"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Flame, Clock, BookOpen,
  Target, Brain, AlertTriangle, CheckCircle, BarChart2, Star,
  Zap, ChevronRight, RefreshCw, Award, Activity
} from "lucide-react";
import {
  getOverallStats, getSubjectProgress, getWeakAreas,
  SubjectProgress, WeakArea
} from "../lib/analytics";

// ─── Animated Counter ─────────────────────────────────────────
function AnimatedCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 30);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

// ─── Radial Progress Ring ─────────────────────────────────────
function ProgressRing({ pct, size = 80, stroke = 7, color = "#6366f1" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Mini Bar ─────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#6366f1", Chemistry: "#f59e0b", Mathematics: "#10b981",
  Biology: "#ef4444", English: "#3b82f6", "Computer Science": "#8b5cf6",
  Economics: "#f97316", History: "#84cc16", Geography: "#06b6d4",
  Science: "#14b8a6", "Social Science": "#ec4899",
};
const getColor = (sub: string) => SUBJECT_COLORS[sub] || "#6366f1";

// ─── Trend Badge ──────────────────────────────────────────────
function TrendBadge({ trend }: { trend: string }) {
  if (trend === "improving") return (
    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" /> Improving
    </span>
  );
  if (trend === "declining") return (
    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-[10px] font-black bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" /> Needs Work
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-slate-500 text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

export default function ProgressDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [tab, setTab] = useState<"overview" | "subjects" | "weak">("overview");
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refresh = useCallback(() => {
    setStats(getOverallStats());
    setSubjects(getSubjectProgress());
    setWeakAreas(getWeakAreas());
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    // Auto refresh every 30s for real-time feel
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!stats) return null;

  const isEmpty = stats.totalTopics === 0 && stats.totalTests === 0;

  return (
    <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 via-violet-500/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-black text-foreground tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            My Progress
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Real-time performance analysis</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
        {(["overview", "subjects", "weak"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-black capitalize tracking-tight transition-all ${tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-400 hover:text-foreground"}`}
          >
            {t === "weak" ? "⚠️ Weak Areas" : t === "overview" ? "📊 Overview" : "📚 Subjects"}
          </button>
        ))}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW TAB ─────────────────── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-6 h-6 bg-primary/10 rounded-3xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-black text-slate-700 dark:text-slate-200">Start Studying to See Analytics!</p>
                  <p className="text-xs text-slate-400">Open any topic or take a quiz to track your progress</p>
                </div>
              ) : (
                <>
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Accuracy", value: stats.accuracy, suffix: "%", icon: Target, color: "#6366f1", ring: true },
                      { label: "🔥 Streak", value: stats.streak, suffix: " days", icon: Flame, color: "#f59e0b", ring: false },
                      { label: "Today's Study", value: stats.todayStudyMin, suffix: " min", icon: Clock, color: "#ef4444", ring: false },
                      { label: "Lifetime Study", value: stats.totalStudyMin, suffix: " min", icon: Award, color: "#10b981", ring: false },
                      { label: "Topics Done", value: stats.totalTopics, suffix: "", icon: BookOpen, color: "#3b82f6", ring: false },
                    ].map((kpi, i) => (
                      <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-border flex items-center gap-3"
                      >
                        {kpi.ring ? (
                          <div className="relative flex items-center justify-center">
                            <ProgressRing pct={kpi.value} size={56} stroke={5} color={kpi.color} />
                            <span className="absolute text-[11px] font-black" style={{ color: kpi.color }}>
                              {kpi.value}%
                            </span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0" style={{ background: kpi.color + "20" }}>
                            <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                          <p className="text-lg font-black text-foreground leading-tight">
                            <AnimatedCount value={kpi.value} suffix={kpi.suffix} />
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  {stats.recentActivity?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Tests</p>
                      <div className="space-y-2">
                        {stats.recentActivity.map((a: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-border"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`min-w-[48px] h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 ${a.score >= 75 ? 'bg-emerald-500' : a.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                                {a.score}%
                              </div>
                              <div>
                                <p className="text-xs font-black text-foreground leading-tight truncate max-w-[130px]">{a.topic}</p>
                                <p className="text-[9px] text-slate-400 font-semibold">{a.subject} · {a.date}</p>
                              </div>
                            </div>
                            {a.score >= 75 ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Topics */}
                  {stats.topTopics?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Most Studied</p>
                      <div className="space-y-2">
                        {stats.topTopics.map((t: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 w-4">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-black text-foreground truncate">{t.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-2">{t.timeMin}m</span>
                              </div>
                              <MiniBar pct={Math.min((t.timeMin / 60) * 100, 100)} color={getColor(t.subject)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── SUBJECTS TAB ────────────────── */}
          {tab === "subjects" && (
            <motion.div key="subjects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <BarChart2 className="w-6 h-6 text-slate-300" />
                  <p className="text-sm font-black text-slate-500">No subject data yet</p>
                  <p className="text-xs text-slate-400">Study topics to see subject-wise breakdown</p>
                </div>
              ) : subjects.map((s, i) => (
                <motion.div
                  key={`${s.subject}_${s.cls}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ background: getColor(s.subject) }}>
                        {s.subject.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{s.subject}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{s.cls}</p>
                      </div>
                    </div>
                    <TrendBadge trend={s.trend} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    {[
                      { label: "Topics", value: s.topicsStudied },
                      { label: "Avg Score", value: `${s.avgScore}%` },
                      { label: "Time", value: `${s.timeSpentMin}m` },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-2 border border-border">
                        <p className="text-sm font-black text-foreground">{stat.value}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <MiniBar pct={s.avgScore} color={getColor(s.subject)} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── WEAK AREAS TAB ──────────────── */}
          {tab === "weak" && (
            <motion.div key="weak" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {weakAreas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-950/30 rounded-3xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-emerald-500" />
                  </div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">No Weak Areas Detected! 🎉</p>
                  <p className="text-xs text-slate-400">Take quizzes to find topics that need more practice</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3">
                    <Zap className="w-6 h-6 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {weakAreas.length} topic{weakAreas.length > 1 ? "s" : ""} need attention. Focus on these first!
                    </p>
                  </div>
                  {weakAreas.map((w, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-black text-foreground truncate">{w.topic}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{w.subject} · {w.chapter}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-xl text-xs font-black text-white shrink-0 ${w.avgScore < 30 ? 'bg-red-500' : w.avgScore < 50 ? 'bg-orange-500' : 'bg-amber-500'}`}>
                          {w.avgScore}%
                        </div>
                      </div>
                      <MiniBar pct={w.avgScore} color={w.avgScore < 30 ? "#ef4444" : w.avgScore < 50 ? "#f97316" : "#f59e0b"} />
                      <div className="flex items-center gap-2 mt-2.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-slate-500">{w.suggestedAction} · {w.attempts} attempt{w.attempts > 1 ? "s" : ""}</p>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-[9px] text-slate-400 font-semibold text-center">
          Last updated {new Date(lastRefresh).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Auto-refreshes every 30s
        </p>
      </div>
    </div>
  );
}
