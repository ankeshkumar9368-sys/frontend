"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { INDIAN_BOARDS, CLASSES, getSubjects } from "../lib/curriculum";
import { recordTestResult, logFeatureTime, updateActiveStatus, recordMistake, getMistakes, removeMistake, getOverallStats, recordMasteredQuestion } from "../lib/analytics";
import { fetchQuestions, generateSingleReplacementQuestion, getTestBankId } from "../lib/content";
import {
  ChevronRight, ChevronLeft, School, GraduationCap, BookOpen,
  Play, CheckCircle, XCircle, AlertTriangle, Trophy, RefreshCw, Loader2, Brain,
  LogOut, Bookmark, BookmarkCheck, Star, Lock, FileText, Calendar, Repeat2
} from "lucide-react";
import MathRenderer from "./MathRenderer";
import BadgeUnlockOverlay from "./BadgeUnlockOverlay";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { addXP, checkMasteryBadges, rewardTestCompletion } from "../lib/gamification";

type Step = "board" | "class" | "type" | "subject" | "pyqyear" | "pyqsubject" | "test" | "result" | "review";

const PYQ_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019"];

interface Question { 
  text: string; 
  options: string[]; 
  correct: number; 
  topic: string; 
  importance?: string;
  examProbability?: number;
  explanation?: string;
}
interface WeakArea { topic: string; wrong: number; total: number; }

const BOARD_COLORS = [
  "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/40",
  "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/40",
  "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40",
  "bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950/20 dark:border-purple-900/40",
  "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/20 dark:border-orange-900/40",
  "bg-pink-50 border-pink-200 text-pink-900 dark:bg-pink-950/20 dark:border-pink-900/40",
  "bg-teal-50 border-teal-200 text-teal-900 dark:bg-teal-950/20 dark:border-teal-900/40",
];
const ICON_COLORS = ["bg-red-500","bg-blue-500","bg-emerald-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-teal-500"];

async function generateTest(board: string, cls: string, subject: string, userData: any, mode: string = "full", pyqYear?: string): Promise<any[]> {
  const isMixed = subject === "All Subjects Mixed" || mode === "mock50";
  const isPYQ = mode === "pyq" && !!pyqYear;

  let topic: string;
  let subjectContext: string;

  if (isPYQ) {
    topic = `${board} ${cls} ${subject} Previous Year Questions ${pyqYear}`;
    subjectContext = `PYQ STRICT LOCK: Generate ONLY ${subject} questions that were asked in ${pyqYear} ${board} ${cls} Board Exam. These must be actual previous year pattern questions with high exam probability. Do NOT include questions from any other subject or year pattern.`;
  } else if (mode === "mock50") {
    topic = `Top 50 Most Important Highly Likely Questions for ${cls} ${board} All Subjects`;
    subjectContext = `High Probability Board Exam 50 Qs Mock Test - ${board} ${cls} All Subjects`;
  } else if (isMixed) {
    topic = `All Subjects Mixed Syllabus for ${cls} ${board}`;
    subjectContext = `Comprehensive Mock Test - ${board} ${cls} All Subjects`;
  } else {
    topic = `${subject}`;
    subjectContext = `STRICT SUBJECT LOCK: Generate ONLY ${subject} questions for ${board} ${cls}. Do NOT include questions from any other subject.`;
  }

  const enrichedUserData = {
    ...userData,
    strictSubject: (isMixed || isPYQ) ? null : subject,
    pyqYear: isPYQ ? pyqYear : null,
    board,
    cls,
  };

  const qs = await fetchQuestions(mode, topic, enrichedUserData, subjectContext);

  return qs;
}

