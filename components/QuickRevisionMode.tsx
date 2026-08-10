"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, ChevronLeft, RotateCcw, CheckCircle, X, Brain, BookOpen, Languages, Sparkles } from "lucide-react";
import { model } from "../lib/gemini";

interface FlashCard {
  front: string;
  frontHindi?: string;
  back: string;
  backHindi?: string;
  hint?: string;
  hintHindi?: string;
  difficulty: "easy" | "medium" | "hard";
}

function CardFace({ 
  text, 
  textHindi, 
  isBack, 
  langMode 
}: { 
  text: string; 
  textHindi?: string; 
  isBack: boolean;
  langMode: "dual" | "hi" | "en";
}) {
  const showEn = langMode === "en" || langMode === "dual" || !textHindi;
  const showHi = (langMode === "hi" || langMode === "dual") && !!textHindi;

  return (
    <div className={`absolute inset-0 p-6 flex flex-col items-center justify-center text-center backface-hidden ${isBack ? "rotate-y-180" : ""}`}>
      <div className="space-y-3 max-w-lg">
        {showEn && (
          <p className={`font-black leading-relaxed ${isBack ? "text-base sm:text-lg text-foreground" : "text-lg sm:text-xl text-foreground"}`}>
            {text}
          </p>
        )}
        {showHi && (
          <div className={`${showEn ? "pt-2 border-t border-white/10" : ""}`}>
            <p className={`font-bold leading-relaxed text-emerald-400 dark:text-emerald-300 ${isBack ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
              🇮🇳 {textHindi}
            </p>
          </div>
        )}
      </div>
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
  const [langMode, setLangMode] = useState<"dual" | "hi" | "en">("dual");

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const prompt = `Generate 8 high-impact BILINGUAL (English + Hindi) flash cards for quick revision of topic: "${topic}".
Return strict JSON array:
[
  {
    "front": "Concept or Question in English",
    "frontHindi": "हिंदी में प्रश्न या अवधारणा (Devanagari)",
    "back": "Short crisp answer (1-2 lines) in English",
    "backHindi": "1-2 पंक्तियों में स्पष्ट हिंदी उत्तर (Devanagari)",
    "hint": "Memory hint in English",
    "hintHindi": "स्मृति संकेत हिंदी में",
    "difficulty": "easy|medium|hard"
  }
]`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const data = JSON.parse(match[0]);
        setCards(data);
      }
    } catch (e) {
      // BILINGUAL Fallback cards
      setCards([
        { 
          front: `What is ${topic}?`, 
          frontHindi: `${topic} क्या है?`,
          back: "Core definition based on NCERT syllabus.", 
          backHindi: "NCERT पाठ्यक्रम पर आधारित मुख्य परिभाषा।",
          hint: "Think core principles", 
          hintHindi: "मूल सिद्धांतों को याद करें",
          difficulty: "easy" 
        },
        { 
          front: `Key formula / law in ${topic}?`, 
          frontHindi: `${topic} का मुख्य सूत्र या नियम क्या है?`,
          back: "Main equation and rule applied in board exam questions.", 
          backHindi: "बोर्ड परीक्षा के प्रश्नों में प्रयुक्त मुख्य समीकरण और नियम।",
          hint: "Recall equation & units", 
          hintHindi: "समीकरण और SI मात्रक याद करें",
          difficulty: "medium" 
        },
        { 
          front: `${topic} VVIP Exam Point?`, 
          frontHindi: `${topic} का सबसे महत्वपूर्ण परीक्षा बिंदु?`,
          back: "Most frequently tested concept in previous year board papers.", 
          backHindi: "विगत वर्षों के बोर्ड प्रश्नपत्रों में बार-बार पूछा जाने वाला बिंदु।",
          hint: "Think 5-mark repeated question", 
          hintHindi: "5 अंकों के बार-बार पूछे जाने वाले प्रश्न पर ध्यान दें",
          difficulty: "hard" 
        },
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
    <div className="fixed inset-0 z-[250] bg-slate-950/95 backdrop-blur-md flex flex-col font-sans select-none">
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Zap className="w-6 h-6 text-yellow-400 shrink-0" />
          <div className="truncate">
            <h3 className="font-black text-white text-xs sm:text-sm">Bilingual Quick Revision</h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[150px] sm:max-w-[250px]">{topic}</p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-900 border border-white/15 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setLangMode("dual")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${
              langMode === "dual" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            🌐 English + Hindi
          </button>
          <button
            onClick={() => setLangMode("hi")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${
              langMode === "hi" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            🇮🇳 Hindi
          </button>
          <button
            onClick={() => setLangMode("en")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors ${
              langMode === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            🇬🇧 English
          </button>
        </div>

        <button onClick={onExit} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Flashcard Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold animate-pulse">Generating Bilingual Revision Flashcards...</p>
          </div>
        ) : done ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/15 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black border border-emerald-500/30">
              🎉
            </div>
            <h3 className="text-xl font-black text-white">Revision Complete!</h3>
            <p className="text-xs text-slate-300 font-medium">
              You mastered <span className="text-emerald-400 font-black">{known.size}</span> of {cards.length} revision points for <span className="text-white font-bold">{topic}</span>.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => { setDone(false); setCurrent(0); setKnown(new Set()); generate(); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black text-xs py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Restart
              </button>
              <button onClick={onExit} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs py-3 rounded-2xl shadow-lg transition-transform hover:scale-105">
                Done
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            {/* Progress bar */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Card {current + 1} of {cards.length}</span>
              <span className={`px-2.5 py-0.5 rounded-full border uppercase text-[9px] font-black ${diffColor[cards[current]?.difficulty || "medium"]}`}>
                {cards[current]?.difficulty || "medium"}
              </span>
            </div>

            {/* Flip Card */}
            <div
              onClick={() => setFlipped(f => !f)}
              className="relative h-72 sm:h-80 w-full cursor-pointer perspective-1000"
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full relative preserve-3d bg-gradient-to-b from-slate-900 to-slate-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
              >
                <CardFace 
                  text={cards[current]?.front || ""} 
                  textHindi={cards[current]?.frontHindi} 
                  isBack={false} 
                  langMode={langMode} 
                />
                <CardFace 
                  text={cards[current]?.back || ""} 
                  textHindi={cards[current]?.backHindi} 
                  isBack={true} 
                  langMode={langMode} 
                />
              </motion.div>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              👆 Tap Card to Flip & View {flipped ? "Question" : "Answer"}
            </p>

            {/* Hint Box */}
            {(cards[current]?.hint || cards[current]?.hintHindi) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
                <p className="text-[11px] font-bold text-amber-300">
                  💡 Hint: {cards[current]?.hint}
                  {cards[current]?.hintHindi && <span className="block text-amber-200/80 font-medium">🇮🇳 {cards[current]?.hintHindi}</span>}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={prev}
                disabled={current === 0}
                className="p-3 bg-white/10 disabled:opacity-30 text-white rounded-2xl hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={markKnown}
                className="flex-1 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 font-black text-xs py-3 rounded-2xl transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Got It!
              </button>

              <button
                onClick={next}
                className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
