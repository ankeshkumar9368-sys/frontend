"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Bookmark as BookmarkIcon, Highlighter, Share2, 
  Download, Search, X, ChevronRight, Sparkles, MessageSquare, 
  GitBranch, Layers, Binary, FileText, HelpCircle, Undo2, Redo2, 
  Eraser, StickyNote as StickyNoteIcon, ZoomIn, ZoomOut, RotateCcw,
  MoreVertical, Info, Clock, PanelRightClose, MousePointer
} from "lucide-react";
import { 
  getChapterNotes, getBookmarks, addBookmark, removeBookmark,
  getHighlights, addHighlight, removeHighlight, getStickyNotes, 
  saveStickyNotes, saveProgress, getProgress, requestAIAssist, searchNotes,
  ChapterNotes, Bookmark, HighlightItem, StickyNote, BookmarkCategory, AIResponse
} from "../../lib/notesApi";

// Capacitor plugins for native sharing
// import { Share } from '@capacitor/share';

const PdfCanvas = dynamic(() => import("../../components/notes/PdfCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#525659] text-slate-300">
      <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="text-sm font-semibold tracking-wide text-blue-400">Loading PDF engine...</span>
    </div>
  )
});

type HistoryEntry =
  | { type: "highlight"; item: HighlightItem }
  | { type: "note";      page: number; text: string; id: string };

