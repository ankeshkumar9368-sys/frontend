"use client";

import { motion } from "framer-motion";
import { Play, CheckCircle2, Clock, Zap, Target, BookOpen, Lock } from "lucide-react";

export default function StudyPlan({ onStartTask, userData, isSubscribed = false }: { onStartTask: (type: string, title: string) => void, userData: any, isSubscribed?: boolean }) {
  const isNewUser = !userData || (userData.totalSolved === 0);
  
  const tasks = isNewUser ? [
    { 
      id: 1, 
      title: "Explore Your Syllabus", 
      sub: "Select an exam or board to start", 
      type: "notes", 
      progress: 0, 
      time: "5 min", 
      color: "blue",
      priority: "High" 
    },
    { 
      id: 2, 
      title: "Take Diagnostic Test", 
      sub: "Identify your strengths", 
      type: "test", 
      progress: 0, 
      time: "10 min", 
      color: "emerald",
      priority: "Must Try" 
    },
    { 
      id: 3, 
      title: "Watch AI Intro", 
      sub: "Learn how to use ExamHero", 
      type: "notes", 
      progress: 0, 
      time: "2 min", 
      color: "violet",
      priority: "Guide" 
    }
  ] : [
    { 
      id: 1, 
      title: "Personalized Review", 
      sub: "Based on last test errors", 
      type: "notes", 
      progress: 45, 
      time: "15 min", 
      color: "blue",
      priority: "High" 
    },
    { 
      id: 2, 
      title: "Topic Speed Test", 
      sub: "Target: Top 10% Rank", 
      type: "test", 
      progress: 0, 
      time: "20 min", 
      color: "emerald",
      priority: "Trending" 
    },
    { 
      id: 3, 
      title: "Subject Mastery", 
      sub: "Improve speed by 12%", 
      type: "test", 
      progress: 75, 
      time: "10 min", 
      color: "violet",
      priority: "Top Goal" 
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-black text-xl tracking-tighter text-slate-800 dark:text-slate-100">AI Study Plan</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tasks.length} tasks generated</span>
        </div>
      </div>

      <div className="space-y-4 relative">
        {!isSubscribed && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-6 -m-4" onClick={() => alert("Personal AI Study Plan is a Premium Feature!")}>
            <Lock className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="text-white font-black">Daily Study Plan</h3>
            <p className="text-white/70 text-xs font-semibold">Upgrade to unlock Auto-AI Planning</p>
          </div>
        )}
        {tasks.map((task) => (
          <motion.div 
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (isSubscribed) onStartTask(task.type, task.title);
            }}
            className={`bg-card border border-border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group flex items-center gap-4 border-l-4 ${task.color === 'blue' ? 'border-l-blue-500' : task.color === 'emerald' ? 'border-l-emerald-500' : 'border-l-violet-500'} ${isSubscribed ? 'hover:shadow-lg' : 'opacity-80'}`}
          >
            <div className={`relative w-6 h-6 rounded-[16px] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-all shadow-[0_6px_12px_-2px_rgba(0,0,0,0.15),inset_0_-2px_0_0_rgba(0,0,0,0.1)] ${task.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 group-hover:bg-blue-500' : task.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 group-hover:bg-emerald-500' : 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 group-hover:bg-violet-500'} group-hover:text-white`}>
              {task.type === 'notes' ? <BookOpen className="w-6 h-6" /> : <Target className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm tracking-tight leading-tight text-slate-800 dark:text-slate-100">{task.title}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 leading-none">{task.sub}</p>
                </div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-tighter shrink-0 ${task.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' : task.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-violet-50 border-violet-100 text-violet-600'}`}>
                  {task.priority}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${task.progress}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }} 
                    className={`h-full rounded-full ${task.color === 'blue' ? 'bg-blue-500' : task.color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'}`} 
                  />
                </div>
                <div className="flex items-center gap-1 text-slate-400 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-black uppercase">{task.time}</span>
                </div>
              </div>
            </div>

            <motion.button 
              className="bg-slate-900 dark:bg-slate-800 text-white p-2.5 rounded-xl shadow-lg flex items-center justify-center group-hover:bg-primary transition-all active:scale-95 shrink-0"
            >
              {task.progress === 100 ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
