"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  GraduationCap, ShieldAlert, Lock, Eye, EyeOff,
  CheckCircle2, Loader2, ArrowRight, LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

interface TeacherAuthGateProps {
  children: React.ReactNode;
}

export default function TeacherAuthGate({ children }: TeacherAuthGateProps) {
  const [gateState, setGateState] = useState<
    "checking" | "need_login" | "need_verify" | "granted" | "denied"
  >("checking");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; name: string } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setGateState("need_login");
        setCurrentUser(null);
        return;
      }

      setCurrentUser({
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "Teacher",
      });

      try {
        // Check Firestore for teacher role
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          // Must have BOTH role=teacher AND teacherVerified=true
          if (data.role === "teacher" && data.teacherVerified === true) {
            setGateState("granted");
            return;
          }
        }
        // Logged in but not verified teacher
        setGateState("need_verify");
      } catch {
        setGateState("need_verify");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setPasscodeError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setPasscodeError(err.message || "Google login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyPasscode = async () => {
    if (!passcode.trim()) {
      setPasscodeError("Please enter the Teacher Access Code.");
      return;
    }
    if (!currentUser) {
      setPasscodeError("Please log in first.");
      return;
    }

    setIsVerifying(true);
    setPasscodeError("");

    try {
      // ── SECURE: Call server-side API — passcode never checked client-side ──
      const res = await fetch("/api/teacher/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passcode: passcode.trim(),
          uid: currentUser.uid,
          email: currentUser.email,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasscodeError(data.error || "❌ Invalid Teacher Access Code. Contact Achivox Admin.");
        return;
      }

      // Server confirmed — now set Firestore role with teacherVerified=true
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, {
          role: "teacher",
          teacherVerified: true,
          teacherVerifiedAt: new Date().toISOString(),
        });
      } else {
        await setDoc(userRef, {
          role: "teacher",
          teacherVerified: true,
          teacherVerifiedAt: new Date().toISOString(),
          email: currentUser.email,
          displayName: currentUser.name,
        });
      }

      setGateState("granted");
    } catch (err: any) {
      setPasscodeError(err.message || "Verification failed. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setPasscode("");
    setPasscodeError("");
    setGateState("need_login");
  };

  // ── LOADING / CHECKING ────────────────────────────────────────────────────
  if (gateState === "checking") {
    return (
      <div className="min-h-screen bg-[#0B1023] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Verifying Teacher Access...
          </p>
        </div>
      </div>
    );
  }

  // ── ACCESS GRANTED — show the portal ─────────────────────────────────────
  if (gateState === "granted") {
    return <>{children}</>;
  }

  // ── GATE UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1023] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#5B5CEB]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-[#38BDF8]/15 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#121735] border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]" />

          <div className="p-8 space-y-6">
            {/* Logo + Title */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[2px] shadow-lg">
                <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-[#38BDF8]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Teacher Portal</h1>
                <p className="text-xs text-[#38BDF8] font-bold uppercase tracking-widest">
                  Achivox AI · Secure Access
                </p>
              </div>
            </div>

            {/* Security Warning */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-400/30">
              <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
              <p className="text-xs font-bold text-rose-200 leading-snug">
                🔒 Restricted Access — Students cannot enter. Only Achivox-verified teachers allowed.
              </p>
            </div>

            {/* STEP 1: Google Login */}
            {gateState === "need_login" && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-300 text-center">
                  Step 1 of 2 — Sign in with Google
                </p>
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
                  {isLoggingIn ? "Signing In..." : "Continue with Google"}
                </button>
                {passcodeError && (
                  <p className="text-xs font-bold text-rose-300 text-center">{passcodeError}</p>
                )}
              </div>
            )}

            {/* STEP 2: Passcode Entry */}
            {gateState === "need_verify" && (
              <div className="space-y-4">
                {/* Logged-in user info */}
                {currentUser && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-emerald-300">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-[10px] font-bold text-slate-500 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <LogOut className="w-3 h-3" /> Switch
                    </button>
                  </div>
                )}

                <p className="text-sm font-bold text-slate-300 text-center">
                  Step 2 of 2 — Enter Teacher Access Code
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#7A5AF8]" /> Private Access Code
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? "text" : "password"}
                      placeholder="Enter code provided by Achivox Admin..."
                      value={passcode}
                      onChange={e => { setPasscode(e.target.value); setPasscodeError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleVerifyPasscode()}
                      className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7A5AF8] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(p => !p)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passcodeError && (
                    <p className="text-xs font-bold text-rose-300">{passcodeError}</p>
                  )}
                </div>

                <button
                  onClick={handleVerifyPasscode}
                  disabled={isVerifying}
                  className="w-full h-12 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 text-sm"
                >
                  {isVerifying
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    : <><ArrowRight className="w-4 h-4" /> Unlock Teacher Portal</>}
                </button>

                <p className="text-center text-[10px] text-slate-500 leading-relaxed">
                  Contact Achivox Admin to get your private Teacher Access Code.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-medium mt-4">
          ACHIVOX AI Teacher Portal · Secure Server Verification · 2026
        </p>
      </motion.div>
    </div>
  );
}
