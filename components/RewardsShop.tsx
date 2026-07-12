"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Zap, Lock, Check, X, Sparkles, Gift } from "lucide-react";

interface RewardItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
  type: "theme" | "badge" | "powerup";
}

const REWARDS: RewardItem[] = [
  { id: "1", name: "Midnight Nebula Theme", cost: 500, description: "Unlock a deep space purple aesthetic", icon: "🌌", type: "theme" },
  { id: "2", name: "Double XP Boost (1hr)", cost: 1200, description: "Earn 2x points on all tests", icon: "⚡", type: "powerup" },
  { id: "3", name: "Golden Aura Profile", cost: 2500, description: "Stand out with a glowing avatar", icon: "✨", type: "badge" },
  { id: "4", name: "Ad-Free Forever", cost: 5000, description: "Remove all platform distractions", icon: "🛡️", type: "powerup" },
  { id: "5", name: "Pro Mentor Voice Pack", cost: 1500, description: "Get premium AI Coach voices", icon: "🎙️", type: "theme" }
];

interface RewardsShopProps {
  currentXP: number;
  onPurchase: (item: RewardItem) => void;
  onClose: () => void;
}

export default function RewardsShop({ currentXP, onPurchase, onClose }: RewardsShopProps) {
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  const handleBuy = (item: RewardItem) => {
    if (currentXP < item.cost) return alert("Not enough XP! Keep studying to earn more.");
    setPurchased(new Set(purchased).add(item.id));
    onPurchase(item);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[48px] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="p-10 bg-gradient-to-br from-indigo-600 to-violet-800 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-4xl font-black italic uppercase tracking-tight">Rewards Shop</h2>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Spend your hard-earned XP</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="mt-8 flex items-center gap-4 bg-white/10 backdrop-blur-md w-fit px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
             <Zap className="w-6 h-6 text-yellow-400" />
             <span className="text-2xl font-black tabular-nums">{currentXP.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Items List */}
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto custom-scrollbar">
           {REWARDS.map(item => (
             <motion.div 
               key={item.id}
               whileHover={{ scale: 1.02 }}
               className={`p-6 rounded-[32px] border-2 transition-all flex flex-col justify-between h-56 ${purchased.has(item.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}
             >
               <div className="space-y-3">
                 <div className="flex justify-between items-start">
                   <div className="text-3xl">{item.icon}</div>
                   {purchased.has(item.id) ? (
                     <div className="bg-emerald-500 text-white p-1.5 rounded-full"><Check className="w-3.5 h-3.5" /></div>
                   ) : (
                     <div className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">
                       <Zap className="w-3 h-3" /> {item.cost}
                     </div>
                   )}
                 </div>
                 <div>
                   <h4 className={`text-sm font-black uppercase ${purchased.has(item.id) ? 'text-emerald-700' : 'text-slate-800 dark:text-white'}`}>{item.name}</h4>
                   <p className="text-[10px] font-bold text-slate-400 leading-tight mt-1">{item.description}</p>
                 </div>
               </div>
               
               <button 
                 onClick={() => handleBuy(item)}
                 disabled={purchased.has(item.id)}
                 className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   purchased.has(item.id) 
                     ? 'bg-emerald-100 text-emerald-600 cursor-default' 
                     : currentXP >= item.cost 
                       ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-indigo-600' 
                       : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                 }`}
               >
                 {purchased.has(item.id) ? 'Unlocked' : currentXP >= item.cost ? 'Buy Now' : 'Not Enough XP'}
               </button>
             </motion.div>
           ))}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">New rewards arrive every week</p>
        </div>
      </motion.div>
    </div>
  );
}
