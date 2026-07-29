"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Gift, Share2, Copy, CheckCircle, Award, Sparkles, UserPlus, 
  Clock, CheckCircle2, Wallet, ArrowRight, ShieldAlert, AlertCircle, Info, ChevronRight, TrendingUp, Send
} from "lucide-react";
import { getReferralCode, processReferralCode, ReferralItem } from "../lib/referral";
import { requestPayout, getUserPayoutHistory, PayoutRequest } from "../lib/payouts";

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
  const [activeTab, setActiveTab] = useState<"refer" | "tracking" | "payouts" | "terms">("refer");

  // Payout Modal States
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);

  const userId = userData?.id || "";
  const myCode = getReferralCode(userId);
  const referralLink = `https://achivox.online/login?ref=${myCode}`;

  const referralEarnings = Number(userData?.referralEarnings || 0);
  const MAX_PAYOUT = 1000;
  const isMaxReached = referralEarnings >= MAX_PAYOUT;

  const rawReferrals: ReferralItem[] = userData?.referrals || [];
  const pendingReferrals = rawReferrals.filter(r => r.status === "pending");
  const completedReferrals = rawReferrals.filter(r => r.status === "completed");

  useEffect(() => {
    if (userId) {
      getUserPayoutHistory(userId).then(setPayoutHistory);
    }
  }, [userId]);

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    const message = `🚀 Join me on Achivox — India's Top AI Study App!\n\nUse my invite code: *${myCode}*\nLink: ${referralLink}\n\nGet FREE Smart Notes, Mock Tests & AI Doubt Solver!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Achivox Referral Invite",
          text: message,
          url: referralLink,
        });
      } catch (err) {
        window.open(whatsappUrl, "_blank");
      }
    } else {
      window.open(whatsappUrl, "_blank");
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
      const result = await processReferralCode(userId, code);
      setSuccess(result.message);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to claim code.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError("");
    setPayoutSuccess("");

    const numAmount = Number(payoutAmount);
    if (!upiId || !upiId.includes("@")) {
      setPayoutError("Please enter a valid UPI ID (e.g. name@upi or phone@paytm).");
      return;
    }
    if (!numAmount || numAmount < 50) {
      setPayoutError("Minimum withdrawal amount is ₹50.");
      return;
    }
    if (numAmount > referralEarnings) {
      setPayoutError(`Amount exceeds available balance of ₹${referralEarnings}.`);
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await requestPayout(
        userId,
        userData.name || "Student",
        userData.email || "Student",
        upiId,
        numAmount
      );
      setPayoutSuccess(res.message);
      // Refresh history
      const updatedHistory = await getUserPayoutHistory(userId);
      setPayoutHistory(updatedHistory);
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccess("");
        setPayoutAmount("");
      }, 3000);
    } catch (err: any) {
      setPayoutError(err.message || "Failed to submit payout request.");
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 w-full max-w-lg rounded-[32px] border border-slate-800 overflow-hidden relative shadow-[0_0_60px_rgba(99,102,241,0.2)] my-auto"
      >
        {/* Glow backdrop */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 relative z-10 space-y-5">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Refer & Earn ₹50</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  1-Yr Pro Sub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Earn ₹50 cash for every friend who subscribes to 1-Yr Pro!</p>
            </div>
          </div>

          {/* Wallet Summary Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Referral Wallet Balance</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-white">₹{referralEarnings}</span>
                  <span className="text-xs font-bold text-slate-400">/ ₹{MAX_PAYOUT} Max</span>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end gap-1.5">
                <button
                  onClick={() => setShowPayoutModal(true)}
                  disabled={referralEarnings < 50}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-3.5 h-3.5" /> Withdraw (UPI)
                </button>
                <span className="text-[9px] font-black uppercase text-amber-400">
                  {referralEarnings < 50 ? "Min ₹50 required" : "Processed in 72h"}
                </span>
              </div>
            </div>

            {/* Progress bar to ₹1,000 */}
            <div className="space-y-1 mb-4">
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (referralEarnings / MAX_PAYOUT) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>₹0</span>
                <span>₹500</span>
                <span>₹1,000 Limit</span>
              </div>
            </div>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
              <div className="bg-white/5 p-2 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400">Total Invited</p>
                <p className="text-sm font-black text-white">{rawReferrals.length}</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                <p className="text-[10px] font-bold text-amber-400">Pending</p>
                <p className="text-sm font-black text-amber-300">{pendingReferrals.length}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-400">Paid (₹50)</p>
                <p className="text-sm font-black text-emerald-300">{completedReferrals.length}</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab("refer")}
              className={`flex-1 py-2 rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeTab === "refer" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button
              onClick={() => setActiveTab("tracking")}
              className={`flex-1 py-2 rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeTab === "tracking" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Friends ({rawReferrals.length})
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`flex-1 py-2 rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeTab === "payouts" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" /> Payouts ({payoutHistory.length})
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`flex-1 py-2 rounded-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeTab === "terms" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Info className="w-3.5 h-3.5" /> Rules
            </button>
          </div>

          {/* TAB 1: REFER & SHARE */}
          {activeTab === "refer" && (
            <div className="space-y-4">
              
              {/* Share Box */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-3 relative overflow-hidden">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Unique Invite Code</p>
                
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-[0.2em] font-mono">{myCode}</span>
                  <button 
                    onClick={() => handleCopy(myCode)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-slate-200"
                    title="Copy Code"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleShareWhatsApp}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Invite Link on WhatsApp
                  </button>
                </div>
              </div>

              {/* Claim Friend's Code Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300 font-black uppercase tracking-wider">Have a Friend's Invite Code?</p>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    +100 Bonus XP
                  </span>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="Enter 6-digit code" 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-center font-mono font-bold text-base text-white placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    disabled={loading || !!success || !!userData?.referredBy}
                  />
                  <button 
                    onClick={handleClaim}
                    disabled={loading || code.length < 6 || !!success || !!userData?.referredBy}
                    className="bg-primary hover:bg-primary/90 text-white px-5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : "Apply Code"}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-bold text-center">
                      {error}
                    </motion.p>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                      <p className="text-emerald-400 text-xs font-bold">{success}</p>
                    </motion.div>
                  )}
                  {userData?.referredBy && !success && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-slate-400 text-xs font-bold">You are already linked to referrer {userData.referredByName || "Friend"}.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}

          {/* TAB 2: FRIENDS TRACKING LIST */}
          {activeTab === "tracking" && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              <div className="flex justify-between items-center px-1 text-xs text-slate-400 font-bold">
                <span>Friend / User</span>
                <span>Referral Status</span>
              </div>

              {rawReferrals.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <UserPlus className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-black text-slate-300">No friends joined yet</p>
                  <p className="text-xs text-slate-400 font-medium">Share your invite link above! When friends join, they will show up here instantly.</p>
                </div>
              ) : (
                rawReferrals.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        item.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {item.name?.[0] || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white leading-tight">{item.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                          Joined: {new Date(item.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.status === "completed" ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Earned ₹50 (1-Yr) 🎉</span>
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1" title="User joined, waiting for 1-Year subscription">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>Pending (1-Yr Sub)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PAYOUT HISTORY */}
          {activeTab === "payouts" && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              <div className="flex justify-between items-center px-1 text-xs text-slate-400 font-bold">
                <span>Requested Date / UPI</span>
                <span>Amount & Status</span>
              </div>

              {payoutHistory.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-black text-slate-300">No payout requests yet</p>
                  <p className="text-xs text-slate-400 font-medium">When you withdraw earnings, your UPI requests will be tracked here!</p>
                </div>
              ) : (
                payoutHistory.map((pay, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-white font-mono">{pay.upiId}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        Requested: {new Date(pay.requestedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-white">₹{pay.amount}</p>
                      {pay.status === "approved" ? (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Paid & Approved ✅
                        </span>
                      ) : pay.status === "rejected" ? (
                        <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Rejected ❌
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Pending (Within 72h) ⏳
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: TERMS & CONDITIONS */}
          {activeTab === "terms" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-3 text-slate-300 max-h-64 overflow-y-auto">
              <h4 className="font-black text-white text-sm flex items-center gap-2 border-b border-white/10 pb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Referral Program Terms & Conditions
              </h4>

              <div className="space-y-2 font-medium leading-relaxed">
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">1.</span>
                  <p><strong className="text-white">Reward Validity:</strong> You earn <strong className="text-emerald-400">₹50 cash reward</strong> when your referred friend purchases a <strong className="text-amber-300">1-Year Achivox Pro Subscription</strong>.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">2.</span>
                  <p><strong className="text-white">Real-Time Status:</strong> When a friend joins using your code, status displays <strong className="text-amber-300">Pending (1-Yr Sub)</strong> until they complete the 1-Year subscription. Once verified, ₹50 is credited instantly.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">3.</span>
                  <p><strong className="text-white">72-Hour Payout SLA:</strong> Payout requests submitted to your UPI ID are verified and transferred by Admin within <strong className="text-emerald-400">72 hours</strong>.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">4.</span>
                  <p><strong className="text-white">Maximum Cap Limit:</strong> The maximum total payout per user account is <strong className="text-amber-300">₹1,000</strong> (max 20 paid 1-year referrals).</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">5.</span>
                  <p><strong className="text-white">Fair Usage & Anti-Fraud:</strong> Self-referrals, duplicate accounts on the same device, or fraudulent activities will result in immediate disqualification and wallet forfeiture.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* PAYOUT REQUEST MODAL OVERLAY */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[32px] p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setShowPayoutModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Withdraw Referral Earnings</h3>
                  <p className="text-xs text-slate-400 font-medium">Available Balance: <strong className="text-emerald-400">₹{referralEarnings}</strong></p>
                </div>
              </div>

              {/* 72h SLA Banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs text-amber-200/90 font-medium leading-snug">
                  Payouts are verified and transferred to your UPI ID within <strong>72 hours</strong>. Balance is deducted upon Admin approval.
                </p>
              </div>

              <form onSubmit={handlePayoutSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Your UPI ID (e.g. name@upi, phone@paytm)
                  </label>
                  <input 
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                    placeholder="e.g. 9876543210@paytm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Amount to Withdraw (₹)
                  </label>
                  <input 
                    type="number"
                    required
                    min={50}
                    max={referralEarnings}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={`Enter amount (Min ₹50, Max ₹${referralEarnings})`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {payoutError && (
                  <p className="text-red-400 text-xs font-bold text-center">{payoutError}</p>
                )}

                {payoutSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{payoutSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={payoutLoading || !upiId || !payoutAmount}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {payoutLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : "Submit Payout Request"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
