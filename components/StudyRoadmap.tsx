"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle2, Lock, Play, Target, 
  ChevronRight, Sparkles, Trophy, Flag, BookOpen 
} from "lucide-react";

interface RoadmapNode {
  id: string;
  title: string;
  status: "completed" | "current" | "locked";
  type: "concept" | "milestone" | "exam";
  description: string;
}

export default function StudyRoadmap({ 
  chapters = [], 
  currentTopic = "", 
  onSelect 
}: { 
  chapters: any[], 
  currentTopic?: string,
  onSelect: (name: string) => void 
}) {
  
  // Mock data generation if no chapters
  const roadmapNodes: RoadmapNode[] = chapters.length > 0 ? chapters.map((c, i) => ({
    id: c.id || `node-${i}`,
    title: c.name || c.title,
    status: i < 2 ? "completed" : i === 2 ? "current" : "locked",
    type: i % 5 === 0 ? "milestone" : "concept",
    description: `Master the fundamentals of ${c.name}`
  })) : [
    { id: "1", title: "Foundations", status: "completed", type: "milestone", description: "Basic concepts and definitions" },
    { id: "2", title: "Core Principles", status: "current", type: "concept", description: "Deep dive into main logic" },
    { id: "3", title: "Advanced Applications", status: "locked", type: "concept", description: "Real-world problem solving" },
    { id: "4", title: "Mid-Term Mastery", status: "locked", type: "milestone", description: "Comprehensive evaluation" },
    { id: "5", title: "Final Strategy", status: "locked", type: "exam", description: "Exam-day preparation" },
  ];

  return (
    <div className="space-y-12 py-10 px-4 max-w-lg mx-auto relative">
      {/* 🚀 AI SUMMARY HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border shadow-sm flex items-center gap-4">
        <div className="w-6 h-6 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl">🛤️</div>
        <div>
          <h3 className="font-black text-lg leading-none mb-1">Your AI Roadmap</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">35% Syllabus Complete • 12 Days Left</p>
        </div>
      </div>

      {/* 🛣️ THE ROADMAP LINE */}
      <div className="relative">
        <div className="absolute left-[39px] top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
        
        <div className="space-y-16">
          {roadmapNodes.map((node, i) => (
            <motion.div 
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex items-start gap-8"
            >
              {/* NODE ICON / STATUS */}
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className={`w-20 h-20 rounded-[28px] border-4 flex items-center justify-center transition-all ${
                    node.status === "completed" ? "bg-emerald-500 border-emerald-100 shadow-lg shadow-emerald-500/20 text-white" :
                    node.status === "current" ? "bg-primary border-primary/20 shadow-xl shadow-primary/30 text-white animate-pulse" :
                    "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300"
                  }`}
                >
                  {node.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> :
                   node.status === "current" ? <Play className="w-6 h-6 fill-white" /> :
                   <Lock className="w-7 h-7 opacity-50" />}
                </motion.div>
                
                {/* Milestone Badge */}
                {node.type === "milestone" && (
                  <div className="absolute -top-3 -right-3 bg-amber-400 text-white p-1.5 rounded-lg shadow-lg">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* NODE CONTENT */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${node.status === "locked" ? "text-slate-400" : "text-primary"}`}>
                    Level {i + 1} • {node.type}
                  </span>
                  {node.status === "current" && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Active Now</span>
                  )}
                </div>
                <h4 className={`text-lg font-black leading-tight ${node.status === "locked" ? "text-slate-400" : "text-slate-800 dark:text-white"}`}>
                  {node.title}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1 mb-4 leading-relaxed">
                  {node.description}
                </p>

                {node.status !== "locked" && (
                  <button 
                    onClick={() => onSelect(node.title)}
                    className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all"
                  >
                    Resume Study <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🏁 FINISH LINE PREVIEW */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <Flag className="w-6 h-6 mx-auto text-primary" />
        <div>
          <h3 className="text-xl font-black italic uppercase italic tracking-tight">Final Destination</h3>
          <p className="text-xs text-slate-400 font-medium">Estimated completion by May 18, 2026</p>
        </div>
        <button className="relative z-10 w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest">Pre-Board Exam Simulation</button>
      </div>
    </div>
  );
}
