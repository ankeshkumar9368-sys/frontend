"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchDoubtResponse } from "../lib/content";
import { checkAndIncrementUsage } from "../lib/analytics";
import { auth, db } from "../lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { Camera, Brain, X, User, Sparkles, Loader2, Mic, Send, Crown, ArrowRight } from "lucide-react";

export default function AIDoubtSolver({ onExit, autoStartMic = false, isSubscribed = false, planType = "free" }: { onExit: () => void, autoStartMic?: boolean, isSubscribed?: boolean, planType?: string }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm your Achivox Personal Teacher. Ask me anything about your school subjects! 📚" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const [doubtCount, setDoubtCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Setup Speech Recognition
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send after a short delay
        setTimeout(() => handleSend(transcript), 500);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);

      if (autoStartMic) startListening();
    }
  }, []);

  const startListening = () => {
    if (!isSubscribed) {
      alert("Voice Doubt Solver is a Premium feature! Upgrade to speak your doubts.");
      return;
    }
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleImageUpload = () => {
    // 🚀 SIMULATE AI OCR SCAN
    setIsScanning(true);
    setTimeout(() => {
      setInput("Calculate the derivative of x^2 + 5x + 6");
      setIsScanning(false);
    }, 3000);
  };

  const handleSend = async (overrideText?: string) => {
    const userMsg = overrideText || input.trim();
    if (!userMsg || isTyping) return;

    if (!isSubscribed) {
      const { allowed, remaining } = await checkAndIncrementUsage(auth.currentUser?.uid || "anon", "AI Doubts", 2);
      setUsageRemaining(remaining);
      if (!allowed) {
        setMessages(prev => [...prev, { role: 'ai', text: "Main thak gaya hu, mujhe aur power chahiye! 😴 Unlock Premium for 24/7 Unlimited AI Tutors." }]);
        return;
      }
    }

    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setDoubtCount(prev => prev + 1);
    
    setIsTyping(true);
    const response = await fetchDoubtResponse(userMsg);
    setIsTyping(false);
    
    setMessages(prev => [...prev, { role: 'ai', text: response }]);

    // Persistently increment doubtsSolved in Firestore
    if (auth.currentUser?.uid) {
      updateDoc(doc(db, "users", auth.currentUser.uid), {
        doubtsSolved: increment(1)
      }).catch(e => console.warn("Failed to increment doubtsSolved:", e));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 flex flex-col"
    >
      {/* 🚀 SCANNING OVERLAY */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/90 flex flex-col items-center justify-center"
          >
            <div className="relative w-64 h-64 border-4 border-indigo-500 rounded-[40px] overflow-hidden">
               <motion.div 
                 animate={{ y: [0, 256, 0] }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,1)]"
               />
               <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center">
                 <Camera className="w-20 h-20 text-indigo-400 animate-pulse" />
               </div>
            </div>
            <p className="text-white font-black uppercase tracking-[0.5em] mt-10 text-xs animate-pulse">AI Scanning Question...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-6 border-b border-border flex justify-between items-center bg-primary text-white">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight leading-none">Personal Teacher</h2>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">AI Powered Doubt Engine</p>
          </div>
        </div>
        <button onClick={onExit} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      {planType !== "pro" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-md space-y-8 relative z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto border-2 border-white/10 shadow-[0_15px_35px_rgba(99,102,241,0.3)]"
            >
              <Crown className="w-10 h-10 text-white animate-pulse" />
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Achivox Pro Doubt Solver</h2>
              <p className="text-[10px] font-extrabold text-slate-400 tracking-[0.25em] uppercase">Lock/Upgrade Required</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-left">
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Personal AI Doubt Solver is an <strong>Achivox Pro</strong> feature. Pro students get:
              </p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">✓</div>
                  <span>Unlimited 24/7 AI Doubt Solving</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">✓</div>
                  <span>Voice Doubt Input (Speak and Ask)</span>
                </li>
                <li className="flex items-center gap-3 text-xs font-bold text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">✓</div>
                  <span>Photo/Camera Scan & Solve coming soon</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              
              <button 
                onClick={onExit}
                className="w-full py-4 text-xs font-black uppercase text-slate-400 hover:text-white transition-all tracking-widest"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary text-white'}`}>
                    {msg.role === 'user' ? <User className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2 rounded-tl-none shadow-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teacher is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-border bg-slate-50 dark:bg-slate-900/50">
            <div className="flex gap-3 bg-white dark:bg-slate-800 p-2 rounded-[24px] border border-border shadow-lg focus-within:border-primary transition-all items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening..." : "Ask your doubt (e.g. How does photosynthesis work?)"}
                className={`flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium ${isListening ? 'text-primary animate-pulse' : ''}`}
              />
              <button 
                onClick={handleImageUpload}
                className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-indigo-100 hover:text-indigo-600 transition-all border-2 border-dashed border-transparent hover:border-indigo-200"
              >
                <Camera className="w-6 h-6" />
              </button>
              <button 
                onClick={startListening}
                className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-100 text-rose-500 animate-pulse' : 'bg-slate-100 text-slate-400'}`}
              >
                {isListening ? <Mic className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">Achivox Smart AI • Step-by-Step Learning</p>
          </div>
        </>
      )}
    </motion.div>
  );
}
