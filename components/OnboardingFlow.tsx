"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, Sparkles, BookOpen, Brain, 
  Target, Flame, Trophy, CheckCircle, ArrowRight,
  MonitorPlay, Mic
} from "lucide-react";

const SCREENS = [
  {
    id: 1,
    title: "Select Your Battlefield",
    desc: "CBSE ho ya State Board, Class 10 ho ya SSC—Achivox AI aapke syllabus ko scan kar lega.",
    hook: "Aapki padhai, aapke rules. Ab syllabus aapko nahi, aap syllabus ko control karenge.",
    icon: Target,
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Meet Your AI Teacher",
    desc: "Hard topics ko AI 'Easy Mode' mein samjhayega. Koi doubt ho? Bas pucho—Voice ya Text.",
    hook: "Padhai ki tension khatam. Jab saath hai Achivox, toh darr kis baat ka?",
    icon: Brain,
    color: "bg-violet-500"
  },
  {
    id: 3,
    title: "Find Your Red Zones",
    desc: "Test ke baad AI batayega ki aap kahan weak ho. Red topics ko boost karke Master banein.",
    hook: "Galtiyon se darna chhodo, unhe sudharna seekho.",
    icon: Flame,
    color: "bg-red-500"
  },
  {
    id: 4,
    title: "Earn While You Learn",
    desc: "Padhai ko game banayein. Har task par XP milega aur aap leaderboard par top karenge.",
    hook: "Boredom ko kahein Bye-Bye. Ab padhai hogi mazedaar!",
    icon: Trophy,
    color: "bg-amber-500"
  }
];

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < SCREENS.length - 1) {
      setCurrent(current + 1);
    } else {
      onComplete();
    }
  };

  const screen = SCREENS[current];

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950 text-white flex flex-col">
      {/* Progress */}
      <div className="flex gap-2 p-6 mt-4">
        {SCREENS.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= current ? "bg-white" : "bg-white/10"}`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className={`w-32 h-32 ${screen.color} rounded-[40px] flex items-center justify-center mb-10 shadow-2xl shadow-${screen.color.split('-')[1]}-500/20`}>
            <screen.icon className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-4xl font-black mb-4 tracking-tighter leading-none">{screen.title}</h2>
          <p className="text-slate-400 text-lg font-bold leading-snug mb-6">{screen.desc}</p>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-primary text-sm font-black italic">"{screen.hook}"</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="p-8 pb-12">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={next}
          className="w-full bg-white text-slate-950 py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl"
        >
          {current === SCREENS.length - 1 ? "Let's Start" : "Next Step"}
          <ArrowRight className="w-6 h-6" />
        </motion.button>
        
        {current < SCREENS.length - 1 && (
          <button 
            onClick={onComplete}
            className="w-full text-slate-500 font-black text-xs uppercase tracking-widest mt-6"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
