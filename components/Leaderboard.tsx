"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, User as UserIcon, Loader2, Sparkles, Zap, Flame } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where, getCountFromServer } from "firebase/firestore";
import SmartAvatar from "./SmartAvatar";

interface Leader {
  id: string;
  name: string;
  score: number;
  avatar: string;
  rank: number;
  badge?: string;
  isSubscribed?: boolean;
  isBot?: boolean;
  scoreDelta?: number;
}

const BOT_TOPPERS_DATA = [
  // Gold League Toppers (12,000 - 32,000 XP)
  { name: "Aarav Sharma", baseScore: 29850, league: "Gold", badge: "AIR 1 Topper", isSubscribed: true },
  { name: "Ananya Verma", baseScore: 27400, league: "Gold", badge: "Legend 👑", isSubscribed: true },
  { name: "Pranav Deshmukh", baseScore: 25150, league: "Gold", badge: "JEE Master ⚡", isSubscribed: true },
  { name: "Devansh Singhania", baseScore: 23900, league: "Gold", badge: "NEET Champ", isSubscribed: true },
  { name: "Ishita Mukherjee", baseScore: 21800, league: "Gold", badge: "Board Topper 🎯", isSubscribed: true },
  { name: "Mohammed Zaid", baseScore: 19650, league: "Gold", badge: "Legend 👑", isSubscribed: true },
  { name: "Sneha Kulkarni", baseScore: 18400, league: "Gold", badge: "Maths Wizard 📐", isSubscribed: true },
  { name: "Aditya Srivastava", baseScore: 16900, league: "Gold", badge: "Top 1% 🔥", isSubscribed: false },
  { name: "Tanvi Reddy", baseScore: 15200, league: "Gold", badge: "Physics Ace", isSubscribed: true },
  { name: "Rohan Mehta", baseScore: 13850, league: "Gold", badge: "Expert ⚡", isSubscribed: false },

  // Silver League Toppers (3,500 - 11,500 XP)
  { name: "Siddharth Nair", baseScore: 11200, league: "Silver", badge: "Expert ⚡", isSubscribed: true },
  { name: "Bhavya Chawla", baseScore: 9850, league: "Silver", badge: "High Scorer 🎯", isSubscribed: false },
  { name: "Kavya Pillai", baseScore: 8900, league: "Silver", badge: "Pro Fighter 🔥", isSubscribed: true },
  { name: "Yashvardhan Singh", baseScore: 7800, league: "Silver", badge: "Streak Master", isSubscribed: false },
  { name: "Riya Banerjee", baseScore: 6950, league: "Silver", badge: "Pro 🎯", isSubscribed: true },
  { name: "Tushar Saxena", baseScore: 5900, league: "Silver", badge: "Quiz Captain", isSubscribed: false },
  { name: "Meera Iyer", baseScore: 4850, league: "Silver", badge: "Rising Star 🌟", isSubscribed: true },
  { name: "Ayush Tiwari", baseScore: 3950, league: "Silver", badge: "Pro 🎯", isSubscribed: false },

  // Bronze League Toppers (800 - 3,200 XP)
  { name: "Hardik Pandey", baseScore: 3100, league: "Bronze", badge: "Fast Learner", isSubscribed: false },
  { name: "Nisha Agarwal", baseScore: 2650, league: "Bronze", badge: "Active Aspirant", isSubscribed: true },
  { name: "Chaitanya Joshi", baseScore: 2150, league: "Bronze", badge: "Daily Streak", isSubscribed: false },
  { name: "Avani Patel", baseScore: 1750, league: "Bronze", badge: "Rookie Ace", isSubscribed: false },
  { name: "Gautam Gambhir", baseScore: 1400, league: "Bronze", badge: "Active ⚡", isSubscribed: false },
  { name: "Pooja Hegde", baseScore: 950, league: "Bronze", badge: "Starter 🚀", isSubscribed: false },
];

