"use client";

import { useState, useEffect } from "react";
import { Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";

const OFFER_KEY = "achivox_offer_deadline";
const OFFER_DURATION_MS = 24 * 60 * 60 * 1000;

export default function OfferBanner() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [expired, setExpired] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if dismissed this session
    if (sessionStorage.getItem("offer_dismissed")) {
      setDismissed(true);
      return;
    }
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
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || dismissed) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;

  const bannerBg =
    totalMinutes < 60
      ? "from-red-600 to-rose-600"
      : "from-emerald-600 to-teal-600";

  return (
    <div
      className={`w-full bg-gradient-to-r ${bannerBg} shrink-0 z-50`}
      style={{ position: "sticky", top: 0 }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 gap-2">
        {/* Left: label + message in one line */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white shrink-0">
            🎉 OFFER
          </span>
          <span className="text-[11px] font-bold text-white truncate">
            60% OFF — Full Year Pro ₹399
          </span>
        </div>

        {/* Right: compact timer + grab deal + close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!expired && (
            <span className="text-[10px] font-black font-mono text-white bg-black/20 px-1.5 py-0.5 rounded">
              {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
            </span>
          )}
          <button
            onClick={() => router.push("/subscription")}
            className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-white text-emerald-700 flex items-center gap-0.5 shrink-0"
          >
            <Zap className="w-2.5 h-2.5" />
            {expired ? "Buy" : "Grab"}
          </button>
          <button
            onClick={() => {
              setDismissed(true);
              sessionStorage.setItem("offer_dismissed", "1");
            }}
            className="p-0.5 text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
