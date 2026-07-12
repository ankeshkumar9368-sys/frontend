import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp, User as UserIcon, Loader2 } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import SmartAvatar from "./SmartAvatar";

interface Leader {
  id: string;
  name: string;
  score: number;
  avatar: string;
  rank: number;
  badge?: string;
  isSubscribed?: boolean;
}

export default function Leaderboard({ userData }: { userData: any }) {
  const getLeague = (points: number) => {
    if (points >= 5000) return "Gold";
    if (points >= 1000) return "Silver";
    return "Bronze";
  };

  const initialLeague = userData?.points ? getLeague(userData.points) : "Bronze";
  const [category, setCategory] = useState(initialLeague);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | string>("--");
  const [timeLeft, setTimeLeft] = useState("");

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

  useEffect(() => {
    setLoading(true);
    let q;
    if (category === "Gold") {
      q = query(collection(db, "users"), where("points", ">=", 5000), orderBy("points", "desc"), limit(10));
    } else if (category === "Silver") {
      q = query(collection(db, "users"), where("points", ">=", 1000), where("points", "<", 5000), orderBy("points", "desc"), limit(10));
    } else {
      q = query(collection(db, "users"), where("points", ">=", 0), where("points", "<", 1000), orderBy("points", "desc"), limit(10));
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const topLeaders: Leader[] = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        const name = data.name || "Aspirant";
        return {
          id: doc.id,
          name: name,
          score: data.points || 0,
          rank: index + 1,
          avatar: data.photoURL || (name[0] + (name.split(' ')[1]?.[0] || "")),
          badge: (data.points > 5000 ? "Legend" : data.points > 2000 ? "Expert" : data.points > 1000 ? "Pro" : undefined),
          isSubscribed: data.isSubscribed || false
        };
      });
      setLeaders(topLeaders);
      
      // Real-time user rank calculation
      const myIndex = topLeaders.findIndex(l => l.id === userData?.uid);
      if (myIndex !== -1) {
        setUserRank(myIndex + 1);
      } else {
        // Find accurate rank by counting users with more points
        try {
          const { getCountFromServer } = require("firebase/firestore");
          let countQuery;
          if (category === "Gold") {
            countQuery = query(collection(db, "users"), where("points", ">", userData?.points || 0));
          } else if (category === "Silver") {
            countQuery = query(collection(db, "users"), where("points", ">", userData?.points || 0), where("points", "<", 5000));
          } else {
            countQuery = query(collection(db, "users"), where("points", ">", userData?.points || 0), where("points", "<", 1000));
          }
          const countSnapshot = await getCountFromServer(countQuery);
          setUserRank(countSnapshot.data().count + 1);
        } catch (e) {
          setUserRank(userData?.rank || "42+");
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid, userData?.points, category]);

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
      {/* 👑 PREMIUM TEASE BANNER */}
      <div className="bg-gradient-to-r from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 rounded-2xl border border-amber-300/50 shadow-inner flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-sm">👑</div>
          <div>
            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Did you know?</p>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-100">Premium users score <span className="font-black text-amber-600 dark:text-amber-400">40% higher</span> in exams on average.</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1 shadow-inner no-print">
        {["Bronze", "Silver", "Gold"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setCategory(tab)}
            className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${
              category === tab 
                ? tab === 'Gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-md text-white scale-[1.02]' 
                : tab === 'Silver' ? 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-md text-white scale-[1.02]'
                : 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-md text-white scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* League Status */}
      <div className={`p-4 rounded-[28px] border flex items-center justify-between overflow-hidden relative ${
        category === "Gold" ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/20" : 
        category === "Silver" ? "bg-gradient-to-r from-slate-500/10 to-gray-500/10 border-slate-500/20" : 
        "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20"
      }`}>
        <div className="flex items-center gap-3 relative z-10">
          <div className={`w-6 h-6 rounded-xl flex items-center justify-center animate-pulse ${
            category === "Gold" ? "bg-yellow-500/20" : category === "Silver" ? "bg-slate-400/20" : "bg-orange-500/20"
          }`}>
            <Trophy className={`w-6 h-6 ${
              category === "Gold" ? "text-yellow-500" : category === "Silver" ? "text-slate-400" : "text-orange-500"
            }`} />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${
              category === "Gold" ? "text-yellow-600 dark:text-yellow-400" : category === "Silver" ? "text-slate-600 dark:text-slate-300" : "text-orange-600 dark:text-orange-400"
            }`}>Active League: {category}</p>
            <p className="text-xs font-bold text-slate-500">Ends in: {timeLeft || "..."}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-border shadow-sm relative z-10">
          <span className="text-[10px] font-black text-slate-400">Prize: {category === "Gold" ? "5000" : category === "Silver" ? "1000" : "200"} XP</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-2 pt-10 pb-6 px-4">
        {/* 2nd Place */}
        {leaders[1] && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <SmartAvatar name={leaders[1].name} src={leaders[1].avatar} size="lg" isPremium={leaders[1].badge === "Legend"} />
              <div className="absolute -top-3 -left-3 bg-slate-400 text-white w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-lg">2</div>
            </div>
            <div className="h-20 w-24 bg-gradient-to-t from-slate-300 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-3xl flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-black text-slate-500 truncate w-full text-center">{leaders[1].name.split(' ')[0]}</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-200">{leaders[1].score}</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {leaders[0] && (
          <div className="flex flex-col items-center gap-2 -mt-8">
            <div className="relative">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500"
              >
                <Crown className="w-6 h-6 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              </motion.div>
              <SmartAvatar name={leaders[0].name} src={leaders[0].avatar} size="xl" isPremium={true} />
              <div className="absolute -top-3 -left-3 bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-lg">1</div>
            </div>
            <div className="h-28 w-28 bg-gradient-to-t from-yellow-400 to-yellow-200 dark:from-yellow-900 dark:to-yellow-700 rounded-t-[32px] flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-black text-yellow-800 dark:text-yellow-100 truncate w-full text-center">{leaders[0].name.split(' ')[0]}</span>
              <span className="text-sm font-black text-yellow-900 dark:text-white">{leaders[0].score}</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {leaders[2] && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <SmartAvatar name={leaders[2].name} src={leaders[2].avatar} size="lg" isPremium={leaders[2].badge === "Legend"} />
              <div className="absolute -top-3 -left-3 bg-orange-400 text-white w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-lg">3</div>
            </div>
            <div className="h-16 w-24 bg-gradient-to-t from-orange-300 to-orange-100 dark:from-orange-800 dark:to-orange-700 rounded-t-3xl flex flex-col items-center justify-center p-2">
              <span className="text-[10px] font-black text-orange-500 truncate w-full text-center">{leaders[2].name.split(' ')[0]}</span>
              <span className="text-xs font-black text-orange-700 dark:text-slate-200">{leaders[2].score}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ranking List */}
      <div className="bg-card rounded-[40px] border border-border shadow-inner p-6 space-y-3">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category} Arena</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Trending
          </span>
        </div>

        {leaders.slice(3).map((leader) => (
          <motion.div 
            key={leader.id}
            whileHover={{ x: 5 }}
            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border group transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="w-6 font-black text-slate-400 text-[10px]">#{leader.rank}</span>
              <SmartAvatar name={leader.name} src={leader.avatar} size="md" isPremium={leader.badge === "Legend"} />
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight truncate max-w-[120px]">{leader.name}</span>
                {leader.badge && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-bold uppercase tracking-wider hidden sm:block">{leader.badge}</span>
                )}
                {leader.isSubscribed && (
                  <span title="Premium Member" className="text-sm drop-shadow-md">👑</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-black text-sm text-primary">{leader.score}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pts</span>
            </div>
          </motion.div>
        ))}

        {/* Current User's Stats Card */}
        <div className="pt-6 mt-4 border-t border-dashed border-border">
          <motion.div 
            className="flex items-center justify-between p-6 bg-slate-900 text-white rounded-[32px] shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white/40 uppercase leading-none mb-1">Rank</span>
                <span className="font-black text-xl leading-none italic">#{currentUser.rank}</span>
              </div>
              <div className="w-1 w-8 bg-white/10 rounded-full" />
              <div className="w-6 h-6 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner font-black text-sm">
                {currentUser.avatar}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base tracking-tight leading-none mb-1">{currentUser.name}</span>
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em]">
                  {userData?.points > 0 ? "You're Catching Up!" : "Top 80% this week"}
                </span>
              </div>
            </div>
            <div className="text-right relative z-10">
              <span className="block font-black text-2xl leading-none text-primary">{currentUser.score}</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Points</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-600/30 text-center relative overflow-hidden group">
        <Medal className="absolute top-0 right-0 w-24 h-24 text-white/10 -mr-8 -mt-8 rotate-12 group-hover:scale-110 transition-transform" />
        <p className="text-xs font-bold text-white/90 leading-relaxed relative z-10">
          🏆 Win the <span className="font-black underline decoration-yellow-400 decoration-2 underline-offset-2">Weekly Arena</span> to earn exclusive badges and premium study credits!
        </p>
      </div>
    </div>
  );
}
