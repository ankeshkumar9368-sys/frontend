"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Clock, ArrowRight, ShieldCheck, Flame, Tag } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function IndependenceDayBanner() {
  // Target deadline: 15th August 2026 23:59:59 PM (Month 7 in JS Date = August)
  const INDEPENDENCE_DAY_DEADLINE = new Date(2026, 7, 15, 23, 59, 59).getTime();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = INDEPENDENCE_DAY_DEADLINE - Date.now();
      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isExpired) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 my-4">
      <div className="relative overflow-hidden rounded-3xl p-0.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-2xl shadow-[#FF9933]/15">
        <div className="bg-[#0B1023] rounded-[23px] p-4 sm:p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Subtle Tricolor Glow Blobs in Background */}
          <div className="absolute -left-20 -top-20 w-48 h-48 bg-[#FF9933]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-[#138808]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Side Info */}
          <div className="flex items-center gap-3.5 z-10 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9933] via-[#FFFFFF] to-[#138808] p-0.5 shrink-0 shadow-lg animate-pulse">
              <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center text-xl">
                🇮🇳
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-1">
                <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#138808] text-transparent bg-clip-text font-black text-xs uppercase tracking-widest">
                  79th Swatantrata Diwas Special
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" /> Save 70% OFF
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Independence Day Offer — Achivox Pro Unlimited at <span className="text-[#FF9933] text-lg sm:text-xl font-extrabold underline decoration-emerald-500">₹299</span>
                <span className="text-slate-400 text-xs line-through ml-2 font-normal">₹999</span>
              </h2>

              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Full Year Access to Topper Notes, 24/7 AI Doubt Solver, PYQs & Unlimited AI Tests. <span className="text-emerald-400 font-bold">Valid till 15th August 11:59 PM!</span>
              </p>
            </div>
          </div>

          {/* Right Side Countdown & CTA */}
          <div className="flex items-center gap-4 z-10 shrink-0 flex-wrap justify-center">
            {/* Countdown Box */}
            <div className="flex items-center gap-1.5 bg-[#121735] border border-white/15 px-3 py-2 rounded-2xl shadow-inner text-center">
              <Clock className="w-4 h-4 text-[#FF9933] animate-spin" style={{ animationDuration: "6s" }} />
              <div className="flex items-center gap-1 text-xs font-black text-white font-mono">
                <div className="flex flex-col">
                  <span className="text-amber-400 leading-none">{String(timeLeft.days).padStart(2, "0")}d</span>
                </div>
                <span>:</span>
                <div className="flex flex-col">
                  <span className="text-white leading-none">{String(timeLeft.hours).padStart(2, "0")}h</span>
                </div>
                <span>:</span>
                <div className="flex flex-col">
                  <span className="text-white leading-none">{String(timeLeft.minutes).padStart(2, "0")}m</span>
                </div>
                <span>:</span>
                <div className="flex flex-col">
                  <span className="text-emerald-400 leading-none">{String(timeLeft.seconds).padStart(2, "0")}s</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link href="/subscription">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF9933] via-amber-500 to-[#138808] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/25 border border-white/30"
              >
                <span>Claim ₹299 Offer 🇮🇳</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
