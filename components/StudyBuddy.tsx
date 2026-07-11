"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Star, MessageCircle, Sparkles } from "lucide-react";

interface StudyBuddyProps {
  points: number;
  streak: number;
}

export default function StudyBuddy({ points, streak }: StudyBuddyProps) {
  const [emotion, setEmotion] = useState<"happy" | "determined" | "sleeping">("happy");
  const [bubbleText, setBubbleText] = useState("");

  useEffect(() => {
    if (streak === 0) setEmotion("sleeping");
    else if (points > 1000) setEmotion("happy");
    else setEmotion("determined");

    const phrases = [
      "Let's crush today's goals!",
      "Did you know? Studying in blocks is better!",
      "I'm feeling smart today, how about you?",
      "Don't stop now, you're on a roll!",
      "Hydrate yourself, master!",
    ];
    setBubbleText(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [points, streak]);

  return (
    <div className="relative group">
      {/* Speech Bubble */}
      <AnimatePresence>
        {bubbleText && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 w-40 z-20"
          >
            <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 text-center leading-tight">
              {bubbleText}
            </p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-slate-100 dark:border-slate-700 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Buddy Character */}
      <motion.div 
        animate={{ 
          y: [0, -10, 0],
          rotate: emotion === "sleeping" ? [0, 5, 0] : [0, -2, 2, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: emotion === "sleeping" ? 4 : 2, 
          ease: "easeInOut" 
        }}
        className="relative w-24 h-24 flex items-center justify-center"
      >
        {/* Glow Effect */}
        <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full ${emotion === "happy" ? "bg-yellow-400" : emotion === "determined" ? "bg-indigo-500" : "bg-slate-500"}`} />
        
        {/* Body */}
        <div className={`relative w-20 h-20 rounded-[32px] border-4 flex flex-col items-center justify-center shadow-2xl transition-all ${
          emotion === "happy" ? "bg-yellow-400 border-yellow-200" : 
          emotion === "determined" ? "bg-indigo-600 border-indigo-400" : 
          "bg-slate-700 border-slate-500 opacity-50"
        }`}>
          {/* Eyes */}
          <div className="flex gap-4 mb-2">
            {emotion === "sleeping" ? (
              <>
                <div className="w-3 h-1 bg-slate-900 rounded-full" />
                <div className="w-3 h-1 bg-slate-900 rounded-full" />
              </>
            ) : (
              <>
                <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="w-3 h-3 bg-white rounded-full" />
                <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="w-3 h-3 bg-white rounded-full" />
              </>
            )}
          </div>
          
          {/* Mouth */}
          <div className={`h-2 rounded-full bg-slate-900/20 ${emotion === "happy" ? "w-6 h-3 rounded-b-full" : "w-4 h-1"}`} />

          {/* Sparkle for Happy */}
          {emotion === "happy" && (
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 text-white"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          )}
        </div>

        {/* Level Indicator */}
        <div className="absolute -bottom-2 bg-slate-900 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg">
          Lvl {Math.floor(points / 500) + 1} Buddy
        </div>
      </motion.div>
    </div>
  );
}
