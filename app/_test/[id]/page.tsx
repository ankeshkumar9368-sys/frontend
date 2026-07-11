"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Target, BarChart3, AlertTriangle, BookOpen, ShieldAlert, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const DUMMY_QUESTIONS = [
  {
    id: 1,
    topic: "Linear Equations",
    text: "If 3x + 4y = 10 and 2x - y = 3, what is the value of x?",
    options: ["1", "2", "3", "4"],
    correct: 1
  },
  {
    id: 2,
    topic: "Quadratic Equations",
    text: "What are the roots of the equation x² - 5x + 6 = 0?",
    options: ["2, 3", "-2, -3", "1, 6", "-1, -6"],
    correct: 0
  },
  {
    id: 3,
    topic: "Polynomials",
    text: "Which of the following is a binomial?",
    options: ["3x²", "4x + 5y", "x² + 2x + 1", "7"],
    correct: 1
  },
  {
    id: 4,
    topic: "Linear Equations",
    text: "Solve for y: 2y + 5 = 15",
    options: ["10", "5", "2", "15"],
    correct: 1
  }
];

export default function MockTestEngine({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Anti-Cheat States
  const [testStarted, setTestStarted] = useState(false);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const isCheatWarningActive = useRef(false);

  const requestFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen request failed", e);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
    requestFullScreen();
  };

  const triggerCheatWarning = () => {
    if (isSubmitted || !testStarted || isCheatWarningActive.current) return;
    
    isCheatWarningActive.current = true;
    setCheatWarnings(prev => {
      const newWarnings = prev + 1;
      if (newWarnings >= 3) {
        handleSubmit(); // Auto submit on 3rd strike
      } else {
        setShowCheatWarning(true);
      }
      return newWarnings;
    });
  };

  const dismissWarning = () => {
    setShowCheatWarning(false);
    isCheatWarningActive.current = false;
    requestFullScreen();
  };

  // Anti-Cheat Listeners
  useEffect(() => {
    if (!testStarted || isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerCheatWarning();
      }
    };

    const handleBlur = () => {
      triggerCheatWarning();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [testStarted, isSubmitted]);

  // Timer Logic
  useEffect(() => {
    if (isSubmitted || !testStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, testStarted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelect = (qIndex: number, optIndex: number) => {
    setAnswers({ ...answers, [qIndex]: optIndex });
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    // Exit full screen if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (e) {}
    }
  };

  // Result Calculations
  const score = Object.keys(answers).reduce((acc, key) => {
    const k = Number(key);
    return acc + (answers[k] === DUMMY_QUESTIONS[k].correct ? 1 : 0);
  }, 0);
  
  const accuracy = Object.keys(answers).length > 0 ? Math.round((score / Object.keys(answers).length) * 100) : 0;
  
  // Find Weak Topics (where answer was wrong or missed)
  const weakTopics = Array.from(new Set(
    DUMMY_QUESTIONS.filter((q, idx) => answers[idx] !== q.correct).map(q => q.topic)
  ));

  // --- RENDERING ---

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-10 px-4">
        <h1 className="text-2xl font-black mb-2 text-center">Analysis Report</h1>
        {cheatWarnings >= 3 && (
          <p className="text-red-500 font-bold mb-6 text-center animate-pulse">Test Auto-Submitted due to Rule Violations</p>
        )}
        
        <div className="w-full max-w-md space-y-6">
          {/* Score Card */}
          <div className="bg-card p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-border text-center">
            <Target className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-5xl font-black text-primary">{score} <span className="text-xl text-slate-400">/ {DUMMY_QUESTIONS.length}</span></h2>
            <p className="text-slate-500 font-semibold mt-2 uppercase tracking-widest text-sm">Total Score</p>
            
            <div className="flex justify-around mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-3xl font-bold text-emerald-500">{accuracy}%</p>
                <p className="text-xs text-slate-500 font-medium">Accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-500">{formatTime(15 * 60 - timeLeft)}</p>
                <p className="text-xs text-slate-500 font-medium">Time Taken</p>
              </div>
            </div>
          </div>

          {/* Smart Guidance / Weak Topics */}
          {weakTopics.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold">Smart Guidance</h3>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">You are weak in the following topics. Review the notes before retesting.</p>
              
              <div className="space-y-2">
                {weakTopics.map(topic => (
                  <div key={topic} className="flex justify-between items-center bg-white dark:bg-orange-900/40 p-3 rounded-xl shadow-sm">
                    <span className="font-bold text-sm text-orange-900 dark:text-orange-200">{topic}</span>
                    <button onClick={() => router.push('/notes/algebra')} className="text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-950 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      <BookOpen className="w-3 h-3"/> Read Notes
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => router.push('/')} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl max-w-md w-full shadow-xl shadow-slate-200/50 dark:shadow-none border border-border text-center">
          <ShieldAlert className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-black mb-4">Strict Exam Mode</h1>
          <ul className="text-left space-y-3 mb-8 text-slate-600 dark:text-slate-300 text-sm">
            <li className="flex gap-2 items-start"><AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Exam will open in Full-Screen.</li>
            <li className="flex gap-2 items-start"><AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Do NOT switch tabs or minimize the browser.</li>
            <li className="flex gap-2 items-start"><AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Do NOT copy, paste, or right-click.</li>
            <li className="flex gap-2 items-start"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> <strong>3 warnings will result in auto-submission.</strong></li>
          </ul>
          <button 
            onClick={handleStartTest}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" /> Start Test Now
          </button>
        </div>
      </div>
    );
  }

  const q = DUMMY_QUESTIONS[currentQ];

  return (
    <div 
      className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* Anti-Cheat Warning Modal */}
      <AnimatePresence>
        {showCheatWarning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-card max-w-md w-full p-8 rounded-3xl text-center border-2 border-red-500 shadow-2xl shadow-red-500/20"
            >
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
              <h2 className="text-2xl font-black text-red-500 mb-2">Warning {cheatWarnings}/3</h2>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-8">
                You have switched tabs or lost focus. This is a strict exam mode. 
                {cheatWarnings === 2 && <span className="block mt-2 font-bold text-red-400">One more violation and your test will be auto-submitted!</span>}
              </p>
              <button 
                onClick={dismissWarning}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all"
              >
                I Understand, Return to Test
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-slate-600 dark:text-slate-300">
          Q {currentQ + 1} / {DUMMY_QUESTIONS.length}
        </h1>
        <div className={`flex items-center gap-2 font-black text-lg ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
          <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
        </div>
        <button 
          onClick={handleSubmit}
          className="text-sm bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
        >
          Submit
        </button>
      </header>

      {/* Progress Line */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(Object.keys(answers).length / DUMMY_QUESTIONS.length) * 100}%` }}></div>
      </div>

      {/* Question Area */}
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">{q.topic}</span>
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{q.text}</h2>
            </div>

            <div className="space-y-3 mt-auto mb-10">
              {q.options.map((opt, idx) => {
                const isSelected = answers[currentQ] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(currentQ, idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-card'
                    }`}
                  >
                    <span className="font-semibold text-[15px]">{opt}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav / Controls */}
      <div className="bg-card border-t border-border p-4 pb-safe flex justify-between items-center">
        <button 
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
          className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex gap-2">
          {DUMMY_QUESTIONS.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentQ === idx ? 'bg-primary scale-125' : 
                answers[idx] !== undefined ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={() => setCurrentQ(prev => Math.min(DUMMY_QUESTIONS.length - 1, prev + 1))}
          disabled={currentQ === DUMMY_QUESTIONS.length - 1}
          className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
