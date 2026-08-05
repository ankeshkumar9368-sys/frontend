"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Search, 
  Brain, Target, Users, BookOpen, Award, ArrowUpRight, ShieldAlert, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

interface TopicMastery {
  subject: string;
  topic: string;
  totalQuestions: number;
  correctQuestions: number;
  accuracyPct: number;
  status: "Strong" | "Moderate" | "Weak";
  lastTested: string;
}

interface StudentAnalyticsData {
  studentId: string;
  name: string;
  email: string;
  classGrade: string;
  board: string;
  scholarId?: string;
  topicMastery: Record<string, TopicMastery>;
  recentAttemptsCount: number;
  overallAccuracyPct: number;
}

interface StudentPerformanceAnalyticsProps {
  batchId?: string;
  studentIds: string[];
}

export default function StudentPerformanceAnalytics({ batchId, studentIds }: StudentPerformanceAnalyticsProps) {
  const [studentsData, setStudentsData] = useState<StudentAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        if (!studentIds || studentIds.length === 0) {
          setStudentsData([]);
          setLoading(false);
          return;
        }

        const loaded: StudentAnalyticsData[] = [];

        for (const sid of studentIds) {
          const userSnap = await getDoc(doc(db, "users", sid));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const topicMastery: Record<string, TopicMastery> = uData.topicMastery || {};

            // Calculate overall accuracy
            let totalQ = 0;
            let correctQ = 0;
            Object.values(topicMastery).forEach((tm) => {
              totalQ += tm.totalQuestions || 0;
              correctQ += tm.correctQuestions || 0;
            });

            const overallAcc = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

            loaded.push({
              studentId: sid,
              name: uData.name || uData.displayName || "Student " + sid.slice(0, 4),
              email: uData.email || "student@achivox.online",
              classGrade: uData.classGrade || uData.class || "Class 10",
              board: uData.board || "CBSE",
              scholarId: uData.scholarId || uData.uid?.slice(0, 6).toUpperCase(),
              topicMastery,
              recentAttemptsCount: Object.keys(topicMastery).length,
              overallAccuracyPct: overallAcc
            });
          }
        }

        setStudentsData(loaded);
        if (loaded.length > 0 && !selectedStudentId) {
          setSelectedStudentId(loaded[0].studentId);
        }
      } catch (err) {
        console.error("Error loading student performance analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [studentIds]);

  const filteredStudents = studentsData.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.scholarId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudent = studentsData.find(s => s.studentId === selectedStudentId);

  // Group topics into Strong, Moderate, Weak
  const masteryList = selectedStudent ? Object.values(selectedStudent.topicMastery) : [];
  const strongTopics = masteryList.filter(t => t.status === "Strong");
  const moderateTopics = masteryList.filter(t => t.status === "Moderate");
  const weakTopics = masteryList.filter(t => t.status === "Weak");

  if (loading) {
    return (
      <div className="p-10 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#7A5AF8] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Student Performance Heatmaps...</p>
      </div>
    );
  }

  if (studentsData.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#121735]/60 border border-white/10 text-center space-y-3">
        <Users className="w-10 h-10 text-slate-500 mx-auto" />
        <h3 className="text-base font-black text-white">No Enrolled Students Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Share your 6-digit Batch Code with your offline coaching students so they can join your batch and appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      
      {/* Search & Student Selector Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#121735]/80 border border-white/10 backdrop-blur-md">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1023] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {filteredStudents.map(s => (
            <button
              key={s.studentId}
              onClick={() => setSelectedStudentId(s.studentId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedStudentId === s.studentId
                  ? "bg-gradient-to-r from-[#5B5CEB] to-[#7A5AF8] text-white shadow-md border border-white/20"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>👨‍🎓 {s.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                s.overallAccuracyPct >= 75 ? "bg-emerald-500/20 text-emerald-300" :
                s.overallAccuracyPct >= 50 ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
              }`}>
                {s.overallAccuracyPct}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Student Details Card */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#151A35] via-[#0B1023] to-[#151A35] border border-[#7A5AF8]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">{selectedStudent.name}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#7A5AF8]/20 text-[#38BDF8] border border-[#7A5AF8]/30">
                  ID: #{selectedStudent.scholarId}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {selectedStudent.board} · {selectedStudent.classGrade} · {selectedStudent.email}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-xs font-bold text-slate-400 block">Overall Mastery</span>
                <span className="text-lg font-black text-emerald-400">{selectedStudent.overallAccuracyPct}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-xs font-bold text-slate-400 block">Strong Topics</span>
                <span className="text-lg font-black text-[#38BDF8]">{strongTopics.length}</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-xs font-bold text-slate-400 block">Weak Topics</span>
                <span className="text-lg font-black text-rose-400">{weakTopics.length}</span>
              </div>
            </div>
          </div>

          {/* STRONG VS WEAK TOPICS HEATMAP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WEAK TOPICS (OFFLINE REVISION REQUIRED) */}
            <div className="p-5 rounded-3xl bg-[#151A35]/80 border border-rose-500/30 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" /> Weak Topics (&lt; 50% Accuracy)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Needs Offline Coaching Revision
                </span>
              </div>

              {weakTopics.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
                  🎉 Excellent! No weak topics found for this student.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {weakTopics.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#0B1023] border border-rose-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{item.subject} - {item.topic}</span>
                        <span className="text-xs font-extrabold text-rose-400">{item.accuracyPct}% Accuracy</span>
                      </div>
                      
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${item.accuracyPct}%` }} />
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Tested: {item.correctQuestions}/{item.totalQuestions} Questions</span>
                        <span className="text-amber-300 font-bold">⚠️ Assign Offline Practice Test</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STRONG TOPICS */}
            <div className="p-5 rounded-3xl bg-[#151A35]/80 border border-emerald-500/30 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strong Topics (&gt;= 75% Accuracy)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mastered Concepts
                </span>
              </div>

              {strongTopics.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
                  No mastered topics recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {strongTopics.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#0B1023] border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{item.subject} - {item.topic}</span>
                        <span className="text-xs font-extrabold text-emerald-400">{item.accuracyPct}% Accuracy</span>
                      </div>
                      
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${item.accuracyPct}%` }} />
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Tested: {item.correctQuestions}/{item.totalQuestions} Questions</span>
                        <span className="text-emerald-300 font-bold">✨ High Command</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
