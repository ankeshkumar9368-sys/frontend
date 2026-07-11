"use client";

import { motion } from "framer-motion";
import { Download, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function ForceUpdateModal({ downloadUrl }: { downloadUrl: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
        
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
          Update Required
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-8 leading-relaxed">
          You are using an older version of ExamHero. To access the latest features, bug fixes, and new study tools, please update the app now.
        </p>

        <a 
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
        >
          <Download className="w-6 h-6" />
          Download Latest Update
        </a>
      </motion.div>
    </div>
  );
}
