"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Flame, Sparkles, BookOpen, Brain, Zap, Target } from "lucide-react";
import confetti from "canvas-confetti";

export type TaskType = "read_notes" | "take_test" | "quick_study" | "revise";

export interface DailyTask {
  id: string;
  type: TaskType;
  title: string;
  completed: boolean;
  icon: any;
  color: string;
}

const TASK_POOL = [
  { type: "read_notes", title: "Read Smart Notes", icon: BookOpen, color: "text-blue-500" },
  { type: "take_test", title: "Take a Quick Test", icon: Target, color: "text-rose-500" },
  { type: "quick_study", title: "Swipe Quick Study Cards", icon: Zap, color: "text-amber-500" },
  { type: "revise", title: "Complete Spaced Revision", icon: Brain, color: "text-emerald-500" },
  { type: "read_notes", title: "Study 1 New Topic", icon: BookOpen, color: "text-indigo-500" },
];

export default function DailyTasksTracker() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completedAll, setCompletedAll] = useState(false);

  useEffect(() => {
    // Initialize or load tasks
    const today = new Date().toISOString().split("T")[0];
    const savedDate = localStorage.getItem("achivox_daily_tasks_date");
    let currentTasks: DailyTask[] = [];

    if (savedDate === today) {
      const savedTasks = localStorage.getItem("achivox_daily_tasks");
      if (savedTasks) {
        currentTasks = JSON.parse(savedTasks);
      }
    }

    if (currentTasks.length === 0) {
      // Generate new tasks
      currentTasks = TASK_POOL.map((t, i) => ({
        id: `task_${i}_${today}`,
        type: t.type as TaskType,
        title: t.title,
        completed: false,
        icon: t.icon, // Won't stringify well, we will re-map below
        color: t.color
      }));
      localStorage.setItem("achivox_daily_tasks_date", today);
      localStorage.setItem("achivox_daily_tasks", JSON.stringify(currentTasks.map(t => ({...t, icon: null}))));
    }

    // Remap icons since they are lost in JSON stringify
    const mappedTasks = currentTasks.map(t => {
      const poolItem = TASK_POOL.find(p => p.type === t.type && p.title === t.title) || TASK_POOL[0];
      return { ...t, icon: poolItem.icon };
    });

    setTasks(mappedTasks);
    checkAllCompleted(mappedTasks);

    // Listen for custom events to mark tasks as done
    const handleTaskCompletion = (e: any) => {
      const taskType = e.detail?.type;
      if (!taskType) return;
      
      setTasks(prev => {
        let updated = false;
        const newTasks = prev.map(t => {
          if (t.type === taskType && !t.completed && !updated) {
            updated = true; // Complete only 1 task of this type at a time
            return { ...t, completed: true };
          }
          return t;
        });

        if (updated) {
          localStorage.setItem("achivox_daily_tasks", JSON.stringify(newTasks.map(n => ({...n, icon: null}))));
          checkAllCompleted(newTasks);
        }
        return newTasks;
      });
    };

    window.addEventListener("achivox_task_completed", handleTaskCompletion);
    return () => window.removeEventListener("achivox_task_completed", handleTaskCompletion);
  }, []);

  const checkAllCompleted = (currentTasks: DailyTask[]) => {
    if (currentTasks.length > 0 && currentTasks.every(t => t.completed)) {
      setCompletedAll(true);
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#ec4899', '#10b981']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#ec4899', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const completedCount = tasks.filter(t => t.completed).length;

  if (tasks.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 rounded-[32px] p-6 border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            Daily AI Goal
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Complete these tasks to boost your score</p>
        </div>
        <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black px-3 py-1.5 rounded-xl text-sm">
          {completedCount}/{tasks.length}
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-center gap-4 p-3 rounded-2xl border \${
              task.completed 
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
                : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            <div className={`shrink-0 \${task.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
              {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 \${task.color}`}>
                <task.icon className="w-4 h-4" />
              </div>
              <span className={`text-sm font-bold \${task.completed ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700 dark:text-slate-200'}`}>
                {task.title}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {completedAll && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center shadow-lg shadow-emerald-500/20"
          >
            <h3 className="font-black flex items-center justify-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Goal Achieved!
            </h3>
            <p className="text-xs font-medium text-emerald-100 mt-1">Awesome job! You are one step closer to becoming a topper.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
