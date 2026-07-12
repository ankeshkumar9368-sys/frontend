"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, ChevronRight, ChevronLeft, 
  RotateCcw, CheckCircle2, X, Brain,
  Sparkles, Star, Trophy
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { getMistakes, removeMistake } from "../lib/analytics";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  topicName?: string;
}

interface FlashcardForgeProps {
  onClose: () => void;
}

export default function FlashcardForge({ onClose }: FlashcardForgeProps) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    const fetchMistakesAsCards = () => {
      try {
        const mistakes = getMistakes();
        const fetched = mistakes.map(m => ({
          id: m.id,
          question: m.question,
          answer: m.correctAnswer,
          topicName: m.topicName
        }));
        setCards(fetched);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakesAsCards();
  }, []);

  const handleNext = async () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % cards.length);
    }, 150);
    // Track flashcardsReviewed achievement
    if (auth.currentUser?.uid) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          flashcardsReviewed: increment(1)
        });
      } catch (e) {
        console.error("Failed to track flashcard review:", e);
      }
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIdx(prev => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleMastered = async () => {
    const cardId = cards[currentIdx].id;
    try {
      removeMistake(cardId);
      const newCards = cards.filter(c => c.id !== cardId);
      setCards(newCards);
      setMasteredCount(prev => prev + 1);
      setIsFlipped(false);
      if (currentIdx >= newCards.length) setCurrentIdx(Math.max(0, newCards.length - 1));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white font-black uppercase tracking-widest text-xs">Forging Your Flashcards...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase leading-none">Flashcard Forge</h2>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">Mastering Your Mistakes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span className="text-xs font-black text-white">{masteredCount} Mastered</span>
        </div>
      </header>

      {/* Main Forge Area */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6">
        {cards.length > 0 ? (
          <div className="w-full max-w-lg space-y-12">
            
            {/* Card Container */}
            <div className="relative h-[450px] [perspective:1000px]">
              <motion.div 
                className="relative w-full h-full [transform-style:preserve-3d] cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full bg-white rounded-[48px] shadow-2xl p-10 flex flex-col items-center justify-center text-center backface-hidden border-8 border-slate-50">
                   <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                     Question
                   </div>
                   <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-relaxed">
                     {cards[currentIdx].question}
                   </h3>
                   <div className="absolute bottom-10 flex flex-col items-center gap-2">
                     <RotateCcw className="w-6 h-6 text-slate-300 animate-spin-slow" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap to reveal answer</p>
                   </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full bg-slate-900 rounded-[48px] shadow-2xl p-10 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)] backface-hidden border-8 border-slate-800">
                   <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                     Correct Answer
                   </div>
                   <div className="space-y-6">
                     <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tight">
                       {cards[currentIdx].answer}
                     </h3>
                     <p className="text-sm font-medium text-slate-400 leading-relaxed">
                        Topic: <span className="text-emerald-400 font-bold">{cards[currentIdx].topicName || "General"}</span>
                     </p>
                   </div>
                   <div className="absolute bottom-10 flex gap-4 w-full px-10">
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleMastered(); }}
                       className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                     >
                       <CheckCircle2 className="w-6 h-6" /> I Got It!
                     </button>
                   </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between px-10">
              <button 
                onClick={handlePrev}
                className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <p className="text-white text-2xl font-black italic">{currentIdx + 1} <span className="text-white/30">/ {cards.length}</span></p>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">Active Deck</p>
              </div>
              <button 
                onClick={handleNext}
                className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center space-y-8 max-w-sm">
            <div className="w-32 h-32 bg-emerald-500/10 rounded-[40px] flex items-center justify-center mx-auto border border-emerald-500/20">
              <Star className="w-6 h-6 text-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white italic uppercase leading-none">Forge Empty!</h3>
              <p className="text-slate-400 font-medium leading-relaxed">Amazing! You've mastered all your mistakes. Go practice some more to forge new cards.</p>
            </div>
            <button onClick={onClose} className="w-full bg-white text-slate-900 py-5 rounded-[28px] font-black uppercase tracking-widest shadow-xl shadow-white/10 hover:scale-105 transition-all">Back to Dashboard</button>
          </div>
        )}
      </main>

      {/* Forge Status Footer */}
      {cards.length > 0 && (
        <footer className="relative z-10 p-10 bg-white/5 border-t border-white/5 backdrop-blur-xl flex justify-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Active Learning Loop</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">AI Generated Cards</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
