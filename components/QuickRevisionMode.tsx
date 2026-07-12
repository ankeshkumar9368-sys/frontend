"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, ChevronLeft, RotateCcw, CheckCircle, X, Brain, BookOpen } from "lucide-react";
import { model } from "../lib/gemini";

interface FlashCard {
  front: string;
  back: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
}

function CardFace({ text, isBack }: { text: string; isBack: boolean }) {
  return (
    <div className={`absolute inset-0 p-6 flex flex-col items-center justify-center text-center backface-hidden ${isBack ? "rotate-y-180" : ""}`}>
      <p className={`font-black leading-relaxed ${isBack ? "text-lg text-foreground" : "text-xl text-foreground"}`}>{text}</p>
    </div>
  );
}

export default function QuickRevisionMode({
  topic,
  onExit,
}: {
  topic: string;
  onExit: () => void;
}) {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = `Generate 8 flash cards for quick revision of topic: "${topic}".
Return strict JSON array:
[{"front":"Concept or Question","back":"Short crisp answer (1-2 lines)","hint":"Memory hint","difficulty":"easy|medium|hard"}]`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const data = JSON.parse(match[0]);
        setCards(data);
      }
    } catch (e) {
      // fallback cards
      setCards([
        { front: `What is ${topic}?`, back: "Core definition based on NCERT syllabus.", hint: "Think basics", difficulty: "easy" },
        { front: `Key formula in ${topic}?`, back: "Main equation/principle", hint: "Recall equation", difficulty: "medium" },
        { front: `${topic} VVIP exam point?`, back: "Most important exam-oriented fact", hint: "Think previous papers", difficulty: "hard" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => { generate(); }, [generate]);

  const next = () => {
    setFlipped(false);
    setTimeout(() => {
      if (current + 1 >= cards.length) setDone(true);
      else setCurrent(c => c + 1);
    }, 200);
  };

  const prev = () => {
    setFlipped(false);
    setTimeout(() => setCurrent(c => Math.max(0, c - 1)), 200);
  };

  const markKnown = () => {
    setKnown(k => {
      const nextSet = new Set(k);
      nextSet.add(current);
      return nextSet;
    });
    next();
  };

  const diffColor: Record<string, string> = {
    easy: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
    medium: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200",
    hard: "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200",
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <div>
            <h3 className="font-black text-white text-xs">Quick Revision</h3>
            <p className="text-[9px] text-slate-400 truncate w-32">{topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-400">
            {current + 1}/{cards.length} · ✅ {known.size}
          </span>
          <button onClick={onExit} className="p-1.5 bg-white/10 rounded-full">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((current + 1) / Math.max(cards.length, 1)) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-6 h-6 text-primary" />
            </motion.div>
            <p className="text-white font-black">AI generating flash cards...</p>
          </div>
        ) : done ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
            <div className="w-6 h-6 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Revision Done!</h2>
            <p className="text-slate-400 text-sm font-bold">
              ✅ {known.size} Known · 🔄 {cards.length - known.size} Review
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setCurrent(0); setFlipped(false); setDone(false); setKnown(new Set()); generate(); }}
                className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-6 h-6" /> Restart
              </button>
              <button onClick={onExit} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black">
                Done
              </button>
            </div>
          </motion.div>
        ) : cards.length > 0 ? (
          <>
            {/* Difficulty badge */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${diffColor[cards[current]?.difficulty] || ""}`}>
              {cards[current]?.difficulty}
            </span>

            {/* Flash Card */}
            <div
              className="w-full max-w-xs h-48 cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={() => setFlipped(f => !f)}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
                  <BookOpen className="w-6 h-6 text-primary mb-2" />
                  <p className="font-black text-base text-foreground leading-snug">{cards[current]?.front}</p>
                  <p className="text-[9px] text-slate-400 mt-2 font-semibold italic">Tap to reveal</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-primary rounded-2xl p-5 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                  <p className="font-black text-base text-white leading-snug">{cards[current]?.back}</p>
                  {cards[current]?.hint && (
                    <p className="text-white/60 text-[10px] mt-2 font-semibold italic">💡 {cards[current].hint}</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={prev}
                disabled={current === 0}
                className="p-3 bg-white/10 text-white rounded-xl disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black text-[11px]"
              >
                Skip
              </button>
              <button
                onClick={markKnown}
                className="flex-2 bg-emerald-500 text-white py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Got It!
              </button>
              <button
                onClick={next}
                className="p-3 bg-white/10 text-white rounded-xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
