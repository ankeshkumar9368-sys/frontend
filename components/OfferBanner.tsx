"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const OFFER_KEY = "achivox_offer_deadline";
const OFFER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function OfferBanner() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [expired, setExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Read or set deadline from localStorage
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
      const t = Math.floor(remaining / 1000);
      setTimeLeft({
        hours: Math.floor(t / 3600),
        minutes: Math.floor((t % 3600) / 60),
        seconds: t % 60,
      });
      setExpired(false);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;

  // Dynamic colors based on urgency
  const bannerBg = expired
    ? "bg-slate-700"
    : totalMinutes < 15
      ? "bg-gradient-to-r from-red-700 via-rose-600 to-red-700"
      : totalMinutes < 60
        ? "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600"
        : totalMinutes < 240
          ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"
          : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600";

  const config = expired
    ? { emoji: "⏰", label: "Offer Ended", msg: "Price increased — Standard rates now active", textColor: "text-slate-300", badgeBg: "bg-slate-600 text-slate-200" }
    : totalMinutes < 15
      ? { emoji: "🚨", label: "LAST CHANCE!", msg: "Price increasing in minutes — Lock in 60% OFF NOW!", textColor: "text-red-100", badgeBg: "bg-white/20 text-white" }
      : totalMinutes < 60
        ? { emoji: "⚡", label: "HURRY!", msg: "Less than 1 hour left! Save 60% on Achivox Pro", textColor: "text-orange-100", badgeBg: "bg-white/20 text-white" }
        : totalMinutes < 240
          ? { emoji: "🔥", label: "FLASH SALE", msg: "60% OFF Launch Offer — Full Year Pro at ₹399 only", textColor: "text-amber-950", badgeBg: "bg-black/20 text-amber-950" }
          : { emoji: "🎉", label: "LIMITED OFFER", msg: "Launch Special: Full Year Pro at 60% OFF — ₹399 only!", textColor: "text-emerald-50", badgeBg: "bg-black/20 text-white" };

  return (
    <div
      className={`w-full ${bannerBg} ${!expired && totalMinutes < 15 ? "animate-pulse" : ""} transition-all duration-1000 z-50`}
      style={{ position: "sticky", top: 0 }}
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Badge + Message */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 ${config.badgeBg}`}>
            {config.emoji} {config.label}
          </span>
          <span className={`text-xs font-bold ${config.textColor}`}>
            {config.msg}
          </span>
        </div>

        {/* Right: Timer + CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {!expired && (
            <div className={`flex items-center gap-1 font-black font-mono text-sm ${config.textColor}`}>
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span className="bg-black/20 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
              <span>:</span>
              <span className="bg-black/20 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
              <span>:</span>
              <span className={`px-1.5 py-0.5 rounded ${
                timeLeft.hours === 0 && timeLeft.minutes < 10 ? "bg-red-900/60 animate-pulse" : "bg-black/20"
              }`}>
                {pad(timeLeft.seconds)}
              </span>
            </div>
          )}
          <button
            onClick={() => router.push("/subscription")}
            className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <Zap className="w-3 h-3" />
            {expired ? "Subscribe Now" : "Grab Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}
