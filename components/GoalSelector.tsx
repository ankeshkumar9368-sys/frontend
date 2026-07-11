"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, X, Target, UploadCloud, Loader2 } from "lucide-react";
import { INDIAN_BOARDS, CLASSES } from "../lib/curriculum";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function GoalSelector({ 
  userId,
  goalChangesCount = 0,
  initialBoard, 
  initialClass, 
  onSave, 
  onClose,
  onRequestPending,
  isForced = false
}: { 
  userId?: string;
  goalChangesCount?: number;
  initialBoard?: string;
  initialClass?: string;
  onSave: (board: string, cls: string) => void;
  onClose: () => void;
  onRequestPending?: () => void;
  isForced?: boolean;
}) {
  const [board, setBoard] = useState(initialBoard || INDIAN_BOARDS[0]);
  const [cls, setCls] = useState(initialClass || CLASSES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const needsDocument = goalChangesCount >= 1;

  const handleAction = async () => {
    if (!needsDocument) {
      onSave(board, cls);
      return;
    }

    if (!file) {
      alert("Please upload a valid ID card or School Document to change your goal.");
      return;
    }

    if (!userId) return;

    setUploading(true);
    try {
      const fileRef = ref(storage, `goal_docs/${userId}_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      await addDoc(collection(db, "goal_change_requests"), {
        userId,
        requestedBoard: board,
        requestedClass: cls,
        documentUrl: url,
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      if (onRequestPending) onRequestPending();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative"
      >
        {!isForced && (
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="mb-6">
          <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Set Your Goal</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Select your board and class to personalize your experience.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Board</label>
            <select 
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              {INDIAN_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Class</label>
            <select 
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            >
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          {needsDocument && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-2xl">
              <p className="text-xs font-bold text-orange-800 dark:text-orange-400 mb-3">
                ⚠️ Goal Change Limit Reached. Please upload a valid ID Card or School Document for verification.
              </p>
              <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-orange-300 dark:border-orange-800 rounded-xl cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-orange-500 mb-1" />
                  <span className="text-xs font-medium text-orange-600">{file ? file.name : "Select Document"}</span>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>

        <button 
          onClick={handleAction}
          disabled={uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-black py-4 rounded-xl mt-6 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (needsDocument ? "Submit for Approval" : "Save Goal")}
        </button>
      </motion.div>
    </div>
  );
}
