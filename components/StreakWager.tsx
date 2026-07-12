"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Coins, ShieldCheck, Target, AlertTriangle } from "lucide-react";

interface StreakWagerProps {
  currentCoins: number;
  currentStreak: number;
  onPlaceWager: (amount: number, targetDays: number) => Promise<boolean>;
  activeWager?: { amount: number; targetStreak: number; startDate: any } | null;
}

export default function StreakWager({ currentCoins, currentStreak, onPlaceWager, activeWager }: StreakWagerProps) {
  const [wagerAmount, setWagerAmount] = useState(50);
  const [loading, setLoading] = useState(false);

  const targetDays = 7; // Fixed 7-day wager for simplicity
  const potentialWin = wagerAmount * 3; // 3x multiplier
  
  const handleWager = async () => {
    if (wagerAmount > currentCoins) {
      alert("You don't have enough Achivox Coins for this wager!");
      return;
    }
    setLoading(true);
    const success = await onPlaceWager(wagerAmount, targetDays);
    setLoading(false);
    if (success) {
      alert("Wager placed! Maintain your streak to win 3x coins!");
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Flame className="w-40 h-40" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <div className="w-6 h-6 rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">Streak Wager</h2>
            <p className="text-sm text-slate-400 font-medium">Bet on your discipline!</p>
          </div>
        </div>

        {activeWager ? (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Flame className="w-6 h-6 fill-current" />
              <span className="font-bold text-sm uppercase tracking-wide">Active Wager</span>
            </div>
            <div className="flex justify-between items-center bg-black/30 rounded-xl p-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Target Streak</p>
                <p className="text-2xl font-black">{activeWager.targetStreak} 🔥</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Potential Win</p>
                <p className="text-2xl font-black text-amber-400">+{activeWager.amount * 3} 🪙</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              If you miss a day and lose your streak, your wagered coins are lost.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
              <p className="text-sm font-medium text-slate-300 leading-snug">
                Bet your Achivox Coins that you can maintain a <strong className="text-white">7-Day Study Streak</strong>. 
                Succeed and win <strong className="text-amber-400">3X</strong> your bet!
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Wager Amount</span>
                  <span>Win Amount</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="50" 
                    max="500" 
                    step="50"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <Coins className="w-6 h-6 text-slate-300" />
                    <span className="font-bold text-lg">{wagerAmount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30">
                    <Coins className="w-6 h-6 text-amber-400" />
                    <span className="font-bold text-lg text-amber-400">{potentialWin}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleWager}
              disabled={loading || currentCoins < wagerAmount}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Placing Wager..." : currentCoins < wagerAmount ? "Not Enough Coins" : "Lock In Wager"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
