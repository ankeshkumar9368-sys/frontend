"use client";

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { Users, Check, X, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface JoinBatchModalProps {
  onClose: () => void;
  onSuccess: (batchName: string) => void;
}

export default function JoinBatchModal({ onClose, onSuccess }: JoinBatchModalProps) {
  const [batchCode, setBatchCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoinBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = batchCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("Please enter 6-digit Batch Code.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setErrorMsg("Please log in to join a coaching batch.");
      return;
    }

    setIsJoining(true);
    setErrorMsg("");

    try {
      const batchesRef = collection(db, "batches");
      const q = query(batchesRef, where("batchCode", "==", cleanCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg("Invalid Batch Code. Please check code given by your teacher.");
        setIsJoining(false);
        return;
      }

      const batchDoc = snap.docs[0];
      const batchData = batchDoc.data();

      // Add student UID to batch
      await updateDoc(doc(db, "batches", batchDoc.id), {
        studentIds: arrayUnion(user.uid)
      });

      // Also tag student's profile with batch
      await updateDoc(doc(db, "users", user.uid), {
        enrolledBatches: arrayUnion(batchDoc.id)
      });

      onSuccess(batchData.batchName || "Coaching Batch");
    } catch (err: any) {
      console.error("Error joining batch:", err);
      setErrorMsg(err.message || "Failed to join batch.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#121735] border border-white/20 w-full max-w-sm rounded-3xl p-6 relative text-white space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="text-base font-black text-white">Join Coaching Batch</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <p className="text-xs text-slate-300 font-medium leading-relaxed">
          Enter the 6-digit Batch Code provided by your offline coaching teacher to access assigned tests and topic reports.
        </p>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-bold text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleJoinBatch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">6-Digit Join Code</label>
            <input
              type="text"
              maxLength={8}
              placeholder="e.g. ACH942"
              value={batchCode}
              onChange={e => setBatchCode(e.target.value.toUpperCase())}
              className="w-full bg-[#0B1023] border border-white/15 rounded-2xl px-4 py-3 text-center text-lg font-black tracking-widest text-amber-300 uppercase placeholder-slate-600 focus:outline-none focus:border-[#7A5AF8]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Join Batch Now
          </button>
        </form>
      </motion.div>
    </div>
  );
}
