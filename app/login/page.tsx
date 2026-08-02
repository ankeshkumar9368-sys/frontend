"use client";

import { useState, useEffect, useRef } from "react";
import {
  Chrome, User, ShieldAlert, Sparkles, X, BookOpen, Flame, Trophy,
  Check, CheckCircle2, Zap, Globe, Lock, ShieldCheck, FileText, Bot,
  LineChart, Brain, GraduationCap, BarChart2, RefreshCw, Award, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import {
  getRedirectResult, GoogleAuthProvider, signInAnonymously,
  signInWithCredential, signInWithPopup
} from "firebase/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const overlayStatusBar = async () => {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch (e) { /* not native */ }
    };
    overlayStatusBar();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");
      if (refCode && refCode.length >= 6) {
        localStorage.setItem("achivox_pending_ref", refCode.toUpperCase());
      }
    }

    const checkRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error: any) {
        setErrorMsg("Redirect error: " + error.message);
      }
    };
    checkRedirect();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const pendingRef = localStorage.getItem("achivox_pending_ref");
        if (pendingRef) {
          try {
            const { processReferralCode } = await import("../../lib/referral");
            await processReferralCode(user.uid, pendingRef);
          } catch (e) { /* ignore */ }
          localStorage.removeItem("achivox_pending_ref");
        }
        const OFFER_KEY = "achivox_offer_deadline";
        if (!localStorage.getItem(OFFER_KEY)) {
          localStorage.setItem(OFFER_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
        }
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGuestLoginActual = async () => {
    setLoading(true);
    setShowWarningModal(false);
    try {
      await signInAnonymously(auth);
      router.push("/");
    } catch (error: any) {
      alert("Guest login failed: " + error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const isNative = typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
      if (isNative) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        } else if (!result.user) {
          throw new Error("Missing authentication token from Google.");
        }
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      setErrorMsg(error.code + ": " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── GOOGLE SVG ─── */
  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#ea4335" d="M12 5.04c1.63 0 3.1.56 4.25 1.66l3.19-3.19C17.51 1.68 14.99.5 12 .5 7.69.5 3.95 2.99 2.12 6.6l3.69 2.86C6.72 6.8 9.15 5.04 12 5.04z" />
      <path fill="#4285f4" d="M23.49 12.275c0-.82-.07-1.64-.22-2.42H12v4.61h6.43c-.27 1.47-1.11 2.7-2.36 3.54l3.67 2.84c2.14-1.97 3.38-4.88 3.38-8.57z" />
      <path fill="#fbbc05" d="M5.81 14.54c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L2.12 6.98C1.3 8.62.83 10.45.83 12.37s.47 3.75 1.29 5.39l3.69-2.86z" />
      <path fill="#34a853" d="M12 23.5c3.11 0 5.71-1.03 7.61-2.8l-3.67-2.84c-1.02.68-2.33 1.09-3.94 1.09-2.85 0-5.28-1.76-6.19-4.42L2.12 17.39c1.83 3.61 5.57 6.11 9.88 6.11z" />
    </svg>
  );

  /* ─── LOGIN CARD ─── */
  const LoginCard = () => (
    <div className="relative rounded-3xl bg-[#121735] border border-[#7A5AF8]/50 shadow-2xl overflow-hidden">
      {/* top accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]" />

      <div className="p-6 space-y-5">
        {/* logo + title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[2px] shadow-lg">
            <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#38BDF8]" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white">Welcome Back 👋</h2>
          <p className="text-xs text-slate-400 font-medium">Continue Your Learning Journey</p>
        </div>

        {/* error */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-400/40 rounded-2xl text-rose-200 text-xs text-center break-all">
            ❌ {errorMsg}
          </div>
        )}

        {/* 🔥 exams banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-purple-500/20 border border-amber-400/40 text-center space-y-1.5">
          <p className="text-sm font-black text-amber-300 flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4 animate-bounce" /> 🔥 Exams are Near!
          </p>
          <p className="text-xs font-bold text-white">Join 50,000+ Students on Achivox AI</p>
          <div className="flex flex-wrap justify-center gap-1 text-[10px] font-bold text-slate-200">
            {["✔ CBSE", "✔ Bihar Board", "✔ ICSE", "✔ State Boards"].map(b => (
              <span key={b} className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">{b}</span>
            ))}
          </div>
          <p className="text-[10px] font-extrabold text-emerald-300 flex items-center justify-center gap-1 pt-0.5">
            Start FREE Today <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* free bonus callout */}
        <div className="p-3 rounded-2xl bg-[#7A5AF8]/15 border border-[#7A5AF8]/35 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider">FREE SIGN-IN BONUS</p>
            <p className="text-[11px] font-bold text-slate-200 leading-tight">AI Credits + Chapter Notes instantly on login.</p>
          </div>
        </div>

        {/* buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#7A5AF8]/30 border border-white/20 disabled:opacity-60 active:scale-[0.98] transition-transform cursor-pointer text-sm"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow shrink-0">
              <GoogleIcon />
            </div>
            Continue with Google
          </button>

          <button
            onClick={() => setShowWarningModal(true)}
            disabled={loading}
            className="w-full h-12 bg-white/5 border border-white/15 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer text-sm"
          >
            <User className="w-4 h-4" /> Continue as Guest
          </button>

          <p className="text-center text-[10px] text-slate-500 font-medium">Limited Features Available</p>
        </div>

        {/* trust strip */}
        <div className="pt-3 border-t border-white/8 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 text-center">
          <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> 100% Encrypted</span>
          <span className="flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3 text-[#38BDF8]" /> Verified Portal</span>
        </div>
      </div>
    </div>
  );

  /* ─── FEATURES DATA ─── */
  const features = [
    { icon: FileText, label: "AI Smart Notes", color: "#38BDF8" },
    { icon: Bot, label: "AI Doubt Solver", color: "#7A5AF8" },
    { icon: LineChart, label: "Progress Tracking", color: "#34d399" },
    { icon: Brain, label: "Study Planner", color: "#FFD54F" },
    { icon: BookOpen, label: "PYQs", color: "#f87171" },
    { icon: BarChart2, label: "Mock Tests", color: "#a78bfa" },
    { icon: RefreshCw, label: "Revision Mode", color: "#22d3ee" },
    { icon: Globe, label: "Hindi / English", color: "#fb923c" },
  ];

  /* ─── REVIEWS DATA ─── */
  const reviews = [
    { name: "Rahul", cls: "Class 10 · CBSE", text: "Aaj revision sirf 2 ghante me ho gayi!" },
    { name: "Priya", cls: "Class 12 · Bihar Board", text: "Boards ke liye best AI app." },
    { name: "Aditya", cls: "Class 9", text: "Mock Tests improved my confidence a lot." },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          PAGE WRAPPER — no overflow tricks, normal document flow
         ═══════════════════════════════════════════════════════ */}
      <div
        className="relative w-full bg-[#0B1023] text-white"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Background blobs — purely decorative, position:absolute so they never break scroll */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#5B5CEB]/20 blur-[120px]" />
          <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full bg-[#38BDF8]/15 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full bg-[#7A5AF8]/15 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "30px 30px" }}
          />
        </div>

        {/* ─── NAV ─── */}
        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[2px] shadow-md">
              <div className="w-full h-full bg-[#0B1023] rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#38BDF8]" />
              </div>
            </div>
            <div>
              <p className="text-lg font-black text-white leading-tight">
                ACHIVOX <span className="text-[#7A5AF8]">AI</span>
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Study Smarter. Score Better.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Class 9th–12th Boards
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            DESKTOP LAYOUT  (≥ 1024px)
           ═══════════════════════════════════════════ */}
        <div className="relative z-10 hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <div className="grid grid-cols-12 gap-8 xl:gap-12 items-start">

              {/* LEFT: hero + content */}
              <div className="col-span-7 space-y-7">

                {/* board badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#7A5AF8]/40 text-xs font-bold text-slate-200">
                  <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  Designed for <strong className="text-white">CBSE · Bihar Board · ICSE · State Boards</strong>
                </div>

                {/* hero heading */}
                <div className="space-y-3">
                  <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-white">
                    📚 Study Smarter.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#7A5AF8] to-[#FFD54F]">
                      🎯 Score Better in Less Time.
                    </span>
                  </h1>
                  <p className="text-base text-slate-300 leading-relaxed max-w-lg">
                    India's AI Study Partner for Class 9–12. Learn Faster, Revise Smarter, Score Higher.
                  </p>
                </div>

                {/* stats */}
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { icon: "⭐⭐⭐⭐⭐", text: "4.9/5 Rating" },
                    { icon: "👨‍🎓", text: "50,000+ Students" },
                    { icon: "🏫", text: "Trusted Across India" },
                  ].map(s => (
                    <div key={s.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
                      <span>{s.icon}</span><span className="text-slate-200">{s.text}</span>
                    </div>
                  ))}
                </div>

                {/* free bonus */}
                <div className="p-5 rounded-3xl bg-white/[0.04] border border-[#7A5AF8]/35 space-y-3">
                  <p className="text-xs font-black text-amber-300 uppercase tracking-wider">🎁 Login Today & Get FREE:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["AI Smart Notes", "10 AI Doubts", "Chapter Revision", "Study Planner", "AI Mock Test"].map(item => (
                      <div key={item} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-[11px] font-bold text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-1 border-t border-white/8">
                    <span>⚡ Instant access on login</span>
                    <span className="text-amber-300">No Credit Card Required</span>
                  </div>
                </div>

                {/* reviews */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">What Indian Toppers Say</p>
                  <div className="grid grid-cols-3 gap-3">
                    {reviews.map((r, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/8 space-y-2">
                        <div className="text-amber-300 text-xs">⭐⭐⭐⭐⭐</div>
                        <p className="text-[11px] font-bold text-slate-200">"{r.text}"</p>
                        <p className="text-[10px] text-slate-500">— {r.name} ({r.cls})</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* features */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" /> Everything You Need to Score 95%+
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {features.map((f, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-white/[0.04] border border-white/8 space-y-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: f.color + "20", border: `1px solid ${f.color}30` }}>
                          <f.icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 leading-tight">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* plan comparison */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-300" /> Choose Your Plan
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                      <p className="text-sm font-black text-slate-200">Free Starter</p>
                      <div className="space-y-1.5 text-xs text-slate-400">
                        {["10 AI Doubts", "1 Mock Test", "Limited Notes", "Basic Planner"].map(t => (
                          <div key={t} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {t}</div>
                        ))}
                      </div>
                    </div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#7A5AF8]/25 to-[#5B5CEB]/20 border-2 border-amber-400/50 space-y-2.5">
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-[#0B1023] text-[9px] font-black uppercase">👑 Most Popular</div>
                      <p className="text-sm font-black text-white">Pro Topper <span className="text-amber-300">Pro</span></p>
                      <div className="space-y-1.5 text-xs text-white font-bold">
                        {["Unlimited AI Doubts", "Unlimited Notes", "Unlimited Mock Tests", "Personal AI Mentor"].map(t => (
                          <div key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-300" /> {t}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT: login card — sticky so it stays visible while user scrolls left column */}
              <div className="col-span-5 sticky top-6">
                <LoginCard />
              </div>

            </div>
          </div>
        </div>


        {/* ═══════════════════════════════════════════
            MOBILE + TABLET LAYOUT  (< 1024px)
           ═══════════════════════════════════════════ */}
        <div className="relative z-10 block lg:hidden">
          <div className="max-w-xl mx-auto px-4 py-4 space-y-6">

            {/* hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-[#7A5AF8]/40 text-[11px] font-bold text-slate-200">
                <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                CBSE · Bihar Board · ICSE · State Boards
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                📚 Study Smarter.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#7A5AF8] to-[#FFD54F]">
                  🎯 Score Better.
                </span>
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                India's AI Study Partner for Class 9–12 Board Students.
              </p>
            </div>

            {/* LOGIN CARD — appears first on mobile so user sees Google Sign-in immediately */}
            <LoginCard />

            {/* stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "⭐", text: "4.9/5 Rating" },
                { icon: "👨‍🎓", text: "50K+ Students" },
                { icon: "🏫", text: "Across India" },
              ].map(s => (
                <div key={s.text} className="p-2.5 rounded-2xl bg-white/5 border border-white/8 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-[10px] font-bold text-slate-300">{s.text}</div>
                </div>
              ))}
            </div>

            {/* free bonus */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-[#7A5AF8]/35 space-y-2.5">
              <p className="text-xs font-black text-amber-300 uppercase tracking-wider">🎁 Login Today & Get FREE:</p>
              <div className="grid grid-cols-2 gap-2">
                {["AI Smart Notes", "10 AI Doubts", "Chapter Revision", "Study Planner", "AI Mock Test"].map(item => (
                  <div key={item} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/8 text-[11px] font-bold text-slate-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* reviews */}
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">What Toppers Say</p>
              {reviews.map((r, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/8 space-y-1">
                  <div className="text-amber-300 text-xs">⭐⭐⭐⭐⭐</div>
                  <p className="text-xs font-bold text-slate-200">"{r.text}"</p>
                  <p className="text-[10px] text-slate-500">— {r.name} ({r.cls})</p>
                </div>
              ))}
            </div>

            {/* features */}
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">All Features Included</p>
              <div className="grid grid-cols-2 gap-2">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/8">
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: f.color + "20" }}>
                      <f.icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-200 leading-tight">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* plan comparison */}
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Free vs Premium</p>
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <p className="text-sm font-black text-slate-200">Free Starter</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
                    {["10 AI Doubts", "1 Mock Test", "Limited Notes", "Basic Planner"].map(t => (
                      <div key={t}>✓ {t}</div>
                    ))}
                  </div>
                </div>
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#7A5AF8]/25 to-[#5B5CEB]/20 border-2 border-amber-400/50 space-y-2">
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-[#0B1023] text-[9px] font-black">👑 Most Popular</div>
                  <p className="text-sm font-black text-white">Pro Topper <span className="text-amber-300">Pro</span></p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-white font-bold">
                    {["Unlimited Doubts", "Unlimited Notes", "Unlimited Mocks", "Personal Mentor"].map(t => (
                      <div key={t}>✔ {t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* ─── FOOTER ─── */}
        <footer className="relative z-10 border-t border-white/8 bg-[#070A17] py-6 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">

            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#5B5CEB]/20 via-[#7A5AF8]/25 to-[#38BDF8]/20 border border-[#7A5AF8]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="text-base sm:text-lg font-black text-white">🚀 Unlock Your Full Learning Potential</p>
                <p className="text-xs text-slate-300">Upgrade anytime · AI Tutor for CBSE & Board Exams</p>
              </div>
              <div className="text-xs font-black text-white px-4 py-2 rounded-full bg-white/10 border border-white/15">
                🌐 <span className="text-[#38BDF8]">achivox.online</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold text-slate-400 pt-2 border-t border-white/8">
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Secure Login</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-300" /> Lightning Fast</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-[#38BDF8]" /> Privacy Protected</span>
                <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-purple-400" /> Built for Indian Students</span>
              </div>
              <span>ACHIVOX AI © 2026 · Made with ❤️ for India</span>
            </div>

          </div>
        </footer>
      </div>

      {/* ─── GUEST WARNING MODAL ─── */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#151A35] border border-white/15 w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              <div className="flex justify-between items-start">
                <div className="w-11 h-11 bg-rose-500/15 rounded-2xl flex items-center justify-center border border-rose-500/25">
                  <ShieldAlert className="w-5 h-5 text-rose-300" />
                </div>
                <button onClick={() => setShowWarningModal(false)} className="w-8 h-8 bg-white/8 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              <div>
                <h3 className="text-lg font-black text-rose-300">⚠️ Guest Warning!</h3>
                <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
                  Guest Account mein logout karne par aapka saara data permanently delete ho jayega!
                </p>
              </div>

              <div className="bg-white/[0.04] p-3.5 rounded-2xl border border-white/8 space-y-2">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Google Account ke Fayde:
                </p>
                <ul className="text-[11px] text-slate-200 font-bold space-y-1 list-disc list-inside leading-tight">
                  <li>Lifetime permanent progress save</li>
                  <li>Multi-device sync & streak</li>
                  <li>Unique Scholar Student ID</li>
                  <li>Secure Achivox Wallet</li>
                </ul>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setShowWarningModal(false); handleGoogleLogin(); }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl flex items-center justify-center gap-2"
                >
                  <Chrome className="w-4 h-4" /> Sign in with Google
                </button>
                <button
                  onClick={handleGuestLoginActual}
                  className="w-full bg-white/8 border border-white/10 text-slate-300 font-bold text-[11px] uppercase py-3 rounded-2xl text-center"
                >
                  Continue as Guest Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
