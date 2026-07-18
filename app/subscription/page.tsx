"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth as clientAuth } from "../../lib/firebase";
import { 
  Sparkles, Check, Zap, ArrowLeft, Loader2, ShieldCheck, Star, 
  Flame, Clock, Users, X, Award, Gift, Tag, Percent, 
  Lock, CheckCircle2
} from "lucide-react";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Billing Cycle Toggle: 'annual' | 'monthly'
  const [proCycle, setProCycle] = useState<"annual" | "monthly">("annual");

  // Coupon State
  const [coupon, setCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Ticking Timer State (23:59:18)
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 18 });

  // Offer Rotator
  const [offerIndex, setOfferIndex] = useState(0);
  const [viewingCount, setViewingCount] = useState(127);

  const rotatingOffers = [
    { icon: Gift, text: "🎉 New User Offer: 7 Days Pro FREE on Annual Plan", badge: "Trial" },
    { icon: Flame, text: "⚡ Flash Sale: Save 60% OFF Launch Pass today", badge: "Hot" },
    { icon: Users, text: "👥 Refer 3 Friends: Get 30 Days Premium FREE", badge: "Bonus" },
    { icon: Award, text: "🏆 Maintain 30-Day Streak: Unlock 1 Month Premium", badge: "Earn" },
    { icon: Percent, text: "🎓 School/Coaching Code: Use 'SCHOOL20' for extra 20% OFF", badge: "Coupon" },
    { icon: Sparkles, text: "📚 Board Exam Special: Launch Pass for ₹399 (Limited Time)", badge: "Special" },
    { icon: Gift, text: "🎁 First Payment Reward: Instant 500 Achivox Coins", badge: "Coins" }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Offer Rotation
  useEffect(() => {
    const offerTimer = setInterval(() => {
      setOfferIndex((prev) => (prev + 1) % rotatingOffers.length);
    }, 4000);
    return () => clearInterval(offerTimer);
  }, []);

  // Live Visitor Ticker Fluctuation
  useEffect(() => {
    const countTimer = setInterval(() => {
      setViewingCount(Math.floor(120 + Math.random() * 25));
    }, 8000);
    return () => clearInterval(countTimer);
  }, []);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const cleanCode = coupon.trim().toUpperCase();
    if (["SCHOOL20", "ACHIVOX20", "EXAM20"].includes(cleanCode)) {
      setDiscountPercent(20);
      setCouponApplied(true);
    } else if (cleanCode === "") {
      setCouponError("Please enter a coupon code");
    } else {
      setCouponError("Invalid code. Try 'SCHOOL20' for 20% OFF");
    }
  };

  const handleCheckout = async (planName: string, baseAmount: number) => {
    setPayingPlan(planName);
    setErrorMsg("");

    const targetUserId = user?.uid || `guest_${Date.now()}`;
    const customerName = user?.displayName || "Academic Achiever";
    const customerEmail = user?.email || "student@achivox.online";

    const finalPrice = discountPercent > 0 
      ? Math.round(baseAmount * (1 - discountPercent / 100))
      : baseAmount;

    try {
      const response = await axios.post("/api/payment/session", {
        userId: targetUserId,
        customerName,
        customerEmail,
        customerPhone: "9999999999",
        amount: finalPrice,
        planName
      });

      if (response.data && response.data.payment_session_id) {
        const { payment_session_id } = response.data;

        const cfMode = process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox";
        const cashfree = await load({
          mode: cfMode === "production" ? "production" : "sandbox"
        });

        cashfree.checkout({
          paymentSessionId: payment_session_id,
          redirectTarget: "_self"
        });
      } else {
        throw new Error("Invalid response from payment gateway server.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMsg(error.response?.data?.error || error.message || "Checkout error. Try again.");
      setPayingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] w-full h-full overflow-y-auto bg-slate-50 text-slate-900 font-sans select-none pb-28 md:pb-32 overflow-x-hidden">
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-white text-xs py-2.5 px-3 sm:px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full shrink-0">
              {rotatingOffers[offerIndex].badge}
            </span>
            <p className="font-bold truncate text-[11px] sm:text-xs">
              {rotatingOffers[offerIndex].text}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0 text-[11px] opacity-90 font-medium">
            <span className="flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5 text-amber-300" /> {viewingCount} students viewing right now
            </span>
          </div>
        </div>
      </div>

      {/* HEADER NAV BAR */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-bold text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          100% Secure Checkout
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4 shadow-sm flex-wrap justify-center">
          <span className="text-amber-500">⭐⭐⭐⭐⭐</span>
          <span className="font-black">4.9/5 Rating</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>100K+ Active Students</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          🚀 Unlock Your Full <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">Learning Potential</span>
        </h1>
        
        <p className="text-xs sm:text-base text-slate-600 font-medium max-w-2xl mx-auto mt-2 sm:mt-3">
          Join thousands of top scorers improving their marks with AI notes, weak-topic detection, and unlimited mock practice.
        </p>

        {/* Responsive Trust Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto mt-5 text-[11px] sm:text-xs font-bold text-slate-600">
          <div className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 4.9 Rating (10K+ reviews)
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 100K+ Students
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Secure Payments
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Cancel Anytime
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>🔥 <b>8,742 students</b> upgraded their plan this month</span>
        </div>
      </section>

      {errorMsg && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-4">
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 p-4 rounded-2xl text-xs font-black flex items-center justify-between gap-2 shadow-sm">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        </section>
      )}

      {/* 3. LIMITED TIME LAUNCH OFFER (GLOWING FIRE CARD) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <div className="relative rounded-3xl p-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 shadow-2xl shadow-amber-500/20">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-[22px] p-5 sm:p-8 relative overflow-hidden">
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
              
              <div className="text-center lg:text-left space-y-2 w-full lg:w-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider animate-pulse">
                  <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
                  🔥 Launch Offer - Save 60% OFF
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white">
                  Get Full Year Premium Access
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto lg:mx-0">
                  Unlimited AI Study Buddy, Notes Generator, Weak-Area Heatmaps & Topper Formula Sheets.
                </p>

                <div className="flex items-baseline justify-center lg:justify-start gap-3 pt-1">
                  <span className="text-slate-400 line-through text-base sm:text-lg font-bold">₹999</span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-400">
                    ₹{discountPercent > 0 ? Math.round(399 * (1 - discountPercent / 100)) : 399}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    SAVE ₹600 TODAY
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center lg:items-end gap-3.5 shrink-0 w-full lg:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl text-center w-full sm:w-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Offer Expires In
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-lg sm:text-xl font-black font-mono text-amber-300">
                    <span className="bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span>:</span>
                    <span className="bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span>:</span>
                    <span className="bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout("Launch Special (₹399)", 399)}
                  disabled={payingPlan === "Launch Special (₹399)"}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  {payingPlan === "Launch Special (₹399)" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      Securing Launch Price...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      Claim Launch Offer (₹{discountPercent > 0 ? Math.round(399 * (1 - discountPercent / 100)) : 399})
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. COUPON INPUT */}
      <section className="max-w-md mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <span>Have a School or Coaching Coupon Code?</span>
          </div>
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input 
              type="text"
              placeholder="e.g. SCHOOL20 or ACHIVOX20"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-600"
            />
            <button 
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Apply
            </button>
          </form>
          {couponApplied && (
            <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Coupon 'SCHOOL20' applied! Extra 20% OFF applied across all plans.
            </p>
          )}
          {couponError && (
            <p className="text-xs font-bold text-rose-500 mt-2">
              {couponError}
            </p>
          )}
        </div>
      </section>

      {/* 5. PLAN CARDS SECTION (RESPONSIVE GRID FOR MOBILE, TABLET & LAPTOP) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Choose Your Learning Plan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Flexible options built to match every student's study goals.
          </p>

          <div className="inline-flex items-center bg-slate-200/80 p-1 rounded-2xl mt-4 border border-slate-300/60 max-w-full overflow-x-auto">
            <button
              onClick={() => setProCycle("annual")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                proCycle === "annual" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yearly (Save 65% + 2 Months Free)
            </button>
            <button
              onClick={() => setProCycle("monthly")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                proCycle === "monthly" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly (₹79/mo)
            </button>
          </div>
        </div>

        {/* Fluid Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* FREE PLAN */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-500">FREE</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">Standard</span>
              </div>

              <div className="mb-5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">₹0</span>
                <span className="text-xs font-bold text-slate-400"> / forever</span>
                <p className="text-xs text-slate-500 mt-1">Basic practice features for everyday revision.</p>
              </div>

              <div className="space-y-3 mb-6 border-t border-slate-100 pt-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Daily 10 Practice MCQs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1 AI Summary Note per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>XP & Daily Streak Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Guest & Basic Mode</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="line-through">Unlimited AI Study Buddy</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="line-through">PDF Export & Download</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-colors"
            >
              Start Free
            </button>
          </div>

          {/* PRO PLAN (MOST POPULAR) */}
          <div className="bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white border-2 border-amber-400 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between transform md:scale-[1.02] lg:scale-[1.03] z-10">
            
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 fill-slate-950" /> ⭐ MOST POPULAR
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-amber-400">PRO PLAN</span>
                <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-400/30">
                  RECOMMENDED
                </span>
              </div>

              <div className="mb-5">
                {proCycle === "annual" ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        ₹{discountPercent > 0 ? Math.round(499 * (1 - discountPercent / 100)) : 499}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ year</span>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-400 mt-1">
                      Only ₹1.36/day (Save ₹449 compared to monthly)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white">
                        ₹{discountPercent > 0 ? Math.round(79 * (1 - discountPercent / 100)) : 79}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/ month</span>
                    </div>
                    <p className="text-[11px] font-bold text-blue-300 mt-1">
                      Billed monthly, cancel anytime.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6 border-t border-white/10 pt-5 text-xs text-slate-200">
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited AI Notes & Summaries</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Full-Length Mock Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Weak Topic Detection & Heatmaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>PDF Export & High Quality Downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority AI Study Buddy (10x Speed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All Subjects (Physics, Chem, Bio, Math...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Detailed Performance Analytics</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Ad-Free Clean Learning</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCheckout(
                proCycle === "annual" ? "Pro Annual (₹499)" : "Pro Monthly (₹79)",
                proCycle === "annual" ? 499 : 79
              )}
              disabled={payingPlan !== null}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {payingPlan?.includes("Pro") ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Upgrade Now (₹{proCycle === "annual" 
                    ? (discountPercent > 0 ? Math.round(499 * (1 - discountPercent / 100)) : 499)
                    : (discountPercent > 0 ? Math.round(79 * (1 - discountPercent / 100)) : 79)
                  })
                </>
              )}
            </button>
          </div>

          {/* EXAM PASS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-700">EXAM PASS</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">30 Days</span>
              </div>

              <div className="mb-5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  ₹{discountPercent > 0 ? Math.round(99 * (1 - discountPercent / 100)) : 99}
                </span>
                <span className="text-xs font-bold text-slate-400"> / 30 Days</span>
                <p className="text-xs text-slate-500 mt-1">One-time pass for immediate exam revision boost.</p>
              </div>

              <div className="space-y-3 mb-6 border-t border-slate-100 pt-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited Full Mock Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Board Exam Fast Revision Notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Exam Booster Formula Vault</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Previous Year Questions (PYQ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Advanced Performance Analytics</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCheckout("Exam Pass (₹99)", 99)}
              disabled={payingPlan === "Exam Pass (₹99)"}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {payingPlan === "Exam Pass (₹99)" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Processing...
                </>
              ) : (
                "Buy Now (₹99)"
              )}
            </button>
          </div>

        </div>
      </section>

      {/* 6. COMPARISON TABLE (SCROLLABLE ON SMALL SCREENS) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">
            Feature Comparison
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            See how Achivox Pro unlocks complete exam mastery.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[480px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase">
                  <th className="p-4">Feature</th>
                  <th className="p-4 text-center">Free</th>
                  <th className="p-4 text-center bg-blue-50/50 text-blue-700">Pro ⭐</th>
                  <th className="p-4 text-center">Exam Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="p-4 font-bold">Unlimited AI Notes</td>
                  <td className="p-4 text-center text-rose-500 font-bold">❌</td>
                  <td className="p-4 text-center bg-blue-50/20 text-emerald-600 font-bold">✅</td>
                  <td className="p-4 text-center text-emerald-600 font-bold">✅</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Unlimited Mock Tests</td>
                  <td className="p-4 text-center text-rose-500 font-bold">❌</td>
                  <td className="p-4 text-center bg-blue-50/20 text-emerald-600 font-bold">✅</td>
                  <td className="p-4 text-center text-emerald-600 font-bold">✅</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Performance Analytics</td>
                  <td className="p-4 text-center text-slate-400">Limited</td>
                  <td className="p-4 text-center bg-blue-50/20 font-bold text-blue-700">Advanced</td>
                  <td className="p-4 text-center font-bold text-blue-700">Advanced</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Priority AI Study Buddy</td>
                  <td className="p-4 text-center text-slate-400">Limited</td>
                  <td className="p-4 text-center bg-blue-50/20 font-bold text-blue-700">Unlimited</td>
                  <td className="p-4 text-center font-bold text-blue-700">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Ad-Free Experience</td>
                  <td className="p-4 text-center text-slate-500">Yes (Limited)</td>
                  <td className="p-4 text-center bg-blue-50/20 font-bold text-emerald-600">No Ads (100%)</td>
                  <td className="p-4 text-center font-bold text-emerald-600">No Ads</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. STUDENT REVIEWS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900">
            Loved by Students Across India
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real stories from aspirants who boosted their board and competitive exam marks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div className="text-amber-500 text-xs mb-2">⭐⭐⭐⭐⭐</div>
            <p className="text-xs font-bold text-slate-800 italic mb-3">
              "I improved from 62% to 89% in my Physics pre-boards. The AI Weak Topic heatmaps are pure gold!"
            </p>
            <div className="text-[11px] font-black text-slate-500">
              — Riya Sharma (Class 12 Aspirant)
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div className="text-amber-500 text-xs mb-2">⭐⭐⭐⭐⭐</div>
            <p className="text-xs font-bold text-slate-800 italic mb-3">
              "The AI Notes saved me during my final revision. Concise, clear formulas, and instant PYQ practice."
            </p>
            <div className="text-[11px] font-black text-slate-500">
              — Aman Verma (JEE Aspirant)
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div className="text-amber-500 text-xs mb-2">⭐⭐⭐⭐⭐</div>
            <p className="text-xs font-bold text-slate-800 italic mb-3">
              "Best study app! Subscription paid for itself on day 1. Unlimited mocks gave me complete confidence."
            </p>
            <div className="text-[11px] font-black text-slate-500">
              — Sneha Patel (Class 10 Topper)
            </div>
          </div>
        </div>
      </section>

      {/* 8. 7-DAY MONEY BACK GUARANTEE */}
      <section className="max-w-xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-emerald-950">
            7-Day Money Back Guarantee
          </h3>
          <p className="text-xs font-medium text-emerald-800 mt-1 max-w-sm">
            Try Achivox Pro completely risk-free. If you are not satisfied with your score improvement within 7 days, get a 100% full refund. No questions asked.
          </p>
          <div className="flex gap-4 text-[11px] font-black text-emerald-700 mt-4">
            <span>🛡️ No Risk</span>
            <span>•</span>
            <span>⚡ Cancel Anytime</span>
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 text-center mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl sm:text-3xl font-black">
              🚀 Start Learning Today
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Only ₹1.36/day on the Yearly Plan. Invest in your academic success now!
            </p>
            
            <button
              onClick={() => handleCheckout("Launch Special (₹399)", 399)}
              disabled={payingPlan !== null}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest py-3.5 sm:py-4 px-8 sm:px-10 rounded-2xl shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
            >
              {payingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  Claim 60% OFF Now
                </>
              )}
            </button>

            <div className="pt-4 border-t border-white/10 text-[10px] sm:text-[11px] text-blue-200">
              <p className="mb-2 font-bold">100% Accepted Payment Options</p>
              <div className="flex justify-center items-center gap-2 sm:gap-4 text-white font-bold flex-wrap">
                <span>Google Pay / PhonePe / UPI</span>
                <span>•</span>
                <span>Debit & Credit Cards</span>
                <span>•</span>
                <span>Net Banking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. STICKY BOTTOM CONVERSION BAR */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-50 shadow-[0_-8px_25px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">PRO YEARLY ACCESS</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">60% OFF</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-600">Only ₹1.36/day (₹399 total)</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="sm:hidden text-left flex-1">
              <p className="text-xs font-black text-slate-900">Pro Year Pass</p>
              <p className="text-[11px] font-bold text-amber-600">₹399 (60% OFF)</p>
            </div>

            <button
              onClick={() => handleCheckout("Launch Special (₹399)", 399)}
              disabled={payingPlan !== null}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl shadow-md transition-all hover:scale-105 flex items-center justify-center gap-1.5 shrink-0"
            >
              {payingPlan ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  Upgrade Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function EyeIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
