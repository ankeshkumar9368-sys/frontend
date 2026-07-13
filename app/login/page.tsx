"use client";

import { useState, useEffect, useRef } from "react";
import { Chrome, User, ShieldAlert, Sparkles, X, BookOpen, Rocket, Mic, Flame, Trophy } from "lucide-react";
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

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("[Auth] onAuthStateChanged fired. user:", user?.email ?? "null");
      if (user) {
        console.log("[Auth] User detected, pushing to /");
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

  return (
    <div 
      ref={containerRef} 
      className="w-full relative overflow-y-auto flex flex-col lg:flex-row min-h-screen bg-[#070518] text-white"
      style={{
        backgroundImage: "radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 40%)"
      }}
    >
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] opacity-25 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[280px] h-[280px] rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] opacity-20 blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      {/* LEFT PANEL: App Features Showcase & Reviews (Responsive: full width on mobile, 58% on desktop) */}
      <div className="flex flex-col justify-center items-center lg:items-start p-8 lg:p-16 w-full lg:w-[58%] xl:w-[62%] relative z-10 space-y-8 select-none order-2 lg:order-1">
        {/* Style injection for Testimonials Marquee animation */}
        <style>{`
          @keyframes marqueeUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .animate-marquee-up {
            animation: marqueeUp 20s linear infinite;
          }
          .animate-marquee-up:hover {
            animation-play-state: paused;
          }
        `}</style>

        {/* India's #1 App Badge */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-2 inline-flex items-center gap-2 border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.18em] text-yellow-200 backdrop-blur shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse"
        >
          <Trophy className="h-4.5 w-4.5 text-yellow-400" />
          🏆 INDIA'S #1 AI STUDY APP FOR BOARDS
        </motion.div>

        {/* Hero Title & Ratings */}
        <div className="space-y-4 text-center lg:text-left">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight"
          >
            Study Smart. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500">
              Score 2x Faster.
            </span>
          </motion.h2>

          {/* Rating Stars Info */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-slate-300 font-bold text-[14px] mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 w-fit mx-auto lg:mx-0 backdrop-blur-md"
          >
            <div className="flex text-yellow-400">
              {"⭐⭐⭐⭐⭐".split("").map((s, idx) => <span key={idx}>{s}</span>)}
            </div>
            <span className="text-white font-extrabold">4.9/5</span>
            <span className="text-slate-400">|</span>
            <span className="text-cyan-300">50,000+ Students trust us</span>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 w-full max-w-2xl mt-2">
          {[
            {
              icon: BookOpen,
              title: "3D Smart Notes",
              desc: "Quick visual summaries and important board questions for all chapters.",
              color: "from-cyan-500/25 to-blue-600/15 border-cyan-500/20 text-cyan-400"
            },
            {
              icon: Mic,
              title: "24/7 Voice Teacher",
              desc: "Ask questions by voice and get instant explanations in Hinglish.",
              color: "from-purple-500/25 to-indigo-600/15 border-purple-500/20 text-purple-400"
            },
            {
              icon: Flame,
              title: "Weakness Heatmap",
              desc: "Spot your red zones instantly and turn mistakes into revision targets.",
              color: "from-rose-500/25 to-orange-600/15 border-rose-500/20 text-rose-400"
            },
            {
              icon: Trophy,
              title: "Daily Study Wagers",
              desc: "Set study wagers, maintain your streak, and win coins with friends.",
              color: "from-amber-500/25 to-yellow-600/15 border-amber-500/20 text-amber-400"
            }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className={`p-4.5 rounded-[28px] border bg-gradient-to-br ${feat.color} shadow-lg backdrop-blur-md flex gap-4 transition-all duration-300`}
            >
              <div className="p-3 bg-white/5 rounded-2xl h-fit shrink-0">
                <feat.icon className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-[15px] text-white tracking-wide">{feat.title}</h4>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Student Comments Marquee section */}
        <div className="w-full max-w-2xl mt-4 space-y-3">
          <h4 className="text-[12px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-2 select-text">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Student Feedbacks
          </h4>
          
          <div className="relative h-[110px] w-full overflow-hidden bg-white/[0.02] border border-white/5 rounded-[24px] backdrop-blur p-4">
            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#070518] to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[#070518] to-transparent z-20 pointer-events-none" />
            
            <div className="flex flex-col space-y-3 animate-marquee-up">
              {[
                { name: "Aarav Sharma", cls: "Class 10 (CBSE)", comment: "Bhai voice coach sach me kamaal hai! Pure math ke doubts instant clear ho gaye. 🔥" },
                { name: "Sneha Patel", cls: "Class 10 (ICSE)", comment: "Weakness heatmap check karke read kiya. Biology me 98 marks aaye, thank you Achivox!" },
                { name: "Priyanshu Roy", cls: "Class 12 (CBSE)", comment: "Iske 3D Smart Notes se chapter revision fast ho jata hai. Highly recommended!" },
                { name: "Dev Adhikari", cls: "Class 11 (State Board)", comment: "Study wagers game ki tarah hai. Dosto ke sath study streak maintain karne me maza aata hai." },
                { name: "Riya Verma", cls: "Class 12 (Boards)", comment: "No. 1 studying tool! Spaced revision signals se pta rehta hai kab kya padhna hai." },
                // Duplicates for looping
                { name: "Aarav Sharma", cls: "Class 10 (CBSE)", comment: "Bhai voice coach sach me kamaal hai! Pure math ke doubts instant clear ho gaye. 🔥" },
                { name: "Sneha Patel", cls: "Class 10 (ICSE)", comment: "Weakness heatmap check karke read kiya. Biology me 98 marks aaye, thank you Achivox!" },
                { name: "Priyanshu Roy", cls: "Class 12 (CBSE)", comment: "Iske 3D Smart Notes se chapter revision fast ho jata hai. Revision signals best hain!" },
                { name: "Dev Adhikari", cls: "Class 11 (State Board)", comment: "Study wagers game ki tarah hai. Dosto ke sath study streak maintain karne me maza aata hai." },
                { name: "Riya Verma", cls: "Class 12 (Boards)", comment: "No. 1 studying tool! Spaced revision signals se pta rehta hai kab kya padhna hai." }
              ].map((t, idx) => (
                <div key={idx} className="flex flex-col space-y-0.5 bg-white/[0.03] border border-white/5 rounded-2xl p-3 shrink-0 select-text">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="text-white font-extrabold">{t.name}</span>
                    <span className="text-indigo-400">{t.cls}</span>
                  </div>
                  <p className="text-slate-300 text-xs font-semibold leading-normal">{t.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Login Action Panel (Responsive: full width on mobile, 42% on desktop) */}
      <div className="flex flex-col justify-center items-center p-6 w-full lg:w-[42%] xl:w-[38%] min-h-screen relative z-10 order-1 lg:order-2 lg:border-l lg:border-white/5 bg-white/[0.01] backdrop-blur-3xl">
        {/* Floating Animated Orbs */}
        <div className="absolute top-[10%] right-[15%] w-12 h-12 rounded-full bg-gradient-to-br from-[#818CF8] to-[#C084FC] opacity-40 shadow-[0_0_20px_rgba(129,140,248,0.4)] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[10%] w-8 h-8 rounded-full bg-gradient-to-tr from-[#F472B6] to-[#FB7185] opacity-30 shadow-[0_0_15px_rgba(244,114,182,0.3)] pointer-events-none" />

        {/* Main Glassmorphic Container Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.1 }} 
          className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.07] rounded-[45px] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)] w-full max-w-[400px] flex flex-col items-center py-10 transform-gpu relative overflow-hidden"
          style={{
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 30px 70px rgba(0,0,0,0.5)"
          }}
        >
          {/* Glowing Logo Circle */}
          <motion.div 
            className="w-[100px] h-[100px] bg-gradient-to-br from-[#818CF8]/20 via-[#C084FC]/20 to-[#F472B6]/20 rounded-[35px] border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.3)] flex items-center justify-center pointer-events-none will-change-transform transform-gpu"
          >
            <BookOpen className="text-white w-[45px] h-[45px]" />
          </motion.div>

          {/* Title */}
          <h1 className="text-[34px] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-white/70 tracking-wider mt-5 select-text">
            ACHIVOX
          </h1>

          <p className="text-slate-400 text-[13px] mt-1.5 font-bold tracking-wide uppercase select-text flex items-center gap-1.5">
            Padho Kam, Score Zyada <Sparkles className="w-4.5 h-4.5 text-yellow-400 animate-pulse" />
          </p>

          <h2 className="text-white text-[24px] font-extrabold mt-8 select-text">
            Welcome Back 👋
          </h2>

          <p className="text-slate-400 text-xs mt-1 text-center font-semibold select-text">
            Start your learning journey today
          </p>

          {/* Visible Error Box */}
          {errorMsg && (
            <div className="w-full mt-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs font-mono text-center break-all">
              ❌ {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 w-full mt-8">
            {/* Google Login */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full h-[60px] bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#EC4899] text-white font-black rounded-[25px] py-4 px-6 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:brightness-110 disabled:opacity-70 transition-all border border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shrink-0">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#ea4335" d="M12 5.04c1.63 0 3.1.56 4.25 1.66l3.19-3.19C17.51 1.68 14.99.5 12 .5 7.69.5 3.95 2.99 2.12 6.6l3.69 2.86C6.72 6.8 9.15 5.04 12 5.04z"/>
                  <path fill="#4285f4" d="M23.49 12.275c0-.82-.07-1.64-.22-2.42H12v4.61h6.43c-.27 1.47-1.11 2.7-2.36 3.54l3.67 2.84c2.14-1.97 3.38-4.88 3.38-8.57z"/>
                  <path fill="#fbbc05" d="M5.81 14.54c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L2.12 6.98C1.3 8.62.83 10.45.83 12.37s.47 3.75 1.29 5.39l3.69-2.86z"/>
                  <path fill="#34a853" d="M12 23.5c3.11 0 5.71-1.03 7.61-2.8l-3.67-2.84c-1.02.68-2.33 1.09-3.94 1.09-2.85 0-5.28-1.76-6.19-4.42L2.12 17.39c1.83 3.61 5.57 6.11 9.88 6.11z"/>
                </svg>
              </div>
              <span className="text-md font-bold tracking-wide">Continue with Google</span>
            </motion.button>

            {/* Guest Login */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowWarningModal(true)} 
              disabled={loading}
              className="w-full h-[60px] bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 hover:text-white font-bold rounded-[25px] py-4 px-6 flex items-center justify-center gap-3 transition-all"
            >
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-md font-bold tracking-wide">Continue as Guest</span>
            </motion.button>
          </div>

          {/* Rocket Icon */}
          <div className="w-full flex justify-center mt-7 pointer-events-none">
            <Rocket className="text-[#A855F7] w-[50px] h-[50px] animate-bounce" style={{ animationDuration: '3s' }} />
          </div>

          {/* Footer Info */}
          <div className="text-slate-500 text-[10px] text-center mt-6 leading-relaxed font-bold select-text uppercase tracking-widest">
            Secure Login &bull; Powered by Firebase
          </div>
        </motion.div>
      </div>

      {/* Guest Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-[200] bg-slate-950/75 backdrop-blur-xl flex items-center justify-center p-5">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="bg-[#130f35]/90 border border-white/10 w-full max-w-sm rounded-[35px] shadow-[0_30px_70px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-[#4F46E5]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-5.5 h-5.5 animate-bounce" />
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowWarningModal(false)}
                    className="w-7.5 h-7.5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </motion.button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-rose-400 tracking-tight">⚠️ Guest Warning!</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                    Guest Account select karne par, logout karne par aapka data permanently delete ho jayega!
                  </p>
                </div>

                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-black text-emerald-400 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 animate-pulse" /> Google account perks:
                  </div>
                  <ul className="text-[9.5px] text-slate-400 space-y-1.5 list-disc list-inside font-bold leading-tight">
                    <li>Lifetime permanent progress saves</li>
                    <li>Sync streak across multiple devices</li>
                    <li>Unique Scholar Student ID</li>
                    <li>Secure Achivox Wallet backing</li>
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowWarningModal(false);
                      handleGoogleLogin();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] uppercase tracking-widest py-3.5 rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
                  >
                    <Chrome className="w-4 h-4" /> Sign in with Google
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGuestLoginActual}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black text-[9px] uppercase py-3 rounded-xl flex items-center justify-center tracking-widest border border-white/10"
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
