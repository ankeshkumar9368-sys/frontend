"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart2, Calendar, X, Filter } from "lucide-react";
import { getOverallStats } from "../lib/analytics";

interface DataPoint {
  date: string;
  score: number;
  topic: string;
  subject: string;
}

function MiniLineChart({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 280;
  const H = 80;
  const pad = 8;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / range) * (H - pad * 2),
  ]);
  const pathD = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />
      ))}
    </svg>
  );
}

function BarGraph({ data, color = "#6366f1" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 100);
  return (
    <div className="flex items-end gap-2 h-24 px-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{ background: color, opacity: 0.85 }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 80}px` }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
          />
          <span className="text-[8px] text-slate-400 font-bold truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PerformanceGraph({ 
  onClose,
  isSubscribed = false,
  refreshTrigger = 0
}: { 
  onClose?: () => void,
  isSubscribed?: boolean,
  refreshTrigger?: number
}) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [view, setView] = useState<"trend" | "subject" | "daily">("trend");
  const [filterSubject, setFilterSubject] = useState<string>("All");

  useEffect(() => {
    try {
      const stats = getOverallStats();
      const attempts: DataPoint[] = stats.recentActivity.map((a: any) => ({
        date: a.attemptedAt.toString(),
        score: a.score,
        topic: a.topic,
        subject: a.subject
      }));
      setData(attempts);
    } catch (_) {}
  }, [refreshTrigger]);

  const subjects = ["All", ...Array.from(new Set(data.map(d => d.subject)))];
  const filtered = filterSubject === "All" ? data : data.filter(d => d.subject === filterSubject);

  // Trend: last 10 quiz scores
  const trendData = filtered.slice(-10).map(d => d.score);

  // Subject averages
  const subjectMap: Record<string, number[]> = {};
  data.forEach(d => {
    if (!subjectMap[d.subject]) subjectMap[d.subject] = [];
    subjectMap[d.subject].push(d.score);
  });
  const subjectBars = Object.entries(subjectMap).map(([label, scores]) => ({
    label: label.slice(0, 5),
    value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // Daily: last 7 days
  const now = new Date();
  const dailyBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" });
    const dayResults = data.filter(r => new Date(parseInt(r.date) || 0).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" }) === dateStr);
    const avg = dayResults.length > 0 ? Math.round(dayResults.reduce((a, b) => a + b.score, 0) / dayResults.length) : 0;
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2), value: avg };
  });

  const overallAvg = data.length > 0 ? Math.round(data.reduce((a, b) => a + b.score, 0) / data.length) : 0;
  const trend = trendData.length >= 2 ? trendData[trendData.length - 1] - trendData[0] : 0;

  return (
    <div className="bg-card rounded-[28px] border border-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-gradient-to-r from-indigo-500/5 via-primary/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-black text-foreground tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Performance Graph
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your score trends over time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-black ${trend >= 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30" : "bg-red-100 text-red-600 dark:bg-red-950/30"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}%
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
        {[
          { label: "Avg Score", value: `${overallAvg}%`, color: "text-primary" },
          { label: "Total Tests", value: data.length, color: "text-indigo-500" },
          { label: "Best Score", value: `${data.length > 0 ? Math.max(...data.map(d => d.score)) : 0}%`, color: "text-emerald-500" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 text-center border border-border">
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["trend", "subject", "daily"] as const).map(t => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={`flex-1 py-2.5 text-[11px] font-black capitalize tracking-tight transition-all ${view === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-400"}`}
          >
            {t === "trend" ? "📈 Trend" : t === "subject" ? "📚 Subjects" : "📅 Daily"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <BarChart2 className="w-6 h-6 text-slate-300" />
            <p className="text-sm font-black text-slate-500">Complete quizzes to see your performance graph!</p>
          </div>
        ) : (
          <>
            {view === "trend" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {subjects.length > 2 && (
                  <div className="flex gap-2 flex-wrap">
                    {subjects.map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterSubject(s)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${filterSubject === s ? "bg-primary text-white border-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-border">
                  {trendData.length >= 2 ? (
                    <MiniLineChart data={trendData} color="#6366f1" />
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-6">Take more quizzes to see trend</p>
                  )}
                </div>
                <div className="space-y-2">
                  {filtered.slice(-5).reverse().map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2.5 border border-border">
                      <div>
                        <p className="text-xs font-black text-foreground truncate max-w-[160px]">{d.topic}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{d.subject}</p>
                      </div>
                      <span className={`text-sm font-black ${d.score >= 75 ? "text-emerald-500" : d.score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                        {d.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === "subject" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-border">
                  <BarGraph data={subjectBars} color="#6366f1" />
                </div>
                <div className="mt-3 space-y-2">
                  {Object.entries(subjectMap).map(([sub, scores], i) => {
                    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                    return (
                      <div key={sub} className="flex items-center gap-3">
                        <div className="w-20 shrink-0">
                          <p className="text-xs font-black text-foreground truncate">{sub}</p>
                          <p className="text-[9px] text-slate-400">{scores.length} tests</p>
                        </div>
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${avg}%` }}
                            transition={{ duration: 0.8, delay: i * 0.07 }}
                          />
                        </div>
                        <span className="text-xs font-black text-foreground w-10 text-right">{avg}%</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {view === "daily" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-border">
                  <BarGraph data={dailyBars} color="#6366f1" />
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2 font-semibold">Average score per day (last 7 days)</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
