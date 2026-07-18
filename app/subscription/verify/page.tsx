"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import axios from "axios";
import confetti from "canvas-confetti";

export default function VerifyPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const verifiedRef = useRef(false);

  const verifyPayment = async () => {
    if (!orderId) {
      setErrorMsg("Invalid session: missing order ID");
      setVerifying(false);
      return;
    }

    setVerifying(true);
    setErrorMsg("");

    try {
      const response = await axios.post("/api/payment/verify", { orderId });
      
      if (response.data && response.data.success) {
        setSuccess(true);
        // Play premium upgrade celebration confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        setErrorMsg(response.data.message || "Payment verification failed. If money was debited, contact support.");
      }
    } catch (error: any) {
      console.error("Verification callback error:", error);
      setErrorMsg(error.response?.data?.error || "Error checking transaction status.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    // Prevent double invocation in React StrictMode
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    verifyPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),rgba(0,0,0,0))] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 text-center">
        <div className="glass-card bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[36px] p-8 shadow-2xl relative overflow-hidden">
          {/* Top subtle highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {verifying && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
              <h2 className="text-xl font-black text-slate-100">Verifying Payment...</h2>
              <p className="text-xs text-slate-400 max-w-xs">
                Securing transactional clearance with Cashfree. Please do not close or refresh this window.
              </p>
            </div>
          )}

          {!verifying && success && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-100">Upgrade Activated!</h2>
              <p className="text-xs text-slate-400 max-w-xs">
                Welcome to ExamHero Premium. Your account features have been successfully unlocked.
              </p>
              
              <button
                onClick={() => router.push("/")}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-2xl shadow-xl shadow-indigo-600/10 transition-all hover:scale-[1.01]"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!verifying && !success && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10 border border-rose-500/20">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-100">Verification Failed</h2>
              <p className="text-xs text-rose-400/90 max-w-xs font-bold mt-1">
                {errorMsg}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Order Reference: <code className="bg-slate-950 px-2 py-0.5 rounded text-slate-300">{orderId || "N/A"}</code>
              </p>

              <div className="w-full flex gap-3 mt-6">
                <button
                  onClick={verifyPayment}
                  className="flex-1 flex items-center justify-center gap-2 border border-white/5 hover:bg-white/5 text-slate-300 font-black text-xs uppercase tracking-widest py-3 px-4 rounded-2xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
                <button
                  onClick={() => router.push("/subscription")}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-2xl transition-all hover:scale-[1.01]"
                >
                  Back
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