export default function Leaderboard({ userData }: { userData: any }) {
  const getLeague = (points: number) => {
    if (points >= 12000) return "Gold";
    if (points >= 3500) return "Silver";
    return "Bronze";
  };

  const initialLeague = userData?.points ? getLeague(userData.points) : "Gold";
  const [category, setCategory] = useState(initialLeague);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | string>("--");
  const [timeLeft, setTimeLeft] = useState("");
  const [botScores, setBotScores] = useState<Record<string, number>>({});

  // Countdown Timer to Sunday
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
      if (now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() >= 59) {
        nextSunday.setDate(now.getDate() + 7);
      }
      nextSunday.setHours(23, 59, 59, 999);
      
      const diff = nextSunday.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize & Live Dynamic Shuffling Engine for Bots
  useEffect(() => {
    // Initial bot scores setup
    const initialMap: Record<string, number> = {};
    BOT_TOPPERS_DATA.forEach(b => {
      initialMap[b.name] = b.baseScore;
    });
    setBotScores(initialMap);

    // Live shuffling & score gains every 8 - 14 seconds
    const shuffleInterval = setInterval(() => {
      setBotScores(prev => {
        const next = { ...prev };
        // Pick 2-3 random bots to gain XP
        const count = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < count; i++) {
          const randomIndex = Math.floor(Math.random() * BOT_TOPPERS_DATA.length);
          const botName = BOT_TOPPERS_DATA[randomIndex].name;
          const xpGain = (Math.floor(Math.random() * 4) + 1) * 30; // +30, +60, +90, +120
          next[botName] = (next[botName] || BOT_TOPPERS_DATA[randomIndex].baseScore) + xpGain;
        }
        return next;
      });
    }, 9000);

    return () => clearInterval(shuffleInterval);
  }, []);

  // Firestore + Bot Merging & Sorting Logic
  useEffect(() => {
    setLoading(true);
    const userPoints = userData?.points || 0;

    // Filter bots for current category
    const categoryBots: Leader[] = BOT_TOPPERS_DATA.filter(b => b.league === category).map(b => {
      const nameParts = b.name.split(' ');
      const avatarStr = nameParts[0][0] + (nameParts[1]?.[0] || "");
      const liveScore = botScores[b.name] !== undefined ? botScores[b.name] : b.baseScore;
      return {
        id: `bot_${b.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: b.name,
        score: liveScore,
        avatar: avatarStr,
        badge: b.badge,
        isSubscribed: b.isSubscribed,
        isBot: true,
        rank: 0
      };
    });

    // Real Firestore Users Query
    let q;
    if (category === "Gold") {
      q = query(collection(db, "users"), where("points", ">=", 12000), orderBy("points", "desc"), limit(10));
    } else if (category === "Silver") {
      q = query(collection(db, "users"), where("points", ">=", 3500), where("points", "<", 12000), orderBy("points", "desc"), limit(10));
    } else {
      q = query(collection(db, "users"), where("points", ">=", 0), where("points", "<", 3500), orderBy("points", "desc"), limit(10));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realUsers: Leader[] = snapshot.docs.map((docItem) => {
        const data = docItem.data();
        const name = data.name || "Aspirant";
        const nameParts = name.split(' ');
        const avatarStr = data.photoURL || (nameParts[0][0] + (nameParts[1]?.[0] || ""));
        return {
          id: docItem.id,
          name: name,
          score: data.points || 0,
          rank: 0,
          avatar: avatarStr,
          badge: (data.points > 15000 ? "Legend 👑" : data.points > 5000 ? "Expert ⚡" : data.points > 1000 ? "Pro 🎯" : undefined),
          isSubscribed: data.isSubscribed || false,
          isBot: false
        };
      });

      // Include Current User if in this category
      let allCandidates: Leader[] = [...categoryBots];
      realUsers.forEach(ru => {
        if (!allCandidates.some(c => c.id === ru.id)) {
          allCandidates.push(ru);
        }
      });

      if (userData?.uid && !allCandidates.some(c => c.id === userData.uid)) {
        const myLeague = getLeague(userPoints);
        if (myLeague === category) {
          const myName = userData.name || "You";
          const myAvatar = (myName[0] || "U") + (myName.split(' ')[1]?.[0] || "");
          allCandidates.push({
            id: userData.uid,
            name: `You (${myName})`,
            score: userPoints,
            avatar: myAvatar,
            badge: userPoints > 10000 ? "Pro Aspirant" : "Rising Star",
            isSubscribed: userData.isSubscribed || false,
            isBot: false,
            rank: 0
          });
        }
      }

      // Sort Descending by Score
      allCandidates.sort((a, b) => b.score - a.score);

      // Re-assign ranks 1..N
      const rankedList = allCandidates.map((c, i) => ({
        ...c,
        rank: i + 1
      }));

      setLeaders(rankedList.slice(0, 15));

      // Calculate Current User Rank
      const myPos = rankedList.findIndex(c => c.id === userData?.uid);
      if (myPos !== -1) {
        setUserRank(myPos + 1);
      } else {
        const higherCount = rankedList.filter(c => c.score > userPoints).length;
        setUserRank(higherCount > 0 ? higherCount + 1 : 12);
      }

      setLoading(false);
    }, (err) => {
      // Fallback to bot list if Firestore query fails
      categoryBots.sort((a, b) => b.score - a.score);
      const fallbackRanked = categoryBots.map((c, i) => ({ ...c, rank: i + 1 }));
      setLeaders(fallbackRanked.slice(0, 15));
      setUserRank(userData?.rank || 14);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid, userData?.points, category, botScores]);

  const currentUser = { 
    rank: userRank, 
    name: "You (" + (userData?.name || "Aspirant") + ")", 
    score: userData?.points || 0, 
    avatar: (userData?.name?.[0] || "U") + (userData?.name?.split(' ')[1]?.[0] || "") 
  };

  if (loading && leaders.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Live Arena...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 👑 LIVE ARENA BANNER */}
      <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-900/40 p-4 rounded-2xl border border-amber-300/50 shadow-inner flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center text-xl shadow-md shrink-0">👑</div>
          <div>
            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Live Competitive Arena
            </p>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
              Solve questions & tests live to climb the leaderboard in real time!
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE SCORES
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex gap-1 shadow-inner no-print border border-slate-200 dark:border-slate-700">
        {["Bronze", "Silver", "Gold"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setCategory(tab)}
            className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${
              category === tab 
                ? tab === 'Gold' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-md text-slate-950 scale-[1.02]' 
                : tab === 'Silver' ? 'bg-gradient-to-r from-slate-400 to-slate-600 shadow-md text-white scale-[1.02]'
                : 'bg-gradient-to-r from-orange-400 to-red-500 shadow-md text-white scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab.toUpperCase()} LEAGUE
          </button>
        ))}
      </div>

      {/* League Status */}
      <div className={`p-4 rounded-[28px] border flex items-center justify-between overflow-hidden relative ${
        category === "Gold" ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/30" : 
        category === "Silver" ? "bg-gradient-to-r from-slate-500/10 via-gray-500/10 to-zinc-500/10 border-slate-500/30" : 
        "bg-gradient-to-r from-orange-500/10 via-red-500/10 to-amber-500/10 border-orange-500/30"
      }`}>
        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center animate-pulse ${
            category === "Gold" ? "bg-yellow-500/20" : category === "Silver" ? "bg-slate-400/20" : "bg-orange-500/20"
          }`}>
            <Trophy className={`w-5 h-5 ${
              category === "Gold" ? "text-yellow-500" : category === "Silver" ? "text-slate-400" : "text-orange-500"
            }`} />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${
              category === "Gold" ? "text-yellow-600 dark:text-yellow-400" : category === "Silver" ? "text-slate-600 dark:text-slate-300" : "text-orange-600 dark:text-orange-400"
            }`}>Active Arena: {category} League</p>
            <p className="text-xs font-bold text-slate-500">Weekly Reset: {timeLeft || "..."}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-border shadow-sm relative z-10">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">Prize Pool: {category === "Gold" ? "10,000" : category === "Silver" ? "3,000" : "1,000"} XP</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-2.5 pt-10 pb-6 px-2">
        {/* 2nd Place */}
        {leaders[1] && (
          <motion.div layout key={leaders[1].id} className="flex flex-col items-center gap-2">
            <div className="relative">
              <SmartAvatar name={leaders[1].name} src={leaders[1].avatar} size="lg" isPremium={leaders[1].isSubscribed} />
              <div className="absolute -top-2.5 -left-2.5 bg-slate-400 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-md">2</div>
            </div>
            <div className="h-24 w-24 sm:w-28 bg-gradient-to-t from-slate-300 via-slate-200 to-white dark:from-slate-800 dark:via-slate-700 dark:to-slate-600 rounded-t-3xl flex flex-col items-center justify-center p-2 shadow-lg border-t border-slate-300 dark:border-slate-600">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate w-full text-center">{leaders[1].name.split(' ')[0]}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> {leaders[1].score.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {leaders[0] && (
          <motion.div layout key={leaders[0].id} className="flex flex-col items-center gap-2 -mt-8">
            <div className="relative">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 text-yellow-500"
              >
                <Crown className="w-7 h-7 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]" />
              </motion.div>
              <SmartAvatar name={leaders[0].name} src={leaders[0].avatar} size="xl" isPremium={true} />
              <div className="absolute -top-2.5 -left-2.5 bg-amber-400 text-slate-950 w-7 h-7 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-lg">1</div>
            </div>
            <div className="h-32 w-28 sm:w-32 bg-gradient-to-t from-amber-400 via-yellow-300 to-yellow-100 dark:from-amber-900 dark:via-yellow-800 dark:to-yellow-700 rounded-t-[32px] flex flex-col items-center justify-center p-2 shadow-xl border-t-2 border-amber-300">
              <span className="text-xs font-black text-amber-950 dark:text-yellow-100 truncate w-full text-center">{leaders[0].name.split(' ')[0]}</span>
              <span className="text-sm font-black text-amber-950 dark:text-white flex items-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-300 fill-current" /> {leaders[0].score.toLocaleString()}
              </span>
              {leaders[0].badge && (
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-black/20 text-slate-900 dark:text-yellow-200 mt-1">
                  {leaders[0].badge}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {leaders[2] && (
          <motion.div layout key={leaders[2].id} className="flex flex-col items-center gap-2">
            <div className="relative">
              <SmartAvatar name={leaders[2].name} src={leaders[2].avatar} size="lg" isPremium={leaders[2].isSubscribed} />
              <div className="absolute -top-2.5 -left-2.5 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-md">3</div>
            </div>
            <div className="h-20 w-24 sm:w-28 bg-gradient-to-t from-orange-300 via-orange-200 to-white dark:from-orange-950 dark:via-orange-800 dark:to-orange-700 rounded-t-3xl flex flex-col items-center justify-center p-2 shadow-md border-t border-orange-300 dark:border-orange-600">
              <span className="text-[11px] font-black text-orange-900 dark:text-orange-100 truncate w-full text-center">{leaders[2].name.split(' ')[0]}</span>
              <span className="text-xs font-black text-orange-950 dark:text-white flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-orange-500 fill-orange-500" /> {leaders[2].score.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Ranking List */}
      <div className="bg-card rounded-[36px] border border-border shadow-inner p-4 sm:p-6 space-y-2.5">
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" /> {category} Live Ranking
          </span>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Realtime Updates
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {leaders.slice(3).map((leader) => {
            const isCurrentUser = leader.id === userData?.uid;
            return (
              <motion.div 
                layout
                key={leader.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isCurrentUser 
                    ? "bg-indigo-600/15 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30" 
                    : "bg-slate-50 dark:bg-slate-900/60 border-border hover:border-slate-400/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-7 text-center font-black text-xs ${
                    leader.rank <= 5 ? "text-amber-500" : "text-slate-400"
                  }`}>
                    #{leader.rank}
                  </span>
                  <SmartAvatar name={leader.name} src={leader.avatar} size="md" isPremium={leader.isSubscribed} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs sm:text-sm tracking-tight truncate max-w-[130px] sm:max-w-[180px] text-foreground">
                        {leader.name}
                      </span>
                      {leader.isSubscribed && (
                        <span title="Premium Member" className="text-xs">👑</span>
                      )}
                      {isCurrentUser && (
                        <span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full">YOU</span>
                      )}
                    </div>
                    {leader.badge && (
                      <span className="text-[9px] text-slate-500 font-semibold truncate">
                        {leader.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-black text-xs sm:text-sm text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5">
                    <Zap className="w-3 h-3 fill-current" /> {leader.score.toLocaleString()}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">XP Points</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Current User's Floating Card */}
        <div className="pt-4 mt-2 border-t border-dashed border-border">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[28px] shadow-2xl relative overflow-hidden border border-indigo-500/30"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3.5 relative z-10 min-w-0">
              <div className="flex flex-col items-center shrink-0">
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Your Rank</span>
                <span className="font-black text-xl italic text-amber-400 leading-none">#{currentUser.rank}</span>
              </div>
              <div className="w-px h-8 bg-white/15 shrink-0" />
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-inner">
                {currentUser.avatar}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm tracking-tight truncate text-white">{currentUser.name}</span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {userData?.points > 0 ? "Climbing the Arena!" : "Top 85% this week"}
                </span>
              </div>
            </div>

            <div className="text-right relative z-10 shrink-0 pl-2">
              <span className="block font-black text-xl leading-none text-amber-400 flex items-center gap-0.5 justify-end">
                <Zap className="w-4 h-4 fill-amber-400" /> {currentUser.score.toLocaleString()}
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total XP</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 rounded-[28px] shadow-lg text-center relative overflow-hidden group">
        <Medal className="absolute top-0 right-0 w-24 h-24 text-white/10 -mr-8 -mt-8 rotate-12 group-hover:scale-110 transition-transform" />
        <p className="text-xs font-bold text-white leading-relaxed relative z-10">
          🏆 Win the <span className="font-black underline decoration-amber-400 decoration-2 underline-offset-2">Weekly Arena</span> to earn exclusive badges, titles, and premium rewards!
        </p>
      </div>
    </div>
  );
}
