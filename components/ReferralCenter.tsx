"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Share2, Copy, CheckCircle, Award, Sparkles, UserPlus } from "lucide-react";
import { getReferralCode, processReferral } from "../lib/referral";

interface ReferralCenterProps {
  userData: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReferralCenter({ userData, onClose, onSuccess }: ReferralCenterProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const myCode = userData?.id ? getReferralCode(userData.id) : "XXXXXX";

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `🚀 Unlock 3 Days of Achivox Premium & 500 XP for FREE!\n\nUse my invite code: *${myCode}* when you log in.\n\nDownload now to boost your board scores!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Achivox Invite",
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
      alert("Code copied to clipboard! Share it with your friends.");
    }
  };

  const handleClaim = async () => {
    if (code.length < 6) {
      setError("Please enter a valid 6-character code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await processReferral(userData.id, code);
      setSuccess(result.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to claim code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 w-full max-w-md rounded-[32px] border border-slate-800 overflow-hidden relative shadow-[0_0_50px_rgba(99,102,241,0.15)]"
      >
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 relative z-10">
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
            <Gift className="w-6 h-6 text-white" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Refer & Earn Premium</h2>
            <p className="text-slate-400 text-sm font-medium">Invite friends and you both get <strong className="text-emerald-400">3 Days Premium + 500 XP!</strong></p>
          </div>

          {/* Share Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Your Invite Code</p>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-4xl font-black text-white tracking-[0.2em]">{myCode}</div>
              <button 
                onClick={handleCopy}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-slate-300"
              >
                {copied ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>

            <button 
              onClick={handleShare}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
              <Share2 className="w-6 h-6" />
              Share on WhatsApp
            </button>
          </div>

          {/* Claim Section */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 text-center">Have an invite code?</p>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-digit code" 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 text-center font-bold text-lg text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                disabled={loading || !!success || !!userData?.referredBy}
              />
              <button 
                onClick={handleClaim}
                disabled={loading || code.length < 6 || !!success || !!userData?.referredBy}
                className="bg-primary hover:bg-primary-dark text-white px-6 rounded-xl font-black transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Sparkles className="w-6 h-6 animate-spin" /> : "Claim"}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs text-center mt-3 font-bold">
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-4 flex items-center justify-center gap-2">
                  <Award className="w-6 h-6 text-emerald-400" />
                  <p className="text-emerald-400 text-sm font-bold">{success}</p>
                </motion.div>
              )}
              {userData?.referredBy && !success && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-4 flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-slate-400" />
                  <p className="text-slate-400 text-xs font-bold">You've already claimed a referral code.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
