"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Star, Lock, X, Award, Flame, Target, Brain, BookOpen, CheckCircle } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { addXP, LEVEL_XP_THRESHOLD } from "../lib/gamification";
import StreakWager from "./StreakWager";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  type: "quiz" | "notes" | "streak" | "test";
}

const BADGES: Badge[] = [
  { id: "first_quiz", name: "First Step", description: "Complete your first quiz", icon: "🎯", color: "from-blue-500 to-blue-600", unlocked: false },
  { id: "streak_3", name: "On Fire!", description: "3-day study streak", icon: "🔥", color: "from-orange-500 to-red-500", unlocked: false },
  { id: "perfect_score", name: "Perfect Mind", description: "Score 100% in any quiz", icon: "⭐", color: "from-yellow-400 to-amber-500", unlocked: false },
  { id: "notes_5", name: "Scholar", description: "Read 5 Smart Notes", icon: "📚", color: "from-indigo-500 to-violet-500", unlocked: false },
  { id: "weak_booster", name: "Comeback King", description: "Improve a weak topic above 70%", icon: "💪", color: "from-emerald-500 to-teal-500", unlocked: false },
  { id: "speed_demon", name: "Speed Demon", description: "Finish a test in under 5 mins", icon: "⚡", color: "from-violet-500 to-purple-600", unlocked: false },
  { id: "consistent", name: "Consistent", description: "Study for 7 days straight", icon: "🏆", color: "from-amber-500 to-yellow-500", unlocked: false },
  { id: "ai_chat", name: "AI Whisperer", description: "Ask 10 doubts to AI", icon: "🤖", color: "from-pink-500 to-rose-500", unlocked: false },
  
  // New Premium Achievements
  { id: "xp_5000", name: "Glory Chaser", description: "Earn 5,000 Total XP Points", icon: "👑", color: "from-fuchsia-500 to-pink-600", unlocked: false },
  { id: "mastery_5", name: "Concept Conqueror", description: "Reach Mastery Level 5", icon: "🔮", color: "from-cyan-500 to-teal-500", unlocked: false },
  { id: "solver_100", name: "Super Solver", description: "Solve 100 Total Questions", icon: "🛡️", color: "from-rose-500 to-red-600", unlocked: false },
  { id: "streak_15", name: "Unstoppable", description: "Reach a 15-day study streak", icon: "🔥", color: "from-orange-500 to-amber-600", unlocked: false },

  // Premium Milestone Additions
  { id: "focus_10", name: "Focus Master", description: "Complete 10 Focus Sessions", icon: "⏱️", color: "from-emerald-500 to-green-600", unlocked: false },
  { id: "doubts_25", name: "Doubt Buster", description: "Ask 25 doubts to AI", icon: "🧠", color: "from-blue-500 to-indigo-600", unlocked: false },
  { id: "test_15", name: "Grand Champion", description: "Complete 15 total tests", icon: "🌟", color: "from-amber-400 to-orange-500", unlocked: false },
  { id: "xp_10000", name: "Elite Learner", description: "Earn 10,000 Total XP Points", icon: "🌌", color: "from-purple-600 to-indigo-800", unlocked: false },
];

const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: "d1", title: "Daily Test", description: "Complete 1 topic test today", xpReward: 50, completed: false, type: "test" },
  { id: "d2", title: "Smart Notes", description: "Read any 1 chapter notes", xpReward: 30, completed: false, type: "notes" },
  { id: "d3", title: "Streak Guard", description: "Log in and study for 10 min", xpReward: 20, completed: false, type: "streak" },
];