export default function SchoolTestEngine({ isSubscribed = false, userData }: { isSubscribed?: boolean, userData?: any }) {
  const [board, setBoard] = useState(userData?.board || "");
  const [cls, setCls] = useState(userData?.cls || "");
  const [step, setStep] = useState<Step>(userData?.board && userData?.cls ? "type" : "board");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [score, setScore] = useState(0);
  const [testsTaken, setTestsTaken] = useState(0);
  const [testType, setTestType] = useState<"subject" | "mixed" | "mock50" | "pyq">("subject");
  const [pyqYear, setPyqYear] = useState("");
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [newBadge, setNewBadge] = useState<{name: string} | null>(null);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(!!(userData?.board && userData?.cls));
  const fetchIdRef = useRef<string | null>(null);

  // Feature time tracking
  useEffect(() => {
    const mountTime = Date.now();
    if (userData?.id) {
      updateActiveStatus(userData.id, "Taking a Test");
    }
    
    // Clear old test questions from database as requested
    if (typeof window !== "undefined" && !localStorage.getItem("cleared_old_mistakes_v2")) {
      localStorage.removeItem("achivox_mistakes");
      localStorage.setItem("cleared_old_mistakes_v2", "true");
    }
    
    return () => {
      const elapsed = Math.round((Date.now() / 1000) - (mountTime / 1000));
      if (userData?.id && elapsed > 0) {
        logFeatureTime(userData.id, "School Test Engine", elapsed);
        updateActiveStatus(userData.id, "Online");
      }
    };
  }, [userData?.id]);

  // Auto-populate board and class from user's goal
  useEffect(() => {
    if (userData?.board && userData?.cls && !hasAutoPopulated) {
      setBoard(userData.board);
      setCls(userData.cls);
      setStep("type");
      setHasAutoPopulated(true);
    }
  }, [userData, hasAutoPopulated]);

  const subjects = cls ? getSubjects(cls, board) : [];

  const startTest = async (overrideSubject?: string, mode: string = "full", overridePyqYear?: string) => {
    const currentFetchId = Date.now().toString();
    fetchIdRef.current = currentFetchId;

    const finalSubject = overrideSubject || subject;
    const finalPyqYear = overridePyqYear || pyqYear;
    if (!isSubscribed && testsTaken >= 1) {
      alert("You have reached your free test limit! Upgrade to Premium for unlimited tests.");
      return;
    }
    setLoading(true);
    setStep("test"); // Transition to test view immediately so the "Generating AI Test..." loader displays!
    
    // Inject Performance Stats for AI adaptation
    let perfStats = { totalSolved: 0, correctAnswers: 0 };
    if (typeof window !== "undefined") {
      const stats = getOverallStats();
      perfStats = { totalSolved: stats.totalSolved || 0, correctAnswers: stats.correctAnswers || 0 };
    }

    const enrichedUserData = { 
      ...(userData || {}), 
      isSubscribed, 
      board, 
      cls,
      totalSolved: userData?.totalSolved || perfStats.totalSolved,
      correctAnswers: userData?.correctAnswers || perfStats.correctAnswers 
    };
    
    const qs = await generateTest(board, cls, finalSubject, enrichedUserData, mode, finalPyqYear);
    if (fetchIdRef.current !== currentFetchId) return; // Discard stale response
    
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrent(0);
    setTestsTaken(prev => prev + 1);
    setHistory([]);
    setLoading(false);
  };

  const pickAnswer = (idx: number) => {
    if (answers[current] !== null) return;
    const updated = [...answers];
    updated[current] = idx;
    setAnswers(updated);

    const q = questions[current];
    const isCorrect = idx === q.correct;
    
    // Add to history
    setHistory(prev => [...prev, { ...q, isCorrect, selectedOption: idx }]);

    // No auto-advancing or background replacement here.
    // The user must manually click Next to advance.
  };

  const finish = () => {
    const correct = history.filter(h => h.isCorrect).length;
    const pct = history.length > 0 ? Math.round((correct / history.length) * 100) : 0;
    
    // Save adaptive data
    history.forEach(q => {
      if (q.isCorrect) {
        recordMasteredQuestion(q.text);
      } else {
        recordMistake({
          question: q.text,
          options: q.options,
          correctAnswer: q.options[q.correct],
          userAnswer: q.options[q.selectedOption],
          topicId: testType || subject,
          topicName: subject,
          subject: subject
        });
      }
    });
    setScore(pct);

    // Weak area analysis
    const topicMap: Record<string, { wrong: number; total: number }> = {};
    history.forEach((h) => {
      if (!topicMap[h.topic]) topicMap[h.topic] = { wrong: 0, total: 0 };
      topicMap[h.topic].total++;
      if (!h.isCorrect) topicMap[h.topic].wrong++;
    });
    setWeakAreas(
      Object.entries(topicMap)
        .map(([topic, v]) => ({ topic, ...v }))
        .filter(w => w.wrong > 0)
        .sort((a, b) => b.wrong - a.wrong)
    );

    // Process mistakes: Add new ones, remove resolved ones
    history.forEach((q: any) => {
      const isCorrect = q.isCorrect;
      if (q.isMistakeRepeat) {
        if (isCorrect) {
          removeMistake(q.mistakeId);
        }
      } else {
        if (!isCorrect && q.selectedOption !== undefined && q.selectedOption !== null) {
          recordMistake({
            question: q.text,
            options: q.options,
            correctAnswer: q.options[q.correct],
            userAnswer: q.options[q.selectedOption],
            topicId: `${board}_${cls}_${subject}`,
            topicName: q.topic || subject,
            subject: subject
          });
        }
      }
    });

    recordTestResult({
      topicId: `${board}_${cls}_${subject}`,
      topicName: subject,
      subject,
      cls,
      score: pct,
      totalQ: questions.length,
      correctQ: correct,
      timeTakenSec: 0
    });

    // Award XP + Achivox Coins based on score (XP never decreases)
    if (auth.currentUser) {
      rewardTestCompletion(auth.currentUser.uid, correct, questions.length);

      // Check for mastery badges
      checkMasteryBadges(auth.currentUser.uid, subject, pct).then(badge => {
        if (badge) {
          setNewBadge({ name: badge.badgeName });
        }
      });
    }

    setStep("result");
  };

  const reset = () => {
    const goalBoard = userData?.board || "";
    const goalCls = userData?.cls || "";
    if (hasAutoPopulated && goalBoard && goalCls) {
      setBoard(goalBoard);
      setCls(goalCls);
      setStep("type");
    } else {
      setStep("board");
      setBoard("");
      setCls("");
    }
    setSubject("");
    setPyqYear("");
    setQuestions([]); setAnswers([]); setCurrent(0);
    setWeakAreas([]); setScore(0);
    setSavedStatus({});
  };

  const saveMCQ = async (qIndex?: number) => {
    const targetIdx = qIndex !== undefined ? qIndex : current;
    if (!auth.currentUser) {
      alert("Please login to save questions!");
      return;
    }
    setSaving(true);
    try {
      const q = questions[targetIdx];
      // Use a more predictable path and ensure we don't save empty/null values
      const savePath = collection(db, "users", auth.currentUser.uid, "saved_mcqs");
      await addDoc(savePath, {
        q: q.text,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || "No explanation available.",
        importance: q.importance || "Medium",
        examProbability: q.examProbability || 70,
        savedAt: serverTimestamp(),
        board: board || "CBSE",
        cls: cls || "Class 10",
        subject: subject || "General"
      });
      setSavedStatus({ ...savedStatus, [targetIdx]: true });
    } catch (e) {
      console.error("Save Error:", e);
      alert("Failed to save MCQ. Check internet connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-black text-foreground flex items-center gap-2">
            <School className="w-6 h-6 text-primary" /> School Test
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {step === "board" ? "Select your board" :
             step === "class" ? `Board: ${board}` :
             step === "type" ? (hasAutoPopulated ? `${board} · ${cls} (Your Goal)` : `${board} · ${cls}`) :
             step === "subject" ? `${board} · ${cls} — Select Subject` :
             step === "pyqyear" ? `${board} · ${cls} — PYQ Year` :
             step === "pyqsubject" ? `PYQ ${pyqYear} — Select Subject` :
             step === "test" ? `${subject} · Q${current + 1}/${questions.length}` :
             "Test Complete!"}
          </p>
        </div>
        {step !== "board" && step !== "test" && step !== "result" && step !== "review" &&
         !(hasAutoPopulated && step === "type") && (
          <button onClick={() => setStep(
            step === "class" ? "board" :
            step === "type" ? "class" :
            step === "subject" ? "type" :
            step === "pyqyear" ? "type" :
            step === "pyqsubject" ? "pyqyear" : "board"
          )}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {step === "review" && (
          <button onClick={() => setStep("result")}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {step === "test" && (
          <button onClick={() => { if(confirm("Are you sure you want to quit this test?")) reset(); }} 
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all">
            <LogOut className="w-3 h-3" /> Quit
          </button>
        )}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">

          {/* ── BOARD SELECTION ── */}
          {step === "board" && (
            <motion.div key="board" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto">
              {INDIAN_BOARDS.map((b, i) => (
                <motion.button key={b} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setBoard(b); setStep("class"); }}
                  className={`p-4 rounded-[20px] border flex items-center gap-3 text-left transition-all ${BOARD_COLORS[i % 7]}`}>
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-white text-xs font-black ${ICON_COLORS[i % 7]}`}>
                    {b.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm">{b}</p>
                    <p className="text-[10px] opacity-60 font-semibold">Class 9–12 · All Subjects</p>
                  </div>
                  <ChevronRight className="w-6 h-6 opacity-40" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── CLASS SELECTION ── */}
          {step === "class" && (
            <motion.div key="class" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-3">
              {CLASSES.map((c, i) => (
                <motion.button key={c} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setCls(c); setStep("type"); }}
                  className={`p-5 rounded-[20px] border flex flex-col items-center gap-2 ${BOARD_COLORS[i % 7]}`}>
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-white ${ICON_COLORS[i % 7]}`}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <p className="font-black text-sm">{c}</p>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── TEST TYPE SELECTION ── */}
          {step === "type" && (
            <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-3">
              
              {/* Goal Banner - shows when auto-populated from profile */}
              {hasAutoPopulated && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 mb-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-xs font-black text-primary">{board} · {cls}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Your Goal Board & Class</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setHasAutoPopulated(false); setStep("board"); setBoard(""); setCls(""); }}
                    className="text-[9px] font-black text-slate-400 hover:text-primary uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-primary/10 transition-all">
                    Change
                  </button>
                </motion.div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setTestType("subject"); setStep("subject"); }}
                className="p-6 rounded-[28px] border-2 border-primary/20 bg-primary/5 flex items-center gap-4 text-left">
                <div className="w-6 h-6 bg-primary rounded-2xl flex items-center justify-center text-white">
                   <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-lg">Subject Wise Test</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Focus on one subject</p>
                </div>
              </motion.button>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { 
                  setTestType("mixed"); 
                  setSubject("All Subjects Mixed");
                  startTest("All Subjects Mixed"); 
                }}
                className="p-6 rounded-[28px] border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10 flex items-center gap-4 text-left">
                <div className="w-6 h-6 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                   <Brain className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-lg">Grand Mock Test</p>
                  <p className="text-xs text-indigo-500 font-bold uppercase tracking-tight">Mixed All Subjects • 10 AI Qs</p>
                </div>
              </motion.button>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { 
                  setTestType("mock50"); 
                  setSubject("50Q Mega Mock Test");
                  startTest("50Q Mega Mock Test", "mock50"); 
                }}
                className="p-6 rounded-[28px] border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/10 flex items-center gap-4 text-left">
                <div className="w-6 h-6 bg-amber-500 rounded-2xl flex items-center justify-center text-white relative">
                   <Star className="w-6 h-6 absolute animate-ping opacity-50" />
                   <Star className="w-6 h-6 relative z-10" />
                </div>
                <div>
                  <p className="font-black text-lg">50Q Mega Mock Test</p>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-tight">High Probability • 50 Qs</p>
                </div>
              </motion.button>

              {/* PYQ Button */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setTestType("pyq"); setStep("pyqyear"); }}
                className="p-6 rounded-[28px] border-2 border-rose-200 bg-rose-50 dark:bg-rose-900/10 flex items-center gap-4 text-left relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                  2026 ★ Latest
                </div>
                <div className="w-6 h-6 bg-rose-600 rounded-2xl flex items-center justify-center text-white">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-lg">PYQ Practice</p>
                  <p className="text-xs text-rose-500 font-bold uppercase tracking-tight">Board Exam 2019–2026 • Year-wise</p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* ── SUBJECT SELECTION ── */}
          {step === "subject" && (
            <motion.div key="subject" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto">
              {subjects.map((s, i) => (
                <motion.button key={s} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSubject(s); startTest(s); }}
                  className={`p-4 rounded-[20px] border flex items-center gap-3 text-left transition-all ${BOARD_COLORS[i % 7]}`}>
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-white ${ICON_COLORS[i % 7]}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm">{s}</p>
                    <p className="text-[10px] opacity-60 font-semibold">10 AI Questions · {cls}</p>
                  </div>
                  <Play className="w-6 h-6 opacity-40" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── PYQ YEAR SELECTION ── */}
          {step === "pyqyear" && (
            <motion.div key="pyqyear" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <div className="flex items-center gap-2 px-1 mb-2">
                <div className="w-6 h-6 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">Select Exam Year</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{board} · {cls} Board Exam PYQs</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PYQ_YEARS.map((year, i) => (
                  <motion.button key={year} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setPyqYear(year); setStep("pyqsubject"); }}
                    className={`p-4 rounded-[20px] border-2 flex flex-col items-center gap-1 relative overflow-hidden
                      ${year === "2026" || year === "2025"
                        ? "border-rose-300 bg-rose-50 dark:bg-rose-900/15"
                        : "border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700"}`}>
                    {(year === "2026" || year === "2025") && (
                      <div className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                        {year === "2026" ? "Latest" : "Recent"}
                      </div>
                    )}
                    <span className={`text-2xl font-black ${year === "2026" ? "text-rose-600" : year === "2025" ? "text-rose-500" : "text-slate-600 dark:text-slate-300"}`}>
                      {year}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Board Exam</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PYQ SUBJECT SELECTION ── */}
          {step === "pyqsubject" && (
            <motion.div key="pyqsubject" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              {/* PYQ Year Banner */}
              <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-800/40 rounded-2xl px-4 py-3">
                <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-sm text-rose-700 dark:text-rose-400">{pyqYear} Board Exam PYQ</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{board} · {cls} · Select Subject</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto">
                {subjects.map((s, i) => (
                  <motion.button key={s} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSubject(s);
                      startTest(s, "pyq", pyqYear);
                    }}
                    className={`p-4 rounded-[20px] border flex items-center gap-3 text-left transition-all ${BOARD_COLORS[i % 7]}`}>
                    <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-white ${ICON_COLORS[i % 7]}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm">{s}</p>
                      <p className="text-[10px] opacity-60 font-semibold">{pyqYear} Board Exam · {cls}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Repeat2 className="w-3 h-3 opacity-30" />
                      <Play className="w-6 h-6 opacity-40" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── TEST ── */}
          {step === "test" && (
            <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-6 h-6 bg-primary/10 rounded-3xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <p className="font-black text-foreground">Generating AI Test...</p>
                  <p className="text-xs text-slate-400">Creating {subject} questions for {cls}</p>
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : questions.length > 0 && (
                <>
                  {/* Progress */}
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                      transition={{ duration: 0.4 }} />
                  </div>

                  {/* Question */}
                  <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border-2 border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                      {questions[current].importance === "High" && (
                        <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-red-500/20 animate-pulse">
                          <Star className="w-2.5 h-2.5 fill-current" /> High Chance
                        </div>
                      )}
                      <div className="bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-indigo-600/20">
                         {questions[current].examProbability}% Probability
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Question {current + 1} of {questions.length}
                      </p>
                      <button 
                        disabled={savedStatus[current] || saving}
                        onClick={() => saveMCQ()}
                        className={`p-2 rounded-xl transition-all ${savedStatus[current] ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary'}`}
                      >
                        {savedStatus[current] ? <BookmarkCheck className="w-6 h-6" /> : saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bookmark className="w-6 h-6" />}
                      </button>
                    </div>
                    
                    <div className="font-bold text-base text-foreground leading-relaxed">
                       <MathRenderer content={questions[current].text} />
                    </div>
                  </motion.div>

                  {/* Options */}
                  <div className="space-y-2">
                    {questions[current].options.map((opt, i) => {
                      const picked = answers[current];
                      const isCorrect = i === questions[current].correct;
                      const isPicked = picked === i;
                      const revealed = picked !== null;
                      return (
                        <motion.button key={i} whileTap={{ scale: 0.98 }}
                          onClick={() => pickAnswer(i)}
                          className={`w-full p-3.5 rounded-xl border text-left text-sm font-semibold flex items-center gap-3 transition-all
                            ${!revealed ? "bg-white dark:bg-slate-800 border-border hover:border-primary hover:bg-primary/5" :
                              isCorrect ? "bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-950/30" :
                              isPicked ? "bg-red-50 border-red-400 text-red-800 dark:bg-red-950/30" :
                              "bg-slate-50 dark:bg-slate-900 border-border opacity-50"}`}>
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0
                            ${!revealed ? "bg-slate-100 dark:bg-slate-700" :
                              isCorrect ? "bg-emerald-500 text-white" :
                              isPicked ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                            {["A","B","C","D"][i]}
                          </span>
                          <span className="flex-1">
                            <MathRenderer content={opt} />
                          </span>
                          {revealed && isCorrect && <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />}
                          {revealed && isPicked && !isCorrect && <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Nav */}
                  {answers[current] !== null && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      {current < questions.length - 1 ? (
                        <button onClick={() => setCurrent(current + 1)}
                          className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-sm flex items-center justify-center gap-2">
                          Next <ChevronRight className="w-6 h-6" />
                        </button>
                      ) : (
                        <button onClick={finish}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2">
                          <Trophy className="w-6 h-6" /> Finish Test
                        </button>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
              {/* Score */}
              <div className={`p-6 rounded-2xl text-center ${score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200' : score >= 50 ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200' : 'bg-red-50 dark:bg-red-950/20 border border-red-200'}`}>
                <div className={`text-5xl font-black mb-1 ${score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {score}%
                </div>
                <p className="font-black text-sm text-foreground">{board} · {cls} · {subject}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {questions.filter((q, i) => answers[i] === q.correct).length}/{questions.length} correct
                </p>
                <div className={`mt-2 text-sm font-black ${score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {score >= 75 ? "🎉 Excellent!" : score >= 50 ? "👍 Good effort!" : "📖 Needs revision"}
                </div>
              </div>

              {/* Weak Areas */}
              {weakAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                    <p className="text-sm font-black text-foreground">Weak Areas Found</p>
                  </div>
                  <div className="space-y-2">
                    {weakAreas.map((w, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-black text-foreground">{w.topic}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {w.wrong}/{w.total} wrong · {w.wrong === w.total ? "Re-read chapter" : "Revise concepts"}
                          </p>
                        </div>
                        <div className="w-6 h-6 rounded-xl bg-red-500 flex items-center justify-center text-white text-xs font-black">
                          {Math.round(((w.total - w.wrong) / w.total) * 100)}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {weakAreas.length === 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl p-4">
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">No weak areas! All topics answered correctly 🎯</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => {
                    if (isSubscribed) {
                       setStep("review");
                    } else {
                       alert("🔒 AI Review Analysis is a Premium Feature. Upgrade to unlock step-by-step explanations for your mistakes.");
                    }
                  }}
                  className={`py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg ${isSubscribed ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-200 text-slate-500 shadow-none'}`}>
                  {isSubscribed ? <Brain className="w-6 h-6" /> : <Lock className="w-6 h-6" />} Review Mistakes
                </button>
                <button onClick={reset}
                  className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-black text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6" /> Reset
                </button>
              </div>
            </motion.div>
          )}

          {/* ── REVIEW MISTAKES ── */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm uppercase tracking-widest text-primary">Mistake Analysis</h4>
                <div className="text-[10px] font-bold text-slate-400">Showing {questions.filter((q, i) => answers[i] !== q.correct).length} errors</div>
              </div>
              
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, i) => {
                  if (answers[i] === q.correct) return null;
                  return (
                    <div key={i} className="bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/30 rounded-[28px] p-5 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3">
                         <button 
                          disabled={savedStatus[i] || saving}
                          onClick={() => saveMCQ(i)}
                          className={`p-2 rounded-xl transition-all ${savedStatus[i] ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                        >
                          {savedStatus[i] ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="pr-10">
                        <p className="text-[10px] font-black text-red-500 uppercase mb-2">Question {i + 1}</p>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                           <MathRenderer content={q.text} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                          <p className="text-[9px] font-black text-red-600 uppercase mb-1">Your Answer</p>
                          <p className="text-xs font-bold text-red-800 dark:text-red-400">
                             {answers[i] !== null ? <MathRenderer content={q.options[answers[i] as number]} /> : "Not Answered"}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Correct Answer</p>
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                             <MathRenderer content={q.options[q.correct]} />
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-3.5 h-3.5 text-primary" />
                          <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">AI Explanation</p>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                           <MathRenderer content={q.explanation || "No detailed explanation provided by AI."} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setStep("result")}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20">
                Back to Result
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      {newBadge && (
        <BadgeUnlockOverlay 
          badgeName={newBadge.name} 
          onClose={() => setNewBadge(null)} 
        />
      )}
    </div>
  );
}
