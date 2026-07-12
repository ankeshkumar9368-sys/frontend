"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Clock, Zap, Coffee, 
  Target, ChevronRight, RefreshCw, 
  Sparkles, CheckCircle2, AlertCircle,
  MessageSquare, Brain, Layout, ArrowRight, Check
} from "lucide-react";
import { generateSmartTimetable } from "../lib/gemini";
import { logFeatureUsage, checkAndIncrementUsage, logFeatureTime, updateActiveStatus } from "../lib/analytics";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const TIMETABLE_EXPIRY_DAYS = 7;

export default function SmartTimetable({ 
  userData, 
  weaknesses,
  onClose 
}: { 
  userData: any; 
  weaknesses: string[];
  onClose: () => void;
}) {
  const [schedule, setSchedule] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  const userId = userData?.uid || userData?.id;

  // Feature time tracking
  useEffect(() => {
    const mountTime = Date.now();
    if (userId) {
      updateActiveStatus(userId, "Planning Study Schedule 📅");
    }
    return () => {
      const elapsed = Math.round((Date.now() - mountTime) / 1000);
      if (userId && elapsed > 0) {
        logFeatureTime(userId, "Smart Timetable", elapsed);
        updateActiveStatus(userId, "Online");
      }
    };
  }, [userId]);

  const loadTimetable = async (forceRegenerate = false) => {
    if (!userId) return;
    
    setLoading(true);
    const startTime = Date.now();
    try {
      const docRef = doc(db, "user_stats", `${userId}_timetable`);
      let snap: any = null;
      try {
        snap = await getDoc(docRef);
      } catch (dbErr) {
        console.warn("Failed to get timetable from Firestore:", dbErr);
      }
      
      let needsNewPlan = false;
      let pastProgressData = "";
      let existingData: any = null;

      if (snap && snap.exists() && !forceRegenerate) {
        existingData = snap.data();
      } else {
        // Fallback to localStorage cache
        const localCached = localStorage.getItem(`achivox_timetable_${userId}`);
        if (localCached && !forceRegenerate) {
          try {
            existingData = JSON.parse(localCached);
          } catch (e) {}
        }
      }

      if (existingData) {
        const ageInDays = (Date.now() - existingData.createdAt) / (1000 * 60 * 60 * 24);
        
        if (ageInDays >= TIMETABLE_EXPIRY_DAYS) {
          needsNewPlan = true;
          // Calculate past performance
          let completed = 0;
          let total = 0;
          if (existingData.schedule?.timetable) {
            existingData.schedule.timetable.forEach((day: any, dIdx: number) => {
              day.slots.forEach((slot: any, sIdx: number) => {
                total++;
                if (existingData.progress && existingData.progress[`${dIdx}-${sIdx}`]) completed++;
              });
            });
          }
          pastProgressData = `Last week they completed ${completed} out of ${total} targets.`;
        } else {
          // Load existing plan
          setSchedule(existingData.schedule);
          setProgress(existingData.progress || {});
          setCreatedAt(existingData.createdAt);
          setLoading(false);
          return;
        }
      } else {
        needsNewPlan = true;
      }

      if (needsNewPlan) {
        // Usage Check for Free Users
        if (!userData?.isSubscribed) {
          try {
            const { allowed, remaining } = await checkAndIncrementUsage(userId, "AI Planner", 1);
            setUsageRemaining(remaining);
            if (!allowed) {
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Usage check failed, continuing anyway:", e);
          }
        }

        const goals = userData?.goals || ["Score 95%+", "Complete Syllabus"];
        const data = await generateSmartTimetable(weaknesses, goals, userData, pastProgressData);
        
        if (!data || !data.timetable) {
          throw new Error("AI Timetable generation returned invalid data");
        }

        // Save to Firestore & localStorage
        const newDocData = {
          schedule: data,
          progress: {},
          createdAt: Date.now()
        };

        try {
          localStorage.setItem(`achivox_timetable_${userId}`, JSON.stringify(newDocData));
        } catch (e) {}

        try {
          await setDoc(docRef, newDocData);
        } catch (e) {
          console.warn("Failed to save timetable to Firebase, but will show it locally", e);
        }
        
        setSchedule(data);
        setProgress({});
        setCreatedAt(newDocData.createdAt);
        logFeatureUsage("AI Planner", "success", Date.now() - startTime, userId);
      }
    } catch (error) {
      console.error("Timetable Error:", error);
      logFeatureUsage("AI Planner", "failed", Date.now() - startTime, userId);
      
      // FALLBACK PLAN - Never crash! Always provide a beautiful, friendly roadmap
      const fallbackData = {
        timetable: [
          {
            day: "Monday",
            slots: [
              { time: "06:00 AM", activity: "Deep Study", subject: weaknesses[0] || "Core Concepts", focus: "Morning Mastery Session", reason: "Revise high-impact weak topics first." },
              { time: "04:00 PM", activity: "Practice", subject: "All Subjects", focus: "MCQ Practice Test", reason: "Attempt a Live Test to analyze performance." }
            ]
          },
          {
            day: "Tuesday",
            slots: [
              { time: "07:00 AM", activity: "Revision", subject: weaknesses[1] || "Formulas", focus: "Quick Revision Session", reason: "Read smart notes to solidify core rules." },
              { time: "05:00 PM", activity: "Practice", subject: "Mock Test", focus: "Subject Mock Test", reason: "Identify and track your dynamic weaknesses." }
            ]
          },
          {
            day: "Wednesday",
            slots: [
              { time: "06:00 AM", activity: "Deep Study", subject: "Science/Math", focus: "Hard Concepts", reason: "Go through high probability syllabus topics." }
            ]
          },
          {
            day: "Thursday",
            slots: [
              { time: "07:00 AM", activity: "Revision", subject: "Memory Tricks", focus: "Topper Flashcards", reason: "Review card deck for micro-learning." }
            ]
          },
          {
            day: "Friday",
            slots: [
              { time: "06:00 AM", activity: "Deep Study", subject: "History/Civics", focus: "Dates & Figures", reason: "Review notes on major events and personality rules." }
            ]
          },
          {
            day: "Saturday",
            slots: [
              { time: "08:00 AM", activity: "Practice", subject: "Weekly Challenge", focus: "Full Exam Simulator", reason: "Unlock topper badge achievement points!" }
            ]
          },
          {
            day: "Sunday",
            slots: [
              { time: "09:00 AM", activity: "Revision", subject: "Mistakes Review", focus: "Why I Got Wrong", reason: "Review mistake sheet of all wrong answers." }
            ]
          }
        ],
        mentorAdvice: "Your Custom Topper Study Plan is active! Follow this structured daily layout to target your weaknesses and secure a top rank.",
        energyEfficiency: "High"
      };

      setSchedule(fallbackData);
      setProgress({});
      setCreatedAt(Date.now());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const toggleProgress = async (dayIdx: number, slotIdx: number) => {
    if (!userId) return;
    const key = `${dayIdx}-${slotIdx}`;
    const newVal = !progress[key];
    const newProgress = { ...progress, [key]: newVal };
    setProgress(newProgress);

    // Update Local Cache
    try {
      const localCached = localStorage.getItem(`achivox_timetable_${userId}`);
      if (localCached) {
        const parsed = JSON.parse(localCached);
        parsed.progress = newProgress;
        localStorage.setItem(`achivox_timetable_${userId}`, JSON.stringify(parsed));
      }
    } catch (e) {}

    // Sync to Firestore
    try {
      const docRef = doc(db, "user_stats", `${userId}_timetable`);
      await updateDoc(docRef, { progress: newProgress });
    } catch (err) {
      console.error("Failed to save progress to Firestore:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-4 border-t-primary border-white/10 rounded-full mx-auto"
          />
          <p className="text-white font-black text-sm uppercase tracking-widest animate-pulse">AI is planning your week...</p>
        </div>
      </div>
    );
  }

  if (!schedule) return null;

  const daysLeft = createdAt ? Math.max(0, 7 - Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24))) : 7;
  const totalSlots = schedule.timetable.reduce((acc: number, day: any) => acc + day.slots.length, 0);
  const completedSlots = Object.values(progress).filter(Boolean).length;
  const progressPct = totalSlots === 0 ? 0 : Math.round((completedSlots / totalSlots) * 100);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-none">Smart Timetable</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Weekly Plan • {daysLeft} Days Left</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => {
             if (confirm("This will erase your current week's progress and generate a new plan. Are you sure?")) {
               loadTimetable(true);
             }
           }} className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10">
             <RefreshCw className="w-6 h-6" />
           </button>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10">
             <Layout className="w-6 h-6" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8">
        
        {/* Weekly Progress Bar */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-black text-xs uppercase tracking-widest">Week Progress</span>
            <span className="text-primary font-black text-xs">{progressPct}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {schedule.timetable.map((day: any, idx: number) => {
            const dayCompleted = day.slots.filter((_: any, sIdx: number) => progress[`${idx}-${sIdx}`]).length;
            const dayTotal = day.slots.length;
            const isAllDone = dayTotal > 0 && dayCompleted === dayTotal;
            return (
              <button
                key={idx}
                onClick={() => setActiveDay(idx)}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shrink-0 flex items-center gap-2 ${
                  activeDay === idx 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : isAllDone 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-slate-500 hover:bg-white/10"
                }`}
              >
                {day.day}
                {isAllDone && <CheckCircle2 className="w-6 h-6" />}
              </button>
            )
          })}
        </div>

        {/* AI Weekly Review (if generated with past performance) */}
        {schedule.lastWeekReview && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-600/20 border border-emerald-500/30 p-6 rounded-[32px] relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-300 tracking-widest">AI Weekly Review</span>
            </div>
            <p className="text-emerald-100 font-bold leading-relaxed italic">
              "{schedule.lastWeekReview}"
            </p>
          </motion.div>
        )}

        {/* Mentor Advice */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 p-6 rounded-[32px] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="w-20 h-20 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-6 h-6 text-indigo-200" />
            <span className="text-[10px] font-black uppercase text-indigo-100 tracking-widest">Mentor's Advice for the Week</span>
          </div>
          <p className="text-white font-bold leading-relaxed pr-10 italic">
            "{schedule.mentorAdvice}"
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase text-white">Energy Flow: {schedule.energyEfficiency}</div>
          </div>
        </motion.div>

        {/* Slots for Active Day */}
        <div className="space-y-4">
           <h3 className="text-white font-black uppercase tracking-widest text-xs px-2 flex items-center gap-2">
             <Clock className="w-6 h-6 text-primary" />
             Daily Targets: {schedule.timetable[activeDay].day}
           </h3>
           
           <div className="space-y-3">
              {schedule.timetable[activeDay].slots.map((slot: any, sIdx: number) => {
                const isDone = !!progress[`${activeDay}-${sIdx}`];
                return (
                  <motion.div 
                    key={sIdx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sIdx * 0.1 }}
                    onClick={() => toggleProgress(activeDay, sIdx)}
                    className={`border rounded-[28px] p-6 flex gap-6 group cursor-pointer transition-all ${
                      isDone 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                     <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-4">
                        <span className={`font-black text-xs ${isDone ? 'text-emerald-400' : 'text-primary'}`}>{slot.time}</span>
                        <div className={`w-6 h-6 rounded-xl mt-2 flex items-center justify-center ${
                          isDone ? 'bg-emerald-500/20 text-emerald-400' :
                          slot.activity.includes('Study') ? 'bg-blue-500/20 text-blue-400' :
                          slot.activity.includes('Practice') ? 'bg-orange-500/20 text-orange-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                           {isDone ? <Check className="w-6 h-6" /> :
                            slot.activity.includes('Study') ? <Brain className="w-6 h-6" /> :
                            slot.activity.includes('Practice') ? <Target className="w-6 h-6" /> :
                            <RefreshCw className="w-6 h-6" />}
                        </div>
                     </div>

                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                           <div>
                              <h4 className={`font-black text-base tracking-tight ${isDone ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>{slot.focus}</h4>
                              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDone ? 'text-emerald-500/70' : 'text-slate-500'}`}>{slot.activity} {slot.subject && `· ${slot.subject}`}</p>
                           </div>
                           <button className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                             isDone ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-slate-500 group-hover:bg-primary group-hover:text-white'
                           }`}>
                              {isDone ? <Check className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full border-2 border-current" />}
                           </button>
                        </div>
                        
                        {slot.reason && !isDone && (
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                             <p className="text-[10px] font-medium text-slate-400 italic">"AI Insight: {slot.reason}"</p>
                          </div>
                        )}
                     </div>
                  </motion.div>
                )
              })}
           </div>
        </div>

      </div>

    </div>
  );
}
