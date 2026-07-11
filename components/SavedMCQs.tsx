"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, Trash2, ChevronRight, ChevronLeft, 
  BookOpen, Brain, Star, X, Loader2, AlertCircle
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import MathRenderer from "./MathRenderer";

interface SavedMCQ {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explanation: string;
  importance?: string;
  examProbability?: number;
  subject?: string;
  cls?: string;
  board?: string;
  savedAt: any;
}

export default function SavedMCQs({ onClose }: { onClose: () => void }) {
  const [mcqs, setMcqs] = useState<SavedMCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedMCQ | null>(null);

  useEffect(() => {
    fetchSavedMCQs();
  }, []);

  const fetchSavedMCQs = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "users", auth.currentUser.uid, "saved_mcqs"),
        orderBy("savedAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedMCQ));
      setMcqs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeMCQ = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser || !confirm("Remove this question?")) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "saved_mcqs", id));
      setMcqs(mcqs.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[300] bg-white dark:bg-slate-950 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Saved Questions</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{mcqs.length} MCQs Stored</p>
          </div>
        </div>
        <div className="w-6 h-6 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Bookmark className="w-6 h-6" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accessing Vault...</p>
          </div>
        ) : mcqs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 text-center px-10">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[40px] flex items-center justify-center border-2 border-slate-200 dark:border-slate-800">
              <Bookmark className="w-6 h-6 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Your Vault is Empty</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Save important questions during tests to review them here later.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-20">
            {mcqs.map((mcq, idx) => (
              <motion.div 
                key={mcq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelected(mcq)}
                className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                      {mcq.subject || "Subject"}
                    </span>
                    {mcq.importance === "High" && (
                      <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Star className="w-2 h-2 fill-current" /> High Chance
                      </span>
                    )}
                  </div>
                  <button onClick={(e) => removeMCQ(mcq.id, e)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                  <MathRenderer content={mcq.q} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MCQ Details Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[310] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-t-[48px] sm:rounded-[48px] p-8 max-h-[90vh] overflow-y-auto relative"
            >
              <button onClick={() => setSelected(null)} className="absolute top-8 right-8 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8 pr-10">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selected.board} · {selected.cls} · {selected.subject}</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  <MathRenderer content={selected.q} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-8">
                {selected.options.map((opt, i) => {
                  const isCorrect = i === selected.correct;
                  return (
                    <div key={i} className={`p-5 rounded-3xl border-2 flex items-center gap-4 ${isCorrect ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 dark:border-slate-800'}`}>
                      <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {["A","B","C","D"][i]}
                      </div>
                      <div className={`text-sm font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        <MathRenderer content={opt} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-6 h-6 text-indigo-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">AI Solution</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
                  <MathRenderer content={selected.explanation} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
