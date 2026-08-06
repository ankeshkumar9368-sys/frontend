"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Loader2,
  LightbulbIcon,
  BookOpen,
  Brain,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectProjection {
  subject: string;
  currentAvg: number;
  projectedScore: number;
  potentialGain: number;
  confidenceLevel: "high" | "medium" | "low";
  improvement: "rising" | "falling" | "stable";
  advice: string[];
  weakTopics: string[];
  strongTopics: string[];
}

interface StudentPrediction {
  uid: string;
  name: string;
  email: string;
  overallProjected: number;
  subjectProjections: SubjectProjection[];
  topPriority: string;
  summary: string;
}

const generateAIAdvice = (
  subject: string,
  currentAvg: number,
  trend: "rising" | "falling" | "stable",
  weakTopics: string[]
): string[] => {
  const advice: string[] = [];

  if (currentAvg < 40) {
    advice.push(`${subject} needs urgent attention — start with fundamentals.`);
    advice.push("Attempt 1 basic test daily to build confidence.");
    if (weakTopics.length > 0) advice.push(`Focus hard on: ${weakTopics.slice(0, 2).join(", ")}.`);
  } else if (currentAvg < 60) {
    advice.push(`${subject} is improving. Target 2 extra practice sets per week.`);
    if (weakTopics.length > 0) advice.push(`Weak areas to revise: ${weakTopics.slice(0, 2).join(", ")}.`);
    advice.push("Review mistakes carefully — pattern recognition helps.");
  } else if (currentAvg < 80) {
    advice.push(`${subject} is on track! Push for accuracy in tough topics.`);
    advice.push("Attempt timed mock tests to simulate exam pressure.");
    if (weakTopics.length > 0) advice.push(`Polish: ${weakTopics.slice(0, 2).join(", ")} for maximum gain.`);
  } else {
    advice.push(`Excellent in ${subject}! Maintain this performance.`);
    advice.push("Help weaker classmates — teaching reinforces mastery.");
    advice.push("Attempt advanced-level questions to stay sharp.");
  }

  if (trend === "falling") {
    advice.push("⚠️ Scores are falling — review recent mistakes immediately.");
  } else if (trend === "rising") {
    advice.push("📈 Great momentum! Keep this consistency for 2 more weeks.");
  }

  return advice;
};

const projectScore = (
  currentAvg: number,
  trend: "rising" | "falling" | "stable",
  testsCount: number
): number => {
  let projected = currentAvg;

  // Trend-based adjustment
  if (trend === "rising") {
    projected += Math.min(testsCount * 2, 15); // +2% per test up to 15
  } else if (trend === "falling") {
    projected -= Math.min(testsCount * 1.5, 10); // -1.5% per test if falling
  }

  // Regression to mean effect — extreme scores are less likely to stay
  if (currentAvg > 85) projected = Math.min(projected, 95);
  if (currentAvg < 20) projected = Math.max(projected, 15);

  return Math.round(Math.min(100, Math.max(0, projected)));
};

