"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import {
  Archive,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  User,
  CalendarDays,
  Percent,
  FlaskConical,
  BookOpen,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestAttemptDetail {
  uid: string;
  studentName: string;
  studentEmail: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
  subject?: string;
  topicsCovered?: string[];
  timeTaken?: number;
}

interface ArchivedTest {
  testId: string;
  title: string;
  subject: string;
  createdAt: string;
  totalQuestions: number;
  assignedBatch?: string;
  attempts: TestAttemptDetail[];
  avgScore: number;
}

export default function TeacherTestArchive({ teacherUid }: { teacherUid?: string }) {
  const [tests, setTests] = useState<ArchivedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [allSubjects, setAllSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchArchivedTests();
  }, [teacherUid]);

  const fetchArchivedTests = async () => {
    setLoading(true);
    try {
      // Fetch coaching tests created by this teacher
      let testsRef = collection(db, "coachingTests");
      let q: any = query(testsRef, orderBy("createdAt", "desc"), limit(50));
      if (teacherUid) {
        q = query(testsRef, where("teacherUid", "==", teacherUid), orderBy("createdAt", "desc"), limit(50));
      }

      const testsSnap = await getDocs(q);
      const subjects = new Set<string>();
      const archivedTests: ArchivedTest[] = [];

      for (const testDoc of testsSnap.docs) {
        const testData = testDoc.data() as any;
        const testId = testDoc.id;

        if (testData.subject) subjects.add(testData.subject);

        // Fetch all student attempts for this test
        const attempts: TestAttemptDetail[] = [];
        const usersSnap = await getDocs(collection(db, "users"));

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.role === "teacher") continue;

          const attemptRef = collection(db, "users", userDoc.id, "testAttempts");
          const attemptQ = query(attemptRef, where("testId", "==", testId));
          const attemptSnap = await getDocs(attemptQ);

          for (const attemptDoc of attemptSnap.docs) {
            const a = attemptDoc.data();
            const totalQ = a.totalQuestions || a.total || testData.totalQuestions || 10;
            const correct = a.correctAnswers || a.correct || 0;
            const percentage = Math.round((correct / totalQ) * 100);
            const ts = a.timestamp?.toDate?.()?.toLocaleString?.() ?? "—";

            attempts.push({
              uid: userDoc.id,
              studentName: userData.displayName || userData.name || "Student",
              studentEmail: userData.email || "—",
              score: correct,
              total: totalQ,
              percentage,
              timestamp: ts,
              subject: testData.subject,
              topicsCovered: testData.topics || a.topicsCovered || [],
              timeTaken: a.timeTaken,
            });
          }
        }

        // Sort attempts by score desc
        attempts.sort((a, b) => b.percentage - a.percentage);

        const avgScore =
          attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
            : 0;

        const createdAtStr =
          testData.createdAt?.toDate?.()?.toLocaleDateString?.() ??
          (testData.createdAt ? new Date(testData.createdAt).toLocaleDateString() : "—");

        archivedTests.push({
          testId,
          title: testData.title || testData.testTitle || "Untitled Test",
          subject: testData.subject || "General",
          createdAt: createdAtStr,
          totalQuestions: testData.totalQuestions || testData.questions?.length || 0,
          assignedBatch: testData.batchId || testData.batchName,
          attempts,
          avgScore,
        });
      }

      setAllSubjects(Array.from(subjects));
      setTests(archivedTests);
    } catch (err) {
      console.error("Archive fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tests.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = subjectFilter === "all" || t.subject === subjectFilter;
    return matchSearch && matchSubject;
  });

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-400";
    if (pct >= 60) return "text-[#38BDF8]";
    if (pct >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500/10 border-emerald-500/20";
    if (pct >= 60) return "bg-[#38BDF8]/10 border-[#38BDF8]/20";
    if (pct >= 40) return "bg-amber-500/10 border-amber-500/20";
    return "bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-[#38BDF8]" />
          <h2 className="text-lg font-black text-white">Test Archives</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/30">
            {tests.length} Tests
          </span>
        </div>
        <button
          onClick={fetchArchivedTests}
          className="text-xs font-bold text-[#7A5AF8] hover:text-white border border-[#7A5AF8]/30 hover:border-[#7A5AF8] px-3 py-1.5 rounded-xl transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1023] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7A5AF8]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="bg-[#0B1023] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#7A5AF8] appearance-none cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Archive className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No tests found. Create coaching tests to see archives here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(test => (
            <motion.div
              key={test.testId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#121735] border border-white/10 rounded-2xl overflow-hidden"
            >
              {/* Test Header Row */}
              <button
                onClick={() => setExpandedTest(expandedTest === test.testId ? null : test.testId)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B5CEB] to-[#38BDF8] flex items-center justify-center shadow flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{test.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-[#7A5AF8] bg-[#7A5AF8]/10 px-2 py-0.5 rounded-md">
                      {test.subject}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {test.createdAt}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" /> {test.totalQuestions}Q
                    </span>
                    {test.assignedBatch && (
                      <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Batch: {test.assignedBatch}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right space-y-0.5 flex-shrink-0">
                  <p className="text-xs font-black text-white">{test.attempts.length} attempts</p>
                  <p className={`text-xs font-black ${test.avgScore > 0 ? getScoreColor(test.avgScore) : "text-slate-600"}`}>
                    {test.avgScore > 0 ? `~${test.avgScore}% avg` : "No attempts"}
                  </p>
                </div>

                {expandedTest === test.testId
                  ? <ChevronDown className="w-4 h-4 text-[#7A5AF8] flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />}
              </button>

              {/* Expanded Attempts List */}
              <AnimatePresence>
                {expandedTest === test.testId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/10 p-4 space-y-2">
                      {test.attempts.length === 0 ? (
                        <p className="text-center text-slate-600 text-sm py-6">No student has attempted this test yet.</p>
                      ) : (
                        <>
                          {/* Attempt Summary Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-[#0B1023] rounded-xl p-3 border border-white/8">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Score</p>
                              <p className={`text-xl font-black ${getScoreColor(test.avgScore)}`}>{test.avgScore}%</p>
                            </div>
                            <div className="bg-[#0B1023] rounded-xl p-3 border border-white/8">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Score</p>
                              <p className="text-xl font-black text-emerald-400">
                                {Math.max(...test.attempts.map(a => a.percentage))}%
                              </p>
                            </div>
                            <div className="bg-[#0B1023] rounded-xl p-3 border border-white/8">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Attempts</p>
                              <p className="text-xl font-black text-[#38BDF8]">{test.attempts.length}</p>
                            </div>
                          </div>

                          {/* Per-Student Attempts */}
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Student Attempts</p>
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {test.attempts.map((attempt, idx) => (
                              <div
                                key={`${attempt.uid}-${idx}`}
                                className={`flex items-center gap-3 p-3 rounded-xl border ${getScoreBg(attempt.percentage)} transition-all`}
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5B5CEB] to-[#7A5AF8] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                                  {attempt.studentName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{attempt.studentName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" /> {attempt.timestamp}
                                    </span>
                                    {attempt.timeTaken && (
                                      <span className="text-[9px] text-slate-500">{Math.round(attempt.timeTaken / 60)}m</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-black ${getScoreColor(attempt.percentage)}`}>
                                    {attempt.score}/{attempt.total}
                                  </p>
                                  <p className={`text-[10px] font-bold ${getScoreColor(attempt.percentage)}`}>
                                    {attempt.percentage}%
                                  </p>
                                </div>
                                {attempt.percentage >= 70
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
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
