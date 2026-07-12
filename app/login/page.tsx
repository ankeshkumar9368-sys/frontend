"use client";

import { useState, useEffect, useRef } from "react";
import { Chrome, User, ShieldAlert, Sparkles, X, ArrowRight, Lock, BookOpen, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, signInAnonymously, signInWithCredential, signInWithPopup } from "firebase/auth";

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
    <div ref={containerRef} className="mobile-container relative overflow-hidden flex flex-col justify-between items-center p-6 bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#EC4899] min-h-screen">
      
      {/* Draggable Floating Balls */}
      <motion.div 
        drag
        dragConstraints={containerRef}
        dragElastic={0.2}
        whileDrag={{ scale: 1.2 }}
        className="absolute top-[120px] left-[30px] w-10 h-10 rounded-full bg-gradient-to-br from-[#A855F7] to-[#EC4899] shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto z-10 animate-pulse will-change-transform transform-gpu"
      />

      <motion.div 
        drag
        dragConstraints={containerRef}
        dragElastic={0.2}
        whileDrag={{ scale: 1.2 }}
        className="absolute top-[250px] right-[20px] w-10 h-10 rounded-full bg-gradient-to-br from-[#A855F7] to-[#EC4899] shadow-lg cursor-grab active:cursor-grabbing pointer-events-auto z-10 animate-pulse will-change-transform transform-gpu"
      />

      {/* Main Glassmorphic Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.1 }} 
        className="backdrop-blur-md bg-white/18 border border-white/20 rounded-[40px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[calc(100%-1.5rem)] mx-3 z-10 relative flex flex-col items-center flex-grow justify-center py-7 my-auto transform-gpu"
      >
        {/* Draggable 3D Logo Container */}
        <motion.div 
          drag
          dragConstraints={containerRef}
          dragElastic={0.2}
          whileDrag={{ scale: 1.1 }}
          className="w-[120px] h-[120px] bg-gradient-to-br from-[#6D5DF6] to-[#E94BBD] rounded-[30px] shadow-[0_15px_30px_rgba(109,93,246,0.4)] flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto will-change-transform transform-gpu"
        >
          <BookOpen className="text-white w-[60px] h-[60px]" />
        </motion.div>

        <h1 className="text-[42px] font-bold text-white tracking-wider mt-4 select-text">
          ACHIVOX
        </h1>

        <p className="text-white/70 text-[16px] mt-2 font-medium select-text">
          Padho Kam, Score Zyada 🚀
        </p>

        <h2 className="text-white text-[28px] font-bold mt-8 select-text">
          Welcome Back 👋
        </h2>

        <p className="text-white/70 text-sm mt-1 text-center select-text">
          Start your learning journey today
        </p>

        {/* Visible Error Box — shows exact Firebase error on screen */}
        {errorMsg && (
          <div className="w-full mt-4 p-3 bg-red-500/80 rounded-2xl text-white text-xs font-mono text-center break-all">
            ❌ {errorMsg}
          </div>
        )}

        <div className="space-y-4 w-full mt-8">
          {/* Google Login */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full h-[60px] bg-gradient-to-br from-[#6D5DF6] to-[#E94BBD] text-white font-bold rounded-[50px] py-4 px-6 flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(109,93,246,0.4)] hover:opacity-90 disabled:opacity-75 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#ea4335" d="M12 5.04c1.63 0 3.1.56 4.25 1.66l3.19-3.19C17.51 1.68 14.99.5 12 .5 7.69.5 3.95 2.99 2.12 6.6l3.69 2.86C6.72 6.8 9.15 5.04 12 5.04z"/>
                <path fill="#4285f4" d="M23.49 12.275c0-.82-.07-1.64-.22-2.42H12v4.61h6.43c-.27 1.47-1.11 2.7-2.36 3.54l3.67 2.84c2.14-1.97 3.38-4.88 3.38-8.57z"/>
                <path fill="#fbbc05" d="M5.81 14.54c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L2.12 6.98C1.3 8.62.83 10.45.83 12.37s.47 3.75 1.29 5.39l3.69-2.86z"/>
                <path fill="#34a853" d="M12 23.5c3.11 0 5.71-1.03 7.61-2.8l-3.67-2.84c-1.02.68-2.33 1.09-3.94 1.09-2.85 0-5.28-1.76-6.19-4.42L2.12 17.39c1.83 3.61 5.57 6.11 9.88 6.11z"/>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-wide">Continue with Google</span>
          </motion.button>

          {/* Guest Login */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWarningModal(true)} 
            disabled={loading}
            className="w-full h-[60px] bg-white/15 border border-white/20 hover:bg-white/25 text-white font-bold rounded-[50px] py-4 px-6 flex items-center justify-center gap-3 transition-all"
          >
            <User className="w-5 h-5 text-white" />
            <span className="text-lg font-bold tracking-wide">Continue as Guest</span>
          </motion.button>
        </div>

        {/* Draggable Rocket Launch Icon */}
        <motion.div 
          drag
          dragConstraints={containerRef}
          dragElastic={0.2}
          whileDrag={{ scale: 1.2 }}
          className="w-full flex justify-center mt-8 cursor-grab active:cursor-grabbing pointer-events-auto will-change-transform transform-gpu"
        >
          <Rocket className="text-white w-[70px] h-[70px] animate-pulse" />
        </motion.div>

        {/* Footer Secure Info */}
        <div className="text-white/80 text-xs text-center mt-6 leading-relaxed font-semibold select-text">
          Secure Login<br />Powered by Firebase Authentication
        </div>
      </motion.div>

      {/* Guest Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-[200] bg-slate-950/65 backdrop-blur-lg flex items-center justify-center p-5">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white border border-white/40 w-full max-w-sm rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.3)] p-5 relative overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="w-11 h-11 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                    <ShieldAlert className="w-5.5 h-5.5 animate-bounce" />
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowWarningModal(false)}
                    className="w-7.5 h-7.5 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </motion.button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-rose-500 tracking-tight">⚠️ Guest Warning!</h3>
                  <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wide leading-relaxed">
                    Guest Account select karne par, logout karne par aapka data permanently delete ho jayega!
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-black text-emerald-600 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" /> Google account perks:
                  </div>
                  <ul className="text-[9.5px] text-slate-500 space-y-1.5 list-disc list-inside font-bold leading-tight">
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
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-[9px] uppercase py-3 rounded-xl flex items-center justify-center tracking-widest border border-slate-200/50"
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
