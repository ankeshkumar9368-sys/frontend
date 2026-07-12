"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Swords, Zap, Timer, 
  User, CheckCircle2, XCircle, 
  Search, Loader2, Award, ArrowLeft, ShieldCheck
} from "lucide-react";
import { db } from "../lib/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { 
  createBattle, findOpenBattle, joinBattle, 
  updateBattleScore, finishBattle, BattleRoom 
} from "../lib/battle";
import { generateAIQuestions } from "../lib/gemini";
import confetti from "canvas-confetti";

export default function BattleQuiz({ 
  userData, 
  onClose 
}: { 
  userData: any; 
  onClose: () => void;
}) {
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [status, setStatus] = useState<"lobby" | "searching" | "vs" | "playing" | "result">("lobby");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [playerNum, setPlayerNum] = useState<1 | 2>(1);
  const [showFeedback, setShowFeedback] = useState<"correct" | "wrong" | null>(null);

  // Matchmaking
  const startSearching = async () => {
    setStatus("searching");
    const subject = userData?.favoriteSubject || "General Knowledge";
    
    // 1. Try to find existing
    const openRoom = await findOpenBattle(subject);
    if (openRoom) {
      setPlayerNum(2);
      await joinBattle(openRoom.id!, userData);
      setRoom(openRoom);
    } else {
      // 2. Create new
      setPlayerNum(1);
      const questions = await generateAIQuestions(subject, userData);
      const roomId = await createBattle(userData, subject, questions);
      // Wait for P2
    }
  };

  // Real-time listener
  useEffect(() => {
    if (!userData?.uid) return;
    
    // Listen for any room where user is p1 and waiting
    const q = findOpenBattle(userData.favoriteSubject || "General Knowledge");
    // Actually, we need to track the specific roomId
  }, []);

  // Listen for the active room
  useEffect(() => {
    if (!room?.id) return;
    const unsub = onSnapshot(doc(db, "quiz_battles", room.id), (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as BattleRoom;
        setRoom(data);
        if (data.status === "active" && status === "searching") {
          setStatus("vs");
          setTimeout(() => setStatus("playing"), 3000);
        }
        if (data.status === "finished") setStatus("result");
      }
    });
    return () => unsub();
  }, [room?.id]);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    if (timeLeft <= 0) {
      handleAnswer(null); // Time out
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleAnswer = async (choiceIndex: number | null) => {
    if (!room) return;
    const q = room.questions[currentQIndex];
    const isCorrect = choiceIndex !== null && choiceIndex === q.correctAnswer;
    
    const score = isCorrect ? Math.max(10, timeLeft * 2) : 0; // Faster answers = more points
    setShowFeedback(isCorrect ? "correct" : "wrong");

    // Update Firebase
    await updateBattleScore(room.id!, playerNum, score, currentQIndex + 1);

    setTimeout(async () => {
      setShowFeedback(null);
      if (currentQIndex < room.questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setTimeLeft(15);
      } else {
        // Finished
        const myFinalScore = (playerNum === 1 ? room.p1.score : room.p2?.score || 0) + score;
        const opponentScore = (playerNum === 1 ? room.p2?.score || 0 : room.p1.score);
        
        if (myFinalScore > opponentScore) {
          await finishBattle(room.id!, userData.uid);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
        setStatus("result");
      }
    }, 1000);
  };

  const currentQ = room?.questions[currentQIndex];
  const me = playerNum === 1 ? room?.p1 : room?.p2;
  const opponent = playerNum === 1 ? room?.p2 : room?.p1;

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {/* LOBBY */}
        {status === "lobby" && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-8 max-w-sm w-full"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <Swords className="w-24 h-24 text-primary mx-auto relative z-10 animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">Battle Arena</h2>
              <p className="text-slate-400 font-bold mt-2 italic">Challenge real students in 1-on-1 real-time quizzes!</p>
            </div>
            <button 
              onClick={startSearching}
              className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3"
            >
              <Zap className="w-6 h-6 fill-current" />
              Find Opponent
            </button>
            <button onClick={onClose} className="text-slate-500 font-bold text-sm uppercase tracking-widest">Maybe Later</button>
          </motion.div>
        )}

        {/* SEARCHING */}
        {status === "searching" && (
          <motion.div key="searching" className="text-center space-y-12">
            <div className="relative w-48 h-48 mx-auto">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-dashed border-primary/40 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-2 border-dotted border-white/20 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary animate-bounce" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black uppercase italic">Searching...</h3>
              <p className="text-slate-500 text-sm font-bold max-w-xs mx-auto italic">Connecting you with a worthy opponent in {userData?.favoriteSubject || "your goals"} area...</p>
            </div>
            <div className="flex justify-center gap-4">
               <div className="w-6 h-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                  <User className="w-6 h-6 text-slate-500" />
               </div>
               <div className="w-6 h-12 flex items-center justify-center">
                  <span className="text-2xl font-black opacity-20">VS</span>
               </div>
               <div className="w-6 h-6 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
               </div>
            </div>
          </motion.div>
        )}

        {/* VS SCREEN */}
        {status === "vs" && (
          <motion.div key="vs" className="flex flex-col items-center justify-center w-full h-full space-y-12">
             <div className="flex items-center justify-between w-full max-w-xl px-10">
                <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-center space-y-4">
                   <div className="w-32 h-32 bg-blue-500 rounded-[40px] flex items-center justify-center text-5xl shadow-2xl border-4 border-white/20">
                      👤
                   </div>
                   <p className="font-black text-xl uppercase italic">{me?.name}</p>
                   <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase">Level 12</div>
                </motion.div>

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl font-black italic text-primary drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">VS</motion.div>

                <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-center space-y-4">
                   <div className="w-32 h-32 bg-rose-500 rounded-[40px] flex items-center justify-center text-5xl shadow-2xl border-4 border-white/20">
                      🥷
                   </div>
                   <p className="font-black text-xl uppercase italic">{opponent?.name}</p>
                   <div className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-black uppercase">Level 15</div>
                </motion.div>
             </div>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="text-center">
                <p className="text-slate-400 font-bold uppercase tracking-[0.5em] mb-4">Battle Starts in</p>
                <div className="text-6xl font-black">3...</div>
             </motion.div>
          </motion.div>
        )}

        {/* PLAYING */}
        {status === "playing" && currentQ && (
          <motion.div key="playing" className="w-full h-full flex flex-col pt-12">
            {/* Real-time Status Bar */}
            <div className="fixed top-0 left-0 right-0 p-6 flex items-center gap-6 bg-slate-900/50 backdrop-blur-md border-b border-white/5">
               <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span>{me?.name}</span>
                     <span className="text-primary">{me?.score} PTS</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                     <motion.div 
                       className="h-full bg-blue-500" 
                       initial={{ width: 0 }} 
                       animate={{ width: `${(me?.currentQ || 0) / room.questions.length * 100}%` }} 
                     />
                  </div>
               </div>
               <div className="flex flex-col items-center justify-center">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary">
                     <span className="text-xl font-black">{timeLeft}</span>
                  </div>
               </div>
               <div className="flex-1 space-y-2 text-right">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-rose-400">{opponent?.score} PTS</span>
                     <span>{opponent?.name}</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden flex flex-row-reverse">
                     <motion.div 
                       className="h-full bg-rose-500" 
                       initial={{ width: 0 }} 
                       animate={{ width: `${(opponent?.currentQ || 0) / room.questions.length * 100}%` }} 
                     />
                  </div>
               </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8">
               <div className="text-center space-y-4 px-6">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">Question {currentQIndex + 1}/{room.questions.length}</span>
                  <h3 className="text-2xl font-black text-center leading-tight tracking-tight">
                    {currentQ.question}
                  </h3>
               </div>

               <div className="grid grid-cols-1 gap-3 w-full px-6">
                  {currentQ.options.map((opt: string, i: number) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(i)}
                      disabled={showFeedback !== null}
                      className={`p-5 rounded-[24px] text-left font-black text-sm transition-all border-2 relative overflow-hidden group ${
                        showFeedback === "correct" && i === currentQ.correctAnswer 
                          ? "bg-emerald-500 border-emerald-400 text-white" 
                          : showFeedback === "wrong" && i === currentQ.correctAnswer
                          ? "bg-emerald-500/20 border-emerald-500/50 text-white"
                          : "bg-white/5 border-white/10 hover:border-primary/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + i)}
                        </div>
                        {opt}
                      </div>
                    </motion.button>
                  ))}
               </div>
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {status === "result" && (
          <motion.div key="result" className="text-center space-y-8 max-w-sm w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
              <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[40px] flex items-center justify-center text-6xl shadow-2xl mx-auto">
                {room?.winner === userData.uid ? "🏆" : "🥈"}
              </div>
            </div>
            <div>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase">
                {room?.winner === userData.uid ? "Victory!" : "Defeat"}
              </h2>
              <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Final Battle Report</p>
            </div>
            
            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-6 h-6 bg-blue-500 rounded-xl flex items-center justify-center text-xl">👤</div>
                     <div className="text-left">
                        <p className="font-black text-xs uppercase">{me?.name}</p>
                        <p className="text-slate-500 text-[10px] font-bold">Total Points</p>
                     </div>
                  </div>
                  <span className="text-2xl font-black">{me?.score}</span>
               </div>
               <div className="h-[1px] bg-white/10 w-full" />
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-6 h-6 bg-rose-500 rounded-xl flex items-center justify-center text-xl">🥷</div>
                     <div className="text-left">
                        <p className="font-black text-xs uppercase">{opponent?.name}</p>
                        <p className="text-slate-500 text-[10px] font-bold">Total Points</p>
                     </div>
                  </div>
                  <span className="text-2xl font-black">{opponent?.score}</span>
               </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setStatus("lobby")}
                className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-xl uppercase tracking-widest"
              >
                Rematch?
              </button>
              <button onClick={onClose} className="w-full bg-white/5 text-slate-400 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest border border-white/5">Exit Arena</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK OVERLAYS */}
      <AnimatePresence>
        {showFeedback === "correct" && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="fixed pointer-events-none z-[300]">
             <CheckCircle2 className="w-48 h-48 text-emerald-500 drop-shadow-[0_0_50px_rgba(16,185,129,0.5)]" />
          </motion.div>
        )}
        {showFeedback === "wrong" && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="fixed pointer-events-none z-[300]">
             <XCircle className="w-48 h-48 text-rose-500 drop-shadow-[0_0_50px_rgba(244,63,94,0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
