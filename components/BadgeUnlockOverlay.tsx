"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export default function BadgeUnlockOverlay({ 
  badgeName, 
  badgeIcon = "🏆", 
  onClose 
}: { 
  badgeName: string; 
  badgeIcon?: string;
  onClose: () => void;
}) {
  
  useEffect(() => {
    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[48px] p-12 text-center max-w-sm w-full border-4 border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" 
          />

          <div className="relative z-10 space-y-6">
            <div className="relative inline-block">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[40px] flex items-center justify-center text-6xl shadow-2xl shadow-orange-500/40 border-4 border-white/20"
              >
                {badgeIcon}
              </motion.div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border-2 border-dashed border-yellow-500/50 rounded-full" 
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Badge Unlocked</h2>
              <h3 className="text-3xl font-black italic text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                {badgeName}
              </h3>
            </div>

            <p className="text-xs font-bold text-slate-400 leading-relaxed">
              Congratulations! Your mastery in this subject has been recognized by the AI.
            </p>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/20"
            >
              Continue Journey
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
