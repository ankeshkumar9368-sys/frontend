"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, PenTool, CheckCircle, ChevronRight, Loader2, Sparkles, ArrowLeft, Trophy } from "lucide-react";
import { generateSubjectiveQuestion, evaluateSubjectiveAnswer } from "../lib/content";
import { recordTestResult } from "../lib/analytics";
import { addXP } from "../lib/gamification";
import MathRenderer from "./MathRenderer";
import { getSubjects } from "../lib/curriculum";

type Step = "setup" | "loading" | "learn" | "write" | "evaluating" | "feedback";

interface SubQ {
  question: string;
  marks: number;
  perfectAnswer: string;
  keywords: string[];
}

interface EvalRes {
  score: number;
  feedback: string;
  tips: string;
}

export default function SubjectiveEngine({ userData, onExit }: { userData: any, onExit: () => void }) {
  const [step, setStep] = useState<Step>("setup");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questionData, setQuestionData] = useState<SubQ | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evalResult, setEvalResult] = useState<EvalRes | null>(null);

  const board = userData?.board || "CBSE";
  const cls = userData?.cls || "Class 10";
  const subjects = getSubjects(cls, board);

  const startGeneration = async (selectedSubject: string) => {
    setSubject(selectedSubject);
    setTopic(selectedSubject);
    setStep("loading");
    
    const data = await generateSubjectiveQuestion(selectedSubject, userData, "100% Highly Probable Board Exam Question");
    if (data) {
      setQuestionData(data);
      setStep("learn");
    } else {
      alert("Failed to generate question. Please try again.");
      setStep("setup");
    }
  };

  const startWriting = () => {
    setStep("write");
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !questionData) return;
    setStep("evaluating");
    
    const res = await evaluateSubjectiveAnswer(
      questionData.question,
      questionData.perfectAnswer,
      userAnswer,
      questionData.marks,
      userData
    );

    if (res) {
      setEvalResult(res);
      setStep("feedback");
      
      // Analytics & XP
      const pct = Math.round((res.score / questionData.marks) * 100);
      recordTestResult({
        topicId: "subjective_" + subject.toLowerCase(),
        topicName: "Subjective Mastery",
        subject: subject,
        cls: cls,
        score: pct,
        totalQ: 1,
        correctQ: res.score >= questionData.marks * 0.5 ? 1 : 0,
        timeTakenSec: 60
      });
      if (userData?.id) {
        addXP(userData.id, Math.round(res.score * 10), `Subjective Mastery: ${subject}`); // 10 XP per mark
      }
    } else {
      alert("Evaluation failed. Try again.");
      setStep("write");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 glass-panel border-b border-white/10 sticky top-0 z-10">
        <button onClick={onExit} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-300" />
        </button>
        <div className="flex items-center gap-2">
          <PenTool className="w-6 h-6 text-purple-400" />
          <span className="font-bold">Subjective Mastery</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <div className="w-6 h-6 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Write & Score 100%</h2>
                <p className="text-slate-400">Select a subject. AI will give you the most highly probable exam question to memorize and practice writing.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => startGeneration(s)}
                    className="p-4 rounded-2xl glass-card hover:bg-slate-800/80 transition-all text-left flex items-center justify-between group"
                  >
                    <span className="font-medium text-slate-200">{s}</span>
                    <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(step === "loading" || step === "evaluating") && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-4"
            >
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <p className="text-slate-400 font-medium">
                {step === "loading" ? "Finding 100% Exam Probable Question..." : "AI Examiner is checking your answer..."}
              </p>
            </motion.div>
          )}

          {step === "learn" && questionData && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6 pb-24"
            >
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-3">
                <BookOpen className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm"><strong>Step 1: Memorize.</strong> Read the perfect answer below. Once you remember the key points, you will write it from memory.</p>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-100"><MathRenderer content={questionData.question} /></h3>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-purple-400 font-bold text-sm border border-purple-500/30 whitespace-nowrap">
                    {questionData.marks} Marks
                  </span>
                </div>
                
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                    Perfect Topper Answer
                  </h4>
                  <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 prose prose-invert max-w-none">
                    <MathRenderer content={questionData.perfectAnswer} />
                  </div>
                </div>
              </div>

              <button
                onClick={startWriting}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
              >
                <PenTool className="w-6 h-6" />
                I have memorized it. Ready to Write!
              </button>
            </motion.div>
          )}

          {step === "write" && questionData && (
            <motion.div
              key="write"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-24"
            >
              <div className="glass-card rounded-2xl p-6 mb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-100"><MathRenderer content={questionData.question} /></h3>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-purple-400 font-bold text-sm border border-purple-500/30 whitespace-nowrap">
                    {questionData.marks} Marks
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 pl-1">Your Answer:</label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here from memory..."
                  className="w-full h-64 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-all"
                />
              </div>

              <button
                onClick={submitAnswer}
                disabled={userAnswer.trim().length < 10}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                Submit to AI Examiner
              </button>
            </motion.div>
          )}

          {step === "feedback" && questionData && evalResult && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6 pb-24"
            >
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 relative mb-4">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="289" strokeDashoffset={289 - (289 * evalResult.score) / questionData.marks} className={evalResult.score >= questionData.marks * 0.8 ? "text-emerald-500" : evalResult.score >= questionData.marks * 0.5 ? "text-yellow-500" : "text-red-500"} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-black">{evalResult.score}</span>
                    <span className="text-xs text-slate-400 font-bold">/ {questionData.marks}</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {evalResult.score === questionData.marks ? "Perfect Score!" : evalResult.score >= questionData.marks * 0.8 ? "Excellent Attempt!" : "Needs Improvement"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="glass-card rounded-2xl p-5 border-l-4 border-l-purple-500">
                  <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">AI Examiner Feedback</h4>
                  <p className="text-slate-200 leading-relaxed"><MathRenderer content={evalResult.feedback} /></p>
                </div>

                <div className="glass-card rounded-2xl p-5 border-l-4 border-l-emerald-500">
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Tips for Full Marks</h4>
                  <p className="text-slate-200 leading-relaxed"><MathRenderer content={evalResult.tips} /></p>
                </div>
                
                <div className="glass-card rounded-2xl p-5 opacity-70">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Original Perfect Answer</h4>
                  <div className="text-sm text-slate-300 line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                    <MathRenderer content={questionData.perfectAnswer} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setUserAnswer(""); startGeneration(subject); }}
                  className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
                >
                  Next Question
                </button>
                <button
                  onClick={onExit}
                  className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
