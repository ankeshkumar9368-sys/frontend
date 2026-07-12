"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, X, Sparkles, CheckCircle2, 
  Lightbulb, Brain, ChevronRight, Image as ImageIcon,
  RotateCcw, ArrowRight, Loader2, Info, Clock, ArrowLeft
} from "lucide-react";
import { solveImageDoubt } from "../lib/gemini";
import MathRenderer from "./MathRenderer";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function ScanAndSolve({ 
  userData, 
  onClose 
}: { 
  userData: any; 
  onClose: () => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // Resize to 800px max for 10x faster AI processing
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // Compress to 70% JPEG
            setImage(compressedBase64);
          } else {
             setImage(reader.result as string); // Fallback
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const loadHistory = async () => {
    if (!auth.currentUser) return;
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, "saved_doubts"), 
        where("userId", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const hData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(hData);
    } catch(e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startSolving = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64 = image.split(",")[1];
      const mime = image.split(";")[0].split(":")[1];
      const data = await solveImageDoubt(base64, mime, userData);
      setResult(data);

      if (auth.currentUser) {
        try {
          await addDoc(collection(db, "saved_doubts"), {
            userId: auth.currentUser.uid,
            question: data.question,
            solution: data.solution,
            finalAnswer: data.finalAnswer,
            concept: data.concept,
            proTip: data.proTip,
            subject: data.subject,
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to save doubt history", e);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Vision Engine failed. Please try a clearer photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="w-full bg-slate-900/50 backdrop-blur-md p-6 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-none">Scan & Solve</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">AI Vision Tutor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!showHistory && (
            <button onClick={() => { setShowHistory(true); loadHistory(); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
              <Clock className="w-6 h-6" /> History
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl p-6 space-y-8">
        {showHistory ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-20">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setShowHistory(false)} className="p-2 bg-white/5 rounded-full text-white">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-white font-black text-xl">Doubt History</h2>
            </div>
            
            {historyLoading ? (
               <div className="text-center py-20">
                 <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-4" />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading past doubts...</p>
               </div>
            ) : history.length === 0 ? (
               <div className="text-center py-20 bg-slate-900/50 rounded-[32px] border border-white/5">
                 <Clock className="w-6 h-6 text-slate-700 mx-auto mb-4" />
                 <p className="text-white font-bold">No history found</p>
                 <p className="text-slate-500 text-sm mt-1">Scan a tricky question to save it here.</p>
               </div>
            ) : (
               <div className="space-y-4">
                 {history.map((item: any, i: number) => (
                   <motion.div 
                     key={item.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     onClick={() => { setResult(item); setShowHistory(false); }}
                     className="bg-slate-900/80 p-5 rounded-[24px] border border-white/5 cursor-pointer hover:border-primary/30 transition-colors"
                   >
                     <div className="flex justify-between items-start mb-2">
                       <span className="px-2 py-1 bg-primary/20 text-primary rounded-md text-[10px] font-black uppercase">{item.subject || "General"}</span>
                       <span className="text-slate-500 text-xs font-bold">{item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleDateString() : 'Recent'}</span>
                     </div>
                     <div className="text-white font-medium text-sm line-clamp-2"><MathRenderer content={item.question || ""} /></div>
                   </motion.div>
                 ))}
               </div>
            )}
          </motion.div>
        ) : !image && !result ? (
          /* Upload State */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-20 text-center space-y-8"
          >
             <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="w-32 h-32 bg-slate-900 rounded-[40px] border-2 border-dashed border-white/10 flex items-center justify-center relative z-10">
                   <ImageIcon className="w-6 h-6 text-slate-700" />
                </div>
             </div>
             <div>
                <h3 className="text-white text-2xl font-black tracking-tight">Got a tricky question?</h3>
                <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto text-sm">Upload or click a photo of any question from your book or notes.</p>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-white py-5 rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:brightness-90 transition-all"
                >
                  <Camera className="w-6 h-6" />
                  Take Photo
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/5 text-white py-5 rounded-[24px] font-black text-lg border border-white/10 active:bg-white/10 transition-all"
                >
                  Upload from Gallery
                </motion.button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                />
             </div>
          </motion.div>
        ) : !result ? (
          /* Preview State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
             <div className="relative aspect-square rounded-[40px] overflow-hidden border-4 border-white/10 shadow-2xl group">
                <img src={image} className="w-full h-full object-cover" alt="Captured question" />
                {loading && (
                  <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center backdrop-blur-sm">
                     <div className="relative w-full overflow-hidden">
                        <motion.div 
                          animate={{ y: [0, 400, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)] z-20"
                        />
                     </div>
                     <Loader2 className="w-6 h-6 text-primary animate-spin mb-4" />
                     <p className="text-white font-black text-sm uppercase tracking-widest animate-pulse">AI is solving...</p>
                  </div>
                )}
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-900/80 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
             </div>

             {!loading && (
               <div className="flex gap-4">
                  <button 
                    onClick={() => setImage(null)}
                    className="flex-1 bg-white/5 text-white py-5 rounded-[24px] font-black text-lg border border-white/10"
                  >
                    Retake
                  </button>
                  <button 
                    onClick={startSolving}
                    className="flex-[2] bg-primary text-white py-5 rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                  >
                    <Sparkles className="w-6 h-6 fill-current" />
                    Solve Now
                  </button>
               </div>
             )}
          </motion.div>
        ) : (
          /* Result State */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-20"
          >
             {/* Question Card */}
             <div className="bg-slate-900/80 rounded-[32px] p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Brain className="w-20 h-20" />
                </div>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 block">Question Detected</span>
                <div className="text-white text-xl font-medium leading-relaxed italic">
                  <MathRenderer content={result.question} />
                </div>
                <div className="mt-4 flex gap-2">
                   <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase">{result.subject || "General"}</span>
                   <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-full text-[10px] font-black uppercase">{result.concept}</span>
                </div>
             </div>

             {/* Steps Card */}
             <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <div className="w-6 h-6 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <h3 className="text-white font-black uppercase tracking-widest text-sm">Step-by-Step Solution</h3>
                </div>
                
                <div className="space-y-3">
                   {result.solution.map((step: string, i: number) => (
                     <motion.div 
                       key={i}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                       className="bg-white/5 border border-white/5 p-6 rounded-[24px] flex gap-4"
                     >
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                           {i + 1}
                        </div>
                        <div className="text-slate-300 text-sm leading-relaxed"><MathRenderer content={step} /></div>
                     </motion.div>
                   ))}
                </div>
             </div>

             {/* Final Answer Card */}
             <div className="bg-emerald-500 text-white p-8 rounded-[32px] shadow-2xl shadow-emerald-500/20 text-center">
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2 block">Final Answer</span>
                <div className="text-3xl font-black tracking-tight"><MathRenderer content={result.finalAnswer} /></div>
             </div>

             {/* Pro Tip */}
             <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[24px] flex gap-4 items-start">
                <div className="w-6 h-6 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                   <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-amber-500 font-black text-xs uppercase tracking-widest mb-1">Expert Pro-Tip</h4>
                   <p className="text-amber-200/80 text-sm italic">"{result.proTip}"</p>
                </div>
             </div>

             <motion.button 
               whileTap={{ scale: 0.95 }}
               onClick={() => { setResult(null); setImage(null); }}
               className="w-full bg-white/5 text-white py-5 rounded-[24px] font-black text-lg border border-white/10 flex items-center justify-center gap-3"
             >
               <RotateCcw className="w-6 h-6" />
               Solve Another
             </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
