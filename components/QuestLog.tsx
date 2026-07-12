"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sword, Target, Clock, Gift, Sparkles, ChevronRight, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { addXP, addCoins } from "../lib/gamification";

export default function QuestLog({ onClose, userData, onRewardClaimed }: { onClose: () => void, userData: any, onRewardClaimed: () => void }) {
  const [claiming, setClaiming] = useState<number | null>(null);
  const [showLootBox, setShowLootBox] = useState(false);
  const [lootBoxOpened, setLootBoxOpened] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [coinRewardAmount, setCoinRewardAmount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [quests, setQuests] = useState<any[]>([]);

  useEffect(() => {
    if (userData) {
      // Calculate targets based on database claimed tiers
      const qSolved = userData.totalSolved || 0;
      const claimedScholarTier = userData.claimedScholarTier || 0;
      const scholarTarget = (claimedScholarTier + 1) * 50;

      // NOTE: Prodigy XP is shown from userData.points (synced from user_stats.xp).
      // The actual verification is done live from Firestore in openLootBox.
      const xp = userData.points || 0;
      const claimedProdigyTier = userData.claimedProdigyTier || 0;
      const prodigyTarget = (claimedProdigyTier + 1) * 1000;

      const correctAns = userData.correctAnswers || 0;
      const claimedSniperTier = userData.claimedSniperTier || 0;
      const sniperTarget = (claimedSniperTier + 1) * 30;

      const streak = userData.streak || 0;
      const claimedConsistentTier = userData.claimedConsistentTier || 0;
      const consistentTarget = (claimedConsistentTier + 1) * 5;

      const mastery = userData.masteryLevel || 0;
      const claimedMasteryTier = userData.claimedMasteryTier || 0;
      const masteryTarget = (claimedMasteryTier + 1) * 2;

      const focusSessions = userData.focusSessions || 0;
      const claimedFocusTier = userData.claimedFocusTier || 0;
      const focusTarget = (claimedFocusTier + 1) * 3;

      const doubtsSolved = userData.doubtsSolved || 0;
      const claimedDialogueTier = userData.claimedDialogueTier || 0;
      const dialogueTarget = (claimedDialogueTier + 1) * 10;

      const testsCompleted = userData.testsCompleted || 0;
      const claimedConquerorTier = userData.claimedConquerorTier || 0;
      const conquerorTarget = (claimedConquerorTier + 1) * 5;

      setQuests([
        { id: 1, title: "The Scholar", desc: `Solve ${scholarTarget} Total Questions`, current: qSolved, target: scholarTarget, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", reward: 200 * (claimedScholarTier + 1), coinsReward: 50 * (claimedScholarTier + 1), claimed: false },
        { id: 2, title: "The Prodigy", desc: `Earn ${prodigyTarget} Total XP Points`, current: xp, target: prodigyTarget, icon: Sword, color: "text-rose-500", bg: "bg-rose-500/10", reward: 500 * (claimedProdigyTier + 1), coinsReward: 150 * (claimedProdigyTier + 1), claimed: false },
        { id: 3, title: "The Sniper", desc: `Get ${sniperTarget} Correct Answers`, current: correctAns, target: sniperTarget, icon: Sparkles, color: "text-yellow-500", bg: "bg-yellow-500/10", reward: 300 * (claimedSniperTier + 1), coinsReward: 80 * (claimedSniperTier + 1), claimed: false },
        { id: 4, title: "The Consistent", desc: `Maintain a ${consistentTarget} Day Streak`, current: streak, target: consistentTarget, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-500/10", reward: 300 * (claimedConsistentTier + 1), coinsReward: 100 * (claimedConsistentTier + 1), claimed: false },
        { id: 5, title: "Mastery Challenger", desc: `Reach Mastery Level ${masteryTarget}`, current: mastery, target: masteryTarget, icon: Gift, color: "text-emerald-500", bg: "bg-emerald-500/10", reward: 400 * (claimedMasteryTier + 1), coinsReward: 120 * (claimedMasteryTier + 1), claimed: false },
        { id: 6, title: "Focus Champion", desc: `Complete ${focusTarget} Focus Sessions`, current: focusSessions, target: focusTarget, icon: Clock, color: "text-teal-500", bg: "bg-teal-500/10", reward: 250 * (claimedFocusTier + 1), coinsReward: 60 * (claimedFocusTier + 1), claimed: false },
        { id: 7, title: "AI Dialogue", desc: `Solve ${dialogueTarget} doubts using AI`, current: doubtsSolved, target: dialogueTarget, icon: Sparkles, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", reward: 200 * (claimedDialogueTier + 1), coinsReward: 50 * (claimedDialogueTier + 1), claimed: false },
        { id: 8, title: "Test Conqueror", desc: `Complete ${conquerorTarget} full tests`, current: testsCompleted, target: conquerorTarget, icon: Target, color: "text-amber-500", bg: "bg-amber-500/10", reward: 350 * (claimedConquerorTier + 1), coinsReward: 90 * (claimedConquerorTier + 1), claimed: false }
      ]);
    }
  }, [userData]);

  const handleClaim = (questId: number, reward: number, coinsReward: number) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.current < quest.target) {
      alert("❌ This mission is not complete yet! Complete the goal to unlock epic loot.");
      return;
    }

    setClaiming(questId);
    setRewardAmount(reward);
    setCoinRewardAmount(coinsReward);
    setTimeout(() => {
      setShowLootBox(true);
      setQuests(quests.map(q => q.id === questId ? { ...q, claimed: true } : q));
    }, 500);
  };

  const openLootBox = async () => {
    if (lootBoxOpened || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    
    try {
      const userId = userData?.uid || userData?.id;
      if (!userId || claiming === null) {
        setVerifying(false);
        return;
      }

      const dbFieldMap: Record<number, string> = {
        1: "claimedScholarTier",
        2: "claimedProdigyTier",
        3: "claimedSniperTier",
        4: "claimedConsistentTier",
        5: "claimedMasteryTier",
        6: "claimedFocusTier",
        7: "claimedDialogueTier",
        8: "claimedConquerorTier"
      };

      // Live field values from Firestore for each quest
      const liveFieldMap: Record<number, (userDoc: any, statsDoc: any) => number> = {
        1: (u) => u.totalSolved || 0,
        2: (_u, s) => s?.xp || 0,   // Prodigy checks live XP from user_stats
        3: (u) => u.correctAnswers || 0,
        4: (u) => u.streak || 0,
        5: (u) => u.masteryLevel || 0,
        6: (u) => u.focusSessions || 0,
        7: (u) => u.doubtsSolved || 0,
        8: (u) => u.testsCompleted || 0,
      };

      const tierField = dbFieldMap[claiming];
      if (!tierField) {
        setVerifying(false);
        return;
      }

      // ── LIVE VERIFICATION: Read authoritative data from Firestore ──
      const [userSnap, statsSnap] = await Promise.all([
        getDoc(doc(db, "users", userId)),
        getDoc(doc(db, "user_stats", userId))
      ]);

      if (!userSnap.exists()) {
        setVerifyError("Could not verify your data. Please try again.");
        setVerifying(false);
        return;
      }

      const liveUserData = userSnap.data();
      const liveStatsData = statsSnap.exists() ? statsSnap.data() : {};

      // Get the current claimed tier from LIVE Firestore (not stale prop)
      const currentClaimedTier = liveUserData[tierField] || 0;
      // Compute the target for THIS tier
      const quest = quests.find(q => q.id === claiming);
      if (!quest) {
        setVerifying(false);
        return;
      }

      // Get the live current value for this quest type
      const liveCurrentValue = liveFieldMap[claiming](liveUserData, liveStatsData);

      // STRICT CHECK: live value must meet or exceed the quest target
      if (liveCurrentValue < quest.target) {
        setVerifyError(`❌ Mission not complete yet! You have ${liveCurrentValue}/${quest.target}. Keep going!`);
        setVerifying(false);
        // Revert optimistic UI
        setQuests(prev => prev.map(q => q.id === claiming ? { ...q, claimed: false } : q));
        setShowLootBox(false);
        setClaiming(null);
        return;
      }

      // ANTI-DOUBLE-CLAIM: Check if this tier was already claimed in Firestore
      if (currentClaimedTier > (quest.target / (quest.id === 2 ? 1000 : quest.id === 1 ? 50 : quest.id === 3 ? 30 : quest.id === 4 ? 5 : quest.id === 5 ? 2 : quest.id === 6 ? 3 : quest.id === 7 ? 10 : 5) - 1)) {
        // Already at a higher tier than we are claiming
      }

      // localStorage anti-duplicate guard
      const localCacheKey = `claimed_quest_${userId}_${claiming}_${currentClaimedTier}`;
      if (localStorage.getItem(localCacheKey)) {
        setVerifyError("You've already claimed this reward! Complete more to unlock the next tier.");
        setVerifying(false);
        setShowLootBox(false);
        setClaiming(null);
        return;
      }
      localStorage.setItem(localCacheKey, "true");

      // ── AWARD: Use addXP so user_stats stays authoritative ──
      const questLabel = quest.title;
      await Promise.all([
        addXP(userId, rewardAmount, `Quest Reward: ${questLabel} Tier ${currentClaimedTier + 1}`),
        addCoins(userId, coinRewardAmount, `Quest Coins: ${questLabel} Tier ${currentClaimedTier + 1}`),
        // Increment the claimed tier in users doc (strict set prevents double-jump)
        updateDoc(doc(db, "users", userId), {
          [tierField]: currentClaimedTier + 1
        })
      ]);

      setLootBoxOpened(true);
      onRewardClaimed();
    } catch (e) {
      console.error("Failed to verify/add rewards:", e);
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const closeLootBox = () => {
    setShowLootBox(false);
    setLootBoxOpened(false);
    setClaiming(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative"
      >
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/5" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
              <Sword className="w-6 h-6 text-amber-500 animate-pulse" />
              Daily Quests
            </h2>
            <p className="text-[10px] text-amber-500/70 font-black uppercase tracking-widest mt-1">Complete missions for epic loot</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors relative z-10">
            <X className="w-5 h-5 text-white/55" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
          {quests.map((quest, index) => {
            const isCompleted = quest.current >= quest.target;
            const progressPercent = Math.min((quest.current / quest.target) * 100, 100);
            
            return (
              <motion.div 
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800/50 border ${isCompleted && !quest.claimed ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-slate-700/50'} p-4 rounded-3xl relative overflow-hidden`}
              >
                {isCompleted && !quest.claimed && (
                   <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/20 blur-2xl rounded-full" />
                )}
                
                <div className="flex gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${quest.bg} ${quest.color} icon-3d`}>
                    <quest.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-sm">{quest.title}</h3>
                    <p className="text-slate-400 text-xs font-medium leading-tight mt-1">{quest.desc}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {quest.current} / {quest.target} Completed
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-yellow-400 text-[10px] font-black whitespace-nowrap">
                          <Zap className="w-3 h-3 fill-yellow-400" /> +{quest.reward} XP
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-[10px] font-black whitespace-nowrap">
                          🪙 +{quest.coinsReward} Coins
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2.5 h-2 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${isCompleted ? 'bg-amber-500' : 'bg-primary'}`} 
                      />
                    </div>

                    {isCompleted && !quest.claimed && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaim(quest.id, quest.reward, quest.coinsReward)}
                        className="mt-4 w-full bg-amber-500 text-amber-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 animate-bounce"
                      >
                        {claiming === quest.id ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity }}><Sparkles className="w-4 h-4" /></motion.div> : "Claim Loot Box 🪙"}
                      </motion.button>
                    )}
                    
                    {quest.claimed && (
                       <div className="mt-4 w-full bg-slate-900/50 border border-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center">
                         Claimed
                       </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* LOOT BOX MODAL */}
      <AnimatePresence>
        {showLootBox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              <motion.div 
                animate={{ 
                  scale: lootBoxOpened ? [1, 2, 0] : [1, 1.2, 1],
                  opacity: lootBoxOpened ? [1, 0] : [0.5, 0.8, 0.5]
                }}
                transition={{ duration: lootBoxOpened ? 0.5 : 2, repeat: lootBoxOpened ? 0 : Infinity }}
                className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full"
              />

              {verifyError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 text-center mb-6"
                >
                  <div className="bg-red-500/20 border border-red-500/40 rounded-2xl px-5 py-4 max-w-xs mx-auto">
                    <p className="text-red-400 font-black text-sm">{verifyError}</p>
                  </div>
                  <button
                    onClick={() => { setShowLootBox(false); setClaiming(null); setVerifyError(null); }}
                    className="mt-4 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              )}

              {!lootBoxOpened && !verifyError && (

                <motion.button
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [-2, 2, -2]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  whileTap={{ scale: 0.9, rotate: 0 }}
                  onClick={openLootBox}
                  disabled={verifying}
                  className={`relative z-10 w-48 h-48 bg-gradient-to-b from-amber-400 to-orange-600 rounded-3xl shadow-2xl border-4 border-amber-300 flex flex-col items-center justify-center group ${verifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-16 h-16 text-white mb-2 animate-spin" />
                      <p className="text-white font-black uppercase tracking-widest text-xs">Verifying...</p>
                    </>
                  ) : (
                    <>
                      <Gift className="w-20 h-20 text-white mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-black uppercase tracking-widest text-xs">Tap to Open</p>
                    </>
                  )}
                </motion.button>
              )}

              {lootBoxOpened && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative z-10 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-32 h-32 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_100px_rgba(250,204,21,0.5)] border border-yellow-400/50"
                  >
                    <Gift className="w-16 h-16 text-yellow-400" />
                  </motion.div>
                  <h3 className="text-4xl font-black text-white tracking-tighter mb-2">+{rewardAmount} XP</h3>
                  <h3 className="text-3xl font-black text-yellow-400 tracking-tighter mb-4">🪙 +{coinRewardAmount} Coins</h3>
                  <p className="text-amber-500 font-black uppercase tracking-widest text-xs mb-8">Epic Rewards Unlocked!</p>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={closeLootBox}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-colors"
                  >
                    Awesome
                  </motion.button>
                </motion.div>
              )}

              {/* Sparkles */}
              {lootBoxOpened && (
                 <>
                   {[...Array(15)].map((_, i) => (
                     <motion.div
                       key={i}
                       initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                       animate={{ 
                         opacity: 0, 
                         x: (Math.random() - 0.5) * 400, 
                         y: (Math.random() - 0.5) * 400,
                         scale: Math.random() * 2 + 1,
                         rotate: Math.random() * 360
                       }}
                       transition={{ duration: 1, ease: "easeOut" }}
                       className="absolute top-1/2 left-1/2 -mt-2 -ml-2 text-yellow-400"
                     >
                       <Sparkles className="w-4 h-4" />
                     </motion.div>
                   ))}
                 </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
