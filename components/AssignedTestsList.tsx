"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, X, Sparkles, Check, Loader2, Plus, Users 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateStudentTopicMastery } from "../lib/analytics";
import JoinBatchModal from "./JoinBatchModal";

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
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
  passingScorePct: number;
  dueDate: string;
  questions: Question[];
}

export default function AssignedTestsList() {
  const [tests, setTests] = useState<CoachingTest[]>([]);
  const [completedTestIds, setCompletedTestIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Active quiz attempt state
  const [activeTest, setActiveTest] = useState<CoachingTest | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);

  useEffect(() => {
    async function loadAssignedTests() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Query assigned tests where studentId is in assignedStudentIds array or query all coaching_tests
        const testsRef = collection(db, "coaching_tests");
        const snap = await getDocs(testsRef);
        const loaded: CoachingTest[] = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const assigned: string[] = data.assignedStudentIds || [];
          if (assigned.length === 0 || assigned.includes(user.uid)) {
            loaded.push({
              testId: docSnap.id,
              testTitle: data.testTitle || "Coaching Test",
              batchName: data.batchName || "Coaching Batch",
              board: data.board || "CBSE",
              targetClass: data.targetClass || "Class 10",
              subject: data.subject || "Mathematics",
              chapterTopic: data.chapterTopic || "General Topic",
              durationMinutes: data.durationMinutes || 20,
              totalMarks: data.totalMarks || 20,
              passingScorePct: data.passingScorePct || 60,
              dueDate: data.dueDate || new Date().toISOString().split("T")[0],
              questions: data.questions || []
            });
          }
        });

        // Query user's prior attempts
        const attemptsRef = collection(db, "student_test_attempts");
        const qAttempts = query(attemptsRef, where("studentId", "==", user.uid));
        const attemptsSnap = await getDocs(qAttempts);
        const doneIds: string[] = [];
        attemptsSnap.forEach(d => {
          doneIds.push(d.data().testId);
        });

        setTests(loaded);
        setCompletedTestIds(doneIds);
      } catch (err) {
        console.error("Error loading assigned tests:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAssignedTests();
  }, []);

  // Timer effect during active test
  useEffect(() => {
    if (!activeTest || timeRemaining <= 0 || submittedResult) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, timeRemaining, submittedResult]);

  const handleStartTest = (test: CoachingTest) => {
    setActiveTest(test);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setTimeRemaining(test.durationMinutes * 60);
    setSubmittedResult(null);
  };

  const handleOptionSelect = (qIndex: number, optionIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: optionIdx
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest || !auth.currentUser) return;
    setIsSubmitting(true);

    try {
      let correctCount = 0;
      const totalQ = activeTest.questions.length;

      activeTest.questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswerIndex) {
          correctCount++;
        }
      });

      const accuracyPct = Math.round((correctCount / totalQ) * 100);
      const passed = accuracyPct >= activeTest.passingScorePct;
      const score = correctCount * 4;

      const attemptDoc = {
        testId: activeTest.testId,
        testTitle: activeTest.testTitle,
        batchName: activeTest.batchName,
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || "Student",
        score,
        totalMarks: activeTest.totalMarks,
        accuracyPct,
        passed,
        submittedAt: serverTimestamp()
      };

      await addDoc(collection(db, "student_test_attempts"), attemptDoc);

      // Update student topic mastery for teacher analytics
      await updateStudentTopicMastery(
        auth.currentUser.uid,
        activeTest.subject,
        activeTest.chapterTopic,
        correctCount,
        totalQ
      );

      setCompletedTestIds(prev => [...prev, activeTest.testId]);
      setSubmittedResult({
        score,
        totalMarks: activeTest.totalMarks,
        accuracyPct,
        passed,
        correctCount,
        totalQ
      });
    } catch (e) {
      console.error("Error submitting coaching test:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;
  if (tests.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-[#38BDF8]" /> Assigned Coaching Tests
        </h3>
        
        <button
          onClick={() => setShowJoinModal(true)}
          className="text-xs font-bold px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 flex items-center gap-1.5 hover:bg-white/10 transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Join Teacher Batch
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tests.map((t) => {
          const isDone = completedTestIds.includes(t.testId);
          return (
            <div
              key={t.testId}
              className="p-4 rounded-2xl bg-[#121735]/80 border border-white/10 flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>{t.board} · {t.targetClass}</span>
                  <span className="text-amber-300">Due: {t.dueDate}</span>
                </div>
                <h4 className="text-sm font-black text-white leading-snug">{t.testTitle}</h4>
                <p className="text-xs text-slate-300 font-medium">{t.subject} - {t.chapterTopic}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-semibold">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#38BDF8]" /> {t.durationMinutes}m</span>
                  <span>·</span>
                  <span>{t.questions.length} Qs ({t.totalMarks} Marks)</span>
                </div>

                {isDone ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Submitted
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartTest(t)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5B5CEB] to-[#7A5AF8] text-white font-bold text-xs flex items-center gap-1 shadow-md hover:from-[#4F46E5] hover:to-[#6D28D9]"
                  >
                    Start Test <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE TEST ATTEMPT MODAL */}
      <AnimatePresence>
        {activeTest && (
          <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121735] border border-white/20 w-full max-w-xl rounded-3xl p-6 relative text-white space-y-5 shadow-2xl"
            >
              {submittedResult ? (
                /* RESULT SCREEN */
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                    {submittedResult.passed ? "🏆" : "📝"}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">
                      {submittedResult.passed ? "Congratulations! Test Passed" : "Test Submitted"}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Score: <strong className="text-emerald-400">{submittedResult.score} / {submittedResult.totalMarks}</strong> ({submittedResult.accuracyPct}%)
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Your result & topic breakdown have been automatically synced to your teacher's dashboard.
                  </p>

                  <button
                    onClick={() => setActiveTest(null)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B5CEB] to-[#7A5AF8] text-white font-black text-xs uppercase tracking-wider"
                  >
                    Close Test
                  </button>
                </div>
              ) : (
                /* QUIZ QUESTIONS SCREEN */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-white">{activeTest.testTitle}</h3>
                      <p className="text-[11px] text-slate-400">Question {currentQIndex + 1} of {activeTest.questions.length}</p>
                    </div>

                    <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* Question Content */}
                  {activeTest.questions[currentQIndex] && (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-100 leading-relaxed">
                        {activeTest.questions[currentQIndex].questionText}
                      </p>

                      <div className="space-y-2">
                        {activeTest.questions[currentQIndex].options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleOptionSelect(currentQIndex, oIdx)}
                            className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                              selectedAnswers[currentQIndex] === oIdx
                                ? "bg-[#7A5AF8]/30 border-[#7A5AF8] text-white shadow-md"
                                : "bg-[#0B1023] border-white/10 text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <span>{opt}</span>
                            {selectedAnswers[currentQIndex] === oIdx && <Check className="w-4 h-4 text-[#38BDF8]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex(prev => prev - 1)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 text-xs font-bold disabled:opacity-30"
                    >
                      Previous
                    </button>

                    {currentQIndex === activeTest.questions.length - 1 ? (
                      <button
                        onClick={handleSubmitTest}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Submit Test
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B5CEB] to-[#7A5AF8] text-white font-bold text-xs"
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN TEACHER BATCH MODAL */}
      <AnimatePresence>
        {showJoinModal && (
          <JoinBatchModal
            onClose={() => setShowJoinModal(false)}
            onSuccess={(batchName) => {
              setShowJoinModal(false);
              alert(`Successfully joined batch: ${batchName}! Assigned tests will now appear here.`);
              window.location.reload();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
