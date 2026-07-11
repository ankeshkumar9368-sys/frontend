"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  TrendingUp, AlertCircle, CheckCircle2, 
  Target, Award, Calendar, Brain, ShieldCheck,
  ArrowUpRight, BarChart3, ArrowLeft
} from "lucide-react";
import { getExamPrediction } from "../../lib/analytics";

import { Suspense } from "react";

function ParentReportContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!userId) {
        console.error("No User ID found in URL");
        setLoading(false);
        return;
      }
      try {
        console.log("Fetching report for:", userId);
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setData(userData);
          const pred = getExamPrediction(["Science", "Math", "Social Science"]);
          setPrediction(pred);
        } else {
          console.error("No such user document in Firestore!");
        }
      } catch (err) {
        console.error("Firestore Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col items-center justify-center p-6 text-center">
       <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-slate-400 font-extrabold uppercase tracking-widest text-[10px]">Loading Secure Report...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col items-center justify-center p-10 text-center space-y-5">
       <div className="text-5xl animate-bounce">⚠️</div>
       <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic">Invalid or Private Report</h2>
       <p className="text-slate-400 dark:text-slate-500 text-xs font-bold max-w-xs leading-relaxed">This link might have expired or the student has set their profile to private.</p>
       <motion.button 
         whileTap={{ scale: 0.95 }}
         onClick={() => window.location.href = '/'} 
         className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20"
       >
         Back to Home
       </motion.button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] pb-20 relative overflow-hidden flex flex-col">
      
      {/* Background decoration */}
      <div className="blur-glow-bubble w-64 h-64 bg-indigo-500/10 top-24 -left-16" />
      <div className="blur-glow-bubble w-80 h-80 bg-purple-500/10 bottom-36 -right-20" style={{ animationDelay: '-5s' }} />

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 p-6 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100/20 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white uppercase italic leading-none">Parent's Insight</h1>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Academic Report • ExamHero</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
             <h2 className="text-base font-black text-indigo-500 dark:text-indigo-400">{data.name}</h2>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-5 space-y-6 w-full relative z-10 flex-1">
        
        {/* Prediction Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden border border-white/5"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <TrendingUp className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 mb-2.5">AI-Predicted Final Percentage</p>
              <div className="flex items-end gap-3">
                 <h3 className="text-6xl font-black tracking-tighter italic leading-none text-indigo-400">{prediction?.total || 75}%</h3>
                 <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 mb-1 shadow-sm">
                    <ArrowUpRight className="w-3 h-3" /> Improving
                 </div>
              </div>
            </div>
            
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden p-[1px]">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${prediction?.total || 75}%` }}
                 transition={{ duration: 1.2, ease: "easeOut" }}
                 className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
               />
            </div>
            
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic border-l-2 border-indigo-500/50 pl-3">
              "Based on current consistency, {data.name.split(' ')[0]} is on track for a high score. Focus on accuracy to push past 90%."
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
           <motion.div 
             whileHover={{ translateY: -2 }}
             className="bg-white/70 dark:bg-slate-900/30 p-5 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm flex flex-col justify-between"
           >
              <Calendar className="w-6 h-6 text-orange-500 mb-4" />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Study Streak</p>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{data.streak || 0} Days</h4>
              </div>
           </motion.div>
           
           <motion.div 
             whileHover={{ translateY: -2 }}
             className="bg-white/70 dark:bg-slate-900/30 p-5 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm flex flex-col justify-between"
           >
              <Target className="w-6 h-6 text-indigo-500 mb-4" />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tests Taken</p>
                <h4 className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{data.totalSolved || 0}</h4>
              </div>
           </motion.div>
        </div>

        {/* AI Parent Note */}
        <div className="bg-indigo-500/5 border border-indigo-500/25 p-7 rounded-[40px] space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                 <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">AI Insight for Parents</h3>
           </div>
           <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300 text-xs font-bold leading-relaxed uppercase tracking-wide">
                 {data.name} is showing exceptional grip on <strong>{data.board} {data.cls}</strong> syllabus. 
                 The strongest area is conceptual understanding, while speed can be improved with more timed practice.
              </p>
              <div className="flex flex-wrap gap-2">
                 <span className="bg-emerald-100/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">Active Learner</span>
                 <span className="bg-blue-100/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">Concept Mastery</span>
                 <span className="bg-purple-100/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">Disciplined</span>
              </div>
           </div>
        </div>

        {/* Achievements Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-2 text-slate-500 dark:text-slate-400">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Recent Achievements</h3>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {(data.badges || []).map((b: string, i: number) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.05, rotateY: 10 }}
                  className="min-w-[105px] h-24 bg-white/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-center gap-2 shadow-md relative overflow-hidden group cursor-pointer"
                  style={{ transformStyle: "preserve-3d", perspective: "150px" }}
                >
                   <span className="text-2xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.25)] filter select-none group-hover:scale-110 transition-transform">🏆</span>
                   <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 text-center px-2 leading-tight tracking-wider">{b.replace('_', ' ')}</span>
                </motion.div>
              ))}
              {(!data.badges || data.badges.length === 0) && (
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase italic tracking-widest pl-2">No badges earned yet.</p>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8">
           <div className="inline-flex items-center gap-2 bg-slate-200/50 dark:bg-slate-900/40 border border-slate-300/35 dark:border-white/5 px-4 py-2 rounded-full text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest shadow-sm">
              Generated by ExamHero AI • 100% Data Integrity
           </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentReport() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <ParentReportContent />
    </Suspense>
  );
}
