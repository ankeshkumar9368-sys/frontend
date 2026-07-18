"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth as clientAuth } from "../../lib/firebase";
import { Sparkles, Check, Zap, ArrowLeft, Loader2, ShieldCheck, Star } from "lucide-react";
import axios from "axios";

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Load Cashfree Web SDK
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/2.0.0/cashfree.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      unsubscribe();
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setPaying(true);
    setErrorMsg("");

    try {
      // 1. Create order session on backend
      const response = await axios.post("/api/payment/session", {
        userId: user.uid,
        customerName: user.displayName || "Academic Achiever",
        customerEmail: user.email || "student@examhero.ai",
        customerPhone: "" // optional, empty is fine
      });

      if (response.data && response.data.payment_session_id) {
        const { payment_session_id } = response.data;

        // 2. Initialize Cashfree SDK
        if (typeof window === "undefined" || !(window as any).Cashfree) {
          throw new Error("Cashfree SDK not loaded. Please refresh.");
        }

        // Auto-detect production mode vs sandbox
        const isProd = window.location.hostname === "www.achivox.online" || window.location.hostname === "achivox.online";
        const cashfree = (window as any).Cashfree({
          mode: isProd ? "production" : "sandbox"
        });

        // 3. Launch Checkout modal/redirect
        cashfree.checkout({
          paymentSessionId: payment_session_id,
          redirectTarget: "_self"
        });
      } else {
        throw new Error("Invalid checkout response from backend API.");
      }
    } catch (error: any) {
      console.error("Upgrade checkout error:", error);
      setErrorMsg(error.response?.data?.error || error.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),rgba(0,0,0,0))] pointer-events-none" />

      {/* Main container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Back Button */}
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold mb-6 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Premium Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Premium Access
          </div>
        </div>

        {/* Content Card */}
        <div className="glass-card bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[36px] p-6 shadow-2xl relative overflow-hidden">
          {/* Top subtle highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          <div className="text-center mb-6">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
              Upgrade to Premium
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Unleash complete learning superpower with ExamHero Premium.
            </p>
          </div>

          {/* Pricing Box */}
          <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-3xl p-5 text-center mb-6 relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
              One-Time Payment
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-400 line-through text-lg font-bold">₹999</span>
              <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                ₹499
              </span>
            </div>
            <p className="text-[11px] font-bold text-indigo-400/80 mt-1">Lifetime Premium access, no recurring bills.</p>
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Premium Privileges</h3>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-200">10x Faster AI Core Response</p>
                <p className="text-[11px] text-slate-400">Direct prioritization on servers for instant answers.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-200">Unlimited Mistake & Revision Vault</p>
                <p className="text-[11px] text-slate-400">Save and re-attempt all wrong answers forever.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-200">Unlimited AI Vision Tokens</p>
                <p className="text-[11px] text-slate-400">Scan board sheets and mock exam answers directly.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-200">Topper Revision Bank & Notes</p>
                <p className="text-[11px] text-slate-400">Get access to premium curations and formula vaults.</p>
              </div>
            </div>
          </div>

          {/* Action button */}
          {errorMsg && (
            <div className="p-3 mb-4 text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-center">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={paying}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Initiating Secured Gateway...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white text-white" />
                Activate Now (₹499)
              </>
            )}
          </button>

          {/* Trust assurances */}
          <div className="flex justify-center items-center gap-4 mt-6 pt-5 border-t border-white/5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Secure SSL Checkout
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-indigo-400" /> Powered by Cashfree
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