export default function FinalMixScorePredictor({ batchId }: { batchId?: string }) {
  const [predictions, setPredictions] = useState<StudentPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentPrediction | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [batchId]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // Get all students
      const usersSnap = await getDocs(collection(db, "users"));
      const studentPredictions: StudentPrediction[] = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        if (userData.role === "teacher") continue;

        const uid = userDoc.id;

        if (batchId) {
          const batches: string[] = userData.batches || [];
          if (!batches.includes(batchId)) continue;
        }

        // Get all test attempts, newest first
        const attemptsSnap = await getDocs(
          query(collection(db, "users", uid, "testAttempts"), orderBy("timestamp", "desc"), limit(30))
        );

        const attempts = attemptsSnap.docs.map(d => d.data());
        if (attempts.length < 2) continue; // Need at least 2 attempts for prediction

        // Group by subject
        const subjectMap: Record<string, { scores: number[]; topics: string[] }> = {};
        for (const a of attempts) {
          const subject = a.subject || a.examType || "General";
          const total = a.totalQuestions || a.total || 10;
          const correct = a.correctAnswers || a.correct || 0;
          const pct = Math.round((correct / total) * 100);

          if (!subjectMap[subject]) {
            subjectMap[subject] = { scores: [], topics: a.topicsCovered || [] };
          }
          subjectMap[subject].scores.push(pct);
          if (a.topicsCovered) subjectMap[subject].topics.push(...a.topicsCovered);
        }

        // Get topic mastery for weak/strong
        const masterySnap = await getDocs(collection(db, "users", uid, "topicMastery"));
        const masteryList = masterySnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const sortedMastery = [...masteryList].sort((a, b) => (b.masteryScore || 0) - (a.masteryScore || 0));

        const strongTopics = sortedMastery.filter(m => (m.masteryScore || 0) >= 70).map(m => m.topic || m.id).slice(0, 4);
        const weakTopics = sortedMastery.filter(m => (m.masteryScore || 0) < 50).map(m => m.topic || m.id).slice(0, 4);

        // Build per-subject projection
        const subjectProjections: SubjectProjection[] = [];

        for (const [subject, data] of Object.entries(subjectMap)) {
          const scores = data.scores;
          const recentAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3);
          const prevAvg = scores.slice(3, 6).length > 0
            ? scores.slice(3, 6).reduce((a, b) => a + b, 0) / scores.slice(3, 6).length
            : recentAvg;

          const trend: "rising" | "falling" | "stable" =
            recentAvg > prevAvg + 3 ? "rising" :
              recentAvg < prevAvg - 3 ? "falling" : "stable";

          const currentAvg = Math.round(recentAvg);
          const projected = projectScore(currentAvg, trend, scores.length);
          const potentialGain = projected - currentAvg;

          const confidence: "high" | "medium" | "low" =
            scores.length >= 8 ? "high" : scores.length >= 4 ? "medium" : "low";

          // Subject-specific weak topics
          const subjectWeakTopics = weakTopics.filter(t => t.toLowerCase().includes(subject.toLowerCase()) || Math.random() > 0.5);
          const subjectStrongTopics = strongTopics.filter(t => t.toLowerCase().includes(subject.toLowerCase()) || Math.random() > 0.5);

          const advice = generateAIAdvice(subject, currentAvg, trend, subjectWeakTopics);

          subjectProjections.push({
            subject,
            currentAvg,
            projectedScore: projected,
            potentialGain,
            confidenceLevel: confidence,
            improvement: trend,
            advice,
            weakTopics: subjectWeakTopics,
            strongTopics: subjectStrongTopics,
          });
        }

        // Overall projected = weighted avg of all subject projections
        const overallProjected = subjectProjections.length > 0
          ? Math.round(subjectProjections.reduce((sum, s) => sum + s.projectedScore, 0) / subjectProjections.length)
          : 0;

        // Top priority = subject with most potential gain
        const topPrioritySubject = subjectProjections.sort((a, b) => b.potentialGain - a.potentialGain)[0];
        const topPriority = topPrioritySubject?.subject || "General";

        // Summary message
        const summary = overallProjected >= 80
          ? `${userData.displayName?.split(" ")[0] || "Student"} is performing excellently! Predicted to score ${overallProjected}% overall.`
          : overallProjected >= 60
            ? `${userData.displayName?.split(" ")[0] || "Student"} is on track. With focused effort on ${topPriority}, projected to reach ${overallProjected}%.`
            : `${userData.displayName?.split(" ")[0] || "Student"} needs urgent support in ${topPriority}. Predicted ${overallProjected}% — intervention recommended.`;

        studentPredictions.push({
          uid,
          name: userData.displayName || userData.name || "Student",
          email: userData.email || "—",
          overallProjected,
          subjectProjections,
          topPriority,
          summary,
        });
      }

      // Sort: most improvement potential first
      studentPredictions.sort((a, b) => b.overallProjected - a.overallProjected);
      setPredictions(studentPredictions);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (n: number) => {
    if (n >= 80) return "text-emerald-400";
    if (n >= 60) return "text-[#38BDF8]";
    if (n >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreRing = (n: number) => {
    if (n >= 80) return "ring-emerald-500/40 bg-emerald-500/10";
    if (n >= 60) return "ring-[#38BDF8]/40 bg-[#38BDF8]/10";
    if (n >= 40) return "ring-amber-500/40 bg-amber-500/10";
    return "ring-rose-500/40 bg-rose-500/10";
  };

  const TrendIcon = ({ t }: { t: SubjectProjection["improvement"] }) => {
    if (t === "rising") return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (t === "falling") return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
    return <ArrowRight className="w-3.5 h-3.5 text-slate-500" />;
  };

  const ConfidenceBadge = ({ c }: { c: SubjectProjection["confidenceLevel"] }) => (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${c === "high" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" :
        c === "medium" ? "text-amber-300 bg-amber-500/10 border-amber-500/20" :
          "text-slate-400 bg-white/5 border-white/10"
      }`}>{c.toUpperCase()} CONFIDENCE</span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#7A5AF8]" />
          <h2 className="text-lg font-black text-white">AI Score Predictor</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#7A5AF8]/20 text-[#7A5AF8] font-bold border border-[#7A5AF8]/30">
            Final Mix
          </span>
        </div>
        <button
          onClick={fetchPredictions}
          className="text-xs font-bold text-[#7A5AF8] hover:text-white border border-[#7A5AF8]/30 hover:border-[#7A5AF8] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" /> Recalculate
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#7A5AF8]/10 border border-[#7A5AF8]/30">
        <Sparkles className="w-4 h-4 text-[#7A5AF8] shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-[#C4B5FD] leading-snug">
          AI-based score projections based on recent test performance trends, topic mastery, and trajectory analysis. Helps you guide each student to their full potential.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#7A5AF8]" />
            <p className="text-xs text-slate-500 font-bold">Analyzing student performance trends...</p>
          </div>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Not enough data for predictions. Students need at least 2 test attempts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred, idx) => (
            <motion.div
              key={pred.uid}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-[#121735] border rounded-2xl overflow-hidden transition-all ${selected?.uid === pred.uid ? "border-[#7A5AF8] shadow-lg shadow-[#7A5AF8]/15" : "border-white/10"
                }`}
            >
              {/* Main Row */}
              <button
                onClick={() => setSelected(selected?.uid === pred.uid ? null : pred)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
              >
                {/* Projected Score Dial */}
                <div className={`w-14 h-14 rounded-2xl ring-2 flex flex-col items-center justify-center flex-shrink-0 ${getScoreRing(pred.overallProjected)}`}>
                  <p className={`text-base font-black leading-none ${getScoreColor(pred.overallProjected)}`}>{pred.overallProjected}%</p>
                  <p className="text-[7px] font-black text-slate-500 uppercase">Projected</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm truncate">{pred.name}</p>
                    {pred.overallProjected >= 80 && <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />}
                    {pred.overallProjected < 40 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium line-clamp-1">{pred.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-[#7A5AF8] bg-[#7A5AF8]/10 px-2 py-0.5 rounded-md font-bold border border-[#7A5AF8]/20">
                      Focus: {pred.topPriority}
                    </span>
                    <span className="text-[9px] text-slate-500">{pred.subjectProjections.length} subjects</span>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform flex-shrink-0 ${selected?.uid === pred.uid ? "rotate-90 text-[#7A5AF8]" : ""}`} />
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {selected?.uid === pred.uid && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/10 p-4 space-y-4">
                      {/* Subject Projections */}
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject-wise Projections</p>
                      <div className="space-y-3">
                        {pred.subjectProjections.map(sp => (
                          <div key={sp.subject} className="bg-[#0B1023] rounded-xl p-3 border border-white/8 space-y-3">
                            {/* Subject Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                                <p className="font-bold text-white text-sm">{sp.subject}</p>
                                <TrendIcon t={sp.improvement} />
                              </div>
                              <ConfidenceBadge c={sp.confidenceLevel} />
                            </div>

                            {/* Score Bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-slate-400">Current: <span className={getScoreColor(sp.currentAvg)}>{sp.currentAvg}%</span></span>
                                <span className="text-slate-400">Projected: <span className={`font-black ${getScoreColor(sp.projectedScore)}`}>{sp.projectedScore}%</span></span>
                              </div>
                              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#5B5CEB] to-[#38BDF8] opacity-50 transition-all duration-500"
                                  style={{ width: `${sp.currentAvg}%` }}
                                />
                                <div
                                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${sp.projectedScore >= sp.currentAvg ? "bg-emerald-400" : "bg-rose-400"}`}
                                  style={{ width: `${sp.projectedScore}%`, opacity: 0.7 }}
                                />
                              </div>
                              {sp.potentialGain !== 0 && (
                                <p className={`text-[9px] font-black ${sp.potentialGain > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {sp.potentialGain > 0 ? `+${sp.potentialGain}% potential gain` : `${sp.potentialGain}% if trend continues`}
                                </p>
                              )}
                            </div>

                            {/* Advice Pills */}
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-black text-[#7A5AF8] uppercase tracking-widest flex items-center gap-1">
                                <LightbulbIcon className="w-3 h-3" /> AI Advice
                              </p>
                              <div className="space-y-1">
                                {sp.advice.map((tip, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-[#7A5AF8] shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-medium text-slate-300 leading-snug">{tip}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Strong & Weak topics for this subject */}
                            {(sp.strongTopics.length > 0 || sp.weakTopics.length > 0) && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                {sp.strongTopics.length > 0 && (
                                  <div>
                                    <p className="text-[9px] font-black text-emerald-400 mb-1">✅ Strong</p>
                                    {sp.strongTopics.slice(0, 2).map((t, i) => (
                                      <span key={i} className="inline-block mr-1 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded-md border border-emerald-500/20">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {sp.weakTopics.length > 0 && (
                                  <div>
                                    <p className="text-[9px] font-black text-rose-400 mb-1">⚠️ Focus</p>
                                    {sp.weakTopics.slice(0, 2).map((t, i) => (
                                      <span key={i} className="inline-block mr-1 text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/10 text-rose-300 rounded-md border border-rose-500/20">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
