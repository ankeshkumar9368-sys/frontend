"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, RefreshCw, Download, Share2, BookOpen,
  Zap, Brain, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Sparkles, Flame, Target, AlarmCheck, Copy, Check
} from "lucide-react";
import { fetchChapterNotes } from "../../lib/content";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { fetchWikipediaImage, fetchMultipleWikiImages } from "../../lib/wikipedia";

// Local fetchWikipediaImage removed in favor of import from lib/wikipedia

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface NotesTopic {
  title: string; titleHindi?: string;
  content: string; contentHindi?: string;
  definition?: string; definitionHindi?: string;
  examLine?: string; formula?: string;
  subPoints?: string[];
}
interface Formula { title: string; equation: string; usage?: string; }
interface MemoryTrick { trick: string; trickHindi?: string; }
interface SubjectiveQ { q: string; a: string; easyWay?: string; solutionSteps?: string[]; weightage?: number; }
interface ObjectiveQ { q: string; options: string[]; correct: number; explanation?: string; }
interface QuickRev { en: string; hi?: string; }

// ─── SUBJECT ICON MAP ─────────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, { bg: string; glow: string; icon: string }> = {
  Physics:            { bg: "from-blue-600 to-cyan-500",    glow: "rgba(59,130,246,.4)",  icon: "⚛️" },
  Chemistry:          { bg: "from-emerald-600 to-teal-500", glow: "rgba(16,185,129,.4)",  icon: "🧪" },
  Biology:            { bg: "from-green-600 to-lime-500",   glow: "rgba(34,197,94,.4)",   icon: "🧬" },
  Mathematics:        { bg: "from-orange-500 to-amber-400", glow: "rgba(245,158,11,.4)",  icon: "📐" },
  History:            { bg: "from-yellow-600 to-orange-500",glow: "rgba(234,179,8,.4)",   icon: "🏛️" },
  Geography:          { bg: "from-sky-600 to-blue-500",     glow: "rgba(14,165,233,.4)",  icon: "🗺️" },
  "Political Science":{ bg: "from-red-600 to-rose-500",     glow: "rgba(239,68,68,.4)",   icon: "⚖️" },
  Economics:          { bg: "from-violet-600 to-purple-500",glow: "rgba(139,92,246,.4)",  icon: "📊" },
  English:            { bg: "from-pink-600 to-rose-400",    glow: "rgba(236,72,153,.4)",  icon: "📝" },
  Hindi:              { bg: "from-orange-600 to-red-500",   glow: "rgba(249,115,22,.4)",  icon: "🪔" },
  "Computer Science": { bg: "from-indigo-600 to-violet-500",glow: "rgba(99,102,241,.4)",  icon: "💻" },
  Accountancy:        { bg: "from-slate-600 to-gray-500",   glow: "rgba(100,116,139,.4)", icon: "📒" },
  "Business Studies": { bg: "from-teal-600 to-cyan-500",   glow: "rgba(20,184,166,.4)",  icon: "💼" },
  Sanskrit:           { bg: "from-amber-600 to-yellow-500", glow: "rgba(217,119,6,.4)",   icon: "📜" },
  "Physical Education":{ bg: "from-lime-600 to-green-500", glow: "rgba(101,163,13,.4)",  icon: "🏃" },
  General:            { bg: "from-indigo-600 to-purple-600",glow: "rgba(99,102,241,.4)",  icon: "📚" },
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, badge, icon, color, children, defaultOpen = true }: {
  title: string; badge?: string; icon: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1a2e] border border-white/8 rounded-2xl overflow-hidden mb-3"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${color} bg-opacity-20`}>
            {icon}
          </div>
          <span className="font-bold text-white text-sm">{title}</span>
          {badge && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/6 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MCQ COMPONENT ────────────────────────────────────────────────────────────
function MCQCard({ q, index }: { q: ObjectiveQ; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3.5 mb-3">
      <p className="text-sm font-bold text-slate-200 mb-3 leading-relaxed">
        <span className="text-indigo-400 font-black mr-1.5">Q{index + 1}.</span>{q.q}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(q.options || []).map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === selected;
          const revealed = selected !== null;
          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => setSelected(i)}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                !revealed
                  ? "border-white/10 bg-white/4 text-slate-300 hover:border-indigo-400 hover:bg-indigo-500/10"
                  : isCorrect
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                  : isSelected
                  ? "border-red-500 bg-red-500/15 text-red-300"
                  : "border-white/6 bg-white/2 text-slate-500"
              }`}
            >
              <span className="font-black mr-1.5">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {selected !== null && q.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3"
          >
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed">{q.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SUBJECTIVE Q ─────────────────────────────────────────────────────────────
function SubjectiveCard({ q, index }: { q: SubjectiveQ; index: number }) {
  const [showAns, setShowAns] = useState(false);
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3.5 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
          {q.weightage ? `⭐ ${q.weightage} Marks` : "Board Level"}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-200 leading-relaxed mb-3">{q.q}</p>
      <button
        onClick={() => setShowAns(o => !o)}
        className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 rounded-lg px-3 py-2 hover:bg-indigo-500/20 transition-all"
      >
        {showAns ? "🙈 Hide Answer" : "👁️ Show Answer"}
      </button>
      <AnimatePresence>
        {showAns && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-2"
          >
            <div className="bg-white/4 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
              {q.a}
            </div>
            {q.solutionSteps && q.solutionSteps.length > 0 && (
              <div className="space-y-1">
                {q.solutionSteps.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-indigo-400 font-bold flex-shrink-0">Step {i + 1}:</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {q.easyWay && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs font-bold text-amber-300">
                💡 {q.easyWay}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen({ topic, subject }: { topic: string; subject: string }) {
  const steps = [
    "Analyzing topic & subject...",
    "Generating bilingual content...",
    "Building formulas & MCQs...",
    "Adding memory tricks...",
    "Finalizing notes..."
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
        </div>
        <h2 className="text-xl font-black text-white mb-2">Generating Smart Notes</h2>
        <p className="text-sm text-indigo-300 font-semibold mb-1">{topic}</p>
        <p className="text-xs text-slate-500 mb-6">{subject} · Bilingual · Exam-Ready</p>
        <div className="bg-white/5 rounded-xl p-4 border border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0"></div>
            <p className="text-xs text-slate-400 text-left">{steps[step]}</p>
          </div>
          <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ERROR SCREEN ─────────────────────────────────────────────────────────────
function ErrorScreen({ topic, subject, error, onRetry }: {
  topic: string; subject: string; error: string; onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/15 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">❌</div>
        <h2 className="text-xl font-black text-white mb-2">Notes Generation Failed</h2>
        <p className="text-sm text-red-300 mb-1">{topic}</p>
        <p className="text-xs text-slate-500 mb-4">{subject}</p>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6">
          <p className="text-xs text-red-300">{error}</p>
        </div>
        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <p className="text-xs text-slate-500">Server band ho toh pehle start karo</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SmartNotesClient() {
  const router = useRouter();
  const params = useSearchParams();

  const topic   = params.get("topic")   || "";
  const subject = params.get("subject") || "General";
  const cls     = params.get("class")   || params.get("cls") || "10th";
  const board   = params.get("board")   || "CBSE";
  const lang    = params.get("lang")    || "en-hi";

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const [notes, setNotes]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [genTime, setGenTime]     = useState(0);
  const [copied, setCopied]       = useState(false);
  const [wikiImages, setWikiImages] = useState<Record<string, { url: string; caption: string; sourceUrl: string } | null>>({});
  const [diagramsLoading, setDiagramsLoading] = useState(false);

  const subjectMeta = SUBJECT_COLORS[subject] || SUBJECT_COLORS["General"];

  const loadNotes = useCallback(async (forceRefresh = false) => {
    if (!topic) { setError("Topic required"); setLoading(false); return; }
    setLoading(true);
    setError("");
    const start = Date.now();
    try {
      const activeBoard = userProfile?.board || board || "CBSE";
      const activeCls = userProfile?.cls || cls || "10th";
      const activeSubject = userProfile?.strictSubject || userProfile?.subject || subject || "General";
      const activePlan = userProfile?.planType || "premium";
      const userId = user?.uid || "guest";

      const userData = {
        id: userId,
        board: activeBoard,
        cls: activeCls,
        subject: activeSubject,
        strictSubject: activeSubject,
        planType: activePlan,
        isSubscribed: true
      };

      const data = await fetchChapterNotes(
        topic, userData, lang, activeSubject, topic, forceRefresh, "full"
      );
      if (!data) throw new Error("AI returned empty notes. Please try again.");
      setNotes(data);
      setGenTime(Math.round((Date.now() - start) / 100) / 10);

      // Fetch Wikipedia diagrams in the background
      if (data?.diagramSuggestions && data.diagramSuggestions.length > 0) {
        setDiagramsLoading(true);
        const filteredSuggestions = data.diagramSuggestions.filter((s: any) => s.wikiTitle);
        fetchMultipleWikiImages(filteredSuggestions)
          .then(images => {
            setWikiImages(images);
            setDiagramsLoading(false);
          })
          .catch(err => {
            console.error("Wiki images fetch failed:", err);
            setWikiImages({});
            setDiagramsLoading(false);
          });
      } else {
        const wikiQuery = data?.wikiSearchTerm || data?.meta?.wikiSearchTerm || data?.topicMeta?.topic || data?.meta?.topic || topic;
        const skipTerms = ["physics", "chemistry", "biology", "mathematics", "maths", "science", "history", "geography", "civics", "economics", "english", "hindi", "sanskrit", "none", "n/a", "null", "general"];
        if (wikiQuery && !skipTerms.includes(wikiQuery.toLowerCase().trim())) {
          fetchWikipediaImage(wikiQuery).then(img => {
            if (img) {
              setWikiImages({ [wikiQuery]: { url: img.url, caption: img.caption, sourceUrl: img.sourceUrl } });
            } else {
              setWikiImages({});
            }
          }).catch(() => {
            setWikiImages({});
          });
        } else {
          setWikiImages({});
        }
      }
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      if (msg.includes("REGENERATE_LOCK")) {
        const days = msg.split(":")[1];
        setError(`Notes already generated. Please wait ${days} more days to regenerate.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [topic, board, cls, subject, lang, user, userProfile]);

  useEffect(() => {
    if (!authLoading) {
      loadNotes();
    }
  }, [authLoading, loadNotes]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) return <LoadingScreen topic={topic} subject={subject} />;
  if (error && !notes) return <ErrorScreen topic={topic} subject={subject} error={error} onRetry={() => loadNotes()} />;

  const topics: NotesTopic[]       = notes?.topics || [];
  const rawFormulas: Formula[]    = notes?.formulas || notes?.masterNotes?.formulaSheet || [];
  
  const isValidFormula = (formulaStr?: string) => {
    if (!formulaStr) return false;
    const f = formulaStr.trim().toLowerCase();
    return f !== "" && f !== "none" && f !== "n/a" && f !== "not applicable" && f !== "no formula" && f !== "null" && f !== "no formulas";
  };

  const formulas = rawFormulas.filter(f => f.equation && isValidFormula(f.equation));
  const finalCheatSheet: string[] = notes?.finalCheatSheet || [];
  const examBooster: any          = notes?.examBooster || null;
  const improvementPlan: any      = notes?.improvementPlanNew || notes?.improvementPlan || null;
  const adaptiveLearning: any     = notes?.adaptiveLearningNew || notes?.adaptiveLearning || null;
  const shortQuestions: any[]     = notes?.shortQuestions || [];
  const longQuestions: any[]      = notes?.longQuestions || [];
  const solvedExample: any        = notes?.solvedExample || notes?.masterNotes?.solvedExample || null;

  const tricks: MemoryTrick[]      = notes?.memoryTricks || [];
  const mcqs: ObjectiveQ[]         = notes?.objectiveQuestions || [];
  const subjective: SubjectiveQ[]  = notes?.subjectiveQuestions || [];
  const quickRev: QuickRev[]       = notes?.quickRevision || [];
  const summary: string[]          = notes?.summary || [];
  const intro: string              = notes?.intro || notes?.masterNotes?.snapshotConcepts || "";
  const introHindi: string         = notes?.introHindi || "";
  const snapshotConcepts: string   = notes?.masterNotes?.snapshotConcepts || intro;
  const topicMeta                  = notes?.topicMeta || notes?.meta || {};
  const detectedSubject            = topicMeta?.subject || subject;
  const commonMistakes             = notes?.masterNotes?.commonMistakes || notes?.commonMistakesNew || [];
  const revisionSummary            = notes?.masterNotes?.revisionSummary || "";

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white font-sans pb-28">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/5 z-50">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: "100%" }} />
      </div>

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/8 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black truncate">{topic}</h1>
          <p className="text-[10px] text-slate-400">{subjectMeta.icon} {detectedSubject} · {cls} · {board}</p>
        </div>
        <button onClick={handleShare} className="p-2 rounded-xl hover:bg-white/8 transition-colors">
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5 text-slate-400" />}
        </button>
        <button onClick={() => loadNotes(true)} className="p-2 rounded-xl hover:bg-white/8 transition-colors">
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">

        {/* HERO BANNER */}
        <div className={`bg-gradient-to-br ${subjectMeta.bg} rounded-3xl p-5 mb-4 relative overflow-hidden`}
          style={{ boxShadow: `0 20px 60px ${subjectMeta.glow}` }}>
          <div className="absolute right-4 top-4 text-6xl opacity-10 font-black">{subjectMeta.icon}</div>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/90 mb-3">
              <Sparkles className="w-3 h-3" /> AI Smart Notes
            </div>
            <h2 className="text-2xl font-black text-white leading-tight mb-3">{topic}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/20 border border-white/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white/90">📚 {board}</span>
              <span className="bg-white/20 border border-white/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white/90">🎓 Class {cls}</span>
              <span className="bg-white/20 border border-white/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white/90">{subjectMeta.icon} {detectedSubject}</span>
              <span className="bg-white/20 border border-white/25 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white/90">🇮🇳 Bilingual</span>
            </div>
            {genTime > 0 && (
              <p className="absolute top-0 right-0 text-[10px] text-white/70">Generated in {genTime}s</p>
            )}
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: "📖", num: topics.length,                                        label: "Topics" },
            { icon: "❓", num: mcqs.length,                                           label: "MCQs" },
            { icon: "✏️", num: shortQuestions.length + longQuestions.length,          label: "Questions" },
            { icon: "🧠", num: tricks.length,                                         label: "Tricks" },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a2e] border border-white/8 rounded-xl p-2.5 text-center">
              <div className="text-lg">{s.icon}</div>
              <div className="text-base font-black text-white">{s.num}</div>
              <div className="text-[9px] text-slate-500 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* INTRO */}
        {intro && (
          <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-4 mb-4">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">📖 Overview</p>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">{intro}</p>
            {introHindi && (
              <p className="text-xs text-indigo-300/75 leading-relaxed italic border-l-2 border-indigo-500/40 pl-3">
                {introHindi}
              </p>
            )}
          </div>
        )}

        {/* WIKIPEDIA DIAGRAMS */}
        {notes?.diagramSuggestions && notes.diagramSuggestions.length > 0 ? (
          <div className="space-y-4 mb-6">
            {notes.diagramSuggestions.map((d: any, idx: number) => {
              const img = wikiImages[d.wikiTitle];
              if (!img) return null;
              return (
                <div key={idx} className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                    <span className="text-base">🖼️</span>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Topic Diagram: {img.caption}</p>
                    <span className="ml-auto text-[9px] text-slate-500 font-semibold">Source: Wikipedia</span>
                  </div>
                  <div className="relative bg-white/3 mx-4 mb-3 rounded-xl overflow-hidden">
                    <img
                      src={img.url}
                      alt={d.label}
                      crossOrigin="anonymous"
                      className="w-full max-h-64 object-contain mx-auto block"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mb-2">{d.label}</p>
                    <a
                      href={img.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      Read on Wikipedia
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          Object.entries(wikiImages).map(([query, img]) => {
            if (!img) return null;
            return (
              <div key={query} className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden mb-4">
                <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                  <span className="text-base">🖼️</span>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Topic Diagram</p>
                  <span className="ml-auto text-[9px] text-slate-500 font-semibold">Source: Wikipedia</span>
                </div>
                <div className="relative bg-white/3 mx-4 mb-3 rounded-xl overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.caption}
                    crossOrigin="anonymous"
                    className="w-full max-h-56 object-contain mx-auto block"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                  />
                </div>
                <div className="px-4 pb-4">
                  <p className="text-[10px] text-slate-400 italic mb-2">{img.caption}</p>
                  <a
                    href={img.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    Read on Wikipedia
                  </a>
                </div>
              </div>
            );
          })
        )}

        {/* KEY CONCEPTS */}
        {topics.length > 0 && (
          <SectionCard title="Key Concepts" badge={`${topics.length} Topics`} icon="⚡" color="from-emerald-500/20 to-teal-500/20">
            {topics.map((t, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-xl mb-3 overflow-hidden hover:border-indigo-400/30 transition-colors">
                <div className="flex items-start gap-3 p-3 bg-white/3 border-b border-white/6">
                  <span className="text-xs font-black text-emerald-400 min-w-[20px]">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-sm font-black text-white">{t.title}</p>
                    {t.titleHindi && <p className="text-[11px] text-indigo-300/75 font-semibold">{t.titleHindi}</p>}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">{t.content}</p>
                  {t.contentHindi && (
                    <p className="text-[11px] text-indigo-300/70 leading-relaxed italic border-l-2 border-indigo-500/30 pl-2">
                      {t.contentHindi}
                    </p>
                  )}
                  {t.formula && isValidFormula(t.formula) && (
                    <div className="inline-block bg-indigo-500/15 border border-indigo-500/25 rounded-lg px-3 py-1.5 font-mono text-sm font-black text-indigo-300">
                      {t.formula}
                    </div>
                  )}
                  {t.subPoints && t.subPoints.length > 0 && (
                    <div className="space-y-1">
                      {t.subPoints.map((p, j) => (
                        <div key={j} className="flex gap-2 text-xs text-slate-400">
                          <span className="text-emerald-400 flex-shrink-0">✓</span>{p}
                        </div>
                      ))}
                    </div>
                  )}
                  {t.examLine && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                      🎯 Exam Tip: {t.examLine}
                    </div>
                  )}
                  {t.definition && (
                    <div className="bg-white/4 rounded-lg p-2.5 text-[11px] text-slate-400 italic">
                      📖 {t.definition}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* FORMULA SHEET */}
        {formulas.length > 0 && (
          <SectionCard title="Formula Sheet" badge="Maths" icon="🧮" color="from-blue-500/20 to-cyan-500/20">
            {formulas.map((f, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-3 mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.title}</p>
                <p className="font-mono text-lg font-black text-blue-300 mb-1">{f.equation}</p>
                {f.usage && <p className="text-xs text-slate-400 italic">{f.usage}</p>}
              </div>
            ))}
          </SectionCard>
        )}

        {/* MEMORY TRICKS */}
        {tricks.length > 0 && (
          <SectionCard title="Memory Tricks" badge={`${tricks.length}`} icon="🧠" color="from-purple-500/20 to-violet-500/20">
            {tricks.map((t, i) => (
              <div key={i} className="flex gap-3 bg-purple-500/8 border border-purple-500/20 rounded-xl p-3 mb-2">
                <span className="text-xl flex-shrink-0">{["🥊", "🚀", "🌈", "⚡", "💡"][i % 5]}</span>
                <div>
                  <p className="text-sm font-bold text-purple-200 leading-relaxed">{t.trick}</p>
                  {t.trickHindi && <p className="text-xs text-purple-300/70 mt-1 italic">{t.trickHindi}</p>}
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* COMMON MISTAKES */}
        {commonMistakes.length > 0 && (
          <SectionCard title="Common Mistakes" badge="Avoid These!" icon="⚠️" color="from-red-500/20 to-rose-500/20" defaultOpen={false}>
            {commonMistakes.map((m: any, i: number) => (
              <div key={i} className="mb-3">
                <div className="flex gap-2 items-start mb-1">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{m.mistake}</p>
                </div>
                {m.correction && (
                  <div className="flex gap-2 items-start ml-6">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-300">{m.correction}</p>
                  </div>
                )}
              </div>
            ))}
          </SectionCard>
        )}

        {/* SHORT QUESTIONS 2-3 MARKS */}
        {shortQuestions.length > 0 && (
          <SectionCard title="Short Questions" badge="2-3 Marks" icon="✏️" color="from-teal-500/20 to-emerald-500/20" defaultOpen={false}>
            {shortQuestions.map((q: any, i: number) => (
              <div key={i} className="mb-3 bg-teal-500/6 border border-teal-500/20 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-teal-500/15">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Q{i+1} · {q.marks || 3} Marks</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-relaxed">{q.q}</p>
                  {q.qHindi && <p className="text-[11px] text-teal-300/70 mt-1 italic">{q.qHindi}</p>}
                </div>
                <div className="px-4 py-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Model Answer</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{q.a}</p>
                  {q.aHindi && <p className="text-[11px] text-teal-300/60 mt-1 italic">{q.aHindi}</p>}
                  {q.tip && (
                    <div className="mt-2 flex gap-2 items-start bg-amber-500/10 rounded-lg p-2">
                      <span className="text-amber-400 text-xs">💡</span>
                      <p className="text-[10px] text-amber-300 font-bold">{q.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* LONG QUESTIONS 5-6 MARKS */}
        {longQuestions.length > 0 && (
          <SectionCard title="Long Questions" badge="5-6 Marks" icon="📝" color="from-blue-600/20 to-indigo-600/20" defaultOpen={false}>
            {longQuestions.map((q: any, i: number) => (
              <div key={i} className="mb-3 bg-blue-500/6 border border-blue-500/20 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-blue-500/15">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Q{i+1} · {q.marks || 5} Marks</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-relaxed">{q.q}</p>
                  {q.qHindi && <p className="text-[11px] text-blue-300/70 mt-1 italic">{q.qHindi}</p>}
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Model Answer</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{q.a}</p>
                    {q.aHindi && <p className="text-[11px] text-blue-300/60 mt-1 italic">{q.aHindi}</p>}
                  </div>
                  {q.keyPoints && q.keyPoints.length > 0 && (
                    <div className="bg-blue-500/8 rounded-lg p-2.5">
                      <p className="text-[10px] font-black text-blue-400 uppercase mb-1.5">Must Mention in Answer</p>
                      {q.keyPoints.map((kp: string, j: number) => (
                        <div key={j} className="flex gap-2 items-start mb-1">
                          <span className="text-blue-400 text-xs flex-shrink-0">→</span>
                          <p className="text-[11px] text-slate-300">{kp}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.tip && (
                    <div className="flex gap-2 items-start bg-amber-500/10 rounded-lg p-2">
                      <span className="text-amber-400 text-xs">🎯</span>
                      <p className="text-[10px] text-amber-300 font-bold">{q.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* MCQs */}
        {mcqs.length > 0 && (
          <SectionCard title="Practice MCQs" badge={`${mcqs.length} Questions`} icon="❓" color="from-red-500/20 to-rose-500/20" defaultOpen={false}>
            {mcqs.map((q, i) => <MCQCard key={i} q={q} index={i} />)}
          </SectionCard>
        )}

        {/* SOLVED EXAMPLE */}
        {solvedExample && solvedExample.question && (
          <SectionCard title="Solved Example" badge="Step by Step" icon="🔬" color="from-cyan-500/20 to-teal-500/20" defaultOpen={false}>
            <div className="space-y-3">
              <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-xl p-3">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">Question</p>
                <p className="text-xs text-white font-bold leading-relaxed">{solvedExample.question}</p>
              </div>
              {(solvedExample.solution || solvedExample.stepByStepSolution) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solution</p>
                  {(solvedExample.solution || solvedExample.stepByStepSolution).map((step: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start bg-white/3 rounded-lg p-2.5">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[9px] font-black text-cyan-400 flex-shrink-0 mt-0.5">{i+1}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* SUBJECTIVE */}
        {subjective.length > 0 && (
          <SectionCard title="Subjective Questions" badge="Board Level" icon="✍️" color="from-amber-500/20 to-yellow-500/20" defaultOpen={false}>
            {subjective.map((q, i) => <SubjectiveCard key={i} q={q} index={i} />)}
          </SectionCard>
        )}

        {/* QUICK REVISION */}
        {quickRev.length > 0 && (
          <SectionCard title="Quick Revision" badge="Fast!" icon="⚡" color="from-indigo-500/20 to-violet-500/20" defaultOpen={false}>
            {quickRev.map((r, i) => (
              <div key={i} className="flex gap-3 items-start bg-indigo-500/6 border border-indigo-500/15 rounded-xl p-3 mb-2">
                <span className="text-indigo-400 font-black text-sm flex-shrink-0">⚡</span>
                <div>
                  <p className="text-xs font-bold text-indigo-200">{r.en}</p>
                  {r.hi && <p className="text-[11px] text-indigo-300/60 mt-0.5 italic">{r.hi}</p>}
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* REVISION SUMMARY */}
        {revisionSummary && (
          <SectionCard title="Last-Minute Summary" badge="Essential" icon="📋" color="from-emerald-500/20 to-teal-500/20" defaultOpen={false}>
            <p className="text-xs text-slate-300 leading-relaxed">{revisionSummary}</p>
          </SectionCard>
        )}

        {/* KEY TAKEAWAYS */}
        {summary.length > 0 && (
          <SectionCard title="Key Takeaways" badge="Summary" icon="🎯" color="from-emerald-500/20 to-green-500/20" defaultOpen={false}>
            {summary.map((s, i) => (
              <div key={i} className="flex gap-3 items-start py-2.5 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5"></div>
                <p className="text-xs text-slate-300 leading-relaxed">{s}</p>
              </div>
            ))}
          </SectionCard>
        )}

        {/* FINAL CHEAT SHEET */}
        {finalCheatSheet.length > 0 && (
          <SectionCard title="Final Cheat Sheet" badge="1 Min Read" icon="🔥" color="from-orange-500/20 to-amber-500/20" defaultOpen={false}>
            {finalCheatSheet.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-orange-500/8 border border-orange-500/15 rounded-xl mb-2">
                <span className="text-sm shrink-0">🔥</span>
                <p className="text-xs text-orange-200 leading-relaxed">{point}</p>
              </div>
            ))}
          </SectionCard>
        )}

        {/* EXAM BOOSTER */}
        {examBooster && (
          <SectionCard title="Exam Booster" badge="Hot" icon="🏆" color="from-rose-500/20 to-pink-500/20" defaultOpen={false}>
            <div className="space-y-3">
              {examBooster.highProbabilityTopics && examBooster.highProbabilityTopics.length > 0 && (
                <div className="bg-rose-500/8 border border-rose-500/15 p-3 rounded-xl">
                  <h5 className="text-[10px] font-black uppercase text-rose-300 mb-2 flex items-center gap-1">
                    🎯 High Probability Topics
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {examBooster.highProbabilityTopics.map((t: string, i: number) => (
                      <span key={i} className="bg-white/5 px-2.5 py-1 rounded-lg text-[10px] font-black text-rose-300 border border-rose-500/25">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {examBooster.boardFrequency && (
                <div className="p-3 bg-white/3 rounded-xl border border-white/5">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1.5">Board Frequency Analysis</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{examBooster.boardFrequency}</p>
                </div>
              )}
              {examBooster.predictedQuestion && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <h5 className="text-[10px] font-black uppercase text-amber-400 mb-1.5">🔮 Predicted Question</h5>
                  <p className="text-xs text-amber-200 leading-relaxed font-semibold">{examBooster.predictedQuestion}</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* AI STUDY PLAN */}
        {improvementPlan && (
          <SectionCard title="AI Study Plan" badge="3-Day" icon="📈" color="from-blue-500/20 to-indigo-500/20" defaultOpen={false}>
            <div className="space-y-3">
              {improvementPlan.weakAreas && improvementPlan.weakAreas.length > 0 && (
                <div className="bg-blue-500/8 border border-blue-500/15 p-3 rounded-xl">
                  <h5 className="text-[10px] font-black uppercase text-blue-300 mb-2">My Weak Areas</h5>
                  <div className="space-y-1.5">
                    {improvementPlan.weakAreas.map((w: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {improvementPlan.practicePlan && improvementPlan.practicePlan.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {improvementPlan.practicePlan.map((step: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400">D{i+1}</div>
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* AI LEARNING INSIGHTS */}
        {adaptiveLearning && (
          <SectionCard title="AI Learning Insights" badge="AI" icon="🧠" color="from-purple-500/20 to-fuchsia-500/20" defaultOpen={false}>
            <div className="space-y-3">
              {adaptiveLearning.currentLevelAnalysis && (
                <div className="p-4 bg-purple-500/8 border border-purple-500/15 rounded-xl">
                  <p className="text-xs text-purple-200 leading-relaxed italic">
                    "{adaptiveLearning.currentLevelAnalysis}"
                  </p>
                </div>
              )}
              {adaptiveLearning.difficultyAdjustment && (
                <div className="flex items-center justify-between px-4 py-3 bg-white/3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Current Difficulty Adjustment</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    adaptiveLearning.difficultyAdjustment.includes('Increase') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {adaptiveLearning.difficultyAdjustment}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>
        )}

      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur-xl border-t border-white/8 px-4 py-3 flex gap-3 z-40">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 bg-white/8 border border-white/10 text-white font-bold py-3 rounded-xl text-sm hover:bg-white/12 transition-colors"
        >
          <Download className="w-4 h-4" /> PDF
        </button>
        <button
          onClick={() => loadNotes(true)}
          className="flex items-center justify-center gap-2 bg-white/8 border border-white/10 text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-white/12 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push(`/test?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}&class=${cls}&board=${board}`)}
          className={`flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r ${subjectMeta.bg} text-white font-bold py-3 rounded-xl text-sm shadow-lg`}
          style={{ boxShadow: `0 4px 20px ${subjectMeta.glow}` }}
        >
          <Target className="w-4 h-4" /> Take Test
        </button>
      </div>
    </div>
  );
}
