"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, BookOpen, Sparkles, ChevronRight, 
  Library, Loader2, Beaker, Calculator, 
  FileText, Globe 
} from "lucide-react";
import { getOrGenerateImportantConcepts } from "../lib/content";
import { logFeatureTime, updateActiveStatus } from "../lib/analytics";
import MathRenderer from "./MathRenderer";
import { getSubjects } from "../lib/curriculum";

const SUBJECT_ICONS: Record<string, any> = {
  "Mathematics": <Calculator className="w-6 h-6" />,
  "Science": <Beaker className="w-6 h-6" />,
  "English": <FileText className="w-6 h-6" />,
  "Hindi": <FileText className="w-6 h-6" />,
  "Social Science": <Globe className="w-6 h-6" />
};

export default function FormulaVault({ userData, onClose }: { userData: any, onClose: () => void }) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [concepts, setConcepts] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const board = userData?.board || "CBSE";
  const cls = userData?.cls || "Class 10";

  useEffect(() => {
    const subjs = getSubjects(cls, board);
    setSubjects(subjs);
    if (subjs.length > 0) {
      setActiveSubject(subjs[0]);
    }
  }, [board, cls]);

  // Feature time tracking
  useEffect(() => {
    const mountTime = Date.now();
    if (userData?.uid) {
      updateActiveStatus(userData.uid, "Reading Cheat Sheets 📚");
    }
    return () => {
      const elapsed = Math.round((Date.now() - mountTime) / 1000);
      if (userData?.uid && elapsed > 0) {
        logFeatureTime(userData.uid, "Formula Vault", elapsed);
        updateActiveStatus(userData.uid, "Online");
      }
    };
  }, [userData?.uid]);

  useEffect(() => {
    if (!activeSubject) return;

    const fetchConcepts = async () => {
      const cacheKey = `achivox_concepts_${board}_${cls}_${activeSubject}`.replace(/[^a-zA-Z0-9_]/g, '_');
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.categories) {
              setConcepts(parsed);
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      setLoading(true);
      const data = await getOrGenerateImportantConcepts(board, cls, activeSubject);
      if (data) {
        setConcepts(data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (e) {}
        }
      }
      setLoading(false);
    };

    fetchConcepts();
  }, [activeSubject, board, cls]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-6 bg-white dark:bg-slate-900 border-b border-border flex flex-col gap-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none text-slate-800 dark:text-white">Smart Cheat Sheets</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Formulas & Key Facts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Subject Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {subjects.map(subj => {
            const isActive = activeSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setActiveSubject(subj)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-white dark:bg-slate-800 text-slate-500 border border-border hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {SUBJECT_ICONS[subj] || <BookOpen className="w-6 h-6" />}
                {subj}
              </button>
            )
          })}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest text-center px-4">
                  AI is gathering critical formulas & facts for {activeSubject}...<br/>
                  <span className="text-[10px] text-slate-400">(This happens only once per subject)</span>
                </p>
              </motion.div>
            ) : concepts && concepts.categories ? (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {concepts.categories.map((category: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-[32px] border border-border overflow-hidden shadow-sm">
                    {/* Category Header */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 md:p-6 border-b border-border flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-indigo-500" />
                      <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Items List */}
                    <div className="p-5 md:p-6 space-y-4">
                      {category.items.map((item: any, iIdx: number) => (
                        <div key={iIdx} className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 rounded-2xl border border-border">
                          <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                            {item.title}
                          </h4>
                          <div className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed overflow-x-auto hide-scrollbar">
                            <MathRenderer content={item.content} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <p className="text-sm font-bold text-rose-500">Failed to load concepts. Please try again.</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
