"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc 
} from "firebase/firestore";
import { 
  GraduationCap, Users, Plus, BookOpen, BarChart3, FileText, Sparkles, 
  Copy, Check, Trophy, ShieldCheck, ArrowLeft, Search, Layers, RefreshCw, Flame, X, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import StudentPerformanceAnalytics from "../../components/StudentPerformanceAnalytics";
import CreateCoachingTest from "../../components/CreateCoachingTest";
import TeacherStudentLeaderboard from "../../components/TeacherStudentLeaderboard";
import TeacherTestArchive from "../../components/TeacherTestArchive";
import FinalMixScorePredictor from "../../components/FinalMixScorePredictor";

interface Batch {
  batchId: string;
  batchName: string;
  teacherId: string;
  board: string;
  targetClass: string;
  subject: string;
  batchCode: string;
  studentIds: string[];
  createdAt?: any;
}

interface CoachingTest {
  testId: string;
  testTitle: string;
  batchName: string;
  board: string;
  targetClass: string;
  subject: string;
  chapterTopic: string;
  durationMinutes: number;
  totalMarks: number;
  dueDate: string;
  questionsCount: number;
}

export default function TeacherPortal() {
  const [activeTab, setActiveTab] = useState<"analytics" | "batches" | "tests" | "results" | "leaderboard" | "archive" | "predictor">("analytics");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [createdTests, setCreatedTests] = useState<CoachingTest[]>([]);
  const [loading, setLoading] = useState(true);

  // New Batch Form State
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [board, setBoard] = useState("CBSE");
  const [targetClass, setTargetClass] = useState("Class 10");
  const [subject, setSubject] = useState("Mathematics");
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Create Test Modal State
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  // Copy Feedback
  const [copiedBatchCode, setCopiedBatchCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        setLoading(false);
        return;
      }
      const teacherId = user.uid;

      // 1. Fetch Teacher's Batches
      const batchesRef = collection(db, "batches");
      const qBatches = query(batchesRef, where("teacherId", "==", teacherId));
      const batchSnap = await getDocs(qBatches);

      const loadedBatches: Batch[] = [];
      batchSnap.forEach((d) => {
        const data = d.data();
        loadedBatches.push({
          batchId: d.id,
          batchName: data.batchName || "Coaching Batch",
          teacherId: data.teacherId,
          board: data.board || "CBSE",
          targetClass: data.targetClass || "Class 10",
          subject: data.subject || "Mathematics",
          batchCode: data.batchCode || "BATCH1",
          studentIds: data.studentIds || []
        });
      });

      // 2. Fetch Teacher's Coaching Tests
      const testsRef = collection(db, "coaching_tests");
      const qTests = query(testsRef, where("teacherId", "==", teacherId));
      const testSnap = await getDocs(qTests);

      const loadedTests: CoachingTest[] = [];
      testSnap.forEach((d) => {
        const data = d.data();
        loadedTests.push({
          testId: d.id,
          testTitle: data.testTitle || "Offline Test",
          batchName: data.batchName || "Batch",
          board: data.board || "CBSE",
          targetClass: data.targetClass || "Class 10",
          subject: data.subject || "Mathematics",
          chapterTopic: data.chapterTopic || "General Topic",
          durationMinutes: data.durationMinutes || 20,
          totalMarks: data.totalMarks || 20,
          dueDate: data.dueDate || "",
          questionsCount: (data.questions || []).length
        });
      });

      setBatches(loadedBatches);
      setCreatedTests(loadedTests);
    } catch (e) {
      console.error("Error fetching teacher data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return;
    setIsCreatingBatch(true);

    try {
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        setIsCreatingBatch(false);
        return;
      }
      const teacherId = user.uid;
      
      // Generate unique 6-character Batch Join Code
      const code = "ACH" + Math.floor(100 + Math.random() * 900);

      const newBatchData = {
        batchName: batchName.trim(),
        teacherId,
        board,
        targetClass,
        subject,
        batchCode: code,
        studentIds: [],
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "batches"), newBatchData);

      setBatches(prev => [
        ...prev,
        {
          batchId: docRef.id,
          ...newBatchData
        }
      ]);

      setBatchName("");
      setShowCreateBatchModal(false);
    } catch (err) {
      console.error("Error creating batch:", err);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBatchCode(code);
    setTimeout(() => setCopiedBatchCode(null), 2500);
  };

  // Collect all student IDs across teacher's batches
  const allStudentIds = Array.from(new Set(batches.flatMap(b => b.studentIds)));

  const handleLogout = async () => {
    await fetch("/api/teacher-auth", { method: "DELETE" });
    window.location.href = "/teacher/login";
  };

  return (
    <div className="min-h-screen bg-[#0B1023] text-white selection:bg-[#7A5AF8] selection:text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* 🌌 Background Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#5B5CEB]/25 via-[#7A5AF8]/15 to-transparent blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-l from-[#38BDF8]/20 via-[#8B5CF6]/15 to-transparent blur-[130px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[1.5px] shadow-[0_0_20px_rgba(122,90,248,0.4)]">
              <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#38BDF8]" />
              </div>
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                ACHIVOX <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A5AF8] to-[#38BDF8] text-xs px-2 py-0.5 rounded-full bg-[#151A35] border border-[#7A5AF8]/30">TEACHER PORTAL</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coaching & Student Performance Manager</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateTestModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg hover:from-amber-600 hover:to-purple-700 transition-all border border-amber-300/30"
          >
            <Sparkles className="w-4 h-4 text-amber-200" /> Create Coaching Test
          </button>

          <button
            onClick={() => setShowCreateBatchModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add Batch
          </button>

          <button
            onClick={handleLogout}
            title="Logout Teacher Session"
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-3xl bg-[#121735]/90 border border-white/10 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7A5AF8]/20 to-[#5B5CEB]/20 border border-[#7A5AF8]/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Batches</span>
              <span className="text-lg font-black text-white">{batches.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#121735]/90 border border-white/10 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Students</span>
              <span className="text-lg font-black text-white">{allStudentIds.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#121735]/90 border border-white/10 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coaching Tests</span>
              <span className="text-lg font-black text-white">{createdTests.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#121735]/90 border border-white/10 flex items-center gap-3 shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Topic Analytics</span>
              <span className="text-xs font-bold text-emerald-300">Live Active</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "analytics", label: "📊 Performance", badge: allStudentIds.length },
            { id: "leaderboard", label: "🏆 Leaderboard", badge: null },
            { id: "archive", label: "🗄️ Test Archive", badge: createdTests.length },
            { id: "predictor", label: "🔮 Score Predictor", badge: null },
            { id: "batches", label: "👥 Batches", badge: batches.length },
            { id: "tests", label: "📝 Assign Tests", badge: createdTests.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#5B5CEB] to-[#7A5AF8] text-white shadow-md border-white/20"
                  : "text-slate-300 hover:text-white hover:bg-white/5 bg-[#121735]/80 border-white/10"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="text-[10px] px-1.5 rounded-full bg-white/20 font-extrabold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: STUDENT PERFORMANCE ANALYTICS */}
        {activeTab === "analytics" && (
          <StudentPerformanceAnalytics studentIds={allStudentIds} />
        )}

        {/* TAB: STUDENT LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div className="bg-[#121735]/80 border border-white/10 rounded-3xl p-6">
            <TeacherStudentLeaderboard />
          </div>
        )}

        {/* TAB: TEST ARCHIVE */}
        {activeTab === "archive" && (
          <div className="bg-[#121735]/80 border border-white/10 rounded-3xl p-6">
            <TeacherTestArchive teacherUid={auth.currentUser?.uid} />
          </div>
        )}

        {/* TAB: AI SCORE PREDICTOR */}
        {activeTab === "predictor" && (
          <div className="bg-[#121735]/80 border border-white/10 rounded-3xl p-6">
            <FinalMixScorePredictor />
          </div>
        )}

        {/* TAB 2: BATCHES & JOIN CODES */}
        {activeTab === "batches" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Your Coaching Batches</h3>
              <button
                onClick={() => setShowCreateBatchModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Create New Batch
              </button>
            </div>

            {batches.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#121735]/60 border border-white/10 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-black text-white">No Coaching Batches Created</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Create a batch to generate a 6-digit Join Code for your Class 9-12 students.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map((b) => (
                  <div key={b.batchId} className="p-5 rounded-3xl bg-[#121735]/90 border border-white/10 space-y-4 shadow-lg flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#7A5AF8]/20 text-[#38BDF8] border border-[#7A5AF8]/30">
                          {b.board} · {b.targetClass}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">{b.studentIds.length} Students</span>
                      </div>

                      <h4 className="text-base font-black text-white">{b.batchName}</h4>
                      <p className="text-xs text-slate-300 font-medium">Subject: {b.subject}</p>
                    </div>

                    {/* Batch Code Box */}
                    <div className="p-3 rounded-2xl bg-[#0B1023] border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Student Join Code</span>
                        <span className="text-base font-black text-amber-300 tracking-wider">{b.batchCode}</span>
                      </div>

                      <button
                        onClick={() => copyCode(b.batchCode)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 text-slate-200"
                      >
                        {copiedBatchCode === b.batchCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedBatchCode === b.batchCode ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNED COACHING TESTS */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Created Offline Coaching Tests</h3>
              <button
                onClick={() => setShowCreateTestModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" /> Create New Test
              </button>
            </div>

            {createdTests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#121735]/60 border border-white/10 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-base font-black text-white">No Coaching Tests Assigned Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Create custom or AI-generated tests for topics taught in your offline coaching classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdTests.map((t) => (
                  <div key={t.testId} className="p-5 rounded-3xl bg-[#121735]/90 border border-white/10 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{t.board} · {t.targetClass}</span>
                      <span className="text-amber-300">Due: {t.dueDate}</span>
                    </div>

                    <h4 className="text-sm font-black text-white leading-snug">{t.testTitle}</h4>
                    <p className="text-xs text-slate-300 font-semibold">{t.subject} - {t.chapterTopic}</p>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>{t.questionsCount} Questions</span>
                      <span className="text-[#38BDF8]">{t.durationMinutes} Minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* CREATE BATCH MODAL */}
      <AnimatePresence>
        {showCreateBatchModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121735] border border-white/20 w-full max-w-md rounded-3xl p-6 relative text-white space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">Create Coaching Batch</h3>
                <button onClick={() => setShowCreateBatchModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Batch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Class 10th CBSE Morning Batch"
                    value={batchName}
                    onChange={e => setBatchName(e.target.value)}
                    className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Board</label>
                    <select
                      value={board}
                      onChange={e => setBoard(e.target.value)}
                      className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="BSEB">Bihar Board (BSEB)</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Class</label>
                    <select
                      value={targetClass}
                      onChange={e => setTargetClass(e.target.value)}
                      className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics / Physics"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingBatch}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Generate Batch Join Code
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TEST MODAL */}
      <AnimatePresence>
        {showCreateTestModal && (
          <CreateCoachingTest
            batches={batches}
            onClose={() => setShowCreateTestModal(false)}
            onSuccess={() => {
              setShowCreateTestModal(false);
              fetchTeacherData();
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
