"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  ChevronRight,
  Flame,
  Mic2,
  Sparkles,
  Star,
  Clock,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LiveDashboardBadge } from "./LiveStudentActivityToast";

const StudyMotionScene = dynamic(() => import("./StudyMotionScene"), { ssr: false });

// Real timer hook — reads same localStorage key as subscription page
function useOfferTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const OFFER_KEY = "achivox_offer_deadline";
    const OFFER_DURATION_MS = 24 * 60 * 60 * 1000;

    let deadline: number;
    const stored = localStorage.getItem(OFFER_KEY);
    if (stored) {
      deadline = parseInt(stored, 10);
    } else {
      deadline = Date.now() + OFFER_DURATION_MS;
      localStorage.setItem(OFFER_KEY, String(deadline));
    }

    const update = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setExpired(true);
        return;
      }
      const totalSecs = Math.floor(remaining / 1000);
      setTimeLeft({
        hours: Math.floor(totalSecs / 3600),
        minutes: Math.floor((totalSecs % 3600) / 60),
        seconds: totalSecs % 60,
      });
      setExpired(false);
    };

    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return { timeLeft, expired };
}

// Banner config based on time urgency
function getBannerConfig(timeLeft: { hours: number; minutes: number; seconds: number }, expired: boolean) {
  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;

  if (expired) {
    return {
      bg: "bg-slate-700",
      border: "border-slate-600",
      text: "text-slate-300",
      badge: "bg-slate-600 text-slate-200",
      glow: "",
      pulse: false,
      label: "Offer Ended",
      emoji: "⏰",
      message: "Standard price now active — Subscribe to unlock Pro",
    };
  }
  if (totalMinutes < 15) {
    return {
      bg: "bg-gradient-to-r from-red-700 via-rose-600 to-red-700",
      border: "border-red-500",
      text: "text-red-100",
      badge: "bg-red-500 text-white",
      glow: "shadow-lg shadow-red-500/40",
      pulse: true,
      label: "LAST CHANCE!",
      emoji: "🚨",
      message: "Price increasing in minutes! Lock in your discount NOW",
    };
  }
  if (totalMinutes < 60) {
    return {
      bg: "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600",
      border: "border-orange-400",
      text: "text-orange-100",
      badge: "bg-orange-500 text-white",
      glow: "shadow-md shadow-orange-500/30",
      pulse: false,
      label: "HURRY!",
      emoji: "⚡",
      message: "Less than 1 hour left! Save 60% on Achivox Pro",
    };
  }
  if (totalMinutes < 240) {
    return {
      bg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500",
      border: "border-amber-400",
      text: "text-amber-950",
      badge: "bg-amber-400 text-slate-950",
      glow: "shadow-md shadow-amber-400/20",
      pulse: false,
      label: "FLASH SALE",
      emoji: "🔥",
      message: "60% OFF Launch offer ending soon! Get Pro at ₹399",
    };
  }
  return {
    bg: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600",
    border: "border-emerald-400",
    text: "text-emerald-50",
    badge: "bg-emerald-400 text-slate-950",
    glow: "shadow-sm shadow-emerald-500/20",
    pulse: false,
    label: "LIMITED OFFER",
    emoji: "🎉",
    message: "Launch Special: Get Full Year Pro Access at 60% OFF — ₹399 only",
  };
}

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const router = useRouter();
  const { timeLeft, expired } = useOfferTimer();
  const config = getBannerConfig(timeLeft, expired);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#06131f] text-white overflow-x-hidden font-sans">

      {/* ━━━ REAL-TIME OFFER BANNER ━━━ */}
      <div
        className={`w-full ${config.bg} ${config.glow} ${config.pulse ? "animate-pulse" : ""} border-b ${config.border} transition-all duration-1000`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Badge + Message */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 ${config.badge}`}>
              {config.emoji} {config.label}
            </span>
            <span className={`text-xs font-bold ${config.text}`}>
              {config.message}
            </span>
          </div>

          {/* Right: Timer + CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {!expired && (
              <div className={`flex items-center gap-1 font-black font-mono text-sm ${config.text}`}>
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span className="bg-black/20 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
                <span>:</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
                <span>:</span>
                <span className={`px-1.5 py-0.5 rounded ${timeLeft.hours === 0 && timeLeft.minutes < 10 ? "bg-red-900/60 animate-pulse" : "bg-black/20"}`}>
                  {pad(timeLeft.seconds)}
                </span>
              </div>
            )}
            <button
              onClick={() => router.push("/subscription")}
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shrink-0 ${
                expired
                  ? "border-slate-400 text-slate-300 hover:bg-slate-600"
                  : "border-white/30 text-white hover:bg-white/15"
              }`}
            >
              <Zap className="w-3 h-3" />
              {expired ? "Subscribe" : "Grab Deal"}
            </button>
          </div>
        </div>
      </div>

      {/* ━━━ HERO SECTION ━━━ */}
      <section className="relative min-h-[92vh] px-5 pt-8 pb-10 flex items-end overflow-hidden sm:px-8 md:min-h-[86vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(20,184,166,0.34),transparent_34%),radial-gradient(circle_at_84%_20%,rgba(249,115,22,0.26),transparent_30%),linear-gradient(135deg,#06131f_0%,#102034_48%,#13251f_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[66vh] md:h-full">
          <StudyMotionScene />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#06131f] via-[#06131f]/38 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06131f] to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 md:grid md:grid-cols-[minmax(0,0.95fr)_360px] md:items-end">
          <div className="max-w-3xl pt-[42vh] md:pt-44">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Achivox AI Selection Engine
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mb-5 max-w-[11ch] text-5xl font-black leading-[0.92] tracking-normal sm:text-6xl md:max-w-[12ch] md:text-7xl"
            >
              Achivox AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mb-7 max-w-xl text-base font-semibold leading-7 text-slate-200 md:text-lg"
            >
              Smart notes, doubt solving, and revision paths move around you like a live study cockpit.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="flex flex-wrap items-center gap-3"
            >
              <button
                onClick={onLogin}
                className="group flex min-h-14 items-center gap-3 bg-white px-6 py-4 text-base font-black text-slate-950 shadow-2xl shadow-cyan-950/30 transition active:scale-95"
              >
                Apna AI Plan Banaye
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <div className="flex items-center gap-3">
                <LiveDashboardBadge />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="grid grid-cols-3 gap-2 border border-white/10 bg-white/[0.07] p-3 backdrop-blur-xl md:grid-cols-1"
          >
            {[
              { label: "Smart Notes", value: "3D", icon: BookOpen },
              { label: "Voice Doubts", value: "24/7", icon: Mic2 },
              { label: "Weak Zones", value: "AI", icon: BarChart3 },
            ].map((item) => (
              <div key={item.label} className="flex min-h-20 flex-col justify-between bg-white/[0.08] p-3">
                <item.icon className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-xl font-black leading-none">{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "AI Smart Notes",
              desc: "Chapter summaries, priority questions, and revision signals in one focused flow.",
              color: "text-cyan-300",
            },
            {
              icon: Flame,
              title: "Weakness Heatmap",
              desc: "Spot the red zones quickly and turn them into daily practice targets.",
              color: "text-rose-300",
            },
            {
              icon: Brain,
              title: "24/7 Voice Doubt Solver",
              desc: "Ask by voice and get step-by-step support while your momentum is still warm.",
              color: "text-amber-300",
            },
          ].map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-white/10 bg-white/[0.06] p-5"
            >
              <benefit.icon className={`mb-7 h-8 w-8 ${benefit.color}`} />
              <h3 className="mb-2 text-xl font-black">{benefit.title}</h3>
              <p className="text-sm font-medium leading-6 text-slate-300">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-[#091925] px-5 py-14 sm:px-8">
        <div className="mx-auto mb-9 max-w-6xl">
          <h2 className="mb-2 text-3xl font-black">Simple Pricing</h2>
          <p className="font-semibold text-slate-300">Invest in your future, not just an app.</p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {[
            {
              name: "ACHIEVER",
              price: "Free",
              tag: "Shuruat ke liye",
              features: ["Basic AI Notes", "Daily 2 Doubts", "Public Leaderboard"],
              color: "bg-white/[0.06]",
              btn: "Start Free",
            },
            {
              name: "PRO",
              price: expired ? "Rs 699" : "Rs 499",
              tag: expired ? "Standard Price" : "Most Popular",
              features: ["Full Smart Notes", "Weakness Heatmap", "Unlimited Doubts", "Spaced Revision"],
              color: "bg-cyan-400/12 border-cyan-300/40",
              btn: "Upgrade Now",
              popular: true,
            },
            {
              name: "ELITE",
              price: expired ? "Rs 1299" : "Rs 999",
              tag: "Best Value",
              features: ["Voice Doubt Solver", "PDF Sync", "AI Performance Graph", "Personal Mentor"],
              color: "bg-amber-400/10 border-amber-300/30",
              btn: "Go Elite",
            },
          ].map((plan) => (
            <div key={plan.name} className={`relative overflow-hidden border border-white/10 p-6 ${plan.color}`}>
              {plan.popular && (
                <div className="absolute right-0 top-0 bg-cyan-300 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">
                  Popular
                </div>
              )}
              <h4 className="mb-1 text-sm font-black uppercase tracking-widest text-slate-400">{plan.name}</h4>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                {plan.price !== "Free" && <span className="text-sm font-bold text-slate-500">/year</span>}
              </div>
              <p className="mb-6 text-xs font-bold text-slate-400">{plan.tag}</p>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push("/subscription")}
                className={`w-full py-4 text-sm font-black transition-all active:scale-95 ${
                  plan.popular ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30" : "bg-white/10 text-white"
                }`}
              >
                {plan.btn}
              </button>
            </div>
          ))}
        </div>

        {/* Live Timer below pricing */}
        {!expired && (
          <div className={`mt-8 mx-auto max-w-md text-center p-4 rounded-2xl border transition-all ${
            timeLeft.hours === 0 && timeLeft.minutes < 15
              ? "bg-red-900/40 border-red-500/40"
              : timeLeft.hours < 2
                ? "bg-orange-900/30 border-orange-500/30"
                : "bg-white/5 border-white/10"
          }`}>
            <p className={`text-xs font-black uppercase tracking-wider mb-2 ${
              timeLeft.hours === 0 && timeLeft.minutes < 15 ? "text-red-300 animate-pulse" :
              timeLeft.hours < 2 ? "text-orange-300" : "text-slate-400"
            }`}>
              ⏱️ Launch Offer ends in
            </p>
            <div className={`flex items-center justify-center gap-2 font-black font-mono text-2xl ${
              timeLeft.hours === 0 && timeLeft.minutes < 15 ? "text-red-400" :
              timeLeft.hours < 2 ? "text-orange-300" : "text-amber-300"
            }`}>
              <span className="bg-black/30 px-3 py-1.5 rounded-xl">{pad(timeLeft.hours)}</span>
              <span>:</span>
              <span className="bg-black/30 px-3 py-1.5 rounded-xl">{pad(timeLeft.minutes)}</span>
              <span>:</span>
              <span className={`px-3 py-1.5 rounded-xl ${timeLeft.hours === 0 && timeLeft.minutes < 10 ? "bg-red-900/60 animate-pulse" : "bg-black/30"}`}>
                {pad(timeLeft.seconds)}
              </span>
            </div>
            <button
              onClick={() => router.push("/subscription")}
              className="mt-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase px-6 py-2 rounded-full transition-all hover:scale-105"
            >
              🔥 Grab 60% OFF Before it Expires
            </button>
          </div>
        )}
      </section>

      <section className="px-5 py-12 text-center sm:px-8">
        <div className="mx-auto max-w-6xl border border-white/10 bg-white/[0.06] p-8">
          <div className="mb-4 flex justify-center -space-x-3">
            {[1, 2, 3, 4, 5].map((user) => (
              <div
                key={user}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#06131f] bg-slate-800 text-[10px] font-black"
              >
                U{user}
              </div>
            ))}
          </div>
          <h2 className="mb-3 text-2xl font-black">Trusted by 50,000+ Students</h2>
          <p className="mx-auto mb-5 max-w-xl text-sm font-bold italic text-slate-300">
            &quot;Sirf video dekhne se marks nahi badhte, Achivox se galti sudharti hai.&quot;
          </p>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Achivox AI © 2026 · Made for India
        </p>
      </footer>
    </div>
  );
}
