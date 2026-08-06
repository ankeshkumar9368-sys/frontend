"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Crown,
  ChevronRight,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

interface StudentStat {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  totalTests: number;
  avgScore: number;
  bestScore: number;
  lastAttemptDate?: string;
  rank: number;
  trend: "up" | "down" | "same";
  topSubjects: string[];
  weakSubjects: string[];
  totalXP: number;
}

export default function TeacherStudentLeaderboard({ batchId }: { batchId?: string }) {
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentStat | null>(null);
  const [sortBy, setSortBy] = useState<"avgScore" | "bestScore" | "totalTests">("avgScore");

  useEffect(() => {
    fetchLeaderboard();
  }, [batchId, sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Get all users who are students (not teachers)
      let usersRef = collection(db, "users");
      let q = query(usersRef, where("role", "!=", "teacher"));
      const usersSnap = await getDocs(q);

      const stats: StudentStat[] = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // If batchId filter is provided, skip students not in that batch
        if (batchId) {
          const batches: string[] = userData.batches || [];
          if (!batches.includes(batchId)) continue;
        }

        // Get all test attempts for this student
        const attemptsRef = collection(db, "users", uid, "testAttempts");
        const attemptsSnap = await getDocs(query(attemptsRef, orderBy("timestamp", "desc"), limit(20)));

        const attempts = attemptsSnap.docs.map(d => d.data());

        if (attempts.length === 0) continue;

        const scores = attempts.map(a => {
          const total = (a.totalQuestions || a.total) ?? 10;
          const correct = (a.correctAnswers || a.correct) ?? 0;
          return Math.round((correct / total) * 100);
        });

        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const bestScore = Math.max(...scores);

        // Trend: compare last 3 vs previous 3
        const recent3 = scores.slice(0, 3);
        const prev3 = scores.slice(3, 6);
        let trend: "up" | "down" | "same" = "same";
        if (prev3.length > 0) {
          const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
          const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length;
          trend = recentAvg > prevAvg + 2 ? "up" : recentAvg < prevAvg - 2 ? "down" : "same";
        }

        // Topic mastery for strong/weak subjects
        const masteryRef = collection(db, "users", uid, "topicMastery");
        const masterySnap = await getDocs(masteryRef);
        const masterySorted = masterySnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .sort((a, b) => (b.masteryScore || 0) - (a.masteryScore || 0));

        const topSubjects = masterySorted
          .filter(m => (m.masteryScore || 0) >= 70)
          .slice(0, 3)
          .map(m => m.subject || m.id);

        const weakSubjects = masterySorted
          .filter(m => (m.masteryScore || 0) < 50)
          .slice(-3)
          .map(m => m.subject || m.id);

        const lastAttempt = attempts[0]?.timestamp?.toDate?.()?.toLocaleDateString?.() || "—";
        const totalXP = attempts.length * 10 + Math.round(avgScore * 0.5);

        stats.push({
          uid,
          name: userData.displayName || userData.name || "Student",
          email: userData.email || "",
          photoURL: userData.photoURL,
          totalTests: attempts.length,
          avgScore,
          bestScore,
          lastAttemptDate: lastAttempt,
          rank: 0,
          trend,
          topSubjects,
          weakSubjects,
          totalXP,
        });
      }

      // Sort + assign ranks
      stats.sort((a, b) => {
        if (sortBy === "avgScore") return b.avgScore - a.avgScore;
        if (sortBy === "bestScore") return b.bestScore - a.bestScore;
        return b.totalTests - a.totalTests;
      });
      stats.forEach((s, i) => (s.rank = i + 1));

      setStudents(stats);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const rankColors: Record<number, string> = {
    1: "from-[#FFD700] to-[#FFA500]",
    2: "from-[#C0C0C0] to-[#A0A0A0]",
    3: "from-[#CD7F32] to-[#A0522D]",
  };

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-[#FFD700]" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-[#C0C0C0]" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-[#CD7F32]" />;
    return <span className="text-xs font-black text-slate-400">#{rank}</span>;
  };

  const TrendIcon = ({ trend }: { trend: StudentStat["trend"] }) => {
    if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header + Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#FFD700]" />
          <h2 className="text-lg font-black text-white">Student Leaderboard</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#7A5AF8]/20 text-[#7A5AF8] font-bold border border-[#7A5AF8]/30">
            {students.length} Students
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(["avgScore", "bestScore", "totalTests"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${sortBy === s
                  ? "bg-[#7A5AF8] text-white border-[#7A5AF8]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-[#7A5AF8]/50"
                }`}
            >
              {s === "avgScore" ? "Avg Score" : s === "bestScore" ? "Best Score" : "Tests Done"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-[#7A5AF8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No student data found. Students need to attempt tests first.
        </div>
      ) : (
        <div className="grid gap-3">
          {/* Top 3 Podium (only if enough students) */}
          {students.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[students[1], students[0], students[2]].map((s, idx) => {
                const realRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const heights = ["h-24", "h-32", "h-20"];
                return (
                  <motion.div
                    key={s.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelected(s)}
                    className={`relative flex flex-col items-center justify-end rounded-2xl p-3 cursor-pointer border transition-all hover:scale-[1.02] ${realRank === 1
                        ? "bg-gradient-to-b from-[#FFD700]/20 to-[#0B1023] border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/10"
                        : realRank === 2
                          ? "bg-gradient-to-b from-[#C0C0C0]/15 to-[#0B1023] border-[#C0C0C0]/30"
                          : "bg-gradient-to-b from-[#CD7F32]/15 to-[#0B1023] border-[#CD7F32]/30"
                      } ${heights[idx]}`}
                  >
                    {realRank === 1 && (
                      <Crown className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 text-[#FFD700]" />
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CEB] to-[#38BDF8] flex items-center justify-center text-white font-black text-lg mb-1 shadow-lg">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-[10px] font-bold text-white text-center truncate w-full">{s.name.split(" ")[0]}</p>
                    <p className={`text-xs font-black bg-gradient-to-r ${rankColors[realRank]} bg-clip-text text-transparent`}>
                      {sortBy === "avgScore" ? `${s.avgScore}%` : sortBy === "bestScore" ? `${s.bestScore}%` : `${s.totalTests} tests`}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          {students.map((student, index) => (
            <motion.div
              key={student.uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelected(selected?.uid === student.uid ? null : student)}
              className={`bg-[#121735] border rounded-2xl p-4 cursor-pointer transition-all hover:border-[#7A5AF8]/50 hover:shadow-lg hover:shadow-[#7A5AF8]/10 ${selected?.uid === student.uid ? "border-[#7A5AF8] shadow-lg shadow-[#7A5AF8]/20" : "border-white/10"
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${student.rank <= 3 ? `bg-gradient-to-br ${rankColors[student.rank]} shadow-md` : "bg-white/5"}`}>
                  <RankIcon rank={student.rank} />
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5CEB] to-[#7A5AF8] flex items-center justify-center text-white font-black text-base shadow flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm truncate">{student.name}</p>
                    <TrendIcon trend={student.trend} />
                    {student.rank === 1 && <Star className="w-3.5 h-3.5 text-[#FFD700]" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{student.email}</p>
                </div>

                {/* Stats */}
                <div className="text-right space-y-0.5">
                  <p className="text-sm font-black text-white">
                    {sortBy === "avgScore" ? `${student.avgScore}%` : sortBy === "bestScore" ? `${student.bestScore}%` : `${student.totalTests}`}
                    <span className="text-[9px] text-slate-500 font-medium ml-1">
                      {sortBy === "avgScore" ? "avg" : sortBy === "bestScore" ? "best" : "tests"}
                    </span>
                  </p>
                  <p className="text-[10px] text-[#38BDF8] font-bold">{student.totalXP} XP</p>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selected?.uid === student.uid ? "rotate-90 text-[#7A5AF8]" : ""}`} />
              </div>

              {/* Expanded Detail */}
              {selected?.uid === student.uid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Strong Subjects
                    </p>
                    {student.topSubjects.length > 0 ? (
                      student.topSubjects.map((s, i) => (
                        <span key={i} className="inline-block mr-1.5 mb-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-lg border border-emerald-500/30">
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600">No data yet</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Needs Attention
                    </p>
                    {student.weakSubjects.length > 0 ? (
                      student.weakSubjects.map((s, i) => (
                        <span key={i} className="inline-block mr-1.5 mb-1 text-[10px] font-bold px-2 py-0.5 bg-rose-500/15 text-rose-300 rounded-lg border border-rose-500/30">
                          {s}
                        </span>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600">No weak areas!</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Tests</p>
                    <p className="text-sm font-black text-white">{student.totalTests}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Active</p>
                    <p className="text-sm font-black text-white">{student.lastAttemptDate || "Never"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Best Score</p>
                    <p className="text-sm font-black text-[#38BDF8]">{student.bestScore}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Score</p>
                    <p className="text-sm font-black text-[#7A5AF8]">{student.avgScore}%</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
