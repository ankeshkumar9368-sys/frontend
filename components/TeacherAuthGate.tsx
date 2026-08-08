"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  GraduationCap, ShieldAlert, ShieldX,
  Loader2, LogOut, Home, Lock, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface TeacherAuthGateProps {
  children: React.ReactNode;
}

export default function TeacherAuthGate({ children }: TeacherAuthGateProps) {
  const [gateState, setGateState] = useState<"checking" | "need_login" | "granted" | "denied">("checking");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; name: string } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // 🔒 STRICT CHECK: Guest/Anonymous users or unauthenticated users CANNOT enter
      if (!user || user.isAnonymous || !user.email) {
        setGateState("need_login");
        setCurrentUser(null);
        return;
      }

      setCurrentUser({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split("@")[0] || "User",
      });

      try {
        // Check Firestore for Admin-assigned teacher role
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const isTeacherApproved = data.adminAssignedTeacher === true;

          if (isTeacherApproved) {
            setGateState("granted");
            return;
          }
        }
        // User logged in with Google but NOT assigned as teacher by admin
        setGateState("denied");
      } catch (err) {
        console.error("Error checking teacher authorization:", err);
        setGateState("denied");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Login Error:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGateState("need_login");
    setCurrentUser(null);
  };

  // ── 1. LOADING / AUTHORIZATION CHECK ─────────────────────────────────────
  if (gateState === "checking") {
    return (
      <div className="min-h-screen bg-[#0B1023] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  // ── 2. ACCESS GRANTED (User assigned Teacher role in Admin Panel) ────────
  if (gateState === "granted") {
    return <>{children}</>;
  }

  // ── 3. NEED LOGIN / ACCESS DENIED UI ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1023] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#5B5CEB]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-rose-500/15 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#121735] border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top Status Accent Line */}
          <div className={`h-1.5 w-full ${
            gateState === "denied" 
              ? "bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" 
              : "bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]"
          }`} />

          <div className="p-8 space-y-6">
            
            {/* Header Icon & Title */}
            <div className="text-center space-y-3">
              <div className={`mx-auto w-16 h-16 rounded-2xl p-[2px] shadow-xl ${
                gateState === "denied"
                  ? "bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500"
                  : "bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]"
              }`}>
                <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
                  {gateState === "denied" ? (
                    <ShieldX className="w-8 h-8 text-rose-400" />
                  ) : (
                    <GraduationCap className="w-8 h-8 text-[#38BDF8]" />
                  )}
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {gateState === "denied" ? "Access Denied" : "Teacher Portal"}
                </h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Achivox AI · Teacher Management
                </p>
              </div>
            </div>

            {/* STATE 1: NOT LOGGED IN OR GUEST ACCOUNT */}
            {gateState === "need_login" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
                  <Lock className="w-5 h-5 text-amber-300 shrink-0" />
                  <p className="text-xs font-bold text-amber-200 leading-snug">
                    🔒 Restricted Access — Guest accounts are blocked. Please sign in with your verified Teacher Google account.
                  </p>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full h-14 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#7A5AF8]/30 border border-white/20 disabled:opacity-60 transition-transform active:scale-[0.98] text-sm"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#ea4335" d="M12 5.04c1.63 0 3.1.56 4.25 1.66l3.19-3.19C17.51 1.68 14.99.5 12 .5 7.69.5 3.95 2.99 2.12 6.6l3.69 2.86C6.72 6.8 9.15 5.04 12 5.04z" />
                        <path fill="#4285f4" d="M23.49 12.275c0-.82-.07-1.64-.22-2.42H12v4.61h6.43c-.27 1.47-1.11 2.7-2.36 3.54l3.67 2.84c2.14-1.97 3.38-4.88 3.38-8.57z" />
                        <path fill="#fbbc05" d="M5.81 14.54c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L2.12 6.98C1.3 8.62.83 10.45.83 12.37s.47 3.75 1.29 5.39l3.69-2.86z" />
                        <path fill="#34a853" d="M12 23.5c3.11 0 5.71-1.03 7.61-2.8l-3.67-2.84c-1.02.68-2.33 1.09-3.94 1.09-2.85 0-5.28-1.76-6.19-4.42L2.12 17.39c1.83 3.61 5.57 6.11 9.88 6.11z" />
                      </svg>
                    </div>
                  )}
                  {isLoggingIn ? "Signing In..." : "Sign in with Google"}
                </button>
              </div>
            )}

            {/* STATE 2: LOGGED IN BUT NOT ASSIGNED TEACHER BY ADMIN */}
            {gateState === "denied" && (
              <div className="space-y-5">
                {/* Account Details Box */}
                {currentUser && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Signed in as</p>
                      <p className="text-xs font-black text-white truncate max-w-[220px]">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Switch
                    </button>
                  </div>
                )}

                {/* Explicit Access Denied Warning */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>RESTRICTED ACCESS</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed font-medium">
                    Only accounts assigned the <strong className="text-white font-bold">"Teacher Role"</strong> by an Administrator in the Admin Panel can access this portal.
                  </p>
                  <p className="text-[11px] text-rose-300/80 italic pt-1">
                    Contact Achivox Admin to grant Teacher access to your email ({currentUser?.email}).
                  </p>
                </div>

                {/* Return Home Button */}
                <Link
                  href="/"
                  className="w-full h-12 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl flex items-center justify-center gap-2 border border-white/15 transition-all text-xs"
                >
                  <Home className="w-4 h-4 text-sky-400" /> Return to Achivox Home
                </Link>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 font-medium mt-4">
          ACHIVOX AI · Admin-Controlled Teacher Security · 2026
        </p>
      </motion.div>
    </div>
  );
}
