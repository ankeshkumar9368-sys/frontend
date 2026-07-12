"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  Zap, Sparkles, ChevronRight, RotateCcw, 
  Brain, BookOpen, Star, Share2, X, Check,
  Loader2, Bookmark, BookmarkCheck
} from "lucide-react";
import { fetchQuickStudyCards } from "../lib/content";
import { getSubjects } from "../lib/curriculum";
import { logFeatureUsage, checkAndIncrementUsage } from "../lib/analytics";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, orderBy, deleteDoc } from "firebase/firestore";
import { PlayCircle, PauseCircle } from "lucide-react";
import MathRenderer from "./MathRenderer";

interface Card {
  id: string;
  question: string;
  answer: string;
  subject: string;
  importance: string;
  factHindi?: string;
  answerHindi?: string;
}

export default function QuickStudyCards({ userData, onClose }: { userData: any, onClose: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [history, setHistory] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const [autoPlayMode, setAutoPlayMode] = useState<"with-answer" | "question-only" | null>(null);
  const [showAutoPlayModal, setShowAutoPlayModal] = useState(false);
  const [streak, setStreak] = useState(0);
  const [triggerSwipeDir, setTriggerSwipeDir] = useState<"left" | "right" | "up" | null>(null);
  const [isSelectingSubjects, setIsSelectingSubjects] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [viewingSavedCards, setViewingSavedCards] = useState(false);
  const [savedCardsList, setSavedCardsList] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const fetchSavedCards = async () => {
    if (!userData?.id) return;
    setIsLoadingSaved(true);
    try {
      const q = query(
        collection(db, "saved_cards"),
        where("userId", "==", userData.id),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      const cards = snap.docs.map(d => ({ dbId: d.id, ...d.data() }));
      setSavedCardsList(cards);
    } catch (error) {
      console.error("Error fetching saved cards", error);
    }
    setIsLoadingSaved(false);
  };


  useEffect(() => {
    const subs = getSubjects(userData?.cls || "10th", userData?.board || "CBSE");
    setAvailableSubjects(subs);
  }, [userData]);

  const handleFooterSwipe = (direction: "left" | "right") => {
    setTriggerSwipeDir(direction);
  };

  const loadMoreCards = useCallback(async () => {
    if (loading) return;
    const startTime = Date.now();
    setLoading(true);
    try {
      // Usage Check for Free Users
      if (!userData?.isSubscribed) {
        const { allowed, remaining } = await checkAndIncrementUsage(userData?.id, "Quick Study", 5); // 5 batches per day
        setUsageRemaining(remaining);
        if (!allowed) {
          setLoading(false);
          return;
        }
      }

      const newCards = await fetchQuickStudyCards(userData, selectedSubjects);
      setCards(prev => [...prev, ...newCards]);
      logFeatureUsage("Quick Study", "success", Date.now() - startTime, userData?.id);
    } catch (err) {
      console.error(err);
      logFeatureUsage("Quick Study", "failed", Date.now() - startTime, userData?.id);
    } finally {
      setLoading(false);
    }
  }, [userData, loading]);

  

  const handleSwipe = async (direction: "left" | "right" | "up") => {
    const swipedCard = cards[0];
    if (!swipedCard) return;

    try {
      await Haptics.impact({ style: direction === 'right' ? ImpactStyle.Heavy : ImpactStyle.Light });
    } catch(e) {}

    if (userData?.id) {
       try {
         const colName = direction === 'right' ? 'mastered_cards' : 'mistakes';
         await setDoc(doc(db, colName, `${userData.id}_${swipedCard.id}`), {
           userId: userData.id,
           cardId: swipedCard.id,
           question: swipedCard.question,
           correctAnswer: swipedCard.answer,
           topicName: swipedCard.subject,
           timestamp: serverTimestamp()
         }, { merge: true });
       } catch (e) {}
    }

    if (direction === 'right') {
       setStreak(prev => prev + 1);
    } else if (direction === 'left') {
       setStreak(0);
    }

    setHistory(prev => [...prev, swipedCard]);

    // Remove the top card
    setCards(prev => {
      const remaining = prev.slice(1);
      
      // Repetition logic: If swiped left (didn't know), high chance to repeat soon
      if (direction === 'left' && Math.random() < 0.6) {
        remaining.splice(Math.floor(Math.random() * Math.min(3, remaining.length)), 0, swipedCard);
      } else if (history.length > 0 && Math.random() < 0.2) {
        const randomPastCard = history[Math.floor(Math.random() * history.length)];
        return [...remaining, randomPastCard];
      }
      return remaining;
    });

    // Fetch more if running low
    if (cards.length < 5) {
      loadMoreCards();
    }
  };

  const handleAutoPlayClick = () => {
    if (autoPlayMode) {
      setAutoPlayMode(null);
    } else {
      setShowAutoPlayModal(true);
    }
  };

  if (viewingSavedCards) {
    return (
      <div className="relative flex flex-col p-6 min-h-[500px] max-h-[80vh] overflow-hidden w-full max-w-[400px] mx-auto bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xl font-black tracking-tight">Saved Cards</h3>
          </div>
          <button onClick={() => setViewingSavedCards(false)} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10">
          {isLoadingSaved ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : savedCardsList.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No saved cards yet.</p>
            </div>
          ) : (
            savedCardsList.map(sc => (
              <div key={sc.dbId} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-border relative">
                <button 
                  onClick={async () => {
                    await deleteDoc(doc(db, "saved_cards", sc.dbId));
                    setSavedCardsList(prev => prev.filter(p => p.dbId !== sc.dbId));
                  }}
                  className="absolute top-3 right-3 text-rose-500 hover:text-rose-600"
                >
                  <BookmarkCheck className="w-4 h-4 fill-rose-500" />
                </button>
                <div className="text-[10px] uppercase font-black text-slate-400 mb-2">{sc.topicName || "Subject"}</div>
                <div className="font-bold text-sm mb-3"><MathRenderer content={sc.question} /></div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl">
                  <MathRenderer content={sc.correctAnswer} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (isSelectingSubjects) {
    return (
      <div className="relative flex flex-col items-center justify-center p-6 min-h-[500px] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-50">
          <div className="w-8 h-8 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-xl font-black mb-2 tracking-tight">Select Subjects</h3>
        <p className="text-xs text-slate-500 mb-8 text-center max-w-[280px]">Select one or more subjects to generate personalized smart cards.</p>
        
        <button 
          onClick={() => {
            setViewingSavedCards(true);
            fetchSavedCards();
          }}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold transition-all"
        >
          <Bookmark className="w-4 h-4" /> View Saved Cards
        </button>
        <div className="flex flex-wrap gap-2 justify-center mb-10 w-full max-w-[340px]">
          {availableSubjects.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedSubjects.includes(sub) ? 'bg-primary text-white border-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-border'}`}
            >
              {sub}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setIsSelectingSubjects(false); loadMoreCards(); }}
          disabled={selectedSubjects.length === 0}
          className="w-full max-w-[280px] py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
        >
          Generate Smart Cards
        </button>
      </div>
    );
  }

  if (cards.length === 0 && loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Generating Smart Cards...</p>
      </div>
    );
  }

  const topCard = cards[0];

  return (
    <div className="relative flex flex-col items-center justify-center py-10 overflow-hidden">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">Quick Study</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{history.length} Learned</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors border border-border">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CARD STACK */}
      <div className="relative w-full max-w-[340px] h-[450px] perspective-1000 select-none touch-none">
        <AnimatePresence mode="popLayout">
          {topCard && (
            <StudyCard 
              key={topCard.id}
              card={topCard}
              onSwipe={(direction) => {
                setTriggerSwipeDir(null);
                handleSwipe(direction);
              }}
              isAutoPlay={autoPlayMode !== null}
              autoPlayMode={autoPlayMode}
              triggerSwipeDir={triggerSwipeDir}
              userData={userData}
            />
          )}
        </AnimatePresence>

        {/* Placeholder for "Empty" state or background cards */}
        {cards.length > 1 && (
          <div className="absolute inset-0 -z-10 scale-95 translate-y-4 bg-slate-200 dark:bg-slate-800 rounded-[40px] opacity-50" />
        )}
        
        {cards.length === 0 && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-[40px] border-2 border-border shadow-2xl text-center">
            <Brain className="w-4 h-4 text-slate-300 mb-4" />
            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2">No Cards Available</h4>
            <p className="text-sm font-medium text-slate-500">The AI couldn't generate cards for this topic, or you've learned them all! Try again later.</p>
            <button onClick={loadMoreCards} className="mt-6 px-6 py-3 bg-primary text-white rounded-full font-black text-sm active:scale-95 transition-transform">
              Retry Generation
            </button>
          </div>
        )}
      </div>

      {/* SWIPE INSTRUCTIONS */}
      <div className="mt-8 flex justify-between w-full max-w-[340px] px-4">
        <div className="flex flex-col items-center gap-1 opacity-70">
          <RotateCcw className="w-5 h-5 text-rose-500" />
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Swipe Left<br/>Needs Revision</span>
        </div>
        <div className="flex flex-col items-center justify-center opacity-40">
           <span className="text-[10px] font-bold text-slate-400">Drag Card</span>
           <div className="flex gap-1 mt-1">
             <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
             <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
             <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
           </div>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-70">
          <Check className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">Swipe Right<br/>Mastered</span>
        </div>
      </div>

      {/* AUTO PLAY OPTION MODAL */}
      <AnimatePresence>
        {showAutoPlayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-[32px] border border-border p-6 w-full max-w-[340px] space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-3 right-3">
                <button 
                  onClick={() => setShowAutoPlayModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-center space-y-2 pt-2">
                <div className="w-4 h-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto animate-bounce animate-pulse">
                  <PlayCircle className="w-7 h-7" />
                </div>
                <h4 className="font-black text-lg text-foreground">Select Auto Play Mode</h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">Let AI read out card concepts automatically</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAutoPlayMode("with-answer");
                    setShowAutoPlayModal(false);
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/30 text-left transition-all active:scale-98 animate-pulse"
                >
                  <p className="font-black text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                     📚 With Answer
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Shows Question (3s) → Shows Answer (3s) → Auto Swipes</p>
                </button>

                <button
                  onClick={() => {
                    setAutoPlayMode("question-only");
                    setShowAutoPlayModal(false);
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/30 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/10 dark:hover:bg-amber-950/30 text-left transition-all active:scale-98"
                >
                  <p className="font-black text-sm text-amber-700 dark:text-amber-500 flex items-center gap-2">
                     🎯 Question Only
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Shows Question (3s) → Auto Swipes (Skips Answer)</p>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StudyCard({ 
  card, 
  onSwipe, 
  isAutoPlay, 
  autoPlayMode,
  triggerSwipeDir,
  userData
}: { 
  card: Card, 
  onSwipe: (dir: "left" | "right" | "up") => void, 
  isAutoPlay?: boolean,
  autoPlayMode?: "with-answer" | "question-only" | null,
  triggerSwipeDir: "left" | "right" | "up" | null,
  userData: any
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);

  const getFontSizeClass = (text: string) => {
    const len = text ? text.length : 0;
    if (len > 150) return "text-sm sm:text-base font-bold leading-relaxed";
    if (len > 80) return "text-base sm:text-lg font-extrabold leading-snug";
    return "text-lg sm:text-xl font-black leading-tight";
  };

  const swipeAway = (dir: "left" | "right" | "up") => {
    if (hasSwiped) return;
    setHasSwiped(true);

    const targetX = dir === "right" ? 500 : dir === "left" ? -500 : 0;
    const targetY = dir === "up" ? -600 : 0;

    animate(x, targetX, { type: "spring", stiffness: 350, damping: 28 });
    animate(y, targetY, { type: "spring", stiffness: 350, damping: 28 }).then(() => {
      onSwipe(dir);
    });
  };

  const handleDragEnd = (event: any, info: any) => {
    if (hasSwiped) return;
    
    const threshold = 120;
    const velocityThreshold = 500;
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      swipeAway("right");
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      swipeAway("left");
    } else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      swipeAway("up");
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  // Programmatic swipe listener
  useEffect(() => {
    if (triggerSwipeDir) {
      swipeAway(triggerSwipeDir);
    }
  }, [triggerSwipeDir]);

  // Autoplay Timer Lifecycle
  useEffect(() => {
    if (!isAutoPlay || !autoPlayMode || hasSwiped) {
      setTimerProgress(0);
      return;
    }

    const duration = 3000; // 3s per phase
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setTimerProgress(Math.min(elapsed / duration, 1));

      if (elapsed >= duration) {
        clearInterval(timer);
        if (autoPlayMode === "with-answer") {
          if (!isFlipped) {
            setIsFlipped(true);
            setTimerProgress(0);
          } else {
            swipeAway("right");
          }
        } else {
          // question-only: swipe directly
          swipeAway("right");
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlay, autoPlayMode, isFlipped, onSwipe, hasSwiped]);

  const isHighImportance = card.importance && card.importance.toLowerCase().includes("high");

  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: x.get() !== 0 ? (x.get() > 0 ? 500 : -500) : 0, 
        y: y.get() < -50 ? -600 : 0,
        opacity: 0, 
        scale: 0.5 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing preserve-3d select-none touch-none"
    >
      <motion.div 
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative w-full h-full preserve-3d select-none touch-none"
        style={{ transformStyle: "preserve-3d" }}
        onTap={() => {
          setIsFlipped(!isFlipped);
        }}
      >
        {/* FRONT */}
        <div className={`absolute inset-0 p-8 flex flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-[40px] border-2 ${isHighImportance ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.3)]' : 'border-border'} backface-hidden overflow-hidden select-none touch-none`}>
           {isAutoPlay && !isFlipped && (
             <div className="absolute top-0 left-0 h-1.5 bg-indigo-500 transition-all duration-75" style={{ width: `${timerProgress * 100}%` }} />
           )}
           <div className="flex justify-between items-start mb-6 mt-2">
              <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-border">
                {card.subject}
              </span>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={async (e) => {
                     e.stopPropagation();
                     if (!userData?.id || isSaved) return;
                     setIsSaved(true);
                     try {
                       await setDoc(doc(db, "saved_cards", `${userData.id}_${card.id}`), {
                         userId: userData.id,
                         cardId: card.id,
                         question: card.question,
                         correctAnswer: card.answer,
                         topicName: card.subject,
                         timestamp: serverTimestamp()
                       });
                     } catch (err) {}
                   }}
                   className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                 >
                   {isSaved ? <BookmarkCheck className="w-5 h-5 text-amber-500 fill-amber-500" /> : <Bookmark className="w-5 h-5 text-slate-300" />}
                 </button>
                 <Sparkles className="w-4 h-4 text-amber-400" />
               </div>
           </div>
           
           <div className="flex-1 flex flex-col justify-center space-y-4">
              <h4 className={`${getFontSizeClass(card.question)} text-slate-800 dark:text-white`}>
                <MathRenderer content={card.question} />
              </h4>
              {card.factHindi && (
                <div className="text-xs sm:text-sm font-bold text-slate-500 italic leading-normal">
                  <MathRenderer content={card.factHindi} />
                </div>
              )}
           </div>

           <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                 <Brain className="w-4 h-4 text-primary" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tap to reveal</span>
              </div>
              <div className="flex -space-x-2">
                 <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                 <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
           </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 p-8 flex flex-col bg-indigo-600 text-white shadow-2xl rounded-[40px] border-2 border-indigo-700 rotate-y-180 backface-hidden overflow-hidden select-none touch-none">
           {isAutoPlay && isFlipped && (
             <div className="absolute top-0 left-0 h-1.5 bg-emerald-400 transition-all duration-75" style={{ width: `${timerProgress * 100}%` }} />
           )}
           <div className="flex justify-between items-start mb-6 mt-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                Answer / Explanation
              </span>
              <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                 <Check className="w-4 h-4 text-white" />
              </div>
           </div>

           <div className="flex-1 flex flex-col justify-center space-y-4">
              <h4 className={`${getFontSizeClass(card.answer)}`}>
                <MathRenderer content={card.answer} />
              </h4>
              {card.answerHindi && (
                <div className="text-xs sm:text-sm font-bold text-indigo-100 italic leading-normal">
                  <MathRenderer content={card.answerHindi} />
                </div>
              )}
           </div>

           <div className="mt-6 pt-6 border-t border-white/10 flex justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Swipe either side to continue</p>
           </div>
        </div>

        {/* OVERLAYS ON SWIPE */}
        <motion.div 
          style={{ opacity: useTransform(x, [50, 100], [0, 1]) }}
          className="absolute inset-0 bg-emerald-500 flex items-center justify-center pointer-events-none z-50 rounded-[40px]"
        >
           <Check className="w-20 h-20 text-white" />
        </motion.div>
        <motion.div 
          style={{ opacity: useTransform(x, [-50, -100], [0, 1]) }}
          className="absolute inset-0 bg-rose-500 flex items-center justify-center pointer-events-none z-50 rounded-[40px]"
        >
           <RotateCcw className="w-20 h-20 text-white" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