export default function GamificationHub({
  userData,
  onClose,
}: {
  userData: any;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"xp" | "badges" | "challenges" | "wagers">("xp");
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [challenges, setChallenges] = useState<DailyChallenge[]>(DAILY_CHALLENGES);

  useEffect(() => {
    const userId = userData?.uid || userData?.id;
    if (!userId) return;

    // Real-time listener for user stats
    const unsub = onSnapshot(doc(db, "user_stats", userId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStats(data);
        
        // Sync badges with Firestore data
        setBadges(prev => prev.map(b => ({
          ...b,
          unlocked: data.badges?.includes(b.id) || b.unlocked
        })));
      }
    });

    return () => unsub();
  }, [userData?.uid, userData?.id]);

  const completeChallenge = async (id: string) => {
    const userId = userData?.uid || userData?.id;
    const challenge = challenges.find(c => c.id === id);
    if (!challenge || challenge.completed || !userId) return;

    // 1. Update UI immediately (Optimistic)
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, completed: true } : c));

    // 2. Award XP via Engine
    await addXP(userId, challenge.xpReward, `Daily Challenge: ${challenge.title}`);
  };

  const xp = stats?.xp || 0;
  const level = stats?.level || 1;
  const coins = stats?.coins || 0;
  const currentLevelXp = xp % LEVEL_XP_THRESHOLD;
  const levelProgress = (currentLevelXp / LEVEL_XP_THRESHOLD) * 100;
  const unlockedBadges = stats?.badges?.length || 0;
  const completedChallenges = challenges.filter(c => c.completed).length;

  return (
    <div className="fixed inset-0 z-[220] bg-slate-950/90 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Achievements</h3>
            <p className="text-[9px] text-slate-400">Level {level} Aspirant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* XP Bar */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-black text-[10px]">
                L{level}
              </div>
              <span className="text-white font-black text-xs">Level {level}</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-500/20 px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-black text-[10px]">{xp.toLocaleString()} XP</span>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-slate-400 font-semibold">{currentLevelXp} / {LEVEL_XP_THRESHOLD} XP</span>
            <span className="text-[8px] text-slate-400 font-semibold">Next: Level {level + 1}</span>
          </div>
        </div>
      </div>

      {/* Coins Balance Banner */}
      <div className="mx-4 mb-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪙</span>
          <div>
            <p className="text-amber-400 font-black text-sm">{coins.toLocaleString()} Achivox Coins</p>
            <p className="text-slate-500 text-[9px] font-semibold uppercase tracking-widest">Spend in Reward Shop • XP is unaffected</p>
          </div>
        </div>
        <div className="bg-amber-500/20 px-2 py-1 rounded-lg">
          <span className="text-amber-400 font-black text-[10px]">Wallet</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2">
        {[
          { label: "Badges", value: `${unlockedBadges}/${badges.length}`, icon: "🏅" },
          { label: "Challenges", value: `${completedChallenges}/${challenges.length}`, icon: "⚡" },
          { label: "Streak", value: `${userData?.streak || 0}d`, icon: "🔥" },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-2.5 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-white font-black text-xs">{s.value}</div>
            <div className="text-slate-400 text-[8px] font-bold uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4">
        {(["xp", "badges", "challenges", "wagers"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[10px] font-black capitalize tracking-tight transition-all ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-slate-400"
            }`}
          >
            {t === "xp" ? "⚡ XP" : t === "badges" ? "🏅 Badges" : t === "wagers" ? "🔥 Wagers" : "🎯 Daily"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* XP Log */}
        {tab === "xp" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2">How to earn XP + 🪙 Coins</p>
            {[
              { action: "Complete a Test", xp: 50, coins: 15, icon: "🎯" },
              { action: "Score 100% Accuracy", xp: 100, coins: 30, icon: "⭐" },
              { action: "Score ≥80%", xp: 30, coins: 20, icon: "📈" },
              { action: "25-min Focus Session", xp: 20, coins: 20, icon: "⏱️" },
              { action: "50-min Focus Session", xp: 40, coins: 45, icon: "🔥" },
              { action: "Daily Streak", xp: 15, coins: 10, icon: "🗓️" },
              { action: "Complete Daily Challenge", xp: 50, coins: 25, icon: "⚡" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-white text-xs font-bold">{item.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-black text-[10px]">+{item.xp} XP</span>
                  <span className="text-amber-400 font-black text-[10px]">+{item.coins} 🪙</span>
                </div>
              </motion.div>
            ))}
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">🛡️ XP & Level NEVER decrease</p>
              <p className="text-slate-400 text-[9px] mt-0.5">Spending coins in Reward Shop has zero effect on your XP or level.</p>
            </div>
          </motion.div>
        )}

        {/* Badges */}
        {tab === "badges" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white/5 rounded-2xl p-4 flex flex-col items-center text-center border transition-all ${
                  badge.unlocked ? "border-primary/30 shadow-lg shadow-primary/10" : "border-white/5 opacity-50"
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center mb-2 text-2xl bg-gradient-to-br ${badge.unlocked ? badge.color : "from-slate-700 to-slate-800"}`}>
                  {badge.unlocked ? badge.icon : <Lock className="w-6 h-6 text-slate-400" />}
                </div>
                <p className="text-white font-black text-[10px] leading-tight">{badge.name}</p>
                <p className="text-slate-400 text-[8px] mt-0.5 font-medium leading-none">{badge.description}</p>
                {badge.unlocked && (
                  <span className="mt-2 bg-primary/20 text-primary text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                    Unlocked!
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Daily Challenges */}
        {tab === "challenges" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-primary font-black text-xs">🎯 Challenges Reset at Midnight</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Complete all 3 for bonus XP!</p>
            </div>
            {challenges.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl p-4 border transition-all ${
                  c.completed
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{(c.type === "quiz" || c.type === "test") ? "🎯" : c.type === "notes" ? "📚" : "🔥"}</span>
                    <div>
                      <p className={`font-black text-sm ${c.completed ? "text-emerald-400" : "text-white"}`}>{c.title}</p>
                      <p className="text-slate-400 text-xs">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2.5 py-1 rounded-full">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-black text-xs">+{c.xpReward}</span>
                  </div>
                </div>
                {!c.completed ? (
                  <button
                    onClick={() => completeChallenge(c.id)}
                    className="w-full bg-primary/20 text-primary py-2.5 rounded-xl font-black text-xs mt-2"
                  >
                    Mark Complete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-black">Completed!</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Wagers Tab */}
        {tab === "wagers" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
            <StreakWager 
              currentCoins={coins} 
              currentStreak={userData?.streak || 0}
              activeWager={stats?.activeWager}
              onPlaceWager={async (amount, targetDays) => {
                try {
                  const userId = userData?.uid || userData?.id;
                  if (!userId) return false;
                  
                  const { updateDoc } = await import("firebase/firestore");
                  
                  // Deduct coins & set active wager
                  await updateDoc(doc(db, "user_stats", userId), {
                    coins: coins - amount,
                    activeWager: {
                      amount,
                      targetStreak: (userData?.streak || 0) + targetDays,
                      startDate: new Date().toISOString()
                    }
                  });
                  return true;
                } catch (error) {
                  console.error(error);
                  return false;
                }
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
