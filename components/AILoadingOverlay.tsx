"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Sparkles, Brain, Activity, Target } from "lucide-react";
import Image from "next/image";

interface AILoadingOverlayProps {
  isOpen: boolean;
  onCancel: () => void;
  type: "notes" | "quiz" | "test";
}

const loadingMessages = [
  "Analyzing your dashboard data...",
  "Identifying your weak conceptual areas...",
  "Scanning syllabus for high-weightage topics...",
  "Generating personalized academic insights...",
  "Synthesizing topper-level study patterns...",
  "Calibrating AI difficulty to your current level...",
  "Structuring curriculum for maximum retention...",
];

export default function AILoadingOverlay({ isOpen, onCancel, type }: AILoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      setShowLongWaitMessage(false);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    const timer = setTimeout(() => {
      setShowLongWaitMessage(true);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
        >
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.1, 0.15, 0.1],
                rotate: [360, 270, 180, 90, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px]"
            />
          </div>

          {/* Close/Back Button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onCancel}
            className="absolute top-10 left-8 flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 text-white/70 text-xs font-black uppercase tracking-widest transition-all z-50 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            Cancel Generation
          </motion.button>

          {/* Logo Animation */}
          <div className="relative mb-12">
            <motion.div 
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(99, 102, 241, 0.2)", 
                  "0 0 60px rgba(99, 102, 241, 0.5)", 
                  "0 0 20px rgba(99, 102, 241, 0.2)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center shadow-2xl relative z-10"
            >
              <Image 
                src="/achivox-logo.png" 
                alt="Achivox" 
                width={80} 
                height={80} 
                className="w-20 h-20 object-contain"
              />
            </motion.div>
            
            {/* Pulsing Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                className="absolute inset-0 border-2 border-primary/30 rounded-[40px] pointer-events-none"
              />
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="space-y-6 max-w-sm w-full relative z-10">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                {type === "notes" ? "Forging Smart Notes" : "Crafting AI Test"}
              </h2>
            </div>

            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "10%" }}
                animate={{ width: "95%" }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary via-violet-500 to-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              />
            </div>

            <div className="h-12 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-primary font-black text-[10px] uppercase tracking-[0.2em]"
                >
                  {showLongWaitMessage ? loadingMessages[messageIndex] : "Initializing Achivox Intelligence..."}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Context Icons */}
            <div className="flex justify-center gap-6 pt-4 opacity-50">
               <div className="flex flex-col items-center gap-2">
                  <Brain className="w-6 h-6 text-white" />
                  <span className="text-[8px] font-black text-white uppercase">Brain Map</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Activity className="w-6 h-6 text-white" />
                  <span className="text-[8px] font-black text-white uppercase">Weak Areas</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Target className="w-6 h-6 text-white" />
                  <span className="text-[8px] font-black text-white uppercase">Mastery</span>
               </div>
            </div>
          </div>

          <p className="absolute bottom-12 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Achivox Neural Core v4.0 • Real-time Synthesis
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
