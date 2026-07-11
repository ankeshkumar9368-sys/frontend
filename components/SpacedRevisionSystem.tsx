"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, BookOpen, Calendar, CheckCircle, Clock, X, Brain, Flame, ChevronRight } from "lucide-react";
import { getSpacedRevisionTopics, RevisionTopic } from "../lib/analytics";

interface RevisionItem {
  id: string;
  topic: string;
  subject: string;
  lastStudied: number; // timestamp
  nextRevision: number; // timestamp
  interval: number; // days
  repetitions: number;
  score: number; // 0-100
  easeFactor: number; // SM-2 factor
}

// SM-2 spaced repetition algorithm
function sm2Next(item: RevisionItem, quality: 0 | 1 | 2 | 3 | 4 | 5): RevisionItem {
  let ef = item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);

  let interval: number;
  let repetitions = item.repetitions;
  if (quality < 3) {
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(item.interval * ef);
    repetitions++;
  }

  const now = Date.now();
  return {
    ...item,
    easeFactor: ef,
    interval,
    repetitions,
    lastStudied: now,
    nextRevision: now + interval * 24 * 60 * 60 * 1000,
  };
}

function getDaysUntil(ts: number): number {
  return Math.ceil((ts - Date.now()) / (24 * 60 * 60 * 1000));
}

function getUrgencyColor(days: number): string {
  if (days <= 0) return "bg-red-500 text-white";
  if (days === 1) return "bg-orange-400 text-white";
  if (days <= 3) return "bg-amber-400 text-slate-900";
  return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
}

export default function SpacedRevisionSystem({ 
  onRevise,
  isSubscribed = false,
  refreshTrigger = 0
}: { 
  onRevise?: (topic: string, subject?: string) => void,
  isSubscribed?: boolean,
  refreshTrigger?: number
}) {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [tab, setTab] = useState<"due" | "all" | "add">("due");
  const [newTopic, setNewTopic] = useState("");
  const [newSubject, setNewSubject] = useState("Mathematics");
  const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Geography", "Science"];

  useEffect(() => {
    // 1. Load manual items from storage
    const stored = localStorage.getItem("achivox_spaced_revision");
    let manualItems: RevisionItem[] = stored ? JSON.parse(stored) : [];
    
    // 2. Load automatic items from real-time analytics
    const autoTopics = getSpacedRevisionTopics();
    const autoItems: RevisionItem[] = autoTopics.map(t => ({
      id: "auto_" + t.topicId,
      topic: t.topicName,
      subject: t.subject,
      lastStudied: t.lastAttemptedAt,
      nextRevision: t.nextRevisionAt,
      interval: Math.round((t.nextRevisionAt - t.lastAttemptedAt) / (24 * 60 * 60 * 1000)),
      repetitions: 1,
      score: t.lastScore,
      easeFactor: 2.5
    }));

    // 3. Merge: Filter out manual items that are now in autoItems
    const filteredManual = manualItems.filter(m => !autoItems.some(a => a.topic === m.topic));
    
    setItems([...autoItems, ...filteredManual]);
  }, [refreshTrigger]);

  const save = (updated: RevisionItem[]) => {
    setItems(updated);
    localStorage.setItem("achivox_spaced_revision", JSON.stringify(updated));
  };

  const handleQuality = (item: RevisionItem, quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const updated = sm2Next(item, quality);
    save(items.map(i => i.id === item.id ? updated : i));
  };

  const addTopic = () => {
    if (!newTopic.trim()) return;
    const now = Date.now();
    const item: RevisionItem = {
      id: newTopic + "_" + now,
      topic: newTopic.trim(),
      subject: newSubject,
      lastStudied: now,
      nextRevision: now + 24 * 60 * 60 * 1000,
      interval: 1,
      repetitions: 0,
      score: 0,
      easeFactor: 2.5,
    };
    save([...items, item]);
    setNewTopic("");
    setTab("due");
  };

  const removeTopic = (id: string) => {
    save(items.filter(i => i.id !== id));
  };

  const dueItems = items.filter(i => getDaysUntil(i.nextRevision) <= 0);
  const displayItems = tab === "due" ? dueItems : items;

  return (
    <div className="bg-card rounded-[28px] border border-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-gradient-to-r from-violet-500/5 via-primary/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-black text-foreground tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-violet-500" />
            Spaced Revision
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">SM-2 Algorithm · Smart Review Intervals</p>
        </div>
        <div className="flex items-center gap-2">
          {dueItems.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
              {dueItems.length} Due!
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["due", "all", "add"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-black capitalize tracking-tight transition-all ${tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-slate-400"}`}
          >
            {t === "due" ? `⚠️ Due (${dueItems.length})` : t === "all" ? `📋 All (${items.length})` : "➕ Add Topic"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tab === "add" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Topic Name</label>
              <input
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Laws of Motion..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-slate-400 outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Subject</label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setNewSubject(sub)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all border ${newSubject === sub ? "bg-primary text-white border-primary" : "bg-slate-50 dark:bg-slate-900 border-border text-slate-500"}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={addTopic}
              disabled={!newTopic.trim()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-40"
            >
              Add to Revision Schedule
            </button>
          </motion.div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-950/30 rounded-3xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              {tab === "due" ? "All caught up! 🎉 No topics due today." : "No topics added yet. Add your first topic!"}
            </p>
            {tab === "due" && (
              <p className="text-xs text-slate-400">Come back tomorrow or add new topics.</p>
            )}
          </div>
        ) : (
          displayItems.map((item, i) => {
            const days = getDaysUntil(item.nextRevision);
            const urgency = getUrgencyColor(days);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-black text-foreground truncate">{item.topic}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.subject} · {item.repetitions} reviews</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0 ${urgency}`}>
                    {days <= 0 ? "Due Now!" : `In ${days}d`}
                  </span>
                </div>

                {days <= 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">How well did you recall?</p>
                    <div className="flex gap-1.5">
                      {([0, 1, 2, 3, 4, 5] as const).map(q => (
                        <button
                          key={q}
                          onClick={() => handleQuality(item, q)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                            q <= 1 ? "bg-red-100 dark:bg-red-950/30 text-red-600 border-red-200 hover:bg-red-200" :
                            q <= 3 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 border-amber-200 hover:bg-amber-200" :
                            "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-1 px-1">
                      <span>Forgot</span>
                      <span>Perfect</span>
                    </div>
                  </div>
                )}

                {onRevise && days <= 0 && (
                  <button
                    onClick={() => onRevise(item.topic, item.subject)}
                    className="w-full mt-2 bg-primary/10 text-primary py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border border-primary/20"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Open Smart Notes
                  </button>
                )}

                {tab === "all" && (
                  <button
                    onClick={() => removeTopic(item.id)}
                    className="mt-2 text-[10px] text-slate-400 font-bold hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
