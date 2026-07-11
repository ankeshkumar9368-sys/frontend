"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Loader2, AlertCircle, Lightbulb, RotateCcw, ChevronRight } from "lucide-react";
import { model } from "../lib/gemini";

interface WrongQuestion {
  q: string;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
  explanation?: string;
}

interface AIExplanation {
  whyWrong: string;
  concept: string;
  trick: string;
  nextStep: string;
}

function QuestionCard({
  item,
  index,
  onAnalyze,
  analysis,
  loading,
}: {
  item: WrongQuestion;
  index: number;
  onAnalyze: (item: WrongQuestion) => void;
  analysis: AIExplanation | null;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-card rounded-[24px] border border-border overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-xl flex items-center justify-center text-sm font-black shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">{item.q}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-100 dark:border-red-900/30">
                Your: {item.userAnswer}
              </span>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/30">
                Correct: {item.correctAnswer}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="px-4 pb-4">
          <button
            onClick={() => { onAnalyze(item); setExpanded(true); }}
            className="w-full bg-primary/10 text-primary py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-primary/20"
          >
            <Brain className="w-6 h-6" />
            Why Did I Get This Wrong?
          </button>
        </div>
      )}

      {loading && (
        <div className="px-4 pb-4 flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-primary text-xs font-black">AI Analyzing...</span>
        </div>
      )}

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="h-px bg-border" />
              {[
                { label: "What Happened", text: analysis.whyWrong, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30" },
                { label: "📖 Concept", text: analysis.concept, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30" },
                { label: "🧠 Remember This", text: analysis.trick, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
                { label: "🚀 Next Step", text: analysis.nextStep, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
              ].map((section) => (
                <div key={section.label} className={`rounded-2xl p-3 border ${section.color}`}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1">{section.label}</p>
                  <p className="text-sm font-bold leading-relaxed">{section.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WhyGotWrong({
  wrongQuestions,
  testTitle,
  onClose,
  isSubscribed = false,
}: {
  wrongQuestions: WrongQuestion[];
  testTitle: string;
  onClose: () => void;
  isSubscribed?: boolean;
}) {
  const [analyses, setAnalyses] = useState<Record<string, AIExplanation>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const analyzeQuestion = async (item: WrongQuestion) => {
    if (!isSubscribed && Object.keys(analyses).length >= 1) {
      alert("Unlock unlimited Detailed Test Analysis with Premium!");
      return;
    }
    const id = item.q.slice(0, 20);
    if (analyses[id]) return;
    setLoadingId(id);
    try {
      const prompt = `Student got this wrong:
Question: "${item.q}"
Their Answer: "${item.userAnswer}"
Correct Answer: "${item.correctAnswer}"
Topic: "${item.topic}"

Explain why they got it wrong and how to remember. Return strict JSON:
{"whyWrong":"short reason for mistake (1-2 lines)","concept":"core concept explanation","trick":"memory trick to remember correct answer","nextStep":"action to improve this topic"}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setAnalyses(prev => ({ ...prev, [id]: data }));
      }
    } catch (e) {
      setAnalyses(prev => ({
        ...prev,
        [id]: {
          whyWrong: "Common misconception in this topic.",
          concept: `The correct answer is "${item.correctAnswer}". Review the core concept.`,
          trick: "Break down the question step by step before answering.",
          nextStep: `Revisit Smart Notes for ${item.topic}.`,
        },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const analyzeAll = async () => {
    for (const item of wrongQuestions) {
      await analyzeQuestion(item);
    }
  };

  return (
    <div className="fixed inset-0 z-[240] bg-slate-950/90 backdrop-blur-md flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Review Mistakes 💬</h3>
            <p className="text-[10px] text-slate-400">{testTitle} · {wrongQuestions.length} to review</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeAll}
            disabled={!!loadingId}
            className="bg-primary/20 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5"
          >
            <Brain className="w-3 h-3" />
            Explain All
          </button>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-[32px] flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white">Perfect Score! 🎉</h3>
          <p className="text-slate-400 font-bold">You didn't get any questions wrong!</p>
          <button onClick={onClose} className="bg-primary text-white px-8 py-4 rounded-2xl font-black">
            Back to Results
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3 flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-violet-400 shrink-0" />
            <p className="text-violet-300 text-xs font-bold">
              Tap any question to get an AI explanation. Learning from mistakes is the fastest way to improve! 🚀
            </p>
          </div>
          {wrongQuestions.map((item, i) => {
            const id = item.q.slice(0, 20);
            return (
              <QuestionCard
                key={i}
                item={item}
                index={i}
                onAnalyze={analyzeQuestion}
                analysis={analyses[id] || null}
                loading={loadingId === id}
              />
            );
          })}
          <div className="h-10" />
        </div>
      )}
    </div>
  );
}
