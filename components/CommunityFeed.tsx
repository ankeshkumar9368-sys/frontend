"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Award, Sparkles, MessageSquare } from "lucide-react";

const SIMULATED_EVENTS = [
  { user: "Rahul S.", action: "solved 15 MCQs", points: "+150", icon: "🔥" },
  { user: "Priya M.", action: "reached level 12", points: "+500", icon: "🏆" },
  { user: "Amit K.", action: "started a mock test", points: "", icon: "📝" },
  { user: "Sneha V.", action: "earned 'Speed Star' badge", points: "+200", icon: "⚡" },
  { user: "Vikram R.", action: "finished Study Roadmap", points: "+1000", icon: "🌟" },
];

export default function CommunityFeed() {
  const [feed, setFeed] = useState(SIMULATED_EVENTS.slice(0, 3));

  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvent = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
      setFeed(prev => [randomEvent, ...prev.slice(0, 2)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Community Live</h3>
         </div>
         <Users className="w-6 h-6 text-slate-400" />
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {feed.map((event, i) => (
            <motion.div 
              key={`${event.user}-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{event.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-100">{event.user}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-1">{event.action}</p>
                </div>
              </div>
              {event.points && (
                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">{event.points}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="w-full mt-4 py-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 transition-all border-t border-slate-50 dark:border-slate-800/50 pt-4 flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3" /> View Global Board
      </button>
    </div>
  );
}
