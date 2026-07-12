"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, RotateCcw, Brain, CheckCircle2, 
  XCircle, ChevronRight, AlertCircle, X, Sparkles, BookOpen
} from "lucide-react";
import { getMistakes, removeMistake, Mistake, logFeatureTime, updateActiveStatus } from "../lib/analytics";
import { auth } from "../lib/firebase";
import MathRenderer from "./MathRenderer";

export default function RevisionVault({ onExit }: { onExit: () => void }) {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("All");

  useEffect(() => {
    setMistakes(getMistakes());
  }, []);

  // Feature time tracking
  useEffect(() => {
    const mountTime = Date.now();
    const uid = auth.currentUser?.uid;
    if (uid) {
      updateActiveStatus(uid, "Revising Mistakes 🧠");
    }
    return () => {
      const elapsed = Math.round((Date.now() - mountTime) / 1000);
      if (uid && elapsed > 0) {
        logFeatureTime(uid, "Revision Vault", elapsed);
        updateActiveStatus(uid, "Online");
      }
    };
  }, []);

  const handleDelete = (id: string) => {
    removeMistake(id);
    setMistakes(getMistakes());
  };

  const topics = ["All", ...Array.from(new Set(mistakes.map(m => m.topicName)))];
  const filteredMistakes = selectedTopic === "All" 
    ? mistakes 
    : mistakes.filter(m => m.topicName === selectedTopic);

  return (
    <div className="fixed inset-0 z-[150] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-6 bg-white dark:bg-slate-900 border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-black tracking-tight italic uppercase">Revision Vault</h2>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Mistake Bank • {mistakes.length} Errors Found</p>
          </div>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
          <span className="text-xs font-black text-primary uppercase">Elite Review</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          
          {/* AI Pattern Analysis Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl">🤖</div>
              <div>
                <h3 className="text-lg font-black leading-none mb-1">AI Pattern Recognition</h3>
                <p className="text-xs text-white/70 font-medium">
                  {mistakes.length === 0 
                    ? "Your vault is empty. Keep practicing to identify weak points!"
                    : `Analysis shows you are struggling most with '${mistakes[0].topicName}'. Would you like to revise the basics?`}
                </p>
              </div>
            </div>
          </div>

          {/* Topic Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedTopic === t ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-border hover:bg-slate-50'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Mistake List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredMistakes.length > 0 ? (
                filteredMistakes.map((m, i) => (
                  <motion.div 
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-900 rounded-[32px] border border-border shadow-sm overflow-hidden"
                  >
                    <div className="p-6 md:p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.subject}</p>
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">•</span>
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest">{m.topicName}</p>
                        </div>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                        <MathRenderer content={m.question} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                          <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Your Answer</p>
                            <div className="text-sm font-bold text-rose-700 dark:text-rose-300 truncate">
                              <MathRenderer content={m.userAnswer} />
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Correct Answer</p>
                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
                              <MathRenderer content={m.correctAnswer} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Retake Section Footer */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 px-8 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <RotateCcw className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Marked for Retake</span>
                      </div>
                      <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:gap-2 transition-all">
                        Study Topic <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[40px] border border-border shadow-inner">
                  <BookOpen className="w-6 h-6 opacity-10 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-slate-300 uppercase italic">Vault is Clean</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">All mistakes have been resolved!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {mistakes.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[20] w-full max-w-xs px-6">
          <button className="w-full bg-primary text-white py-5 rounded-[28px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
            <RotateCcw className="w-6 h-6" />
            Retake Mistakes
          </button>
        </div>
      )}
    </div>
  );
}
