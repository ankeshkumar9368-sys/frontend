"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Flame, Target, BookOpen, Zap, X, Users, CheckCircle2 } from "lucide-react";

interface ActivityEvent {
  id: string;
  name: string;
  avatarBg: string;
  boardClass: string;
  action: string;
  icon: string;
  timeAgo: string;
  badge: string;
  badgeColor: string;
}

const SAMPLE_STUDENTS = [
  { name: "Rohan Verma", boardClass: "CBSE Class 10", avatarBg: "from-blue-500 to-indigo-600" },
  { name: "Ananya Sharma", boardClass: "Bihar Board Class 12", avatarBg: "from-emerald-500 to-teal-600" },
  { name: "Aditya Kumar", boardClass: "UP Board Class 9", avatarBg: "from-orange-500 to-amber-600" },
  { name: "Priya Patel", boardClass: "CBSE Class 10", avatarBg: "from-purple-500 to-pink-600" },
  { name: "Mohammed Sahil", boardClass: "Class 11 JEE Aspirant", avatarBg: "from-cyan-500 to-blue-600" },
  { name: "Vikram Rajput", boardClass: "Maharashtra Board Class 10", avatarBg: "from-rose-500 to-red-600" },
  { name: "Sneha Gupta", boardClass: "MP Board Class 12", avatarBg: "from-violet-500 to-purple-600" },
  { name: "Divya Reddy", boardClass: "ICSE Class 10", avatarBg: "from-lime-500 to-emerald-600" },
  { name: "Karan Joshi", boardClass: "Rajasthan Board Class 9", avatarBg: "from-amber-500 to-yellow-600" },
  { name: "Aarav Mishra", boardClass: "Class 12 NEET Aspirant", avatarBg: "from-fuchsia-500 to-pink-600" },
  { name: "Ishita Roy", boardClass: "WB Board Class 10", avatarBg: "from-teal-500 to-cyan-600" },
  { name: "Harsh Vardhan", boardClass: "CBSE Class 9", avatarBg: "from-sky-500 to-blue-600" },
];

const ACTIONS = [
  { action: "generated AI Smart Notes for 'Linear Equations'", icon: "📖", badge: "Smart Notes", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { action: "scored 95% in Physics Chapter Mock Test", icon: "🎯", badge: "95% Score", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { action: "unlocked a 14-Day Active Study Streak!", icon: "🔥", badge: "14 Days Streak", badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { action: "earned 'Maths Wizard' Rank 1 Badge", icon: "🏆", badge: "Badge Unlocked", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { action: "solved 20 hard Chemistry MCQs in 10 mins", icon: "⚡", badge: "MCQ Mastery", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  { action: "cleared a complex Physics doubt with AI Coach", icon: "🧠", badge: "AI Doubt Cleared", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { action: "won a 1-on-1 Quiz Battle against a peer", icon: "⚔️", badge: "Battle Winner", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { action: "completed 'Light & Reflection' Revision", icon: "📚", badge: "Chapter Complete", badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
];

export function LiveStudentActivityToast() {
  const [currentEvent, setCurrentEvent] = useState<ActivityEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Show a new random student activity toast every 10 to 16 seconds
  useEffect(() => {
    if (dismissed) return;

    const triggerRandomActivity = () => {
      const student = SAMPLE_STUDENTS[Math.floor(Math.random() * SAMPLE_STUDENTS.length)];
      const act = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      const times = ["just now", "2 sec ago", "5 sec ago", "12 sec ago"];

      const event: ActivityEvent = {
        id: Date.now().toString(),
        name: student.name,
        avatarBg: student.avatarBg,
        boardClass: student.boardClass,
        action: act.action,
        icon: act.icon,
        timeAgo: times[Math.floor(Math.random() * times.length)],
        badge: act.badge,
        badgeColor: act.badgeColor
      };

      setCurrentEvent(event);

      // Auto-hide after 5.5 seconds
      setTimeout(() => {
        setCurrentEvent(null);
      }, 5500);
    };

    // First trigger after 2.5 seconds
    const initialTimer = setTimeout(triggerRandomActivity, 2500);

    const recurringInterval = setInterval(() => {
      triggerRandomActivity();
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(recurringInterval);
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 left-3 sm:bottom-6 sm:left-6 z-[999] max-w-sm pointer-events-auto">
      <AnimatePresence mode="wait">
        {currentEvent && (
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[#0f172a]/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden flex items-start gap-3 group"
          >
            {/* Ambient subtle glow background */}
            <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Avatar Circle */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${currentEvent.avatarBg} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 border border-white/20 relative`}>
              {currentEvent.name.charAt(0)}
              {/* Online Green Pulsing Dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a] animate-pulse" />
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                  {currentEvent.name}
                </span>
                <span className="text-[9px] font-semibold text-slate-400">
                  • {currentEvent.timeAgo}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 font-medium mb-1 truncate">
                {currentEvent.boardClass}
              </p>

              <div className="text-[11px] font-medium text-slate-200 leading-snug flex items-start gap-1">
                <span className="shrink-0">{currentEvent.icon}</span>
                <span className="line-clamp-2">{currentEvent.action}</span>
              </div>

              {/* Badge */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentEvent.badgeColor}`}>
                  {currentEvent.badge}
                </span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified Student
                </span>
              </div>
            </div>

            {/* Dismiss X button */}
            <button
              onClick={() => {
                setCurrentEvent(null);
                setDismissed(true);
              }}
              className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors shrink-0"
              title="Dismiss notifications"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Live Activity Counter Badge for Dashboard & Headers
 */
export function LiveDashboardBadge() {
  const [activeCount, setActiveCount] = useState(1540);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(prev => prev + (Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-200 shadow-md backdrop-blur-md">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="text-emerald-400 font-black text-xs sm:text-sm">{activeCount.toLocaleString()}</span>
      <span className="text-slate-300 text-[11px] sm:text-xs">Students Studying Live</span>
    </div>
  );
}
