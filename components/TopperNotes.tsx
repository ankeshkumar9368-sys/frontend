"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Download, Sparkles, Lightbulb, AlertCircle, BookOpen, 
  PenTool, StickyNote, Bookmark, ChevronRight, CheckCircle2,
  Globe, GraduationCap, ChevronDown, Check, ArrowRight, Printer, Star, ImageIcon, ExternalLink
} from "lucide-react";
import { generateTopperNotes } from "../lib/gemini";
import { getSubjects, getChapters, getTopics, INDIAN_BOARDS, CLASSES } from "../lib/curriculum";
import { fetchMultipleWikiImages, WikiImage } from "../lib/wikipedia";
import MathRenderer from "./MathRenderer";
import { useStudyTimer } from "../lib/analytics";

function parseTextMindmap(text: string) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return lines.map(line => {
    const cleanLine = line.replace(/[├└│┌─┼┬\-\*\+•]/g, '').trim();
    const match = line.match(/^[\s│├└─\-\*\+•]+/);
    let level = 0;
    if (match) {
      const prefix = match[0];
      const totalChars = prefix.length;
      level = Math.floor(totalChars / 3);
      if (level < 0) level = 0;
    }
    return { text: cleanLine, level };
  });
}

function VisualMindmap({ chartText }: { chartText: string }) {
  const nodes = parseTextMindmap(chartText);
  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-inner font-sans space-y-3.5 my-4">
      {nodes.map((node, i) => {
        let styleClass = "";
        let indentStyle = {};

        if (node.level === 0) {
          styleClass = "bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base font-black shadow-md px-5 py-3 rounded-2xl border-none text-center max-w-md mx-auto transform hover:scale-[1.02] transition-transform";
        } else if (node.level === 1) {
          styleClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 text-sm font-bold border-l-4 border-l-emerald-500 border-y border-r border-emerald-100 dark:border-emerald-900/50 px-4 py-3 rounded-r-xl shadow-sm";
          indentStyle = { marginLeft: '24px' };
        } else if (node.level === 2) {
          styleClass = "bg-sky-50/70 dark:bg-sky-950/10 text-sky-900 dark:text-sky-100 text-xs font-bold border-l-4 border-l-sky-400 border-y border-r border-sky-100 dark:border-sky-900/30 px-3.5 py-2.5 rounded-r-lg shadow-sm";
          indentStyle = { marginLeft: '48px' };
        } else {
          styleClass = "bg-slate-100/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-[11px] font-bold border-l-4 border-l-slate-400 border-y border-r border-slate-200/50 dark:border-slate-700/50 px-3 py-2 rounded-r-md";
          indentStyle = { marginLeft: `${Math.min(node.level * 24, 120)}px` };
        }

        return (
          <div key={i} style={indentStyle} className="transition-all duration-200">
            <div className={`${styleClass} flex items-center gap-2.5`}>
              {node.level > 0 && (
                <span className="text-emerald-500 font-bold shrink-0">
                  {node.level === 1 ? "🌴" : "🌱"}
                </span>
              )}
              <span className="leading-relaxed">{node.text}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmartTextRenderer({ content }: { content: string }) {
  if (!content) return null;
  // Check if content has LaTeX math, equations, fractions, or superscripts/subscripts
  const hasLatex = /\$|\\frac|\\Delta|\\hbar|\\cdot|\^|_|\\{/i.test(content);
  if (hasLatex) {
    return <MathRenderer content={content} />;
  }
  return <span>{content}</span>;
}

interface TopperNotesProps {
  topic?: string;
  subject?: string;
  userData?: any;
  onClose: () => void;
}

export default function TopperNotes({ 
  topic: initialTopic, 
  subject: initialSubject, 
  userData, 
  onClose 
}: TopperNotesProps) {
  // Config selection states
  const [board, setBoard] = useState(userData?.board || "CBSE");
  const [cls, setCls] = useState(userData?.cls || "Class 10");
  const [goalMode, setGoalMode] = useState("Board Exams");
  const [language, setLanguage] = useState("Hinglish");
  
  const [subject, setSubject] = useState(initialSubject || "");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState(initialTopic || "");
  const [customTopic, setCustomTopic] = useState("");
  const [showCustomTopicInput, setShowCustomTopicInput] = useState(false);

  // Notes data states
  const [notes, setNotes] = useState<any>(null);
  useStudyTimer(notes ? topic.toLowerCase().replace(/\s+/g, "-") : null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNotebookTab, setActiveNotebookTab] = useState("snapshot"); // snapshot, core, visuals, mistakes, pyqs
  const [zoomScale, setZoomScale] = useState(1.0);
  const [downloading, setDownloading] = useState(false);

  // Wikipedia diagram states
  const [wikiImages, setWikiImages] = useState<Record<string, WikiImage | null>>({});
  const [diagramsLoading, setDiagramsLoading] = useState(false);

  // Interactive states
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<Record<number, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Dynamic dropdown lists
  const subjects = getSubjects(cls, board);
  const chapters = subject ? getChapters(subject, cls, board) : [];
  const topics = (subject && chapter) ? getTopics(chapter, subject, cls) : [];
  const isGeneratingRef = useRef(false);

  // If initial topic and subject are passed, trigger generation immediately
  useEffect(() => {
    if (initialTopic && initialSubject) {
      handleGenerate(initialTopic, initialSubject);
    }
  }, [initialTopic, initialSubject]);

  // Reset child selections on parent changes
  useEffect(() => {
    if (!initialSubject) setSubject(subjects[0] || "");
  }, [cls, board]);

  useEffect(() => {
    setChapter(chapters[0] || "");
  }, [subject]);

  useEffect(() => {
    setTopic(topics[0] || "");
    setShowCustomTopicInput(false);
  }, [chapter]);

  const handleGenerate = async (targetTopic: string = topic, targetSubject: string = subject) => {
    const finalTopic = showCustomTopicInput ? customTopic : targetTopic;
    if (!finalTopic) {
      alert("Please enter or select a topic first!");
      return;
    }

    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    setLoading(true);
    setError("");
    setWikiImages({});
    try {
      const data = await generateTopperNotes(finalTopic, targetSubject, cls, board, goalMode, language);
      if (data) {
        setNotes(data);
        setActiveNotebookTab("snapshot");
        setSelectedMcqAnswers({});
        setRevealedAnswers({});
        // Fetch Wikipedia diagrams in background after notes load
        if (data.diagramSuggestions && data.diagramSuggestions.length > 0) {
          setDiagramsLoading(true);
          const skipTerms = ["physics", "chemistry", "biology", "mathematics", "maths", "science", "history", "geography", "civics", "economics", "english", "hindi", "sanskrit", "none", "n/a", "null", "general"];
          const filteredSuggestions = data.diagramSuggestions.filter((s: any) => 
            s.wikiTitle && !skipTerms.includes(s.wikiTitle.toLowerCase().trim())
          );
          fetchMultipleWikiImages(filteredSuggestions)
            .then((imgs) => {
              setWikiImages(imgs);
            })
            .catch(console.error)
            .finally(() => setDiagramsLoading(false));
        }
      } else {
        setError("Failed to generate notes. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while generating notes.");
    } finally {
      isGeneratingRef.current = false;
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const oldScrollX = window.scrollX;
    const oldScrollY = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const source = document.getElementById("topper-notes-pdf-template");
      if (!source) {
        alert("PDF template not found!");
        setDownloading(false);
        return;
      }

      // 1. Create a layout wrapper styled to render off-screen but readable by browser
      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-render-wrapper';
      Object.assign(wrapper.style, {
        position:        'fixed',
        top:             '0',
        left:            '0',
        width:           '820px',
        height:          'auto',
        zIndex:          '-9999',
        opacity:         '0.01',
        pointerEvents:   'none',
        overflow:        'visible',
        display:         'block',
        backgroundColor: '#ffffff',
      });

      // 2. Clone the source template and assign it a standard relative layout (crucial to avoid html2canvas blank page)
      const clone = source.cloneNode(true) as HTMLElement;
      clone.setAttribute('style', 'position: relative; width: 820px; min-width: 820px; max-width: 820px; background: #fbf8eb; box-sizing: border-box; padding: 0; margin: 0; line-height: 1.6; font-family: "Kalam", "Patrick Hand", "Caveat", cursive; display: block; visibility: visible; opacity: 1;');

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Wait 1.5 seconds for all images, MathJax, and KaTeX subcomponents to paint
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html2pdf = (await import("html2pdf.js")).default as any;

      const opt = {
        margin:       0, // mm
        filename:     `${notes.metadata.topic.replace(/\W+/g, "_")}_Topper_Notes.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 820,
        },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNative;

      if (isCapacitor) {
        const pdfDataUri = await html2pdf().from(clone).set(opt).outputPdf('datauristring');
        const pdfBase64 = pdfDataUri.split('base64,')[1];
        
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        
        const fileName = `${notes.metadata.topic.replace(/\W+/g, "_")}_Topper_Notes.pdf`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents
        });
        await Share.share({
          title: 'Save Topper Notes',
          text: `Revision Notes for ${notes.metadata.topic}`,
          url: savedFile.uri,
          dialogTitle: 'Save Topper Notes PDF'
        });
      } else {
        await html2pdf().from(clone).set(opt).save();
      }

      // Remove wrapper
      document.body.removeChild(wrapper);
      window.scrollTo(oldScrollX, oldScrollY);

    } catch (err) {
      console.error("PDF download failed:", err);
      const stale = document.getElementById('pdf-render-wrapper');
      if (stale) stale.parentNode?.removeChild(stale);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };


  if (loading) {
    return (
      <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-4">
          <div className="relative inline-block">
             <PenTool className="w-10 h-10 text-amber-400 animate-bounce mx-auto" />
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="absolute -inset-4 border-2 border-dashed border-amber-400/50 rounded-full"
             />
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-black text-lg uppercase tracking-wider">Topper is writing notes...</h3>
            <p className="text-slate-400 text-xs font-semibold">Creating handwritten formulas, mindmaps, mnemonics, and PYQs in {language} style.</p>
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€ SELECTION SCREEN â”€â”€
  if (!notes) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative"
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-transform z-10">
            <X className="w-6 h-6" />
          </button>

          <div className="p-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-black uppercase text-amber-600 tracking-wider">New Premium Feature</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">Topper's Revision Notes</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-8">Get ultra-focused 5-minute revision sheets, hand-drawn comparison tables, memory mnemonics, and real board questions.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left Column: Personalization */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">1. Personalize Language & Goal</h3>
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Target Exam / Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Board Exams", "JEE Main/Adv", "NEET", "Olympiad"].map((goal) => (
                      <button
                        key={goal}
                        onClick={() => setGoalMode(goal)}
                        className={`p-3 rounded-xl border text-xs font-black tracking-wide uppercase transition-all ${
                          goalMode === goal 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Preferred Note Language</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: "English", label: "English" },
                      { code: "Hinglish", label: "Hinglish" },
                      { code: "Hindi", label: "हिंदी" }
                    ].map((langOpt) => (
                      <button
                        key={langOpt.code}
                        onClick={() => setLanguage(langOpt.code)}
                        className={`p-3 rounded-xl border text-xs font-black tracking-wide transition-all ${
                          language === langOpt.code 
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {langOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Board</label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                    >
                      {INDIAN_BOARDS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Class</label>
                    <select
                      value={cls}
                      onChange={(e) => setCls(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Subject & Topic Selection */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">2. Select Chapter / Topic</h3>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {subject && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Chapter</label>
                    <select
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="" disabled>Select Chapter</option>
                      {chapters.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                )}

                {subject && chapter && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Topic</label>
                      <button 
                        onClick={() => setShowCustomTopicInput(!showCustomTopicInput)}
                        className="text-[9px] font-bold uppercase text-primary tracking-wider"
                      >
                        {showCustomTopicInput ? "Select List" : "Type Custom"}
                      </button>
                    </div>

                    {showCustomTopicInput ? (
                      <input
                        type="text"
                        placeholder="e.g. Newton's Third Law, Photosynthesis"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-primary transition-colors"
                      />
                    ) : (
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                      >
                        <option value="" disabled>Select Topic</option>
                        {topics.map((top) => (
                          <option key={top} value={top}>{top}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold mt-4 text-center">{error}</p>
            )}

            <button
              onClick={() => handleGenerate()}
              className="w-full bg-primary hover:bg-primary/95 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 mt-8 text-sm uppercase tracking-widest active:scale-98"
            >
              <PenTool className="w-4 h-4" />
              Generate Topper Notes
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Helper to detect LaTeX mathematical notations
  const hasLatex = (text: string) => {
    if (!text) return false;
    return /\\(frac|d?frac|sqrt|alpha|beta|gamma|delta|theta|pi|mu|sigma|omega|phi|lambda|Delta|pm|times|div|ge|le|ne|approx|infty|degree|cdot|\[|\()|[\$\^_]/g.test(text);
  };

  // Render content using MathRenderer if it has LaTeX, otherwise use highlighter effects
  const renderTextContent = (text: string) => {
    if (hasLatex(text)) {
      return <MathRenderer content={text} />;
    }
    return renderHighlightedText(text);
  };

  // Helper function to render text with highlighter effects
  const renderHighlightedText = (text: string) => {
    if (!notes.highlighterPoints || notes.highlighterPoints.length === 0) return text;
    const sortedPoints = [...notes.highlighterPoints].sort((a: string, b: string) => b.length - a.length);
    let html = text;
    sortedPoints.forEach((point: string) => {
      if (!point || point.trim().length < 2) return;
      const regex = new RegExp(`\\b(${point.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, "gi");
      html = html.replace(regex, `<span class="highlighter-yellow">$1</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Helper: get diagrams for a specific section and optional concept
  const getDiagrams = (section: string, insertAfterConcept?: string) => {
    if (!notes?.diagramSuggestions) return [];
    return notes.diagramSuggestions.filter((d: any) => {
      if (d.section !== section) return false;
      if (insertAfterConcept) return d.insertAfterConcept === insertAfterConcept;
      return true;
    });
  };

  // Helper to render any diagrams for the current tab that weren't matched in-line
  const renderUnmatchedDiagrams = (section: string) => {
    if (!notes?.diagramSuggestions) return null;
    
    // Get all diagrams for this section
    const sectionDiagrams = notes.diagramSuggestions.filter((d: any) => d.section === section);
    if (sectionDiagrams.length === 0) return null;

    // Identify which concepts/titles exist in this tab
    const placedConcepts = new Set<string>();
    
    if (section === "snapshot") {
      placedConcepts.add("Chapter Snapshot");
      notes.keyConcepts?.forEach((c: any) => { if (c.concept) placedConcepts.add(c.concept); });
    } else if (section === "core") {
      placedConcepts.add("Definitions & Terms");
      placedConcepts.add("Formula Sheet");
      notes.comparisons?.forEach((t: any) => { if (t.title) placedConcepts.add(t.title); });
    } else if (section === "visuals") {
      return null;
    } else if (section === "mistakes") {
      placedConcepts.add("Common Mistakes to Avoid");
    }

    // Filter diagrams where insertAfterConcept is NOT in placedConcepts
    const unmatched = sectionDiagrams.filter((d: any) => !d.insertAfterConcept || !placedConcepts.has(d.insertAfterConcept));
    if (unmatched.length === 0) return null;

    return (
      <div className="border-t border-dashed border-slate-400/30 pt-6 mt-6">
        <h3 className="handwritten text-xl sm:text-2xl font-bold text-indigo-800 mb-2">📐 Additional Visuals</h3>
        {unmatched.map((d: any) => (
          <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
        ))}
      </div>
    );
  };

  // DiagramCard: fetches and renders a Wikipedia diagram
  const DiagramCard = ({ wikiTitle, label }: { wikiTitle: string; label: string }) => {
    const skipTerms = ["physics", "chemistry", "biology", "mathematics", "maths", "science", "history", "geography", "civics", "economics", "english", "hindi", "sanskrit", "none", "n/a", "null", "general"];
    if (skipTerms.includes(wikiTitle.toLowerCase().trim())) return null;

    const img = wikiImages[wikiTitle];
    const isLoading = diagramsLoading && img === undefined;

    if (isLoading) {
      return (
        <div className="my-5 rounded-2xl overflow-hidden border border-indigo-200 bg-indigo-50/50 flex items-center justify-center gap-3 p-6 animate-pulse">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Loading diagram...</span>
        </div>
      );
    }

    if (!img) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-6 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-md"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600">
          <ImageIcon className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">📐 DIAGRAM</span>
        </div>
        {/* Image */}
        <div className="flex flex-col items-center p-3 sm:p-5">
          <img
            src={img.url}
            alt={label}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="max-h-72 w-auto object-contain rounded-xl border border-slate-200 shadow-sm bg-white"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <p className="mt-3 text-center text-xs font-bold text-slate-600 italic leading-snug max-w-sm">
            {label}
            <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-wider mt-1">Source Concept: {img.caption}</span>
          </p>
        </div>
      </motion.div>
    );
  };

  const pdfPageStyle = {
    width: '820px',
    minWidth: '820px',
    maxWidth: '820px',
    height: '1122px',
    minHeight: '1122px',
    maxHeight: '1122px',
    border: '10px double #b45309',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    backgroundColor: '#fbf8eb',
    backgroundImage: 'linear-gradient(90deg, transparent 79px, #e9a6a6 79px, #e9a6a6 81px, transparent 81px), linear-gradient(#e1ded3 .1em, transparent .1em)',
    backgroundSize: '100% 1.6em',
    padding: '40px 40px 40px 100px',
    fontFamily: "'Kalam', 'Patrick Hand', 'Caveat', cursive",
    lineHeight: '1.6',
    color: '#1e293b',
    overflow: 'hidden' as const,
    pageBreakAfter: 'always' as const,
    breakAfter: 'page' as const,
  };

  // ── NOTES VIEWER SCREEN (Spiral Notebook UI) ──
  return (
    <div className="fixed inset-0 z-[290] bg-slate-950/95 backdrop-blur-xl overflow-y-auto flex flex-col items-center py-6 px-4 no-scrollbar">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Patrick+Hand&family=Gochi+Hand&family=Kalam:wght@400;700&display=swap');
        
        .handwritten {
          font-family: 'Kalam', 'Caveat', cursive;
        }
        .handwritten-content {
          font-family: 'Kalam', 'Patrick Hand', cursive;
        }
        .paper-texture {
          background-color: #fbf8eb;
          background-image: 
            linear-gradient(90deg, transparent 79px, #e9a6a6 79px, #e9a6a6 81px, transparent 81px),
            linear-gradient(#e1ded3 .1em, transparent .1em);
          background-size: 100% 1.6em;
        }
        .highlighter-yellow {
          background: linear-gradient(104deg, rgba(255, 255, 0, 0) 0.9%, rgba(255, 255, 0, 0.75) 2.4%, rgba(255, 255, 0, 0.65) 5.8%, rgba(255, 255, 0, 0.15) 93%, rgba(255, 255, 0, 0.8) 96%, rgba(255, 255, 0, 0) 98%), linear-gradient(183deg, rgba(255, 255, 0, 0) 0%, rgba(255, 255, 0, 0.3) 7.9%, rgba(255, 255, 0, 0) 15%);
          padding: 0 4px;
          border-radius: 4px;
          color: #1e293b;
          font-weight: bold;
        }
        .custom-ring-steel {
          background: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 50%, #64748b 100%);
          box-shadow: inset 1px 1px 2px rgba(255,255,255,0.4), 1px 2px 3px rgba(0,0,0,0.15);
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .pdf-content-area {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .paper-texture {
            background-color: white !important;
            background-image: none !important;
          }
        }
      `}</style>

      {/* Floating Toolbar */}
      <div className="no-print w-full max-w-4xl flex justify-between items-center mb-6 gap-2">
        <button 
          onClick={() => {
            if (initialTopic && initialSubject) {
              onClose();
            } else {
              setNotes(null);
            }
          }} 
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider border border-white/15 shrink-0"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">{initialTopic ? "Close Notes" : "Select Topic"}</span>
          <span className="inline sm:hidden">{initialTopic ? "Close" : "Select"}</span>
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/10 rounded-2xl p-1 border border-white/15 select-none">
          <button 
            onClick={() => setZoomScale(prev => Math.max(prev - 0.1, 0.2))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-transform font-black text-xs"
            title="Zoom Out"
          >
            A-
          </button>
          <button 
            onClick={() => setZoomScale(1.0)}
            className="text-[10px] font-black uppercase tracking-wider text-white hover:text-amber-400 px-1 w-10 text-center"
            title="Reset Zoom"
          >
            {Math.round(zoomScale * 100)}%
          </button>
          <button 
            onClick={() => setZoomScale(prev => Math.min(prev + 0.1, 1.5))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-transform font-black text-xs"
            title="Zoom In"
          >
            A+
          </button>
        </div>

        <div className="flex gap-2 shrink-0">
          <button 
            disabled={downloading}
            onClick={handleDownloadPDF}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            title="Download Notes PDF"
          >
            {downloading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
          <button 
            onClick={onClose} 
            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl flex items-center justify-center border border-white/15 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Spiral Binder Main Container */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-2 relative">
        
        {/* Notebook Index Tabs (Stickers on the side) - no-print */}
        <div className="no-print flex md:flex-col gap-1.5 md:order-2 shrink-0 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none md:mt-20">
          {[
            { id: "snapshot", label: "📖 Snapshot & Concepts", color: "bg-rose-500", text: "text-rose-500" },
            { id: "core", label: "⚡ Formulas & Tables", color: "bg-amber-500", text: "text-amber-500" },
            { id: "visuals", label: "🗺️ Mindmaps & Booster", color: "bg-emerald-500", text: "text-emerald-500" },
            { id: "mistakes", label: "❌ Mistakes & Tricks", color: "bg-orange-500", text: "text-orange-500" },
            { id: "pyqs", label: "🎯 PYQs & Practice", color: "bg-indigo-600", text: "text-indigo-600" }
          ].map((tabOpt) => {
            const isActive = activeNotebookTab === tabOpt.id;
            return (
              <button
                key={tabOpt.id}
                onClick={() => setActiveNotebookTab(tabOpt.id)}
                className={`py-2 px-3 md:py-3 md:px-4 rounded-xl md:rounded-r-2xl md:rounded-l-none text-[10px] font-black uppercase tracking-wider text-left transition-all flex items-center gap-2 border md:border-l-0 ${
                  isActive 
                    ? `${tabOpt.color} text-white border-transparent scale-105 shadow-md z-10` 
                    : "bg-white/5 dark:bg-slate-900/50 hover:bg-white/10 border-white/10 text-white/70"
                }`}
              >
                <span>{tabOpt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable wrapper for paper notebook page on mobile */}
        <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-6 scroll-smooth">
          {/* Paper Notebook Page */}
          <motion.div 
            layout
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ zoom: zoomScale }}
            className="paper-texture shadow-2xl rounded-3xl p-6 sm:p-10 min-h-[750px] border border-slate-300 relative overflow-hidden flex flex-col justify-between pdf-content-area min-w-[700px] md:min-w-0"
          >
          {/* Notebook Margin Line */}
          <div className="absolute left-[30px] sm:left-[70px] top-0 bottom-0 w-[2px] bg-red-400 opacity-30 no-print" />

          {/* Notebook Spiral rings elements on the left side - no-print */}
          <div className="no-print absolute left-0.5 sm:left-2 top-0 bottom-0 flex flex-col justify-around py-8 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {/* Steel Ring */}
                <div className="w-6 h-2 sm:w-12 sm:h-3.5 custom-ring-steel rounded-full transform -rotate-12 z-20" />
                {/* Punch Holes */}
                <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-950/80 -ml-1.5 sm:-ml-3" />
              </div>
            ))}
          </div>

          {/* Notebook Page Content */}
          <div className="pl-9 sm:pl-16 flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="mb-8 border-b border-dashed border-slate-400/50 pb-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <Star className="w-5 h-5 fill-indigo-100" />
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">Topper's Personal Revision Log</span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
                  {notes.metadata.topic}
                </h1>
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {notes.metadata.subject} · {notes.metadata.class} · {notes.metadata.board}
                  </span>
                  <span className="bg-indigo-100 text-indigo-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Target: {notes.metadata.goal}
                  </span>
                </div>
              </div>

              {/* ── Tab 1: Snapshot & Concepts ── */}
              {activeNotebookTab === "snapshot" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Chapter Snapshot */}
                  <div>
                    <h2 className="handwritten text-2xl sm:text-3xl font-bold text-rose-600 mb-4 flex items-center gap-2">
                      📖 Chapter Snapshot
                    </h2>
                    <ul className="handwritten-content text-lg sm:text-xl text-slate-800 space-y-3.5 leading-[1.4em]">
                      {notes.chapterSnapshot?.map((point: string, idx: number) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <span className="text-rose-500 font-sans font-black text-sm mt-1">✓</span>
                          <span className="w-full">{renderTextContent(point)}</span>
                        </li>
                      ))}
                    </ul>
                    {/* Diagrams after Chapter Snapshot */}
                    {getDiagrams("snapshot", "Chapter Snapshot").map((d: any) => (
                      <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                    ))}
                  </div>

                  {/* Key Concepts */}
                  <div>
                    <h2 className="handwritten text-2xl sm:text-3xl font-bold text-rose-600 mb-5 flex items-center gap-2 border-t border-dashed border-slate-400/30 pt-6">
                      💡 Key Concepts
                    </h2>
                    <div className="space-y-6">
                      {notes.keyConcepts?.map((conceptObj: any, idx: number) => (
                        <div key={idx}>
                          <div className="bg-slate-100/40 dark:bg-transparent rounded-2xl p-4 border border-slate-400/20">
                            <h3 className="handwritten text-xl sm:text-2xl font-bold text-indigo-800 mb-2">
                              {conceptObj.concept}
                            </h3>
                            <ul className="handwritten-content text-lg sm:text-xl text-slate-800 space-y-2.5 leading-[1.4em]">
                              {conceptObj.details?.map((detail: string, i: number) => (
                                <li key={i} className="flex gap-2 items-start">
                                  <span className="text-slate-400 font-sans text-xs mt-1.5">•</span>
                                  <span className="w-full">{renderTextContent(detail)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Diagram after this specific concept */}
                          {getDiagrams("snapshot", conceptObj.concept).map((d: any) => (
                            <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  {renderUnmatchedDiagrams("snapshot")}
                </div>
              )}

              {/* ── Tab 2: Core (Glossary, Formulas, Tables) ── */}
              {activeNotebookTab === "core" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Definitions */}
                  {notes.definitions && notes.definitions.length > 0 && (
                    <div>
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-amber-600 mb-4 flex items-center gap-2">
                        📖 Definitions & Terms
                      </h2>
                      <div className="space-y-4">
                        {notes.definitions.map((def: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-amber-400 pl-4 py-1">
                            <span className="handwritten text-xl sm:text-2xl font-bold text-slate-800 block leading-tight">
                              {def.term}
                            </span>
                            <div className="handwritten-content text-lg sm:text-xl text-slate-800 mt-1">
                              {renderTextContent(def.definition)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Diagrams after Definitions */}
                      {getDiagrams("core", "Definitions & Terms").map((d: any) => (
                        <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                      ))}
                    </div>
                  )}

                  {/* Formulas */}
                  {notes.formulas && notes.formulas.length > 0 && (
                    <div className="border-t border-dashed border-slate-400/30 pt-6">
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-amber-600 mb-4 flex items-center gap-2">
                        ⚙️ Formula Sheet
                      </h2>
                      <div className="grid grid-cols-1 gap-4">
                        {notes.formulas.map((form: any, idx: number) => (
                          <div key={idx} className="bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start gap-2">
                              <div className="bg-white p-3 rounded-xl border border-slate-200 w-full max-w-lg">
                                <MathRenderer content={(form.formula && form.formula.includes('$')) ? form.formula : `$$${form.formula || ''}$$`} />
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-full mt-1.5">Equation</span>
                            </div>
                            <div className="mt-3 space-y-1 handwritten-content text-lg">
                              <div className="text-slate-800 font-bold">
                                <span className="text-slate-500 text-sm font-sans uppercase font-bold">Symbols: </span> 
                                {renderTextContent(form.symbolsMeaning)}
                              </div>
                              {form.usageTip && (
                                <div className="text-amber-800 italic">
                                  <span className="text-amber-600 text-sm font-sans uppercase font-bold">Topper Tip: </span> 
                                  {renderTextContent(form.usageTip)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Diagrams after Formula Sheet */}
                      {getDiagrams("core", "Formula Sheet").map((d: any) => (
                        <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                      ))}
                    </div>
                  )}

                  {/* Comparisons / Tables */}
                  {notes.comparisons && notes.comparisons.length > 0 && (
                    <div className="border-t border-dashed border-slate-400/30 pt-6">
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-amber-600 mb-4 flex items-center gap-2">
                        ⚖️ Tables & Comparisons
                      </h2>
                      <div className="space-y-6 overflow-x-auto">
                        {notes.comparisons.map((table: any, idx: number) => (
                          <div key={idx} className="min-w-[450px]">
                            <h3 className="handwritten text-xl sm:text-2xl font-bold text-indigo-800 mb-2">{table.title}</h3>
                            <table className="w-full border-collapse border border-slate-400 font-sans text-xs">
                              <thead>
                                <tr className="bg-slate-200">
                                  {table.headers?.map((h: string, i: number) => (
                                    <th key={i} className="border border-slate-400 p-2.5 font-black text-left uppercase tracking-wider text-slate-800">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.rows?.map((row: string[], rIdx: number) => (
                                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white/40" : "bg-slate-50/40"}>
                                    {row.map((cell: string, cIdx: number) => (
                                      <td key={cIdx} className="border border-slate-400 p-2.5 font-bold text-slate-700">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {/* Diagram after each comparison table */}
                            {getDiagrams("core", table.title).map((d: any) => (
                              <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {renderUnmatchedDiagrams("core")}
                </div>
              )}

              {/* ── Tab 3: Visuals & Boosters (Flowcharts, Boosters, Mnemonics) ── */}
              {activeNotebookTab === "visuals" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Flowcharts */}
                  {notes.flowcharts && notes.flowcharts.length > 0 && (
                    <div>
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-emerald-600 mb-4 flex items-center gap-2">
                        🗺️ Text Flowchart / Mindmap
                      </h2>
                      <div className="space-y-4">
                        {notes.flowcharts.map((chart: string, idx: number) => (
                          <VisualMindmap key={idx} chartText={chart} />
                        ))}
                      </div>
                      {/* Diagrams after Flowchart/Mindmap */}
                      {getDiagrams("visuals", "Text Flowchart").map((d: any) => (
                        <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                      ))}
                      {/* All visuals-section diagrams without specific concept match */}
                      {getDiagrams("visuals").filter((d: any) => !d.insertAfterConcept || d.insertAfterConcept === "Text Flowchart").map((d: any) => (
                        <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                      ))}
                    </div>
                  )}

                  {/* Exam Booster Facts */}
                  {notes.examBoosterFacts && (
                    <div className="border-t border-dashed border-slate-400/30 pt-6">
                      <h2 className="handwritten text-3xl font-bold text-emerald-600 mb-4 flex items-center gap-2">
                        🚀 Exam Booster Facts
                      </h2>
                      <div className="space-y-4 font-sans text-xs">
                        {notes.examBoosterFacts.frequentlyAsked && notes.examBoosterFacts.frequentlyAsked.length > 0 && (
                          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block mb-1">Frequently Asked</span>
                            <ul className="list-disc pl-4 space-y-1 font-bold text-indigo-950">
                              {notes.examBoosterFacts.frequentlyAsked.map((fact: string, i: number) => (
                                <li key={i}>{fact}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {notes.examBoosterFacts.oneMark && notes.examBoosterFacts.oneMark.length > 0 && (
                          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block mb-1">1-Mark Keypoints</span>
                            <ul className="list-disc pl-4 space-y-1 font-bold text-amber-950">
                              {notes.examBoosterFacts.oneMark.map((fact: string, i: number) => (
                                <li key={i}>{fact}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {notes.examBoosterFacts.boardFavourites && notes.examBoosterFacts.boardFavourites.length > 0 && (
                          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
                            <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block mb-1">Examiner Favourites</span>
                            <ul className="list-disc pl-4 space-y-1 font-bold text-rose-950">
                              {notes.examBoosterFacts.boardFavourites.map((fact: string, i: number) => (
                                <li key={i}>{fact}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 4: Mistakes, Tricks, & NCERT ── */}
              {activeNotebookTab === "mistakes" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Common Mistakes */}
                  {notes.commonMistakes && notes.commonMistakes.length > 0 && (
                    <div>
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                        ❌ Common Mistakes to Avoid
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {notes.commonMistakes.map((mistake: any, idx: number) => (
                          <div key={idx} className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
                            <div className="text-xs font-bold text-rose-700 leading-tight">
                              <span className="font-black uppercase tracking-widest text-[9px] block text-rose-600 mb-1">Common Error:</span>
                              {renderTextContent(mistake.error)}
                            </div>
                            <div className="text-xs font-bold text-emerald-700 leading-tight border-t border-rose-100 pt-2.5">
                              <span className="font-black uppercase tracking-widest text-[9px] block text-emerald-600 mb-1">Correct Way:</span>
                              {renderTextContent(mistake.correction)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Diagrams after Common Mistakes */}
                      {getDiagrams("mistakes", "Common Mistakes to Avoid").map((d: any) => (
                        <DiagramCard key={d.wikiTitle} wikiTitle={d.wikiTitle} label={d.label} />
                      ))}
                    </div>
                  )}

                  {/* Mnemonics */}
                  {notes.memoryTricks && notes.memoryTricks.length > 0 && (
                    <div className="border-t border-dashed border-slate-400/30 pt-6">
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                        🧠 Memory Mnemonics
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {notes.memoryTricks.map((trick: string, idx: number) => (
                          <motion.div 
                             key={idx}
                             whileHover={{ rotate: 0, scale: 1.02 }}
                             className={`p-6 shadow-md -rotate-${idx % 2 === 0 ? 1 : 2} relative bg-yellow-100 text-slate-800 border-l-4 border-yellow-400 rounded-r-xl`}
                          >
                            <div className="flex items-center gap-1.5 mb-2">
                              <Bookmark className="w-4 h-4 text-yellow-600" />
                              <span className="text-[9px] font-black uppercase text-yellow-700 tracking-wider">Mnemonic Code</span>
                            </div>
                            <div className="handwritten text-lg sm:text-xl font-bold leading-tight text-slate-800">
                              {renderTextContent(trick)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NCERT Highlights */}
                  {notes.ncertHighlights && notes.ncertHighlights.length > 0 && (
                    <div className="border-t border-dashed border-slate-400/30 pt-6">
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                        📚 NCERT Line Highlights
                      </h2>
                      <div className="space-y-3">
                        {notes.ncertHighlights.map((highlight: string, idx: number) => (
                          <div key={idx} className="bg-slate-100/50 p-4 border-l-4 border-indigo-600 rounded-r-2xl shadow-sm italic text-slate-700 font-sans text-xs font-bold leading-relaxed">
                            {renderTextContent(highlight)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {renderUnmatchedDiagrams("mistakes")}
                </div>
              )}

              {/* â”€â”€ Tab 5: PYQs & 1-Page Revision â”€â”€ */}
              {activeNotebookTab === "pyqs" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* PYQs Section */}
                  {notes.pyqs && (
                    <div>
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-indigo-600 mb-5 flex items-center gap-2">
                        🎯 PYQ Style Questions
                      </h2>
                      
                      {/* MCQs (Interactive) */}
                      {notes.pyqs.mcqs && notes.pyqs.mcqs.length > 0 && (
                        <div className="space-y-5 mb-8">
                          <h3 className="handwritten text-xl sm:text-2xl font-bold text-indigo-800">1. Multiple Choice Questions</h3>
                          {notes.pyqs.mcqs.map((q: any, idx: number) => {
                            const isAnswered = selectedMcqAnswers[idx] !== undefined;
                            return (
                              <div key={idx} className="bg-white/40 border border-slate-400/25 rounded-2xl p-4 shadow-sm font-sans text-xs">
                                <p className="font-black text-slate-800 mb-3">{idx + 1}. {q.question}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options?.map((opt: string, optIdx: number) => {
                                    const isSelected = selectedMcqAnswers[idx] === optIdx;
                                    const isCorrect = q.answer?.toLowerCase().includes(`option ${String.fromCharCode(65 + optIdx).toLowerCase()}`) || q.answer?.includes(opt);
                                    
                                    let btnStyle = "border-slate-200 hover:bg-slate-100";
                                    if (isAnswered) {
                                      if (isCorrect) {
                                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800";
                                      } else if (isSelected) {
                                        btnStyle = "border-rose-500 bg-rose-50 text-rose-800";
                                      } else {
                                        btnStyle = "border-slate-200 opacity-60";
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        disabled={isAnswered}
                                        onClick={() => {
                                          setSelectedMcqAnswers(prev => ({
                                            ...prev,
                                            [idx]: optIdx
                                          }));
                                        }}
                                        className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${btnStyle}`}
                                      >
                                        <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-black shrink-0">
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span>{opt}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {isAnswered && (
                                  <div className="mt-3 p-3 bg-indigo-50/50 rounded-xl text-indigo-950 font-bold border border-indigo-100">
                                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">Answer & Explanation:</span>
                                    {q.answer}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Short Answer Questions */}
                      {notes.pyqs.shortAnswers && notes.pyqs.shortAnswers.length > 0 && (
                        <div className="space-y-4 mb-8 border-t border-dashed border-slate-400/30 pt-6">
                          <h3 className="handwritten text-xl sm:text-2xl font-bold text-indigo-800">2. Short Answer Questions</h3>
                          {notes.pyqs.shortAnswers.map((q: any, idx: number) => {
                            const isRevealed = revealedAnswers[`sa_${idx}`];
                            return (
                              <div key={idx} className="bg-slate-100/40 p-4 rounded-2xl border border-slate-400/20 font-sans text-xs">
                                <p className="font-black text-slate-800">Q: {q.question}</p>
                                {isRevealed ? (
                                  <p className="mt-2.5 font-bold text-indigo-700 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50">
                                    <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Topper Answer:</span>
                                    {q.answer}
                                  </p>
                                ) : (
                                  <button 
                                    onClick={() => setRevealedAnswers(prev => ({ ...prev, [`sa_${idx}`]: true }))}
                                    className="mt-2 text-indigo-600 hover:text-indigo-800 font-black uppercase tracking-wider text-[9px] flex items-center gap-1 active:scale-95"
                                  >
                                    Reveal Topper Answer <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Long Answer Questions */}
                      {notes.pyqs.longAnswers && notes.pyqs.longAnswers.length > 0 && (
                        <div className="space-y-4 mb-8 border-t border-dashed border-slate-400/30 pt-6">
                          <h3 className="handwritten text-xl sm:text-2xl font-bold text-indigo-800">3. Long Answer Questions</h3>
                          {notes.pyqs.longAnswers.map((q: any, idx: number) => {
                            const isRevealed = revealedAnswers[`la_${idx}`];
                            return (
                              <div key={idx} className="bg-slate-100/40 p-4 rounded-2xl border border-slate-400/20 font-sans text-xs">
                                <p className="font-black text-slate-800">Q: {q.question}</p>
                                {isRevealed ? (
                                  <div className="mt-2.5 font-bold text-indigo-700 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50 whitespace-pre-line leading-relaxed">
                                    <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Topper Answer Scheme:</span>
                                    {q.answer}
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setRevealedAnswers(prev => ({ ...prev, [`la_${idx}`]: true }))}
                                    className="mt-2 text-indigo-600 hover:text-indigo-800 font-black uppercase tracking-wider text-[9px] flex items-center gap-1 active:scale-95"
                                  >
                                    Reveal Topper Answer <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1-Page Revision Sheet */}
                  {notes.onePageRevision && notes.onePageRevision.length > 0 && (
                    <div className="border-t border-dashed border-slate-400/30 pt-6">
                      <h2 className="handwritten text-2xl sm:text-3xl font-bold text-indigo-600 mb-4 flex items-center gap-2">
                        📑 1-Page Summary Revision Sheet
                      </h2>
                      <div className="bg-indigo-950 text-indigo-100 rounded-3xl p-6 shadow-xl font-sans text-xs leading-relaxed space-y-3">
                        {notes.onePageRevision.map((point: string, idx: number) => (
                          <p key={idx} className="flex gap-2 items-start font-bold">
                            <span className="text-amber-400 text-sm mt-0.5">•</span>
                            <span>{point}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Signature */}
            <div className="mt-12 pt-6 border-t border-slate-400/30 flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
              <span>Date: {notes.metadata.date || "Revision Day"}</span>
              <div className="text-right opacity-40">
                <p className="handwritten text-2xl text-slate-800 mb-0.5 leading-none">ExamHero Topper</p>
                <p className="leading-none">Achivox AI Study Engine</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Hidden PDF template source — cloned at download time, never visible */}
      <div
        id="topper-notes-pdf-template"
        style={{
          position: 'absolute',
          top: '-99999px',
          left: '-99999px',
          width: '820px',
          backgroundColor: '#fbf8eb',
          color: '#1e293b',
          fontFamily: "'Kalam', 'Patrick Hand', 'Caveat', cursive",
          lineHeight: '1.6',
          boxSizing: 'border-box',
          padding: '0',
          margin: '0'
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Patrick+Hand&family=Gochi+Hand&family=Kalam:wght@400;700&display=swap');
          
          #topper-notes-pdf-template * {
            box-sizing: border-box !important;
            max-width: 100% !important;
            word-break: break-word !important;
          }
          #topper-notes-pdf-template table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          #topper-notes-pdf-template td, #topper-notes-pdf-template th {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            padding: 6px !important;
          }
          #topper-notes-pdf-template .math-rendered {
            font-size: 11px !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          #topper-notes-pdf-template .pdf-page {
            border: 10px double #b45309 !important;
            height: 1122px !important;
            min-height: 1122px !important;
            max-height: 1122px !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        ` }} />

        {/* Page 1: Chapter Snapshot & Key Concepts */}
        {((notes.chapterSnapshot && notes.chapterSnapshot.length > 0) || (notes.keyConcepts && notes.keyConcepts.length > 0)) && (
          <div className="pdf-page" style={pdfPageStyle}>
            <div style={{ borderBottom: '3px solid #4f46e5', paddingBottom: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4f46e5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ExamHero Topper Notes</span>
              <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: '4px 0 0 0' }}>{notes.metadata.topic}</h1>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {notes.metadata.subject} · {notes.metadata.class} · {notes.metadata.board} · Target: {notes.metadata.goal}
              </div>
            </div>

            {notes.chapterSnapshot && notes.chapterSnapshot.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e11d48', borderBottom: '1px solid #f43f5e', paddingBottom: '4px', marginBottom: '12px' }}>📖 Chapter Snapshot</h2>
                <ul style={{ listStyleType: 'none', paddingLeft: '0', margin: '0' }}>
                  {notes.chapterSnapshot.map((point: string, idx: number) => (
                    <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#334155', marginBottom: '12px', lineHeight: '1.9' }}>
                      <span style={{ color: '#e11d48', fontWeight: 'bold' }}>✓</span>
                      <span style={{ width: '100%' }}><MathRenderer content={point} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {notes.keyConcepts && notes.keyConcepts.length > 0 && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e11d48', borderBottom: '1px solid #f43f5e', paddingBottom: '4px', marginBottom: '16px' }}>💡 Key Concepts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notes.keyConcepts.map((c: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b', margin: '0 0 8px 0' }}>{c.concept}</h3>
                      <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: '#475569', lineHeight: '1.9' }}>
                        {c.details?.map((detail: string, i: number) => (
                          <li key={i} style={{ marginBottom: '4px' }}><MathRenderer content={detail} /></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page 2: Definitions & Formulas */}
        {((notes.definitions && notes.definitions.length > 0) || (notes.formulas && notes.formulas.length > 0)) && (
          <div className="pdf-page" style={pdfPageStyle}>
            {notes.definitions && notes.definitions.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706', borderBottom: '1px solid #f59e0b', paddingBottom: '4px', marginBottom: '14px' }}>📖 Definitions & Terms</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.definitions.map((def: any, idx: number) => (
                    <div key={idx} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', display: 'block' }}>{def.term}</span>
                      <div style={{ fontSize: '12px', color: '#475569', display: 'block', marginTop: '3px', lineHeight: '1.9' }}><MathRenderer content={def.definition} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.formulas && notes.formulas.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706', borderBottom: '1px solid #f59e0b', paddingBottom: '4px', marginBottom: '14px' }}>⚙️ Formula Sheet</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.formulas.map((form: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#4338ca', backgroundColor: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '350px' }}>
                          <MathRenderer content={(form.formula && form.formula.includes('$')) ? form.formula : `$$${form.formula || ''}$$`} />
                        </div>
                        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equation</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#334155', marginTop: '8px', lineHeight: '1.9' }}>
                        <strong>Symbols:</strong> <MathRenderer content={form.symbolsMeaning} />
                        {form.usageTip && <div style={{ color: '#78350f', fontStyle: 'italic', marginTop: '3px' }}><strong>Topper Tip:</strong> <MathRenderer content={form.usageTip} /></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page 3: Tables & Comparisons */}
        {notes.comparisons && notes.comparisons.length > 0 && (
          <div className="pdf-page" style={pdfPageStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706', borderBottom: '1px solid #f59e0b', paddingBottom: '4px', marginBottom: '16px' }}>⚖️ Tables & Comparisons</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {notes.comparisons.map((table: any, idx: number) => (
                <div key={idx}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '8px' }}>{table.title}</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        {table.headers?.map((h: string, i: number) => (
                          <th key={i} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#334155' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows?.map((row: string[], rIdx: number) => (
                        <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          {row.map((cell: string, cIdx: number) => (
                            <td key={cIdx} style={{ border: '1px solid #cbd5e1', padding: '8px', color: '#475569' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page 4: Flowcharts, Mindmaps & Booster Facts */}
        {((notes.flowcharts && notes.flowcharts.length > 0) || (notes.examBoosterFacts && (notes.examBoosterFacts.frequentlyAsked || notes.examBoosterFacts.oneMark || notes.examBoosterFacts.boardFavourites))) && (
          <div className="pdf-page" style={pdfPageStyle}>
            {notes.flowcharts && notes.flowcharts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669', borderBottom: '1px solid #10b981', paddingBottom: '4px', marginBottom: '14px' }}>🗺️ Text Flowchart / Mindmap</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.flowcharts.map((chart: string, idx: number) => (
                    <VisualMindmap key={idx} chartText={chart} />
                  ))}
                </div>
              </div>
            )}

            {notes.examBoosterFacts && (
              <div style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669', borderBottom: '1px solid #10b981', paddingBottom: '4px', marginBottom: '14px' }}>🚀 Exam Booster Facts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', lineHeight: '1.9' }}>
                  {notes.examBoosterFacts.frequentlyAsked && notes.examBoosterFacts.frequentlyAsked.length > 0 && (
                    <div style={{ backgroundColor: '#e0e7ff', padding: '10px 14px', borderLeft: '4px solid #6366f1', borderRadius: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#4338ca', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Frequently Asked</span>
                      <ul style={{ paddingLeft: '16px', margin: '0', fontWeight: 'bold', color: '#1e1b4b' }}>
                        {notes.examBoosterFacts.frequentlyAsked.map((fact: string, i: number) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {notes.examBoosterFacts.oneMark && notes.examBoosterFacts.oneMark.length > 0 && (
                    <div style={{ backgroundColor: '#fef3c7', padding: '10px 14px', borderLeft: '4px solid #d97706', borderRadius: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>1-Mark Keypoints</span>
                      <ul style={{ paddingLeft: '16px', margin: '0', fontWeight: 'bold', color: '#78350f' }}>
                        {notes.examBoosterFacts.oneMark.map((fact: string, i: number) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {notes.examBoosterFacts.boardFavourites && notes.examBoosterFacts.boardFavourites.length > 0 && (
                    <div style={{ backgroundColor: '#ffe4e6', padding: '10px 14px', borderLeft: '4px solid #f43f5e', borderRadius: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#be123c', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Examiner Favourites</span>
                      <ul style={{ paddingLeft: '16px', margin: '0', fontWeight: 'bold', color: '#881337' }}>
                        {notes.examBoosterFacts.boardFavourites.map((fact: string, i: number) => (
                          <li key={i}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page 5: Diagrams & Visuals */}
        {notes.diagramSuggestions && notes.diagramSuggestions.length > 0 && (
          <div className="pdf-page" style={pdfPageStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669', borderBottom: '1px solid #10b981', paddingBottom: '4px', marginBottom: '14px' }}>📐 Diagrams & Visuals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {notes.diagramSuggestions.map((d: any, idx: number) => {
                const img = wikiImages[d.wikiTitle];
                if (!img) return null;
                return (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', backgroundColor: '#ffffff', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={img.url} alt={d.label} crossOrigin="anonymous" style={{ maxHeight: '160px', maxWidth: '220px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #f1f5f9' }} referrerPolicy="no-referrer" />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '9px', fontWeight: 'black', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Concept Diagram: {img.caption}</span>
                      <p style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold', margin: '0', lineHeight: '1.6' }}>{d.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Page 6: Common Mistakes & Memory Mnemonics */}
        {((notes.commonMistakes && notes.commonMistakes.length > 0) || (notes.memoryTricks && notes.memoryTricks.length > 0) || (notes.ncertHighlights && notes.ncertHighlights.length > 0)) && (
          <div className="pdf-page" style={pdfPageStyle}>
            {notes.commonMistakes && notes.commonMistakes.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1px solid #f97316', paddingBottom: '4px', marginBottom: '14px' }}>❌ Common Mistakes to Avoid</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.commonMistakes.map((mistake: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '12px', padding: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#991b1b', lineHeight: '1.9' }}><strong>Common Error:</strong> "{mistake.error}"</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#065f46', borderTop: '1px solid #fee2e2', paddingTop: '6px', marginTop: '6px', lineHeight: '1.9' }}><strong>Correct Way:</strong> "{mistake.correction}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.memoryTricks && notes.memoryTricks.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1px solid #f97316', paddingBottom: '4px', marginBottom: '14px' }}>🧠 Memory Mnemonics</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {notes.memoryTricks.map((trick: string, idx: number) => (
                    <div key={idx} style={{ padding: '12px 16px', backgroundColor: '#fef9c3', border: '1px solid #fef08a', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#854d0e', flex: '1 1 200px' }}>
                      {trick}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.ncertHighlights && notes.ncertHighlights.length > 0 && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c', borderBottom: '1px solid #f97316', paddingBottom: '4px', marginBottom: '14px' }}>📚 NCERT Line Highlights</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notes.ncertHighlights.map((highlight: string, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderLeft: '4px solid #6366f1', borderRadius: '0 8px 8px 0', fontSize: '11px', fontStyle: 'italic', fontWeight: 'bold', color: '#475569', lineHeight: '1.9' }}>
                      <MathRenderer content={highlight} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page 7: PYQ style questions (MCQs & Short Answer Questions) */}
        {notes.pyqs && ((notes.pyqs.mcqs && notes.pyqs.mcqs.length > 0) || (notes.pyqs.shortAnswers && notes.pyqs.shortAnswers.length > 0)) && (
          <div className="pdf-page" style={pdfPageStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#4f46e5', borderBottom: '1px solid #818cf8', paddingBottom: '4px', marginBottom: '14px' }}>🎯 PYQ Style Questions</h2>
            
            {notes.pyqs.mcqs && notes.pyqs.mcqs.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#312e81', margin: '0 0 10px 0' }}>1. Multiple Choice Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.pyqs.mcqs.map((q: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
                        <span style={{ marginRight: '4px' }}>{idx + 1}.</span>
                        <SmartTextRenderer content={q.question} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '0 0 8px 0' }}>
                        {q.options?.map((opt: string, oIdx: number) => (
                          <div key={oIdx} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff', fontWeight: '600', color: '#475569', display: 'flex', gap: '4px' }}>
                            <span>{String.fromCharCode(65 + oIdx)}.</span>
                            <SmartTextRenderer content={opt} />
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#4f46e5', display: 'flex', gap: '4px' }}>
                        <strong>Answer:</strong>
                        <SmartTextRenderer content={q.answer} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.pyqs.shortAnswers && notes.pyqs.shortAnswers.length > 0 && (
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#312e81', margin: '0 0 10px 0' }}>2. Short Answer Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notes.pyqs.shortAnswers.map((q: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', display: 'flex', gap: '4px' }}>
                        <strong>Q:</strong>
                        <SmartTextRenderer content={q.question} />
                      </div>
                      <div style={{ color: '#4f46e5', fontWeight: '600', margin: '4px 0 0 0', display: 'flex', gap: '4px' }}>
                        <strong>A:</strong>
                        <SmartTextRenderer content={q.answer} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page 8: Long Answer Questions & 1-Page Summary Revision Sheet */}
        {((notes.pyqs && notes.pyqs.longAnswers && notes.pyqs.longAnswers.length > 0) || (notes.onePageRevision && notes.onePageRevision.length > 0)) && (
          <div className="pdf-page" style={pdfPageStyle}>
            {notes.pyqs && notes.pyqs.longAnswers && notes.pyqs.longAnswers.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#4f46e5', borderBottom: '1px solid #818cf8', paddingBottom: '4px', marginBottom: '14px' }}>🎯 Long Answer Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notes.pyqs.longAnswers.map((q: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontSize: '11px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', display: 'flex', gap: '4px' }}>
                        <strong>Q:</strong>
                        <SmartTextRenderer content={q.question} />
                      </div>
                      <div style={{ color: '#4f46e5', fontWeight: '600', margin: '4px 0 0 0', display: 'flex', gap: '4px', whiteSpace: 'pre-line', lineHeight: '1.9' }}>
                        <strong>A:</strong>
                        <SmartTextRenderer content={q.answer} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.onePageRevision && notes.onePageRevision.length > 0 && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#4f46e5', borderBottom: '1px solid #818cf8', paddingBottom: '4px', marginBottom: '12px' }}>📑 1-Page Summary Revision Sheet</h2>
                <div style={{ backgroundColor: '#0f172a', color: '#f1f5f9', borderRadius: '12px', padding: '16px', fontSize: '11px', lineHeight: '1.9', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '600' }}>
                  {notes.onePageRevision.map((point: string, idx: number) => (
                    <p key={idx} style={{ margin: '0' }}>• {point}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
