"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Coffee, Heart, Target, Users, BookOpen, Clock } from "lucide-react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { rewardPomodoroSession } from "../lib/gamification";
import { logFeatureTime, updateActiveStatus } from "../lib/analytics";

const AVATARS = [
  { name: "Rahul", color: "bg-blue-500", icon: "👨‍🎓" },
  { name: "Priya", color: "bg-pink-500", icon: "👩‍🎓" },
  { name: "Ankit", color: "bg-emerald-500", icon: "👨‍💻" },
  { name: "Neha", color: "bg-purple-500", icon: "👩‍💻" },
  { name: "Aman", color: "bg-orange-500", icon: "👨‍🔬" },
];

export default function StudyPod({ onClose, userData, onComplete }: { onClose: () => void, userData: any, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(true);
  const [emojis, setEmojis] = useState<{ id: number, type: string, x: number }[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const emojiIdCounter = useRef(0);

  // Feature time tracking
  useEffect(() => {
    const mountTime = Date.now();
    if (userData?.uid) {
      updateActiveStatus(userData.uid, "Studying in Study Pod 🎧");
    }
    return () => {
      const elapsed = Math.round((Date.now() - mountTime) / 1000);
      if (userData?.uid && elapsed > 0) {
        logFeatureTime(userData.uid, "Study Pod", elapsed);
        updateActiveStatus(userData.uid, "Online");
      }
    };
  }, [userData?.uid]);

  // Initialize simulated users
  useEffect(() => {
    const shuffled = [...AVATARS].sort(() => 0.5 - Math.random());
    setActiveUsers(shuffled.slice(0, 3 + Math.floor(Math.random() * 2))); // 3-4 users
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && !completed) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, completed]);

  // Simulate other users sending emojis
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const types = ["🔥", "☕", "💯", "👏"];
        const type = types[Math.floor(Math.random() * types.length)];
        triggerEmoji(type);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  const handleComplete = async () => {
    setCompleted(true);
    setIsActive(false);
    try {
      if (userData?.uid) {
        const result = await rewardPomodoroSession(userData.uid, 25);
        setCoinsEarned(result?.coinsEarned || 20);
        setXpEarned(result?.xpEarned || 20);
        onComplete();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerEmoji = (type: string) => {
    const id = emojiIdCounter.current++;
    const x = Math.floor(Math.random() * 80) + 10; // 10% to 90% screen width
    setEmojis(prev => [...prev, { id, type, x }]);
    
    // Remove after animation
    setTimeout(() => {
      setEmojis(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };

  const sendMotivation = (type: string) => {
    triggerEmoji(type);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - (timeLeft / (25 * 60));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-950 to-purple-900/40" />
      
      {/* Floating Emojis Layer */}
      <AnimatePresence>
        {emojis.map(emoji => (
          <motion.div
            key={emoji.id}
            initial={{ opacity: 0, y: "100vh", x: `${emoji.x}vw`, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: "-10vh", scale: 1.5 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-4xl z-10 pointer-events-none"
          >
            {emoji.type}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-20 px-6 py-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white">Deep Focus Pod</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{activeUsers.length + 1} Studying</p>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-6 h-6 text-white/50" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-20 flex flex-col items-center justify-center px-6">
        {completed ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(16,185,129,0.3)]">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Session Complete!</h2>
            <p className="text-slate-400 font-medium mb-6">You stayed focused for 25 minutes. 🎉</p>
            <div className="flex flex-col gap-3 items-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 px-6 py-3 rounded-2xl border border-amber-500/25 font-black text-lg">
                🪙 +{coinsEarned} Achivox Coins
              </div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-5 py-2 rounded-2xl border border-yellow-500/20 font-black text-sm">
                <Flame className="w-6 h-6 fill-yellow-400" /> +{xpEarned} XP
              </div>
              <p className="text-slate-500 text-[10px] font-semibold mt-2 uppercase tracking-widest">Coins added to your wallet 🎯</p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Timer Circle */}
            <div className="relative w-64 h-64 mb-12">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-white/5" strokeWidth="4" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                <motion.circle
                  className="text-indigo-500"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - progress)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="46" cx="50" cy="50"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-2">Focus Mode</span>
              </div>
            </div>

            {/* Active Users */}
            <div className="w-full max-w-sm bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" /> Fellow Aspirants
              </h3>
              <div className="flex flex-col gap-4">
                {activeUsers.map((user, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-2xl flex items-center justify-center text-xl shadow-lg ${user.color}`}>
                        {user.icon}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{user.name}</p>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase">Studying</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Controls */}
      {!completed && (
        <div className="relative z-20 px-6 pb-8 pt-4">
          <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Send Motivation</p>
          <div className="flex justify-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMotivation("🔥")} className="w-6 h-6 bg-white/10 rounded-2xl flex items-center justify-center text-2xl hover:bg-white/20 transition-colors border border-white/5 shadow-xl">
              🔥
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMotivation("☕")} className="w-6 h-6 bg-white/10 rounded-2xl flex items-center justify-center text-2xl hover:bg-white/20 transition-colors border border-white/5 shadow-xl">
              ☕
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMotivation("💯")} className="w-6 h-6 bg-white/10 rounded-2xl flex items-center justify-center text-2xl hover:bg-white/20 transition-colors border border-white/5 shadow-xl">
              💯
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
