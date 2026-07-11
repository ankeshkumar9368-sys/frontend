"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col items-center pt-24 space-y-8">
      
      {/* Top Header Skeleton */}
      <div className="w-full max-w-4xl flex justify-between items-center px-4">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>

      {/* Main Stats / Overview Skeleton */}
      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-2 mt-auto">
              <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Body Skeleton */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 px-4">
        {/* Left Column (Larger) */}
        <div className="flex-1 space-y-6">
          <div className="h-64 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
             <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
             <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ml-2" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="w-1/3 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="w-full md:w-80 space-y-6">
          <div className="h-80 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-[32px] border border-indigo-100 dark:border-indigo-800/50 p-6 flex flex-col items-center justify-center space-y-4">
             <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
             <div className="w-32 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
             <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
      
    </div>
  );
}
