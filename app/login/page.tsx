"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Chrome, User, ShieldAlert, Sparkles, X, BookOpen, Rocket, Mic, Flame, Trophy,
  Star, Check, CheckCircle2, Zap, Globe, Lock, ShieldCheck, FileText, Bot, 
  LineChart, Brain, GraduationCap, HelpCircle, BarChart2, RefreshCw, Award, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { getRedirectResult, GoogleAuthProvider, signInAnonymously, signInWithCredential, signInWithPopup } from "firebase/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlayStatusBar = async () => {
      try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch (e) {
        console.log("StatusBar overlay not supported");
      }
    };
    overlayStatusBar();
  }, []);

  useEffect(() => {
    // Capture referral link parameter from URL (e.g. /login?ref=ANKESH1)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");
      if (refCode && refCode.length >= 6) {
        localStorage.setItem("achivox_pending_ref", refCode.toUpperCase());
      }
    }

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        console.log("[Auth] getRedirectResult:", result?.user?.email ?? "no redirect user");
      } catch (error: any) {
        console.error("[Auth] Redirect Login Error:", error);
        setErrorMsg("Redirect error: " + error.message);
      }
    };
    checkRedirect();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("[Auth] onAuthStateChanged fired. user:", user?.email ?? "null");
      if (user) {
        console.log("[Auth] User detected, pushing to /");
        
        // Auto-process referral if user arrived via a referral link
        const pendingRef = localStorage.getItem("achivox_pending_ref");
        if (pendingRef) {
          try {
            const { processReferralCode } = await import("../../lib/referral");
            await processReferralCode(user.uid, pendingRef);
            localStorage.removeItem("achivox_pending_ref");
          } catch (refErr) {
            console.warn("Auto referral link notice:", refErr);
            localStorage.removeItem("achivox_pending_ref");
          }
        }

        // Set offer deadline when user first logs in (24 hours from now)
        const OFFER_KEY = "achivox_offer_deadline";
        if (!localStorage.getItem(OFFER_KEY)) {
          const deadline = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem(OFFER_KEY, String(deadline));
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
      const isNative =
        typeof window !== "undefined" &&
        !!(window as any).Capacitor?.isNativePlatform?.();

      console.log("[Auth] isNative:", isNative);
      console.log("[Auth] Starting Google login on domain:", window.location.hostname);

      if (isNative) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log("[Auth] Native signIn result user:", result.user?.email);
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        } else if (!result.user) {
          throw new Error("Missing authentication token from Google.");
        }
      } else {
        console.log("[Auth] Calling signInWithPopup...");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log("[Auth] Popup success! user:", result.user?.email);
      }
    } catch (error: any) {
      console.error("[Auth] Google Login Error:", error.code, error.message);
      setErrorMsg(error.code + ": " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* Helper sub-component for the Login Card so we can render it cleanly in both mobile & desktop orders */
  const renderLoginPanel = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 10 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      transition={{ type: "spring", stiffness: 100, damping: 20 }} 
      className="relative p-4 sm:p-6 lg:p-6 xl:p-7 rounded-[28px] sm:rounded-[36px] bg-[#121735]/95 border border-[#7A5AF8]/50 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden space-y-4"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]" />

      {/* LOGO & WELCOME */}
      <div className="text-center space-y-1">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[1.5px] shadow-[0_0_20px_rgba(122,90,248,0.4)] flex items-center justify-center">
          <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#38BDF8]" />
          </div>
        </div>

        <h2 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-white pt-1">
          Welcome Back 👋
        </h2>
        <p className="text-xs font-semibold text-slate-300">
          Continue Your Learning Journey
        </p>
      </div>

      {/* ⚠️ VISIBLE ERROR MESSAGE IF ANY */}
      {errorMsg && (
        <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-mono text-center break-all shadow-md">
          ❌ {errorMsg}
        </div>
      )}

      {/* 🔥 EXAMS ARE NEAR BANNER (CRITICAL REQ: PLACED JUST ABOVE LOGIN BUTTON) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-purple-500/20 border border-amber-400/50 backdrop-blur-md space-y-1.5 text-center shadow-md">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#FFD54F] uppercase tracking-wider">
          <Flame className="w-4 h-4 text-amber-300 animate-bounce" /> 🔥 Exams are Near!
        </div>
        <p className="text-xs font-bold text-white leading-tight">
          Join 50,000+ Students Learning with Achivox AI
        </p>
        <div className="flex flex-wrap justify-center gap-1 pt-0.5 text-[10px] font-bold text-slate-200">
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">✔ CBSE</span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">✔ Bihar Board</span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">✔ ICSE</span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10">✔ State Boards</span>
        </div>
        <div className="text-[10px] font-extrabold text-emerald-300 pt-0.5 flex items-center justify-center gap-1">
          Start FREE Today <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* 🎁 FREE SIGN-IN BONUS CALLOUT */}
      <div className="p-3 rounded-2xl bg-[#7A5AF8]/15 border border-[#7A5AF8]/40 flex items-center gap-2.5">
        <Sparkles className="w-4.5 h-4.5 text-[#FFD54F] shrink-0 animate-pulse" />
        <div className="text-left">
          <span className="text-[10px] font-black text-[#FFD54F] uppercase tracking-wider block">FREE SIGN-IN BONUS</span>
          <span className="text-[11px] font-bold text-slate-100 leading-tight block">Get AI Credits + Chapter Notes instantly on login.</span>
        </div>
      </div>

      {/* 🔘 LOGIN ACTION BUTTONS */}
      <div className="space-y-2.5 pt-1">
        {/* Primary Button: Continue with Google */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full h-13 sm:h-14 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] hover:from-[#4F46E5] hover:to-[#0EA5E9] text-white font-black rounded-2xl px-4 flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(122,90,248,0.4)] transition-all border border-white/25 disabled:opacity-70 active:scale-95 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ea4335" d="M12 5.04c1.63 0 3.1.56 4.25 1.66l3.19-3.19C17.51 1.68 14.99.5 12 .5 7.69.5 3.95 2.99 2.12 6.6l3.69 2.86C6.72 6.8 9.15 5.04 12 5.04z"/>
              <path fill="#4285f4" d="M23.49 12.275c0-.82-.07-1.64-.22-2.42H12v4.61h6.43c-.27 1.47-1.11 2.7-2.36 3.54l3.67 2.84c2.14-1.97 3.38-4.88 3.38-8.57z"/>
              <path fill="#fbbc05" d="M5.81 14.54c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L2.12 6.98C1.3 8.62.83 10.45.83 12.37s.47 3.75 1.29 5.39l3.69-2.86z"/>
              <path fill="#34a853" d="M12 23.5c3.11 0 5.71-1.03 7.61-2.8l-3.67-2.84c-1.02.68-2.33 1.09-3.94 1.09-2.85 0-5.28-1.76-6.19-4.42L2.12 17.39c1.83 3.61 5.57 6.11 9.88 6.11z"/>
            </svg>
          </div>
          <span className="text-sm sm:text-base font-extrabold tracking-wide">Continue with Google</span>
        </motion.button>

        {/* Secondary Button: Continue as Guest */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWarningModal(true)} 
          disabled={loading}
          className="w-full h-11 sm:h-12 bg-white/[0.06] border border-white/15 hover:bg-white/[0.1] text-slate-200 hover:text-white font-bold rounded-2xl px-4 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <User className="w-4 h-4 text-slate-300" />
          <span className="text-xs sm:text-sm font-bold">Continue as Guest</span>
        </motion.button>

        <p className="text-center text-[10px] text-slate-400 font-semibold">
          Limited Features Available
        </p>
      </div>

      {/* 🛡️ BOTTOM TRUST BADGES INSIDE PANEL */}
      <div className="pt-2.5 border-t border-white/10 text-[10px] font-bold text-slate-300 grid grid-cols-2 gap-2 text-center">
        <span className="flex items-center justify-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> 100% Encrypted</span>
        <span className="flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3 text-[#38BDF8]" /> Verified Portal</span>
      </div>
    </motion.div>
  );

  return (
    <div 
      ref={containerRef} 
      className="w-full relative min-h-screen overflow-x-hidden bg-[#0B1023] text-white selection:bg-[#7A5AF8] selection:text-white"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* 🌌 FUTURISTIC BACKGROUND GLOW BLOBS & AI NEURAL PARTICLES */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#5B5CEB]/30 via-[#7A5AF8]/20 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-[#38BDF8]/25 via-[#8B5CF6]/20 to-transparent blur-[130px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-gradient-to-t from-[#7A5AF8]/25 via-[#5B5CEB]/15 to-transparent blur-[140px]" />
        
        {/* Subtle Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* 🔝 TOP BRAND NAVIGATION BAR */}
      <header className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[1.5px] shadow-[0_0_25px_rgba(122,90,248,0.4)]">
            <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#38BDF8]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              ACHIVOX <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A5AF8] to-[#38BDF8] text-xs px-2 py-0.5 rounded-full bg-[#151A35] border border-[#7A5AF8]/30">AI</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Study Smarter. Score Better.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-[#151A35]/90 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-inner text-xs font-semibold text-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>Class <strong className="text-white">9th–12th Boards</strong></span>
        </div>
      </header>

      {/* 🚀 MAIN CONTENT CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        
        {/* ========================================================
            MOBILE & TABLET VIEW (screen < lg): STACKED VIEW WITH LOGIN TOP
           ======================================================== */}
        <div className="block lg:hidden space-y-6">
          
          {/* Mobile Hero Text */}
          <div className="text-center space-y-2.5 pt-1">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7A5AF8]/25 via-[#5B5CEB]/25 to-[#38BDF8]/25 border border-[#7A5AF8]/40 backdrop-blur-xl text-[11px] font-bold text-slate-100 shadow-[0_0_15px_rgba(122,90,248,0.2)]"
            >
              <Trophy className="w-3.5 h-3.5 text-[#FFD54F] shrink-0" />
              <span>CBSE · Bihar Board · ICSE · State Boards</span>
            </motion.div>

            <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight text-white">
              📚 Study Smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#7A5AF8] to-[#FFD54F]">
                🎯 Score Better in Less Time.
              </span>
            </h1>

            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-normal max-w-md mx-auto">
              India's AI Study Partner for School Students. Learn Faster, Revise Smarter & Score Higher.
            </p>
          </div>

          {/* Mobile Login Panel (FIRST priority on phone screens so user sees Google button right away!) */}
          <div className="w-full max-w-md mx-auto">
            {renderLoginPanel()}
          </div>

          {/* Mobile Free Bonus Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#151A35]/95 via-[#0B1023]/95 to-[#151A35]/95 border border-[#7A5AF8]/40 shadow-lg backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#FFD54F] uppercase tracking-wider">
              <span>🎁</span> Login Today & Get FREE:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-200">
              {["AI Smart Notes", "10 AI Doubts", "Chapter-wise Revision", "Study Planner", "AI Mock Test"].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Social Proof */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7A5AF8] animate-ping" /> What Toppers Say
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { name: "Rahul", cls: "Class 10 · CBSE", review: "Aaj revision sirf 2 ghante me complete ho gaya." },
                { name: "Priya", cls: "Class 12 · Bihar Board", review: "Boards ke liye best AI app." },
                { name: "Aditya", cls: "Class 9", review: "Mock Tests helped improve my confidence." }
              ].map((rev, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-[#151A35]/80 border border-white/10 space-y-1">
                  <div className="flex text-[#FFD54F] text-[10px]">{"⭐⭐⭐⭐⭐".split("").map((s, idx) => <span key={idx}>{s}</span>)}</div>
                  <p className="text-xs font-bold text-slate-200">"{rev.review}"</p>
                  <p className="text-[10px] text-slate-400 font-medium pt-1">— {rev.name} ({rev.cls})</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Feature Grid */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">All Features Included</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: FileText, title: "AI Smart Notes" },
                { icon: Bot, title: "Instant AI Doubt Solver" },
                { icon: LineChart, title: "Progress Tracking" },
                { icon: Brain, title: "Personalized Study Planner" },
                { icon: BookOpen, title: "Previous Year Questions" },
                { icon: BarChart2, title: "AI Mock Tests" },
                { icon: RefreshCw, title: "Revision Mode" },
                { icon: Globe, title: "Hindi, English & Hinglish" }
              ].map((feat, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#151A35]/60 border border-white/10 flex items-center gap-2">
                  <feat.icon className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-200 leading-tight">{feat.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ========================================================
            DESKTOP VIEW (screen >= lg): AUTO-RESIZING 2-COLUMN LAYOUT
           ======================================================== */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-10 items-center min-h-[calc(100vh-100px)]">
          
          {/* LEFT COLUMN: HERO, BONUS CARD, REVIEWS, FEATURES, COMPARISON (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 🏆 FLOATING BOARD BADGE */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7A5AF8]/20 via-[#5B5CEB]/20 to-[#38BDF8]/20 border border-[#7A5AF8]/40 backdrop-blur-xl text-xs font-bold text-slate-200 shadow-[0_0_20px_rgba(122,90,248,0.2)]"
            >
              <Trophy className="w-4 h-4 text-[#FFD54F] shrink-0" />
              <span>Designed for <strong className="text-white">CBSE · Bihar Board · ICSE · State Boards</strong></span>
            </motion.div>

            {/* 📚 HERO HEADINGS */}
            <div className="space-y-2.5">
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-white"
              >
                📚 Study Smarter. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#7A5AF8] to-[#FFD54F]">
                  🎯 Score Better in Less Time.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-sm lg:text-base font-medium text-slate-300 leading-relaxed max-w-xl"
              >
                India's AI Study Partner for School Students. Learn Faster, Revise Smarter and Score Higher with AI.
              </motion.p>
            </div>

            {/* ⭐ STATS & TRUST BADGES */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A35]/90 border border-white/10 text-xs font-bold text-white shadow-md">
                <div className="flex text-[#FFD54F]">{"⭐⭐⭐⭐⭐".split("").map((s, idx) => <span key={idx}>{s}</span>)}</div>
                <span className="text-slate-200 ml-1">4.9/5 Rating</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A35]/90 border border-white/10 text-xs font-bold text-white shadow-md">
                <span className="text-sm">👨‍🎓</span> <span>50,000+ Students</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151A35]/90 border border-white/10 text-xs font-bold text-white shadow-md">
                <span className="text-sm">🏫</span> <span>Trusted Across India</span>
              </div>
            </div>

            {/* 🎁 FREE BONUS CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative p-5 rounded-3xl bg-gradient-to-br from-[#151A35]/90 via-[#0B1023]/95 to-[#151A35]/90 border border-[#7A5AF8]/40 shadow-[0_15px_40px_rgba(122,90,248,0.15)] backdrop-blur-xl space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-black text-[#FFD54F] uppercase tracking-wider">
                <span>🎁</span> Login Today & Get FREE:
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  "AI Smart Notes",
                  "10 AI Doubts",
                  "Chapter-wise Revision",
                  "Study Planner",
                  "AI Mock Test"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-bold text-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span>⚡ Instant access on login</span>
                <span className="text-[#FFD54F] font-extrabold">No Credit Card Required</span>
              </div>
            </motion.div>

            {/* ⭐ SOCIAL PROOF REVIEWS */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7A5AF8] animate-ping" /> What Indian Toppers Say
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { name: "Rahul", cls: "Class 10 · CBSE", review: "Aaj revision sirf 2 ghante me complete ho gaya.", avatar: "👨‍🎓" },
                  { name: "Priya", cls: "Class 12 · Bihar Board", review: "Boards ke liye best AI app.", avatar: "👩‍🎓" },
                  { name: "Aditya", cls: "Class 9", review: "Mock Tests helped improve my confidence.", avatar: "🧑‍🎓" }
                ].map((rev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-[#151A35]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between space-y-2"
                  >
                    <div className="space-y-1">
                      <div className="flex text-[#FFD54F] text-[10px]">{"⭐⭐⭐⭐⭐".split("").map((s, idx) => <span key={idx}>{s}</span>)}</div>
                      <p className="text-[11px] font-bold text-slate-200 leading-snug">"{rev.review}"</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5 text-[10px]">
                      <span>{rev.avatar}</span>
                      <div>
                        <p className="font-black text-white leading-tight">{rev.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{rev.cls}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 📄 FEATURE GRID */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" /> Everything You Need To Score 95%+
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: FileText, title: "AI Smart Notes", color: "text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20" },
                  { icon: Bot, title: "Instant AI Doubt Solver", color: "text-[#7A5AF8] bg-[#7A5AF8]/10 border-[#7A5AF8]/20" },
                  { icon: LineChart, title: "Progress Tracking", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
                  { icon: Brain, title: "Personalized Study Planner", color: "text-[#FFD54F] bg-[#FFD54F]/10 border-[#FFD54F]/20" },
                  { icon: BookOpen, title: "Previous Year Questions", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
                  { icon: BarChart2, title: "AI Mock Tests", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
                  { icon: RefreshCw, title: "Revision Mode", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
                  { icon: Globe, title: "Hindi, English & Hinglish", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" }
                ].map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#151A35]/70 border border-white/10 backdrop-blur-md flex flex-col gap-2"
                  >
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${feat.color}`}>
                      <feat.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 leading-tight">{feat.title}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>


          {/* RIGHT COLUMN: LOGIN PANEL (5 COLS - Perfect Centered Viewport Auto-fit) */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto flex items-center justify-center">
            {renderLoginPanel()}
          </div>

        </div>
      </main>

      {/* ========================================================
          BOTTOM CTA SECTION & TRUST BAR
         ======================================================== */}
      <footer className="relative z-10 border-t border-white/10 mt-12 bg-[#070A17]/90 backdrop-blur-xl py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          
          {/* BOTTOM CTA CARD */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#5B5CEB]/25 via-[#7A5AF8]/35 to-[#38BDF8]/25 border border-[#7A5AF8]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-base sm:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                🚀 Unlock Your Full Learning Potential
              </h3>
              <p className="text-xs text-slate-200 font-semibold">
                Upgrade Anytime · Personalized AI Tutor for CBSE & Board Exams
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-black text-white px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur">
                Visit: <strong className="text-[#38BDF8]">🌐 achivox.online</strong>
              </span>
            </div>
          </div>

          {/* BOTTOM TRUST BAR */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-300 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Secure Google Login</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#FFD54F]" /> Lightning Fast</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" /> Privacy Protected</span>
              <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-purple-400" /> Built for Indian Students</span>
            </div>

            <div className="text-[10px] font-bold text-slate-400">
              ACHIVOX AI © 2026 · Made with ❤️ for India
            </div>
          </div>

        </div>
      </footer>

      {/* 🛡️ GUEST WARNING MODAL */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-[200] bg-[#0B1023]/85 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="bg-[#151A35] border border-white/20 w-full max-w-sm rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.7)] p-6 relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-[#7A5AF8]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-rose-500/15 rounded-2xl flex items-center justify-center text-rose-300 border border-rose-500/30">
                    <ShieldAlert className="w-5.5 h-5.5 animate-bounce" />
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowWarningModal(false)}
                    className="w-8 h-8 bg-white/10 border border-white/15 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-300" />
                  </motion.button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-rose-300 tracking-tight">⚠️ Guest Warning!</h3>
                  <p className="text-xs text-slate-200 font-bold uppercase tracking-wide leading-relaxed">
                    Guest Account select karne par, logout karne par aapka data permanently delete ho jayega!
                  </p>
                </div>

                <div className="bg-white/[0.04] p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Google account perks:
                  </div>
                  <ul className="text-[11px] text-slate-200 space-y-1 list-disc list-inside font-bold leading-tight">
                    <li>Lifetime permanent progress saves</li>
                    <li>Sync streak across multiple devices</li>
                    <li>Unique Scholar Student ID</li>
                    <li>Secure Achivox Wallet backing</li>
                  </ul>
                </div>

                <div className="space-y-2 pt-1">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowWarningModal(false);
                      handleGoogleLogin();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Chrome className="w-4 h-4" /> Sign in with Google
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGuestLoginActual}
                    className="w-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-[11px] uppercase py-3 rounded-2xl flex items-center justify-center tracking-widest border border-white/10"
                  >
                    Continue as Guest Anyway
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
