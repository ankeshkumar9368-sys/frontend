"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, BookOpen, Sparkles, Brain, Download, ChevronDown,
  Lightbulb, Zap, ArrowLeft, HelpCircle, Loader2,
  CheckCircle2, AlertCircle, Star, Activity, MessageCircle,
  Mic, MonitorPlay, Languages, ChevronRight, Lock, Clock, BookText, Target, Trophy, Flame, PenTool
} from "lucide-react";
import { logFeatureUsage, checkAndIncrementUsage, useStudyTimer } from "../lib/analytics";
import { fetchChapterNotes, ChapterNote } from "../lib/content";
import MathRenderer from "./MathRenderer";
import TopperNotes from "./TopperNotes";
import { db } from "../lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

interface SmartNotesViewerProps {
  title: string;
  chapterName: string;
  userData: any;
  onExit: () => void;
  onStartTest?: () => void;
  onAskDoubt?: () => void;
  onVoiceDoubt?: () => void;
  isSubscribed?: boolean;
  subjectContext?: string;
  classContext?: string;
  mode?: "full" | "short" | "revision" | "remedial";
  initialData?: ChapterNote | null;
}

function InteractiveDiagramCard({ wikiTitle, label, wikiImage }: { wikiTitle: string; label: string; wikiImage: any }) {
  if (!wikiImage || !wikiImage.url) return null;

  const textToParse = `${label} ${wikiImage.caption || ''}`;
  const parts: string[] = [];
  
  const matchParentheses = textToParse.match(/\(([^)]+)\)/g);
  if (matchParentheses) {
    matchParentheses.forEach(m => {
      const clean = m.replace(/[()]/g, '').trim();
      if (clean.length > 2 && clean.length < 30) parts.push(clean);
    });
  }

  const matchLabelsList = textToParse.match(/labels:\s*([^।|.]+)/i) || textToParse.match(/parts:\s*([^।|.]+)/i) || textToParse.match(/अनिवार्य लेबल:\s*([^।|.]+)/i);
  if (matchLabelsList) {
    const list = matchLabelsList[1].split(/[,|•]/);
    list.forEach(item => {
      const clean = item.trim().replace(/["']/g, '');
      if (clean.length > 1 && clean.length < 40 && !parts.includes(clean)) {
        parts.push(clean);
      }
    });
  }

  if (parts.length === 0) {
    const words = textToParse.split(/[,.;]/);
    words.forEach(w => {
      const clean = w.trim();
      if (clean.length > 3 && clean.length < 35 && !clean.includes('http') && !clean.toLowerCase().includes('diagram')) {
        parts.push(clean);
      }
    });
  }

  const uniqueParts = Array.from(new Set(parts)).slice(0, 6);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 my-4 shadow-sm break-inside-avoid page-break-inside-avoid font-sans">
      <div className="flex flex-col md:flex-row gap-5 items-center">
        {/* Image Container */}
        <div className="w-full md:w-1/2 flex flex-col items-center bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 relative group overflow-hidden shadow-sm">
          <img 
            src={wikiImage.url} 
            alt={wikiTitle} 
            className="max-h-[220px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-sm text-[9px] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider font-black shadow-sm">
            Interactive Guide
          </div>
        </div>

        {/* Info & Labels Explorer */}
        <div className="w-full md:w-1/2 space-y-3.5">
          <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-emerald-500">📐</span> {wikiTitle} Diagram
          </h4>
          
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
            {wikiImage.caption || label}
          </p>

          {uniqueParts.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Labels & Key Parts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueParts.map((part, pIdx) => (
                  <span 
                    key={pIdx} 
                    className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shadow-sm"
                  >
                    📍 {part}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Collapsible Section ─────────────────────────────────────────
function SmartAccordion({ icon: Icon, title, color, badge, children, defaultOpen = false, forceOpen = false }: {
  icon: any; title: string; color: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean; forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-sm text-foreground tracking-tight">{title}</span>
          {badge && (
            <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-6 h-6 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {(open || forceOpen) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SmartNotesViewer({
  title,
  chapterName,
  userData,
  onExit,
  onStartTest,
  onAskDoubt,
  onVoiceDoubt,
  isSubscribed = false,
  subjectContext,
  classContext,
  mode = "full",
  initialData = null
}: SmartNotesViewerProps) {
  useStudyTimer(title.toLowerCase().replace(/\s+/g, "-"));

  const [notesData, setNotesData] = useState<ChapterNote | null>(() => {
    if (initialData) return initialData;
    if (typeof window !== "undefined") {
      try {
        const localKey = `achivox_notes_${mode}_${subjectContext || 'gen'}_${chapterName || 'none'}_${title || 'none'}_${userData?.id || 'guest'}`.replace(/[^a-zA-Z0-9_]/g, '_');
        const localCache = localStorage.getItem(localKey);
        if (localCache) {
          const parsed = JSON.parse(localCache);
          if (parsed && parsed.topics) return parsed;
        }
      } catch (e) {}
    }
    return null;
  });
  
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialData) return false;
    if (typeof window !== "undefined") {
      try {
        const localKey = `achivox_notes_${mode}_${subjectContext || 'gen'}_${chapterName || 'none'}_${title || 'none'}_${userData?.id || 'guest'}`.replace(/[^a-zA-Z0-9_]/g, '_');
        if (localStorage.getItem(localKey)) return false;
      } catch (e) {}
    }
    return true;
  });
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState<string>("dual");
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTopperNotes, setShowTopperNotes] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [wikiImages, setWikiImages] = useState<Record<string, any>>({});
  const [diagramsLoading, setDiagramsLoading] = useState(false);
  const fetchIdRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);

  const displayBoard = notesData?.topicMeta?.board || userData?.board || "CBSE";
  const displayClass = classContext || notesData?.topicMeta?.class || userData?.cls || "10th";
  const displaySubject = subjectContext || notesData?.topicMeta?.subject || "General";
  const displayTopic = notesData?.topicMeta?.topic || chapterName || title;

  useEffect(() => {
    if (notesData) {
      const suggestions: { wikiTitle: string; label: string; section: string; insertAfterConcept?: string }[] = [];
      
      const mainTerm = notesData.meta?.wikiSearchTerm;
      if (mainTerm && mainTerm.toLowerCase() !== 'none' && mainTerm.trim().length > 0) {
        suggestions.push({
          wikiTitle: mainTerm,
          label: `Main diagram for ${notesData.meta.topic || 'Concept'}`,
          section: 'core'
        });
      }

      if (notesData.topics && notesData.topics.length > 0) {
        const skipTerms = ["physics", "chemistry", "biology", "mathematics", "maths", "science", "history", "geography", "civics", "economics", "english", "hindi", "sanskrit", "none", "n/a", "null", "general"];
        notesData.topics.forEach((t: any) => {
          if (t.title && !skipTerms.includes(t.title.toLowerCase().trim())) {
            suggestions.push({
              wikiTitle: t.title,
              label: `Concept diagram: ${t.title}`,
              section: 'core',
              insertAfterConcept: t.title
            });
          }
        });
      }

      if (suggestions.length > 0) {
        setDiagramsLoading(true);
        import("../lib/wikipedia").then(({ fetchMultipleWikiImages }) => {
          fetchMultipleWikiImages(suggestions)
            .then((imgs) => {
              setWikiImages(imgs);
            })
            .catch(console.error)
            .finally(() => setDiagramsLoading(false));
        });
      }
    }
  }, [notesData]);

  // Automatic localStorage caching whenever notesData updates (e.g. from parent initialData or direct fetch)
  useEffect(() => {
    if (notesData) {
      const localKey = `achivox_notes_${mode}_${subjectContext || 'gen'}_${chapterName || 'none'}_${title || 'none'}_${userData?.id || 'guest'}`.replace(/[^a-zA-Z0-9_]/g, '_');
      try {
        localStorage.setItem(localKey, JSON.stringify(notesData));
      } catch (e) {
        console.warn("Failed to write notes data to local storage cache:", e);
      }
    }
  }, [notesData, mode, subjectContext, chapterName, title, userData?.id]);

  useEffect(() => {
    // Skip fetching if we already have data from initialData
    if (notesData && (notesData.topicMeta?.topic === chapterName || notesData.topicMeta?.topic === title)) {
      setLoading(false);
      return;
    }

    const loadNotes = async () => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;

      const currentFetchId = Date.now().toString();
      fetchIdRef.current = currentFetchId;

      const localKey = `achivox_notes_${mode}_${subjectContext || 'gen'}_${chapterName || 'none'}_${title || 'none'}_${userData?.id || 'guest'}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const localCache = localStorage.getItem(localKey);
      if (localCache) {
        try {
          const parsed = JSON.parse(localCache);
          if (parsed && parsed.topics) {
            setNotesData(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      const startTime = Date.now();
      try {
        setLoading(true);

        // Usage Check for Free Users
        if (!isSubscribed) {
          const { allowed, remaining } = await checkAndIncrementUsage(userData?.id, "Smart Notes", 1, title); // 1 note per day
          setUsageRemaining(remaining);
          if (!allowed) {
            setLoading(false);
            return;
          }
        }

        const data = await fetchChapterNotes(title, userData, lang, subjectContext, chapterName, false, mode);
        if (fetchIdRef.current !== currentFetchId) return; // Discard stale response
        
        if (data) {
          setNotesData(data);
          try { localStorage.setItem(localKey, JSON.stringify(data)); } catch (e) {}
          logFeatureUsage("Smart Notes", "success", Date.now() - startTime, userData?.id);
          
          // Track notesGenerated achievement
          if (userData?.id) {
            try { await updateDoc(doc(db, "users", userData.id), { notesGenerated: increment(1) }); } catch(e) {}
          }
        } else {
          throw new Error("Neural Core API returned empty data. Check system logs.");
        }
      } catch (error: any) {
        console.error("Notes Loading Error:", error);
        setUpdateError(error.message);
        logFeatureUsage("Smart Notes", "failed", Date.now() - startTime, userData?.id);
      } finally {
        isGeneratingRef.current = false;
        setLoading(false);
      }
    };
    if (chapterName || title) loadNotes();
  }, [chapterName, title, userData, lang, subjectContext, mode]);

  const getRegenerateStatus = () => {
    if (!notesData?.createdAt) return { canUpdate: true, daysLeft: 0 };
    
    const oldMillis = typeof notesData.createdAt.toMillis === 'function' 
      ? notesData.createdAt.toMillis() 
      : (typeof notesData.createdAt === 'number' ? notesData.createdAt : Date.now());
      
    const ageInDays = (Date.now() - oldMillis) / (1000 * 60 * 60 * 24);
    const requiredDays = isSubscribed ? 7 : 30;
    
    if (ageInDays >= requiredDays) {
      return { canUpdate: true, daysLeft: 0 };
    }
    
    return { canUpdate: false, daysLeft: Math.ceil(requiredDays - ageInDays) };
  };

  const regenStatus = getRegenerateStatus();

  const handleUpdateNotes = async () => {
    setIsUpdating(true);
    try {
      const data = await fetchChapterNotes(title, userData, lang, subjectContext, chapterName, true, mode);
      if (data) {
        setNotesData(data);
        const localKey = `achivox_notes_${mode}_${subjectContext || 'gen'}_${chapterName || 'none'}_${title || 'none'}_${userData?.id || 'guest'}`.replace(/[^a-zA-Z0-9_]/g, '_');
        try { localStorage.setItem(localKey, JSON.stringify(data)); } catch (e) {}
        alert("✅ Smart Notes updated successfully with your latest performance!");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.startsWith("REGENERATE_LOCK:")) {
        const remaining = e.message.split(":")[1];
        alert(`🔒 Regeneration limit active! You can regenerate notes for this topic after ${remaining} day${Number(remaining) > 1 ? 's' : ''}.`);
      } else {
        alert("Could not update notes at this time.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const totalScroll = scrollHeight - clientHeight;
      setProgress((scrollTop / totalScroll) * 100);
    }
  };

  const handleDownload = async () => {
    try {
      const element = scrollRef.current;
      if (!element) {
        alert("Notes content not ready. Please wait.");
        return;
      }

      setIsExporting(true);
      await new Promise(r => setTimeout(r, 600));

      // ── Safe filename ──
      const safeFilename = `${chapterName.replace(/[\s/\\?%*:|"<>]/g, '_')}_Masterclass_Achivox.pdf`;

      // ── Import html2pdf ──
      let html2pdfLib: any;
      try {
        html2pdfLib = (await import("html2pdf.js")).default;
      } catch {
        html2pdfLib = (window as any).html2pdf;
      }
      if (!html2pdfLib) {
        alert("PDF engine could not load. Please check your internet connection.");
        return;
      }

      const opt = {
        margin: [10, 10, 20, 10], // top, right, bottom, left margins in mm
        filename: safeFilename,
        image: { type: 'jpeg' as const, quality: 0.92 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } as any,
      };

      // 🎨 Add print-mode class
      element.classList.add('premium-pdf-mode');
      const pdfSection = element.querySelector('.pdf-only-section');
      if (pdfSection) pdfSection.classList.remove('hidden');

      let pdfBlob: Blob;
      try {
        // Build the PDF and get it as Blob — correct chain using .outputPdf('blob')
        pdfBlob = await html2pdfLib()
          .set(opt)
          .from(element)
          .toPdf()
          .get('pdf')
          .then((pdf: any) => {
            try {
              const totalPages = pdf.internal.getNumberOfPages();
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();

              for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);

                // Watermark
                pdf.setFontSize(38);
                pdf.setTextColor(230, 230, 230);
                pdf.setFont('helvetica', 'bold');
                pdf.text('ACHIVOX AI', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });

                // Header
                pdf.setFontSize(8);
                pdf.setTextColor(79, 70, 229);
                pdf.text('MASTERCLASS SERIES', 15, 9);
                pdf.setTextColor(148, 163, 184);
                pdf.text(`|  ${chapterName}`, 54, 9);
                pdf.setDrawColor(241, 245, 249);
                pdf.line(15, 12, pageWidth - 15, 12);

                // Footer
                pdf.setDrawColor(241, 245, 249);
                pdf.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);
                pdf.setFontSize(7);
                pdf.setTextColor(148, 163, 184);
                pdf.text('\u00a9 2026 Achivox. All rights reserved.', 15, pageHeight - 7);
                pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 7, { align: 'right' });
              }
            } catch (e) {
              console.warn('PDF styling skipped:', e);
            }
          })
          .outputPdf('blob');
      } finally {
        // Always restore view state
        element.classList.remove('premium-pdf-mode');
        if (pdfSection) pdfSection.classList.add('hidden');
        setIsExporting(false);
      }

      // ─── TIER 1: Capacitor Native Android APK ───────────────────────
      const isNativeCapacitor = typeof window !== 'undefined' &&
        typeof (window as any).Capacitor !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.() === true;

      if (isNativeCapacitor) {
        try {
          // Convert Blob to Base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });

          // Write to device Documents folder
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const writeResult = await Filesystem.writeFile({
            path: safeFilename,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true,
          });

          // Open native share sheet
          const { Share } = await import('@capacitor/share');
          await Share.share({
            title: `${chapterName} - Smart Notes`,
            text: `\ud83d\udcda Smart Notes for ${chapterName} \u2014 Generated by Achivox AI`,
            url: writeResult.uri,
            dialogTitle: 'Save or Share Smart Notes PDF',
          });
          return;
        } catch (capErr: any) {
          console.warn('Capacitor save/share failed, trying fallback:', capErr?.message || capErr);
          // Fall through to next tier
        }
      }

      // ─── TIER 2: Android WebView / Mobile browser ────────────────────
      // <a download> is blocked in Capacitor WebView; use blob URL + window.open
      const blobUrl = URL.createObjectURL(pdfBlob);
      const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

      if (isAndroid) {
        try {
          const opened = window.open(blobUrl, '_blank');
          if (opened) {
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            return;
          }
        } catch (e) {
          console.warn('window.open failed:', e);
        }
      }

      // ─── TIER 3: Standard web browser download ───────────────────────
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    } catch (error: any) {
      console.error("PDF Download Error:", error);
      alert(`PDF generation failed: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  if (!notesData && loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] bg-slate-50 dark:bg-slate-950 flex flex-col"
      >
        {/* Skeleton Header */}
        <div className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Loading Banner */}
          <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-2xl border border-primary/20">
             <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
             <span className="text-sm font-semibold text-primary animate-pulse">Loading Smart Notes...</span>
          </div>

          {/* Hero Image / Title block */}
          <div className="h-28 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          
          {/* Intro Text */}
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 w-[90%] bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 w-[75%] bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>

          {/* Topic Cards */}
          <div className="pt-6 space-y-4">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 w-[85%] bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!notesData && updateError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6 bg-slate-50 dark:bg-[#0B1120]">
        <AlertCircle className="w-6 h-6 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">API or Generation Failed</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          {updateError}
        </p>
        <p className="text-xs text-slate-400">
          The Neural Core could not process this topic. Please try another chapter or contact support.
        </p>
        <button 
          onClick={onExit}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:scale-105 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] bg-slate-50 dark:bg-slate-950 flex flex-col pdf-content-area"
    >
      {/* ── HEADER ─────────────────────────────── */}
      <div className="bg-card border-b border-border sticky top-0 z-50 shadow-sm no-print">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onExit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center px-2">
            <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-1 mb-0.5">
              <Sparkles className="w-3 h-3" /> {displayClass} • {displaySubject}
            </p>
            <h2 className="text-sm font-black text-slate-800 dark:text-white truncate">
              {displayTopic}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTopperNotes(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:scale-105 shadow-sm transition-all border border-amber-200 dark:border-amber-900"
              title="Topper's Revision Notes"
            >
              <PenTool className="w-5 h-5 animate-pulse" />
            </button>
            <button 
              onClick={handleDownload}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white shadow-md transition-all bg-primary hover:scale-105"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Reading progress bar */}
        <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
          <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── SCROLLABLE BODY ────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-28 relative"
      >
        <div className="mx-4 mt-4 bg-slate-100 dark:bg-slate-800/50 p-3 flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs">
              {regenStatus.canUpdate ? (
                <Sparkles className="w-6 h-6 text-amber-500" />
              ) : (
                <Clock className="w-6 h-6 text-slate-400" />
              )}
              <span className="text-slate-600 dark:text-slate-300">
                {regenStatus.canUpdate 
                  ? (isSubscribed ? "New generation available!" : "New generation available!")
                  : `Next AI Generation unlocks in ${regenStatus.daysLeft} day${regenStatus.daysLeft !== 1 ? 's' : ''}`
                }
              </span>
            </div>
            {notesData?.createdAt && (
              <span className="text-[10px] font-medium text-slate-500 ml-6">
                Generated: {new Date(typeof notesData.createdAt === 'number' ? notesData.createdAt : (typeof notesData.createdAt.toMillis === 'function' ? notesData.createdAt.toMillis() : Date.now())).toLocaleDateString()}
              </span>
            )}
          </div>
          {regenStatus.canUpdate ? (
            <button 
              onClick={handleUpdateNotes} 
              disabled={isUpdating} 
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              {isUpdating ? "Generating..." : "Generate New"}
            </button>
          ) : (
            <button 
              disabled 
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center gap-1 rounded-lg text-xs font-bold opacity-70 cursor-not-allowed"
            >
              <Lock className="w-3 h-3" /> Locked
            </button>
          )}
        </div>
        
        {/* PDF Watermark — only visible in export */}
        <div className="pdf-watermark hidden pointer-events-none select-none">
          ExamHero AI
        </div>
        {/* Topic Hero — compact */}
        <div className={`mx-4 mt-4 mb-3 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden ${
          mode === "remedial" ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-primary/90 to-violet-600"
        }`}>
          <div className="absolute top-0 right-0 opacity-10 -mr-4 -mt-4">
            <Brain className="w-28 h-28" />
          </div>
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
            mode === "remedial" ? "bg-black/20 text-white" : "bg-white/20 text-white"
          }`}>
            {mode === "remedial" ? "AI Remedial Booster" : "Premium Study Series"}
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2 leading-tight pr-10">
            {displayTopic}
          </h1>
          <div className="flex justify-between items-end">
            <div className="flex gap-2 mt-3 flex-wrap">
              {[displayBoard, displayClass, displaySubject].map((v, i) => (
                <span key={i} className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{v}</span>
              ))}
            </div>

          </div>
        </div>

        {notesData?.meta?.wikiSearchTerm && notesData.meta.wikiSearchTerm.toLowerCase() !== 'none' && wikiImages[notesData.meta.wikiSearchTerm] && (
          <div className="mx-4 mb-3">
            <InteractiveDiagramCard 
              wikiTitle={notesData.meta.wikiSearchTerm} 
              label={`Overview visual diagram for ${notesData.meta.topic || 'Concept'}`} 
              wikiImage={wikiImages[notesData.meta.wikiSearchTerm]} 
            />
          </div>
        )}

        {/* Concept Overview — always open */}
        <div className="px-4 space-y-6">

          {/* Quick Intro */}
          {notesData?.intro && (
            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Overview
              </p>
              <div className="space-y-2">
                {(lang === "en" || lang === "dual") && (
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    <MathRenderer content={notesData?.intro || ""} />
                  </div>
                )}
                {(lang === "hi" || lang === "dual") && (
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic">
                    <MathRenderer content={notesData?.introHindi || ""} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Concepts — accordion */}
          {notesData?.topics && notesData.topics.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={Zap} title="Key Concepts" color="bg-emerald-500" badge={`${notesData.topics.length}`} defaultOpen={true}>
              <div className="space-y-3 pt-2">
                {notesData.topics.map((t, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden break-inside-avoid bg-white dark:bg-slate-950 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-emerald-500 font-black text-xs w-5">{String(i + 1).padStart(2, "0")}</span>
                      <h4 className="font-black text-sm text-foreground flex-1 leading-tight flex flex-col gap-0.5">
                        {(lang === "en" || lang === "dual") && <span>{t.title}</span>}
                        {(lang === "hi" || lang === "dual") && <span className="text-primary/70">{t.titleHindi}</span>}
                      </h4>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="space-y-2">
                        {(lang === "en" || lang === "dual") && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            <MathRenderer content={t.content} />
                          </div>
                        )}
                        {(lang === "hi" || lang === "dual") && (
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-300 leading-relaxed border-l-2 border-primary/20 pl-2">
                            <MathRenderer content={t.contentHindi} />
                          </div>
                        )}
                      </div>
                      {t.formula && (
                        <div className="my-5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-5 py-5 text-center break-inside-avoid">
                          <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 opacity-70">Principle Formula</div>
                          <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                            <MathRenderer content={(t.formula && t.formula.includes('$')) ? t.formula : `$${t.formula}$`} />
                          </div>
                        </div>
                      )}
                      {t.subPoints && t.subPoints.length > 0 && (
                        <div className="space-y-1">
                          {t.subPoints.map((p, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                <MathRenderer content={p} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {t.definition && (
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs italic text-slate-500 dark:text-slate-400">
                          <MathRenderer content={lang === "hi" ? (t.definitionHindi || t.definition) : t.definition} />
                        </div>
                      )}
                      {t.examTip && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2 text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight flex items-center gap-2">
                           <span className="shrink-0">🎯 Exam Tip:</span>
                           <MathRenderer content={t.examTip} />
                        </div>
                      )}
                      {wikiImages[t.title] && (
                        <InteractiveDiagramCard 
                          wikiTitle={t.title} 
                          label={`Academic diagram for ${t.title}`} 
                          wikiImage={wikiImages[t.title]} 
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SmartAccordion>
          )}

          {/* Memory Tricks */}
          {notesData?.memoryTricks && notesData.memoryTricks.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={Brain} title="Memory Tricks" color="bg-violet-500" badge={`${notesData.memoryTricks.length}`}>
              {!isSubscribed ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl" onClick={() => alert("Memory Tricks & Shortcuts are for Premium users!")}>
                  <Lock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-black text-foreground">Premium Feature</p>
                  <p className="text-xs text-slate-500 mt-1">Upgrade to unlock AI Memory Tricks.</p>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {Array.isArray(notesData.memoryTricks) && notesData.memoryTricks.map((m, i) => (
                    <div key={i} className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 rounded-xl p-4 flex items-start gap-3 break-inside-avoid">
                      <span className="text-violet-500 text-lg shrink-0">🧠</span>
                      <div className="text-xs font-bold text-violet-800 dark:text-violet-300 leading-relaxed">
                        <MathRenderer content={lang === "hi" ? m.trickHindi : m.trick} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SmartAccordion>
          )}

          {/* 🚀 QUICK REVISION — 1 liner facts */}
          {notesData?.quickRevision && notesData.quickRevision.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={Clock} title="Last-Minute Revision" color="bg-indigo-500" badge="Fast">
              <div className="space-y-2 pt-2">
                {Array.isArray(notesData.quickRevision) && notesData.quickRevision.map((point, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <Zap className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 leading-tight">
                       <MathRenderer content={point} />
                    </p>
                  </div>
                ))}
              </div>
            </SmartAccordion>
          )}

          {/* 📑 FORMULA SHEET — Clean LaTeX formulas */}
          {notesData?.formulaSheet && notesData.formulaSheet.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={BookText} title="Formula Facts" color="bg-blue-500" badge="Maths">
              <div className="space-y-3 pt-2">
                {Array.isArray(notesData.formulaSheet) && notesData.formulaSheet.map((f, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border break-inside-avoid">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{f.title}</p>
                    <div className="text-base font-black text-indigo-600 dark:text-indigo-400 my-2">
                      <MathRenderer content={(f.equation && f.equation.includes('$')) ? f.equation : `$${f.equation}$`} />
                    </div>
                    <p className="text-[10px] text-slate-500 italic">{f.usage}</p>
                  </div>
                ))}
              </div>
            </SmartAccordion>
          )}

          {/* 🔥 FINAL CHEAT SHEET */}
          {notesData?.finalCheatSheet && notesData.finalCheatSheet.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={Flame} title="Final Cheat Sheet" color="bg-orange-500" badge="1 Min Read">
              <div className="space-y-2 pt-2">
                {Array.isArray(notesData.finalCheatSheet) && notesData.finalCheatSheet.map((point, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900/40 break-inside-avoid">
                    <span className="text-lg shrink-0 mt-0.5">⚡</span>
                    <div className="text-xs font-black text-orange-900 dark:text-orange-200 leading-tight">
                       <MathRenderer content={point} />
                    </div>
                  </div>
                ))}
              </div>
            </SmartAccordion>
          )}

          {/* 🎯 EXAM BOOSTER — Probability & Frequency */}
          {notesData?.examBooster && (
            <SmartAccordion forceOpen={isExporting} icon={Trophy} title="Exam Booster" color="bg-rose-500" badge="Hot">
              <div className="space-y-3 pt-2">
                <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <h5 className="text-[10px] font-black uppercase text-rose-600 mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> High Probability Topics
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(notesData.examBooster.highProbabilityTopics) && notesData.examBooster.highProbabilityTopics.map((t, i) => (
                      <span key={i} className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-black text-rose-500 border border-rose-200 dark:border-rose-900 shadow-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1">Board Frequency Analysis</h5>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                    <MathRenderer content={notesData.examBooster.boardFrequency} />
                  </div>
                </div>
              </div>
            </SmartAccordion>
          )}

          {/* 💡 WATCH OUT! — Common Mistakes (Improved) */}
          {notesData?.commonMistakesNew && notesData.commonMistakesNew.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={Lightbulb} title="Watch Out!" color="bg-amber-500" badge="Alert">
              <div className="space-y-3 pt-2">
                {Array.isArray(notesData.commonMistakesNew) && notesData.commonMistakesNew.map((m, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border break-inside-avoid">
                    <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-2">
                      <span className="text-amber-500 text-sm shrink-0 mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <p className="text-xs font-black text-amber-800 dark:text-amber-300 mb-1">Common Mistake</p>
                        <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                          <MathRenderer content={`"${m.mistake}"`} />
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/10 flex items-start gap-2 border-t border-border/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 mb-0.5">Correct Way</p>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                           <MathRenderer content={m.correction} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SmartAccordion>
          )}

          {/* 📅 ADAPTIVE STUDY PLAN */}
          {notesData?.improvementPlanNew && (
            <SmartAccordion forceOpen={isExporting} icon={Activity} title="AI Study Plan" color="bg-blue-600" badge="3-Day">
              <div className="space-y-3 pt-2">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <h5 className="text-[10px] font-black uppercase text-blue-600 mb-2">My Weak Areas</h5>
                  <div className="space-y-2">
                    {Array.isArray(notesData.improvementPlanNew.weakAreas) && notesData.improvementPlanNew.weakAreas.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {w}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {Array.isArray(notesData.improvementPlanNew.practicePlan) && notesData.improvementPlanNew.practicePlan.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-border shadow-sm">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">D{i+1}</div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        <MathRenderer content={step} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SmartAccordion>
          )}

          {/* 🧠 AI ANALYTICS HUB */}
          {notesData?.adaptiveLearningNew && (
            <SmartAccordion forceOpen={isExporting} icon={Brain} title="AI Learning Insights" color="bg-purple-500" badge="AI">
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200 leading-relaxed italic">
                    <MathRenderer content={`"${notesData.adaptiveLearningNew.currentLevelAnalysis}"`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Current Difficulty</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    notesData.adaptiveLearningNew.difficultyAdjustment.includes('Increase') ? 'bg-rose-100 text-rose-600' : 
                    notesData.adaptiveLearningNew.difficultyAdjustment.includes('Decrease') ? 'bg-emerald-100 text-emerald-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {notesData.adaptiveLearningNew.difficultyAdjustment}
                  </span>
                </div>
              </div>
            </SmartAccordion>
          )}

          {/* VVIP Questions */}
          {notesData?.subjectiveQuestions && notesData.subjectiveQuestions.length > 0 && (
            <SmartAccordion forceOpen={isExporting} icon={HelpCircle} title="VVIP Questions" color="bg-rose-500" badge="Exam Important">
              {!isSubscribed ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl" onClick={() => alert("VVIP Question Tagging is a Premium feature!")}>
                  <Lock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-black text-foreground">Premium Feature</p>
                  <p className="text-xs text-slate-500 mt-1">Upgrade to unlock most repeated questions.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {notesData.subjectiveQuestions.map((q, i) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden break-inside-avoid bg-white dark:bg-slate-950 shadow-sm">
                      <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-3 flex items-center justify-between">
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider">
                          ⭐ High Chance
                        </span>
                        <span className="text-[9px] font-black text-slate-400">{q.weightage} Marks</span>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="text-sm font-black text-foreground leading-tight">
                          <MathRenderer content={q.q} />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <MathRenderer content={q.a} />
                        </div>
                        {q.easyWay && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-2.5 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              <MathRenderer content={q.easyWay} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SmartAccordion>
          )}

        </div>

        {/* ── PDF ONLY FINAL PAGE ─────────────────── */}
        <div className="hidden pdf-only-section" style={{ pageBreakBefore: 'always' }}>
          <div className="min-h-[800px] flex flex-col items-center justify-center text-center p-10 bg-gradient-to-b from-white to-indigo-50/50 mt-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-600/30 mb-8">
              <span className="text-3xl font-black text-white">A</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              Hi, {userData?.name?.split(' ')[0] || "Champion"}!
            </h1>
            <p className="text-lg text-slate-600 font-medium mb-12 max-w-sm mx-auto">
              🎉 Keep learning, keep growing! You're on the path to success.
            </p>
            
            <div className="w-full max-w-md bg-white border border-border rounded-3xl p-8 shadow-sm mb-12 mx-auto">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6 text-center">Why Achivox?</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3"><span className="text-xl">🤖</span><span className="font-bold text-slate-700">AI Smart Notes</span></div>
                <div className="flex items-center gap-3"><span className="text-xl">📊</span><span className="font-bold text-slate-700">Performance Analysis</span></div>
                <div className="flex items-center gap-3"><span className="text-xl">🎯</span><span className="font-bold text-slate-700">Exam Booster System</span></div>
                <div className="flex items-center gap-3"><span className="text-xl">⚡</span><span className="font-bold text-slate-700">Quick Revision Tools</span></div>
                <div className="flex items-center gap-3"><span className="text-xl">🧠</span><span className="font-bold text-slate-700">Personalized Study Plan</span></div>
              </div>
            </div>

            {/* Clickable Download Button for PDF */}
            <a href="https://achivox.com/app" target="_blank" className="bg-indigo-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-xl shadow-indigo-600/20 inline-block mx-auto text-decoration-none">
              Download Achivox App
            </a>
          </div>
        </div>

        {/* ── ACTION BUTTONS ─────────────────── */}
        <div className="no-print px-4 pt-4 grid grid-cols-3 gap-3">
          <button
            onClick={onStartTest}
            className="bg-primary text-white p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <MonitorPlay className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-wider">Live Test</span>
          </button>
          <button
            onClick={() => onAskDoubt?.()}
            className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-transform relative overflow-hidden"
          >
            <MessageCircle className="w-6 h-6 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-wider">Ask Doubt</span>
          </button>
          <button
            onClick={() => onVoiceDoubt?.()}
            className="bg-card border border-border text-foreground p-4 rounded-2xl shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-transform relative overflow-hidden"
          >
            <Mic className="w-6 h-6 text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-wider">Voice</span>
          </button>
        </div>
      </div>


      <AnimatePresence>
        {showTopperNotes && (
          <TopperNotes
            topic={displayTopic}
            subject={displaySubject}
            userData={userData}
            onClose={() => setShowTopperNotes(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
