"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Mail, KeyRound, Eye, EyeOff,
  ArrowRight, Loader2, Lock, AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter your Teacher Email and Password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/teacher-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid credentials. Please try again.");
        return;
      }

      // Cookie is now set server-side (httpOnly) — redirect to teacher dashboard
      router.push("/teacher");
      router.refresh(); // Force middleware re-check
    } catch (err: any) {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1023] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#5B5CEB]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-[#38BDF8]/15 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-[#121735] border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
          {/* Accent top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8]" />

          <div className="p-8 space-y-6">
            {/* Logo */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[2px] shadow-xl">
                <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-[#38BDF8]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Teacher Portal</h1>
                <p className="text-[11px] text-[#38BDF8] font-bold uppercase tracking-widest mt-1">
                  Achivox AI · Private Coaching Access
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30">
              <Lock className="w-4 h-4 text-indigo-300 shrink-0" />
              <p className="text-xs font-semibold text-indigo-200 leading-snug">
                Enter your Teacher Email and the Password given to you by Achivox Admin.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#38BDF8]" /> Teacher Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(""); }}
                  className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8] transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#7A5AF8]" /> Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Password given by Admin..."
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrorMsg(""); }}
                    className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8] pr-11 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-semibold leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#7A5AF8]/25 border border-white/20 disabled:opacity-60 hover:opacity-90 transition-all active:scale-[0.98] text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                ) : (
                  <><ArrowRight className="w-5 h-5" /> Unlock Teacher Dashboard</>
                )}
              </button>
            </form>

            <div className="text-center pt-1">
              <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors">
                ← Return to Achivox Home
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-medium mt-4">
          ACHIVOX AI · Server-Secured Teacher Access · 2026
        </p>
      </div>
    </div>
  );
}
