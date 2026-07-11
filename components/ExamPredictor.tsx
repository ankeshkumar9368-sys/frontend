"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, AlertCircle, Info, CheckCircle2, 
  BarChart3, Target, Sparkles, HelpCircle 
} from "lucide-react";
import { getExamPrediction, ExamPrediction } from "../lib/analytics";
import { useEffect, useState } from "react";

export default function ExamPredictor({ subjects = [] }: { subjects: string[] }) {
  const [data, setData] = useState<{ predictions: ExamPrediction[], total: number, totalStatus: string } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setData(getExamPrediction(subjects));
  }, [subjects]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Exam Predictor <Sparkles className="w-6 h-6 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">AI-Based Final Mark Estimation</p>
        </div>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-primary transition-colors"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {showInfo && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-primary/5 border border-primary/10 rounded-3xl p-5 overflow-hidden"
        >
          <h4 className="font-black text-sm text-primary mb-2 flex items-center gap-2">
            <Info className="w-6 h-6" /> How it works
          </h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 font-medium leading-relaxed">
            <li>• We analyze your average score across all tests for each subject.</li>
            <li>• <strong>Requirement:</strong> You must attempt tests for at least <strong>2 different topics</strong> in a subject for a prediction.</li>
            <li>• AI adjusts the prediction based on your accuracy trend and consistency.</li>
            <li>• These marks are estimates based on your current conceptual grip.</li>
          </ul>
        </motion.div>
      )}

      {/* TOTAL SCORE CARD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <TrendingUp className="w-32 h-32 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Overall Predicted Percentage</p>
          {data.totalStatus === "ready" ? (
            <div className="space-y-2">
              <h3 className="text-6xl font-black tracking-tighter italic">{data.total}%</h3>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Projected Final Result</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-4xl font-black tracking-tighter text-white/30 italic">N/A</h3>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest max-w-[200px]">Study more subjects to unlock overall prediction</p>
            </div>
          )}
        </div>
      </div>

      {/* SUBJECT GRID */}
      <div className="grid grid-cols-1 gap-4">
        {data.predictions.map((p) => (
          <div 
            key={p.subject}
            className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-border shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-2xl flex items-center justify-center text-xl ${
                p.status === "ready" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
              }`}>
                {p.status === "ready" ? "📊" : "🔒"}
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight">{p.subject}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {p.topicsAttempted} Topics Analyzed
                </p>
              </div>
            </div>

            <div className="text-right">
              {p.status === "ready" ? (
                <div>
                  <span className="text-xl font-black text-slate-800 dark:text-white">{p.predictedMarks}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/100</span>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-tight mb-1">
                    Needs Data
                  </span>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Study {2 - p.topicsAttempted} more topic</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-[32px] border border-amber-100 dark:border-amber-900/30 flex gap-4">
         <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
         <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400 leading-relaxed">
           <strong>Pro Tip:</strong> To increase your predicted score, focus on topics in your "Weakness Heatmap" and clear them with &gt;90% accuracy.
         </p>
      </div>
    </div>
  );
}
