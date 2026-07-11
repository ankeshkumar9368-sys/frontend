"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, RefreshCw, X, Info } from "lucide-react";
import { getOverallStats } from "../lib/analytics";

interface HeatCell {
  topic: string;
  subject: string;
  score: number; // 0–100
  attempts: number;
}

function getColor(score: number): string {
  if (score === 0) return "bg-slate-200 dark:bg-slate-700";
  if (score < 30) return "bg-red-500";
  if (score < 50) return "bg-orange-400";
  if (score < 70) return "bg-amber-400";
  if (score < 85) return "bg-lime-400";
  return "bg-emerald-500";
}

function getLabel(score: number): string {
  if (score === 0) return "Not Attempted";
  if (score < 30) return "Needs Focus 🎯";
  if (score < 50) return "Needs Work";
  if (score < 70) return "Improving";
  if (score < 85) return "Good";
  return "Mastered ✅";
}

export default function WeaknessHeatmap({ 
  onBoostTopic,
  isSubscribed = false,
  refreshTrigger = 0
}: { 
  onBoostTopic?: (topic: string, subject?: string) => void,
  isSubscribed?: boolean,
  refreshTrigger?: number
}) {
  const [cells, setCells] = useState<HeatCell[]>([]);
  const [selected, setSelected] = useState<HeatCell | null>(null);
  const [filter, setFilter] = useState<"all" | "weak" | "strong">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");

  useEffect(() => {
    try {
      const stats = getOverallStats();
      const results = stats.recentActivity;
      if (!results || results.length === 0) return;
      
      const map: Record<string, { total: number; count: number; subject: string; attempts: number }> = {};
      results.forEach((r: any) => {
        const key = r.topic || "Unknown";
        if (!map[key]) map[key] = { total: 0, count: 0, subject: r.subject || "General", attempts: 0 };
        map[key].total += r.score || 0;
        map[key].count++;
        map[key].attempts++;
      });
      const arr: HeatCell[] = Object.entries(map).map(([topic, v]) => ({
        topic,
        subject: v.subject,
        score: Math.round(v.total / v.count),
        attempts: v.attempts,
      }));
      setCells(arr.sort((a, b) => a.score - b.score));
    } catch (_) {}
  }, [refreshTrigger]);

  const subjects = ["All", ...Array.from(new Set(cells.map(c => c.subject)))];

  const filtered = cells.filter(c => {
    const matchesFilter = filter === "weak" ? c.score < 60 : filter === "strong" ? c.score >= 70 : true;
    const matchesSubject = selectedSubject === "All" || c.subject === selectedSubject;
    return matchesFilter && matchesSubject;
  });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm text-foreground tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-500" />
            Weakness Heatmap
          </h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Topic performance at a glance</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5">
          {["bg-red-500", "bg-amber-400", "bg-lime-400", "bg-emerald-500"].map((c, i) => (
            <div key={i} className={`w-6 h-6 rounded-sm ${c}`} />
          ))}
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                selectedSubject === s
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(["all", "weak", "strong"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === f
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent"
              }`}
            >
              {f === "all" ? "All" : f === "weak" ? "⚠️ Weak" : "✅ Strong"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Target className="w-6 h-6 text-slate-300" />
            <p className="text-sm font-black text-slate-500">
              {cells.length === 0 ? "Take quizzes to generate your heatmap!" : "No topics match this filter"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((cell, i) => (
              <motion.button
                key={cell.topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(cell)}
                className={`aspect-square rounded-2xl ${getColor(cell.score)} flex items-center justify-center text-white text-[8px] font-black leading-tight text-center p-1 hover:scale-110 transition-transform shadow-sm`}
              >
                <span className="truncate">{cell.topic.split(" ").slice(0, 2).join(" ")}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Legend row */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[9px] text-red-500 font-bold">Needs Focus</span>
            <div className="flex gap-1 flex-1 mx-2">
              {["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-lime-400", "bg-emerald-500"].map((c, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${c}`} />
              ))}
            </div>
            <span className="text-[9px] text-emerald-500 font-bold">Mastered</span>
          </div>
        )}
      </div>

      {/* Detail popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-950/60 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full max-w-sm rounded-2xl p-5 border border-border shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-black text-lg text-foreground">{selected.topic}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{selected.subject} · {selected.attempts} attempts</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className={`w-full py-4 rounded-2xl ${getColor(selected.score)} flex flex-col items-center justify-center mb-4`}>
                <span className="text-4xl font-black text-white">{selected.score}%</span>
                <span className="text-white/80 text-xs font-bold">{getLabel(selected.score)}</span>
              </div>
              {onBoostTopic && selected.score < 70 && (
                <button
                  onClick={() => { onBoostTopic(selected.topic, selected.subject); setSelected(null); }}
                  className="w-full bg-primary text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm"
                >
                  🚀 Boost This Topic
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