export default function NotesClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const chapterId = params.id;
  const pdfRef = useRef<any>(null); // To call imperative handle .scrollToPage()

  const [notesInfo, setNotesInfo] = useState<ChapterNotes | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"contents" | "pages" | "bookmarks" | "highlights" | "notes">("pages");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ page: number; snippet: string }>>([]);
  
  const [activeTool, setActiveTool] = useState<"select" | "highlight" | "note" | "eraser">("select");
  const [activeColor, setActiveColor] = useState("yellow");

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Modals
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<{ open: boolean, page: number, defaultText: string, noteId?: string }>({ open: false, page: 1, defaultText: "" });
  
  // AI Smart Toolbar & Side Panel
  const [aiToolbarParams, setAiToolbarParams] = useState<{ visible: boolean, top: number, left: number, text: string }>({ visible: false, top: 0, left: 0, text: "" });
  const [aiSidePanel, setAiSidePanel] = useState<{ open: boolean, loading: boolean, title: string, snippet: string, result: string }>({ open: false, loading: false, title: "", snippet: "", result: "" });
  const [showMoreActions, setShowMoreActions] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const info = await getChapterNotes(chapterId);
        setNotesInfo(info);
        setTotalPages(info.totalPages || 1);
        
        const [bms, hls, sns, prog] = await Promise.all([
          getBookmarks(chapterId),
          getHighlights(chapterId),
          getStickyNotes(chapterId),
          getProgress(chapterId)
        ]);

        setBookmarks(bms);
        setHighlights(hls);
        setStickyNotes(sns);

        if (prog) {
          setCurrentPage(prog.page);
          setProgressPercent(Math.round((prog.page / info.totalPages) * 100));
          if (pdfRef.current && pdfRef.current.scrollToPage) {
            pdfRef.current.scrollToPage(prog.page);
          }
        }
      } catch (err) {
        console.error("Failed to load notes data:", err);
      }
    }
    init();
  }, [chapterId]);

  useEffect(() => {
    const interval = setInterval(() => setSessionSeconds(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getEstLeft = () => {
    if (!notesInfo?.estimatedReadingMinutes) return "Calculated soon";
    const perPage = notesInfo.estimatedReadingMinutes / totalPages;
    const minsLeft = Math.ceil((totalPages - currentPage) * perPage);
    return minsLeft <= 0 ? "Completed" : `${minsLeft} min left`;
  };

  const handlePageChange = useCallback((page: number, scrollProgress: number) => {
    setCurrentPage(page);
    if (totalPages > 0) {
      setProgressPercent(Math.round((page / totalPages) * 100));
    }
    saveProgress(chapterId, page, scrollProgress).catch(() => {});
  }, [chapterId, totalPages]);

  // Undo / Redo
  const pushUndo = (entry: HistoryEntry) => {
    setUndoStack(prev => [...prev, entry]);
    setRedoStack([]); // Clear redo on new action
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, last]);

    if (last.type === "highlight") {
      setHighlights(prev => prev.filter(h => h.id !== last.item.id));
      await removeHighlight(chapterId, last.item.id).catch(() => {}); // Revert on backend
    } else if (last.type === "note") {
      setStickyNotes(prev => prev.filter(n => n.id !== last.id));
      const updated = stickyNotes.filter(n => n.id !== last.id);
      saveStickyNotes(chapterId, updated);
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, last]);

    if (last.type === "highlight") {
      setHighlights(prev => [...prev, last.item]);
    } else if (last.type === "note") {
      const newNote = { id: last.id, chapterId, page: last.page, color: "yellow", text: last.text, x: 50, y: 50, createdAt: new Date().toISOString() };
      const updated = [...stickyNotes, newNote];
      setStickyNotes(updated);
      saveStickyNotes(chapterId, updated);
    }
  };

  // Annotations
  const onAddHighlight = (hl: HighlightItem) => {
    setHighlights(prev => [...prev, hl]);
    pushUndo({ type: "highlight", item: hl });
  };
  
  const onDeleteHighlight = async (id: string) => {
    const hl = highlights.find(h => h.id === id);
    if (!hl) return;
    setHighlights(prev => prev.filter(h => h.id !== id));
    await removeHighlight(chapterId, id).catch(() => {});
  };

  const onAddStickyNote = (page: number) => {
    setShowNoteModal({ open: true, page, defaultText: "" });
  };

  const saveModalNote = () => {
    if (!showNoteModal.defaultText.trim()) {
      setShowNoteModal({ ...showNoteModal, open: false });
      return;
    }
    const newNote: StickyNote = {
      id: showNoteModal.noteId || ('sn_' + Math.random().toString(36).substring(2, 9)),
      chapterId,
      page: showNoteModal.page,
      x: 50, y: 50,
      text: showNoteModal.defaultText,
      color: activeColor,
      createdAt: new Date().toISOString()
    };
    const updated = showNoteModal.noteId 
      ? stickyNotes.map(n => n.id === newNote.id ? newNote : n)
      : [...stickyNotes, newNote];
      
    setStickyNotes(updated);
    saveStickyNotes(chapterId, updated);
    if (!showNoteModal.noteId) {
      pushUndo({ type: "note", page: newNote.page, text: newNote.text, id: newNote.id });
    }
    setShowNoteModal({ open: false, page: 1, defaultText: "" });
  };

  // Bookmarks Modal Logic
  const handleBookmarkClick = () => {
    const existing = bookmarks.find(b => b.page === currentPage);
    if (existing) {
      removeBookmark(chapterId, existing.id).then(() => {
        setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      }).catch(e => console.error(e));
    } else {
      setShowBookmarkModal(true);
    }
  };

  const addCategoryBookmark = (category: BookmarkCategory) => {
    addBookmark(chapterId, { chapterId, page: currentPage, category })
      .then(bm => setBookmarks(prev => [...prev, bm]))
      .catch(e => console.error(e));
    setShowBookmarkModal(false);
  };

  // Search Logic
  useEffect(() => {
    if (!searchQuery) return;
    const timer = setTimeout(async () => {
      const results = await searchNotes(chapterId, searchQuery);
      setSearchResults(results);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, chapterId]);

  // AI Triggers
  const handleAITrigger = async (action: string, selectedText: string = "") => {
    setAiToolbarParams({ ...aiToolbarParams, visible: false }); // Hide toolbar
    setAiSidePanel({ open: true, loading: true, title: action.toUpperCase(), snippet: selectedText, result: "" });
    try {
      const res = await requestAIAssist(chapterId, selectedText, action);
      setAiSidePanel(prev => ({ ...prev, loading: false, result: res.result }));
    } catch (err) {
      setAiSidePanel(prev => ({ ...prev, loading: false, result: "Couldn't reach the AI assistant right now. Please check your connection and try again." }));
    }
  };

  // Listen for selection changes to show AI Smart Toolbar
  useEffect(() => {
    const handleSelection = () => {
      if (activeTool !== "select") return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        if (aiToolbarParams.visible) setAiToolbarParams(p => ({ ...p, visible: false }));
        return;
      }
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const top = Math.max(8, rect.top - 60);
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - 360);
      
      setAiToolbarParams({ visible: true, top, left, text });
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [activeTool, aiToolbarParams.visible]);

  // Hide AI toolbar if tapping elsewhere
  useEffect(() => {
    const hideToolbar = (e: MouseEvent | TouchEvent) => {
      if (aiToolbarParams.visible) setAiToolbarParams(p => ({ ...p, visible: false }));
    };
    document.addEventListener("mousedown", hideToolbar);
    return () => document.removeEventListener("mousedown", hideToolbar);
  }, [aiToolbarParams.visible]);

  // Share using Capacitor fallback
  const handleShareClick = async () => {
    try {
      if (navigator.share) await navigator.share({ title: notesInfo?.title, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
    } catch { /* ignored */ }
  };

  const gradients = [
    "from-blue-500 to-indigo-600", "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600", "from-sky-500 to-blue-600", "from-fuchsia-500 to-violet-600"
  ];
  
  const aiCards = [
    { id: "explain", name: "AI Explain", icon: Sparkles },
    { id: "ask", name: "Doubt Solver", icon: MessageSquare },
    { id: "mindmap", name: "Mind Map", icon: GitBranch },
    { id: "flashcards", name: "Flashcards", icon: Layers },
    { id: "formula", name: "Formula Sheet", icon: Binary },
    { id: "summarize", name: "Revision Notes", icon: FileText },
    { id: "quiz", name: "Practice Questions", icon: HelpCircle }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-white dark:bg-[#323639] text-slate-900 dark:text-slate-100 relative">
      
      {/* ── 1. Top Navigation Bar ── */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 sm:px-4 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => router.back()} className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex" title="Toggle Sidebar">
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="flex flex-col items-center flex-1 mx-2 truncate">
          <h1 className="text-sm font-bold truncate max-w-[150px] sm:max-w-xs">{notesInfo?.title || "Loading..."}</h1>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{notesInfo?.subtitle || `${notesInfo?.subject} • Class ${notesInfo?.classLevel}`}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setSearchActive(!searchActive)} className="p-2.5 rounded-[12px] hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[48px] min-h-[48px] flex items-center justify-center">
            <Search className="w-5 h-5" />
          </button>
          <button onClick={handleBookmarkClick} className={`p-2.5 rounded-[12px] hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[48px] min-h-[48px] flex items-center justify-center ${bookmarks.some(b => b.page === currentPage) ? "text-[#2563EB]" : ""}`}>
            <BookmarkIcon className={`w-5 h-5 ${bookmarks.some(b => b.page === currentPage) ? "fill-[#2563EB]" : ""}`} />
          </button>
          <button onClick={handleShareClick} className="p-2.5 rounded-[12px] hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[48px] min-h-[48px] flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </button>
          <a href={notesInfo?.pdfUrl} download className="p-2.5 rounded-[12px] hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-900 dark:text-slate-100">
            <Download className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Reading Progress Bar Row */}
      <div className="h-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center px-4 text-[10px] font-bold text-slate-500 gap-4">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="w-24 sm:w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <motion.div animate={{ width: `${progressPercent}%` }} className="absolute left-0 top-0 bottom-0 bg-[#2563EB]" />
        </div>
        <span>{progressPercent}%</span>
        <span className="hidden sm:inline">· {getEstLeft()} · {formatTime(sessionSeconds)} session</span>
      </div>

      {/* In-Chapter Search Panel */}
      <AnimatePresence>
        {searchActive && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-14 left-0 right-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 shadow-lg flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="text" autoFocus className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm select-text focus:ring-2 focus:ring-[#2563EB]" placeholder="Search chapter..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button onClick={() => setSearchActive(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl min-w-[48px] min-h-[48px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto mt-2">
                <span className="text-xs font-bold text-slate-500 mb-1 block">{searchResults.length} results</span>
                {searchResults.map((res, i) => (
                  <div key={i} onClick={() => { pdfRef.current?.scrollToPage(res.page); setSearchActive(false); }} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-sm flex gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="font-bold text-[#2563EB]">P.{res.page}</span>
                    <span className="truncate text-slate-600 dark:text-slate-300">{res.snippet}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ── 2. Left Sidebar ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="absolute md:relative left-0 top-0 bottom-0 w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-10 flex flex-col shadow-xl md:shadow-none">
              <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  {(["contents", "pages", "bookmarks", "highlights", "notes"] as const).map(tab => (
                    <button key={tab} onClick={() => setSidebarTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${sidebarTab === tab ? "bg-[#2563EB] text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}`}>{tab === "contents" ? "ToC" : tab}</button>
                  ))}
                </div>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 min-w-[48px] min-h-[48px] flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sidebarTab === "contents" && <p className="text-xs text-slate-500 italic text-center mt-10">Wire to chapter sections API.</p>}
                {sidebarTab === "pages" && (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from(new Array(totalPages), (x, i) => i + 1).map(p => (
                      <button key={p} onClick={() => pdfRef.current?.scrollToPage(p)} className={`py-6 rounded-[20px] text-xs font-bold border transition-colors ${currentPage === p ? "border-[#2563EB] bg-blue-50 dark:bg-blue-900/20 text-[#2563EB]" : "border-slate-200 dark:border-slate-800 hover:border-[#2563EB]"}`}>Page {p}</button>
                    ))}
                  </div>
                )}
                {sidebarTab === "bookmarks" && bookmarks.map(b => (
                  <div key={b.id} className="p-3 bg-white dark:bg-slate-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between"><span className="text-xs font-bold">Page {b.page}</span><button onClick={() => removeBookmark(chapterId, b.id).then(() => setBookmarks(prev => prev.filter(x => x.id !== b.id)))}><X className="w-4 h-4 text-red-500" /></button></div>
                    <span className="text-[10px] text-[#2563EB] font-black uppercase mt-1 inline-block">{b.category}</span>
                  </div>
                ))}
                {sidebarTab === "highlights" && highlights.map(h => (
                  <div key={h.id} className="p-3 bg-white dark:bg-slate-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer" onClick={() => pdfRef.current?.scrollToPage(h.page)}>
                    <div className="flex items-center gap-2 mb-1"><span className={`w-3 h-3 rounded-full bg-${h.color}-400`} /><span className="text-xs font-bold">Page {h.page}</span></div>
                    <p className="text-xs italic text-slate-600 dark:text-slate-400 line-clamp-3">"{h.text}"</p>
                  </div>
                ))}
                {sidebarTab === "notes" && stickyNotes.map(n => (
                  <div key={n.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-[20px] shadow-sm border border-yellow-200 dark:border-yellow-800/50 cursor-pointer" onClick={() => pdfRef.current?.scrollToPage(n.page)}>
                    <div className="text-xs font-bold mb-1 text-yellow-800 dark:text-yellow-500">Page {n.page}</div>
                    <p className="text-xs text-yellow-900 dark:text-yellow-100">{n.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3. PDF Viewer Area ── */}
        <div className="flex-1 bg-[#525659] dark:bg-[#323639] relative overflow-hidden flex flex-col" onCopy={(e) => e.preventDefault()}>
          <PdfCanvas
            ref={pdfRef}
            pdfUrl={notesInfo?.pdfUrl || "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf"}
            chapterId={chapterId}
            onPageChange={handlePageChange}
            highlights={highlights}
            stickyNotes={stickyNotes}
            bookmarks={bookmarks}
            onAddHighlight={onAddHighlight}
            onDeleteHighlight={onDeleteHighlight}
            onAddStickyNote={() => onAddStickyNote(currentPage)}
            onDeleteStickyNote={(id) => setStickyNotes(s => s.filter(n => n.id !== id))}
            onUpdateStickyNote={(id, text) => setStickyNotes(s => s.map(n => n.id === id ? { ...n, text } : n))}
            activeTool={activeTool}
            activeColor={activeColor}
            currentPage={currentPage}
          />
        </div>

        {/* ── 4. Floating Annotation Toolbar ── */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 bg-white dark:bg-slate-900 p-2 rounded-[20px] shadow-2xl border border-slate-200 dark:border-slate-800 z-10">
          <button onClick={() => setActiveTool("select")} className={`min-w-[48px] min-h-[48px] rounded-[12px] flex items-center justify-center transition-colors ${activeTool === "select" ? "bg-slate-100 dark:bg-slate-800 text-[#2563EB]" : "text-slate-500"}`}><MousePointer className="w-5 h-5" /></button>
          <div className="relative group">
            <button onClick={() => setActiveTool("highlight")} className={`min-w-[48px] min-h-[48px] rounded-[12px] flex items-center justify-center transition-colors ${activeTool === "highlight" ? "bg-slate-100 dark:bg-slate-800 text-[#2563EB]" : "text-slate-500"}`}><Highlighter className="w-5 h-5" /></button>
            {activeTool === "highlight" && (
              <div className="absolute right-full mr-2 top-0 hidden group-hover:flex bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl gap-2 border border-slate-200 dark:border-slate-800">
                {["yellow", "green", "pink", "blue", "purple", "orange"].map(c => (
                  <button key={c} onClick={() => setActiveColor(c)} className={`w-8 h-8 rounded-full bg-${c}-400 ${activeColor === c ? "ring-2 ring-offset-2 ring-[#2563EB]" : ""}`} />
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onAddStickyNote(currentPage)} className="min-w-[48px] min-h-[48px] rounded-[12px] flex items-center justify-center text-slate-500 hover:text-[#2563EB]"><StickyNoteIcon className="w-5 h-5" /></button>
          <button onClick={() => setActiveTool("eraser")} className={`min-w-[48px] min-h-[48px] rounded-[12px] flex items-center justify-center transition-colors ${activeTool === "eraser" ? "bg-slate-100 dark:bg-slate-800 text-red-500" : "text-slate-500"}`}><Eraser className="w-5 h-5" /></button>
          <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 mx-auto my-1" />
          <button onClick={handleUndo} disabled={undoStack.length === 0} className="min-w-[48px] min-h-[48px] rounded-[12px] flex items-center justify-center text-slate-500 disabled:opacity-30 disabled:active:scale-100 active:scale-95"><Undo2 className="w-5 h-5" /></button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} className="min-w-[48px] min-h-[48px] rounded-[12px] flex items-center justify-center text-slate-500 disabled:opacity-30 disabled:active:scale-100 active:scale-95"><Redo2 className="w-5 h-5" /></button>
        </div>
        
      </div>

      {/* ── 5. AI Smart Toolbar (Floating on text selection) ── */}
      <AnimatePresence>
        {aiToolbarParams.visible && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: 'fixed', top: aiToolbarParams.top, left: aiToolbarParams.left }}
            className="z-50 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-full px-2 py-1 gap-1"
            onMouseDown={(e) => e.stopPropagation()} // Prevent closing
          >
            <div className="flex items-center">
              {aiCards.slice(0, 5).map(c => (
                <button key={c.id} onClick={() => handleAITrigger(c.id, aiToolbarParams.text)} className="min-w-[48px] min-h-[48px] flex items-center justify-center text-[#2563EB] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full" title={c.name}><c.icon className="w-5 h-5" /></button>
              ))}
              <div className="relative">
                <button onClick={() => setShowMoreActions(!showMoreActions)} className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><MoreVertical className="w-5 h-5" /></button>
                {showMoreActions && (
                  <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 flex flex-col gap-1 w-48">
                    {aiCards.slice(5).map(c => (
                      <button key={c.id} onClick={() => handleAITrigger(c.id, aiToolbarParams.text)} className="min-h-[48px] text-left px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><c.icon className="w-4 h-4 text-[#2563EB]"/>{c.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. AI Response Side Panel ── */}
      <AnimatePresence>
        {aiSidePanel.open && (
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute right-0 top-14 bottom-0 w-80 sm:w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-40 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-[#2563EB]">
              <h2 className="text-white font-bold tracking-wide uppercase text-xs flex items-center gap-2"><Sparkles className="w-4 h-4"/> {aiSidePanel.title}</h2>
              <button onClick={() => setAiSidePanel({ ...aiSidePanel, open: false })} className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-white/80 hover:text-white"><PanelRightClose className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {aiSidePanel.snippet && (
                <blockquote className="border-l-4 border-[#3B82F6] pl-3 py-1 mb-6 text-xs italic text-slate-500 dark:text-slate-400">"{aiSidePanel.snippet}"</blockquote>
              )}
              {aiSidePanel.loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-4">
                  <div className="w-8 h-8 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-400">Thinking, strictly within this chapter...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert text-sm select-text whitespace-pre-wrap">{aiSidePanel.result}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 7. AI Learning Cards Bottom Panel ── */}
      <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {aiCards.map((card, i) => (
            <button key={card.id} onClick={() => handleAITrigger(card.id, "")} className={`min-w-[140px] h-24 rounded-[20px] bg-gradient-to-br ${gradients[i]} p-4 flex flex-col justify-between shadow-md active:scale-95 transition-transform text-left group`}>
              <card.icon className="w-6 h-6 text-white/80 group-hover:text-white" />
              <span className="text-white font-bold text-sm leading-tight drop-shadow-md">{card.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 8. Bottom Sticky Learning Loop CTA ── */}
      <div className="bg-white dark:bg-slate-950 p-4 pb-safe border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-[#3B82F6] tracking-wider">Next Step in Loop</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Check your understanding</span>
        </div>
        <button onClick={() => router.push(`/test/${chapterId}`)} className="bg-[#2563EB] text-white px-6 py-3 min-h-[48px] rounded-[18px] font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-transform text-sm">
          Take Test
        </button>
      </div>

      {/* ── 10. Bookmark Modal ── */}
      <AnimatePresence>
        {showBookmarkModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-[28px] p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Add Bookmark</h3>
                <button onClick={() => setShowBookmarkModal(false)} className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["Important", "Revision", "Formula", "Definition", "Example", "Favorite"] as BookmarkCategory[]).map(cat => (
                  <button key={cat} onClick={() => addCategoryBookmark(cat)} className="min-h-[48px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 active:bg-blue-50 dark:active:bg-blue-900/30">{cat}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 11. Sticky Note Modal ── */}
      <AnimatePresence>
        {showNoteModal.open && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-[28px] p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><StickyNoteIcon className="w-5 h-5 text-[#2563EB]"/> Sticky Note (Pg {showNoteModal.page})</h3>
              <textarea autoFocus rows={4} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm select-text focus:ring-2 focus:ring-[#2563EB] resize-none" placeholder="Type your note here..." value={showNoteModal.defaultText} onChange={e => setShowNoteModal({ ...showNoteModal, defaultText: e.target.value })} />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowNoteModal({ ...showNoteModal, open: false })} className="min-w-[48px] min-h-[48px] px-4 font-bold text-slate-500 rounded-xl">Cancel</button>
                <button onClick={saveModalNote} className="min-w-[48px] min-h-[48px] px-6 bg-[#2563EB] text-white font-bold rounded-xl shadow-lg active:scale-95">Save Note</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
