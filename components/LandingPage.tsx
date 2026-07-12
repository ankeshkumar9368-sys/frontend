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
} from "lucide-react";
import dynamic from "next/dynamic";

const StudyMotionScene = dynamic(() => import("./StudyMotionScene"), { ssr: false });

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#06131f] text-white overflow-x-hidden font-sans">
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
              <div className="flex items-center gap-3 border border-white/12 bg-black/20 px-4 py-3 backdrop-blur">
                <div className="h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]" />
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-200">
                  Live motion study mode
                </span>
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
              price: "Rs 499",
              tag: "Most Popular",
              features: ["Full Smart Notes", "Weakness Heatmap", "Unlimited Doubts", "Spaced Revision"],
              color: "bg-cyan-400/12 border-cyan-300/40",
              btn: "Upgrade Now",
              popular: true,
            },
            {
              name: "ELITE",
              price: "Rs 999",
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
                onClick={onLogin}
                className={`w-full py-4 text-sm font-black transition-all active:scale-95 ${
                  plan.popular ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30" : "bg-white/10 text-white"
                }`}
              >
                {plan.btn}
              </button>
            </div>
          ))}
        </div>
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
            "Sirf video dekhne se marks nahi badhte, Achivox se galti sudharti hai."
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
