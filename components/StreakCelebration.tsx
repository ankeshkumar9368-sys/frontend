"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, Trophy, X } from "lucide-react";
import { getLocalData, setLocalData } from "../lib/analytics";
import confetti from "canvas-confetti";

export default function StreakCelebration({ currentStreak }: { currentStreak: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if celebration flag is set
    const shouldCelebrate = getLocalData<boolean>("achivox_show_streak_celebration", false);
    if (shouldCelebrate && currentStreak > 0) {
      setShow(true);
      // Fire confetti!
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f97316', '#ef4444', '#eab308']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#ef4444', '#eab308']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Clear the flag so it doesn't show again until next streak update
      setLocalData("achivox_show_streak_celebration", false);
    }
  }, [currentStreak]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShow(false)}
          />
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative w-full max-w-sm bg-gradient-to-b from-orange-500 to-red-600 rounded-[40px] p-8 text-center shadow-[0_0_100px_rgba(239,68,68,0.5)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
            
            <button 
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-32 h-32 mx-auto mb-6 z-10"
            >
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-white text-orange-500 w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-orange-200">
                <Flame className="w-6 h-6 fill-current" />
              </div>
            </motion.div>

            <div className="relative z-10 space-y-2">
              <h2 className="text-white font-black text-3xl uppercase tracking-tight drop-shadow-lg">
                Streak Extended!
              </h2>
              <div className="flex items-center justify-center gap-2 text-orange-100">
                <span className="text-5xl font-black drop-shadow-md">{currentStreak}</span>
                <span className="text-lg font-bold uppercase tracking-widest mt-3">Days</span>
              </div>
              <p className="text-white/80 font-medium text-sm mt-4 px-4 leading-relaxed">
                You're on fire! Keep coming back every day to maintain your streak and earn more XP.
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShow(false)}
              className="relative z-10 mt-8 w-full bg-white text-red-600 font-black text-lg py-4 rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              Keep Going!
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
