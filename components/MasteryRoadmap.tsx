"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle2, Lock, Play, Target, 
  ChevronRight, Sparkles, Trophy, Flag, BookOpen,
  Brain, Zap, Star
} from "lucide-react";

interface MasteryNode {
  topic: string;
  subject: string;
  status: "completed" | "current" | "locked";
  level: number;
}

export default function MasteryRoadmap({ 
  topics = [], 
  masteryLevel = 0,
  isSubscribed = false,
  onStartTest
}: { 
  topics: { topic: string, subject: string }[], 
  masteryLevel: number,
  isSubscribed: boolean,
  onStartTest: (topic: string, subject: string) => void 
}) {
  
  if (!isSubscribed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-100 rounded-[40px] flex items-center justify-center border-2 border-amber-200 shadow-xl">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic">Premium Mastery</h2>
          <p className="text-amber-600 font-black text-xs uppercase tracking-[0.3em]">Exclusive Feature</p>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-[280px] leading-relaxed">
          The Mastery Roadmap is a level-by-level challenge path designed to mix all subjects and push you to 100% syllabus mastery.
        </p>
        <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
          Upgrade to Unlock
        </button>
      </div>
    );
  }

  const roadmapNodes: MasteryNode[] = topics.map((t, i) => ({
    topic: t.topic,
    subject: t.subject,
    status: i < masteryLevel ? "completed" : i === masteryLevel ? "current" : "locked",
    level: i + 1
  }));

  // Only show a slice of the roadmap to keep it manageable (current level +/- some)
  const visibleNodes = roadmapNodes.slice(Math.max(0, masteryLevel - 2), masteryLevel + 8);

  return (
    <div className="space-y-12 py-10 px-4 max-w-lg mx-auto relative">
      {/* 🚀 AI SUMMARY HEADER */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Star className="w-20 h-20 rotate-12" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl">🛤️</div>
          <div>
            <h3 className="font-black text-lg leading-none mb-1">Mastery Journey</h3>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Level {masteryLevel + 1} • {topics.length} Total Challenges</p>
          </div>
        </div>
        
        <div className="mt-6 bg-black/20 rounded-2xl p-4">
           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
             <span>Overall Progress</span>
             <span>{Math.round((masteryLevel / topics.length) * 100)}%</span>
           </div>
           <div className="h-2 bg-white/10 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(masteryLevel / topics.length) * 100}%` }}
               className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
             />
           </div>
        </div>
      </div>

      {/* 🛣️ THE ROADMAP LINE */}
      <div className="relative">
        <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
        
        <div className="space-y-16">
          {visibleNodes.map((node, i) => (
            <motion.div 
              key={`${node.topic}-${node.level}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex items-start gap-8"
            >
              {/* NODE ICON / STATUS */}
              <div className="relative z-10">
                <motion.div 
                  whileHover={node.status !== "locked" ? { scale: 1.1 } : {}}
                  className={`w-20 h-20 rounded-[28px] border-4 flex items-center justify-center transition-all ${
                    node.status === "completed" ? "bg-emerald-500 border-emerald-100 shadow-lg shadow-emerald-500/20 text-white" :
                    node.status === "current" ? "bg-indigo-600 border-indigo-100 shadow-xl shadow-indigo-600/30 text-white animate-pulse" :
                    "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300"
                  }`}
                >
                  {node.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> :
                   node.status === "current" ? <Brain className="w-6 h-6 fill-white/20" /> :
                   <Lock className="w-7 h-7 opacity-50" />}
                </motion.div>
                
                {/* Level Badge */}
                <div className={`absolute -top-3 -right-3 px-2 py-1 rounded-lg shadow-lg text-[10px] font-black ${
                  node.status === "locked" ? "bg-slate-200 text-slate-400" : "bg-amber-400 text-white"
                }`}>
                  Lvl {node.level}
                </div>
              </div>

              {/* NODE CONTENT */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${node.status === "locked" ? "text-slate-400" : "text-indigo-600"}`}>
                    {node.subject}
                  </span>
                  {node.status === "current" && (
                    <span className="bg-indigo-600/10 text-indigo-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Start Test</span>
                  )}
                </div>
                <h4 className={`text-lg font-black leading-tight ${node.status === "locked" ? "text-slate-400" : "text-slate-800 dark:text-white"}`}>
                  {node.topic}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1 mb-4 leading-relaxed">
                  {node.status === "completed" ? "Topic Mastered! Ready for next level." : 
                   node.status === "current" ? "Pass this topic test to unlock the next level." : 
                   "Complete previous levels to unlock."}
                </p>

                {node.status === "current" && (
                  <button 
                    onClick={() => onStartTest(node.topic, node.subject)}
                    className="group flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Take Test <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                
                {node.status === "completed" && (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5 fill-emerald-500" /> Mastery Achieved
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🏁 FINISH LINE PREVIEW */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
        <Trophy className="w-6 h-6 mx-auto text-amber-400" />
        <div>
          <h3 className="text-xl font-black italic uppercase italic tracking-tight">Ultimate Goal</h3>
          <p className="text-xs text-slate-400 font-medium">Master every topic in your curriculum</p>
        </div>
        <div className="relative z-10 w-full py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black uppercase text-[10px] tracking-widest">
           Locked until Final Level
        </div>
      </div>
    </div>
  );
}
