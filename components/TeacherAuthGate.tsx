"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import {
  GraduationCap, ShieldAlert, Lock, Mail, Eye, EyeOff,
  CheckCircle2, Loader2, ArrowRight, LogOut, KeyRound, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface TeacherAuthGateProps {
  children: React.ReactNode;
}

interface TeacherSession {
  uid: string;
  email: string;
  name: string;
  timestamp: number;
}

const STORAGE_KEY = "achivox_teacher_active_session";

export default function TeacherAuthGate({ children }: TeacherAuthGateProps) {
  const [gateState, setGateState] = useState<"checking" | "login_required" | "granted">("checking");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentTeacher, setCurrentTeacher] = useState<TeacherSession | null>(null);

  // 1. On Mount: Check if there's an existing valid session stored in localStorage
  useEffect(() => {
    const verifyExistingSession = async () => {
      try {
        const savedSessionStr = localStorage.getItem(STORAGE_KEY);
        if (!savedSessionStr) {
          setGateState("login_required");
          return;
        }

        const sessionData: TeacherSession = JSON.parse(savedSessionStr);
        if (!sessionData || !sessionData.uid) {
          setGateState("login_required");
          return;
        }

        // Re-verify against Firestore to ensure Admin hasn't revoked the role
        const snap = await getDoc(doc(db, "users", sessionData.uid));
        if (snap.exists() && snap.data()?.adminAssignedTeacher === true) {
          setCurrentTeacher(sessionData);
          setGateState("granted");
          return;
        }

        // Revoked or invalid doc -> Clear session
        localStorage.removeItem(STORAGE_KEY);
        setGateState("login_required");
      } catch (err) {
        console.error("Session verification error:", err);
        localStorage.removeItem(STORAGE_KEY);
        setGateState("login_required");
      }
    };

    verifyExistingSession();
  }, []);

  // 2. Submit Handler: Validate Email & Admin-Assigned Password
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg("Please enter both your Teacher Email and Password.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");

    try {
      // Query Firestore users collection for matching email
      const usersRef = collection(db, "users");
      const qEmail = query(usersRef, where("email", "==", cleanEmail));
      let querySnap = await getDocs(qEmail);

      // Fallback: check case-insensitive or trimmed email
      if (querySnap.empty) {
        const allUsersSnap = await getDocs(usersRef);
        const matchDoc = allUsersSnap.docs.find(d => {
          const data = d.data();
          return (data.email || "").trim().toLowerCase() === cleanEmail;
        });

        if (matchDoc) {
          querySnap = { docs: [matchDoc], empty: false } as any;
        }
      }

      if (querySnap.empty) {
        setErrorMsg("❌ No Teacher account found with this email. Please contact Achivox Admin.");
        setIsVerifying(false);
        return;
      }

      const userDoc = querySnap.docs[0];
      const userData = userDoc.data();

      // Check 1: Must have adminAssignedTeacher === true
      if (userData.adminAssignedTeacher !== true) {
        setErrorMsg("🚫 Access Denied: Teacher role has not been granted to this account by Achivox Admin.");
        setIsVerifying(false);
        return;
      }

      // Check 2: Password match check
      if (!userData.teacherPassword || userData.teacherPassword.trim() !== cleanPass) {
        setErrorMsg("❌ Incorrect Teacher Password. Please use the password provided by Admin.");
        setIsVerifying(false);
        return;
      }

      // Successful Auth -> Save Session
      const newSession: TeacherSession = {
        uid: userDoc.id,
        email: userData.email || cleanEmail,
        name: userData.name || userData.displayName || cleanEmail.split("@")[0] || "Teacher",
        timestamp: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setCurrentTeacher(newSession);
      setGateState("granted");

    } catch (err: any) {
      console.error("Login verification error:", err);
      setErrorMsg(err.message || "Failed to verify credentials. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentTeacher(null);
    setEmailInput("");
    setPasswordInput("");
    setErrorMsg("");
    setGateState("login_required");
  };

  // ── 1. CHECKING SESSION ──────────────────────────────────────────────────
  if (gateState === "checking") {
    return (
      <div className="min-h-screen bg-[#0B1023] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Verifying Teacher Authorization...
          </p>
        </div>
      </div>
    );
  }

  // ── 2. ACCESS GRANTED ────────────────────────────────────────────────────
  if (gateState === "granted") {
    return (
      <div>
        {/* Floating Session Bar */}
        <div className="bg-[#121735] border-b border-white/10 px-4 py-2 text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Logged in as: <strong className="text-white">{currentTeacher?.name}</strong> ({currentTeacher?.email})</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition-colors border border-rose-500/20"
          >
            <LogOut className="w-3 h-3" /> Logout Teacher
          </button>
        </div>
        {children}
      </div>
    );
  }

  // ── 3. TEACHER EMAIL & PASSWORD LOGIN FORM ───────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1023] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#5B5CEB]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-[#38BDF8]/15 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#121735] border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]" />

          <div className="p-8 space-y-6">
            
            {/* Logo + Header Title */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[2px] shadow-xl">
                <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-[#38BDF8]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Teacher Portal Login</h1>
                <p className="text-xs text-[#38BDF8] font-bold uppercase tracking-widest mt-1">
                  Achivox AI · Private Coaching Access
                </p>
              </div>
            </div>

            {/* Security Warning Box */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30">
              <Lock className="w-5 h-5 text-indigo-300 shrink-0" />
              <p className="text-xs font-bold text-indigo-200 leading-snug">
                Enter the Email and Private Teacher Password given to you by Achivox Admin to unlock your dashboard.
              </p>
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#38BDF8]" /> Teacher Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. teacher@coaching.com"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setErrorMsg(""); }}
                  className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8] transition-colors"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#7A5AF8]" /> Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password given by Admin..."
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setErrorMsg(""); }}
                    className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8] pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-bold leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-13 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] hover:opacity-95 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#7A5AF8]/30 border border-white/20 disabled:opacity-60 transition-transform active:scale-[0.98] text-sm py-3.5"
              >
                {isVerifying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Credentials...</>
                ) : (
                  <><ArrowRight className="w-5 h-5" /> Unlock Teacher Dashboard</>
                )}
              </button>
            </form>

            {/* Back Link */}
            <div className="text-center pt-2">
              <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
                ← Return to Achivox Home
              </Link>
            </div>

          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 font-medium mt-4">
          ACHIVOX AI · Admin-Assigned Credentials Security · 2026
        </p>
      </motion.div>
    </div>
  );
}
