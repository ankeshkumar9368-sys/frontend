"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Clock, Flag, 
  CheckCircle2, AlertCircle, Send, X, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MathRenderer from "./MathRenderer";
import { recordMistake } from "../lib/analytics";
import { generateSingleReplacementQuestion } from "../lib/content";
interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface MockTestEngineProps {
  testTitle: string;
  subTitle?: string;
  durationMinutes: number;
  questions: Question[];
  onComplete: (score: number, total: number, results: any[]) => void;
  onExit: () => void;
  isSubscribed?: boolean;
  onUpgrade?: () => void;
  onCorrectAnswer?: (questionText: string) => void;
  userData?: any;
}

export default function MockTestEngine({ testTitle, userData, subTitle, durationMinutes, questions, onComplete, onExit, isSubscribed = false, onUpgrade, onCorrectAnswer }: MockTestEngineProps) {
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(questions);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lives, setLives] = useState(3);
  
  // 🧠 ADAPTIVE ENGINE STATE
  const [difficulty, setDifficulty] = useState(2); // 1: Easy, 2: Medium, 3: Hard, 4: Expert, 5: Extreme
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx: number) => {
    if (answers[currentIdx] !== undefined) return;

    const currentQ = activeQuestions[currentIdx];
    const isCorrect = optIdx === currentQ.correctAnswer;

    setAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
    setTotalAttempted(prev => prev + 1);
    if (isCorrect) setTotalCorrect(prev => prev + 1);

    if (isCorrect) {
      if (onCorrectAnswer) {
        onCorrectAnswer(currentQ.text);
      }

      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setWrongStreak(0);
      
      if (newStreak >= 2 && difficulty < 5) {
        setDifficulty(prev => prev + 1);
        setCorrectStreak(0);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 2000);
      }
    } else {
      const newWStreak = wrongStreak + 1;
      setWrongStreak(newWStreak);
      setCorrectStreak(0);

      if (newWStreak >= 2 && difficulty > 1) {
        setDifficulty(prev => prev - 1);
        setWrongStreak(0);
      }

      if (!isSubscribed) {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          onUpgrade?.();
        }
      }
      
      recordMistake({
        question: currentQ.text,
        options: currentQ.options,
        correctAnswer: currentQ.options[currentQ.correctAnswer],
        userAnswer: currentQ.options[optIdx],
        topicId: testTitle.replace(/\s+/g, '_').toLowerCase(),
        topicName: testTitle,
        subject: subTitle || "Academic"
      });
    }

    // Background generation and auto-advance removed to respect manual navigation.
    // The UI handles 'Next' logic via the Finish/Next button.
  };

  const toggleReview = () => {
    const newSet = new Set(markedForReview);
    if (newSet.has(currentIdx)) newSet.delete(currentIdx);
    else newSet.add(currentIdx);
    setMarkedForReview(newSet);
  };

  const getDifficultyLabel = () => {
    switch(difficulty) {
      case 1: return { label: "Elementary", color: "text-emerald-500", bg: "bg-emerald-500" };
      case 2: return { label: "Intermediate", color: "text-blue-500", bg: "bg-blue-500" };
      case 3: return { label: "Challenging", color: "text-amber-500", bg: "bg-amber-500" };
      case 4: return { label: "Expert", color: "text-rose-500", bg: "bg-rose-500" };
      case 5: return { label: "EXTREME", color: "text-purple-600", bg: "bg-purple-600" };
      default: return { label: "Standard", color: "text-slate-500", bg: "bg-slate-500" };
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    onComplete(totalCorrect, totalAttempted || activeQuestions.length, []);
  };

  const currentQuestion = activeQuestions[currentIdx] || activeQuestions[0];
  const dStyle = getDifficultyLabel();

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col">
      {/* 🚀 LEVEL UP OVERLAY */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl p-10 rounded-[48px] border-4 border-yellow-500 shadow-[0_0_100px_rgba(234,179,8,0.4)] text-center">
              <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Difficulty Boosted!</h2>
              <p className="text-yellow-500 font-black uppercase tracking-widest mt-2">Entering {dStyle.label} Tier</p>
              <p className="text-white/50 text-xs font-bold mt-4">+50% XP Multiplier Active</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between glass-card">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h3 className="font-black text-sm tracking-tight truncate max-w-[200px]">{testTitle}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${dStyle.bg} text-white transition-all`}>
                {dStyle.label}
              </span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-1.5 h-3 rounded-full ${i <= difficulty ? dStyle.bg : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* HEARTS SYSTEM */}
          {!isSubscribed && (
            <div className="flex gap-1 items-center bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
              {[1, 2, 3].map(i => (
                <span key={i} className={`text-sm ${i <= lives ? '' : 'grayscale opacity-30'} transition-all`}>❤️</span>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-all ${timeLeft < 300 ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 bg-slate-50 dark:bg-slate-900 text-slate-700'}`}>
            <Clock className="w-6 h-6" />
            <span className="font-black tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={handleSubmit}
            className="bg-primary text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Main Test Area */}
      <main className="flex-1 overflow-y-auto p-5 md:p-10 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Question Meta */}
          <div className="flex justify-between items-center">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <button 
              onClick={toggleReview}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${markedForReview.has(currentIdx) ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}
            >
              <Flag className="w-3.5 h-3.5" /> {markedForReview.has(currentIdx) ? 'Marked' : 'Review'}
            </button>
          </div>

          {/* Question Text */}
          <div className="glass-card p-5 rounded-[32px] border border-border shadow-sm">
            <div className="text-lg md:text-xl font-bold leading-relaxed text-slate-800 dark:text-slate-100">
              <MathRenderer content={currentQuestion.text} />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((opt, i) => (
              <motion.div 
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectOption(i)}
                className={`p-5 rounded-[24px] border-2 cursor-pointer transition-all flex items-center gap-4 group ${answers[currentIdx] === i ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-100 dark:border-slate-800 glass-card hover:border-primary/30'}`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center font-black transition-all ${answers[currentIdx] === i ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <div className={`font-bold text-sm md:text-base ${answers[currentIdx] === i ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                  <MathRenderer content={opt} />
                </div>
                {answers[currentIdx] === i && (
                  <div className="ml-auto">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="p-4 glass-card border-t border-border flex items-center justify-between">
        <button 
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(prev => prev - 1)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 disabled:opacity-30 transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" /> Prev
        </button>

        {/* Question Palette (Compact for Mobile) */}
        <div className="hidden md:flex gap-1.5 overflow-x-auto max-w-sm px-4">
          {questions.map((_, i) => (
            <button 
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all shrink-0 ${currentIdx === i ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''} ${answers[i] !== undefined ? 'bg-emerald-500 text-white' : markedForReview.has(i) ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button 
          onClick={() => currentIdx < questions.length - 1 ? setCurrentIdx(prev => prev + 1) : handleSubmit()}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 dark:bg-primary text-white shadow-lg active:scale-95 transition-all"
        >
          {currentIdx === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
}
