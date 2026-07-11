"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, BookOpen, Target, Brain, TrendingUp,
  Zap, RotateCcw, CheckCircle, ChevronRight, Flame, Star
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: BookOpen,
    emoji: "🎯",
    title: "Select Board / Class / Subject",
    desc: "Choose your exam board, class level, and subject. The AI customizes everything based on your selection.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/40",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: 2,
    icon: Brain,
    emoji: "📖",
    title: "AI Smart Notes Generated",
    desc: "Gemini AI instantly creates personalized notes — with formulas, VVIP points, memory tricks, and Hindi explanations.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-900/40",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: 3,
    icon: Target,
    emoji: "📝",
    title: "Practice Test",
    desc: "Take an AI-generated adaptive MCQ test. Difficulty adjusts automatically based on your performance history.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: 4,
    icon: TrendingUp,
    emoji: "🔍",
    title: "AI Analyzes Performance",
    desc: "Instantly after every test, AI scans your answers, calculates accuracy, identifies error patterns.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/40",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: 5,
    icon: Zap,
    emoji: "⚠️",
    title: "Weak Topics Detected",
    desc: "The AI pinpoints exact sub-topics where you scored below 60%. Heatmap shows red/orange zones.",
    color: "from-red-500 to-rose-600",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900/40",
    textColor: "text-red-600 dark:text-red-400",
  },
  {
    id: 6,
    icon: BookOpen,
    emoji: "📚",
    title: "Smart Notes Update",
    desc: "Notes are regenerated with extra focus on your weak areas — simpler explanations and more practice questions.",
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-900/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: 7,
    icon: Brain,
    emoji: "💬",
    title: "Doubt Solve",
    desc: "Ask AI your doubts via text or voice. Get instant step-by-step explanations tailored to your level.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-900/40",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  {
    id: 8,
    icon: RotateCcw,
    emoji: "📅",
    title: "Study Plan Updates",
    desc: "Your daily study plan auto-adjusts. Weak topics get more sessions, strong topics enter spaced revision.",
    color: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    border: "border-teal-200 dark:border-teal-900/40",
    textColor: "text-teal-600 dark:text-teal-400",
  },
];

export default function SystemFlowModal({ onClose }: { onClose: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const next = () => {
    if (animating) return;
    if (activeStep < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => { setActiveStep(s => s + 1); setAnimating(false); }, 200);
    }
  };

  const prev = () => {
    if (animating) return;
    if (activeStep > 0) {
      setAnimating(true);
      setTimeout(() => { setActiveStep(s => s - 1); setAnimating(false); }, 200);
    }
  };

  const step = STEPS[activeStep];
  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-black text-white text-sm">How ExamHero AI Works</h3>
            <p className="text-[10px] text-slate-400">The Learning Loop — 8-Step System</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-5 px-5">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`rounded-full transition-all duration-300 ${i === activeStep ? "w-6 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-white/20"}`}
          />
        ))}
      </div>

      {/* Step counter */}
      <div className="text-center mt-2">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Step {activeStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm space-y-6"
          >
            {/* Step number badge */}
            <div className="flex justify-center">
              <div className={`w-24 h-24 rounded-[32px] bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl relative`}>
                <span className="text-4xl">{step.emoji}</span>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                  {step.id}
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-white leading-tight mb-3">{step.title}</h2>
              <p className="text-slate-300 font-medium text-sm leading-relaxed">{step.desc}</p>
            </div>

            {/* Context card */}
            <div className={`rounded-2xl p-4 border ${step.bg} ${step.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <StepIcon className={`w-6 h-6 ${step.textColor}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${step.textColor}`}>Key Action</span>
              </div>
              <p className={`text-xs font-bold ${step.textColor}`}>
                {activeStep === 0 && "🎓 Supports 22+ boards: CBSE, ICSE, Maharashtra, Karnataka, Tamil Nadu & more"}
                {activeStep === 1 && "🤖 AI generates unique notes for every topic in seconds using Gemini Flash"}
                {activeStep === 2 && "⚡ Adaptive difficulty: Easy → Medium → Hard based on your past accuracy"}
                {activeStep === 3 && "📊 Accuracy %, subject-wise breakdown, time analysis — all auto-calculated"}
                {activeStep === 4 && "🔴 Topics below 60% accuracy are flagged as Critical in your Heatmap"}
                {activeStep === 5 && "🔁 Notes refresh automatically with extra weak-area booster content"}
                {activeStep === 6 && "🎙️ Voice or text doubt solving — AI responds in Hindi + English"}
                {activeStep === 7 && "🔂 Spaced Repetition (SM-2) ensures you never forget what you learned"}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-5 border-t border-white/10 flex gap-3">
        <button
          onClick={prev}
          disabled={activeStep === 0}
          className="px-6 py-4 bg-white/10 text-white rounded-2xl font-black disabled:opacity-30 transition-all"
        >
          ← Back
        </button>
        {activeStep < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="flex-1 bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-6 h-6" /> Start Learning!
          </button>
        )}
      </div>

      {/* Mini flow diagram at bottom */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between overflow-x-auto gap-1 hide-scrollbar">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveStep(i)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${i === activeStep ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" : i < activeStep ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-500"}`}
              >
                {i < activeStep ? "✓" : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 rounded-full ${i < activeStep ? "bg-emerald-500/50" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
