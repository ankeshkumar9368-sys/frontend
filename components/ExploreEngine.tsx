import { useState, useEffect, useRef } from "react";
import { 
  ChevronRight, ChevronLeft, Building2, BookText, Activity, 
  Layers, Target, Clock, Library, School, Landmark, Train, 
  Briefcase, Award, GraduationCap, Loader2, Search, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchContent, ContentItem, hasCachedContent, fetchChapterNotes } from "../lib/content";

export default function ExploreEngine({ 
  mode, 
  onFinalSelect,
  isSubscribed = false,
  userData,
  onUpgrade
}: { 
  mode: "govt" | "school", 
  onFinalSelect: (item: ContentItem) => void,
  isSubscribed?: boolean,
  userData?: any,
  onUpgrade?: () => void
}) {
  const [path, setPath] = useState<ContentItem[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ContentItem[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const govtStructure = ["Categories", "Exams", "Years", "Subjects", "Topics"];
  const schoolStructure = ["Boards", "Classes", "Subjects", "Chapters", "Topics"];
  
  const currentStructure = mode === "govt" ? govtStructure : schoolStructure;
  const currentLevelIndex = path.length;
  const currentLevelName = currentStructure[currentLevelIndex];

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      const parentId = path.length > 0 ? path[path.length - 1].id : null;
      const type = currentStructure[path.length];
      
      if (type) {
        if (!hasCachedContent(mode, parentId, type)) {
          setLoading(true);
          setItems([]); // Clear items to prevent showing stale data from previous level
        }
        const data = await fetchContent(mode, parentId, type);
        if (!ignore) {
          if ((type === "Topics" || type === "Chapters") && !isSubscribed) {
            const premiumDummy: ContentItem = {
              id: `premium_locked_${Date.now()}`,
              name: "👑 Topper's PYQs & Final Revision",
              type: type,
              parentId: parentId,
              isPremiumLocked: true
            };
            setItems([premiumDummy, ...data]);
          } else {
            setItems(data);
          }
          setLoading(false);

          // SMART PRE-FETCHING: Pre-generate notes for the first item in the background
          if (data && data.length > 0 && (type === "Chapters" || type === "Topics")) {
            const firstItem = data[0];
            const subject = path.find(p => p.type === "Subjects")?.name || userData?.strictSubject || "General";
            const topicName = firstItem.name;
            const uId = userData?.id || 'guest';
            
            setTimeout(() => {
              const localKey = `achivox_notes_full_${subject}_${topicName}_${topicName}_${uId}`.replace(/[^a-zA-Z0-9_]/g, '_');
              if (!localStorage.getItem(localKey)) {
                fetchChapterNotes(topicName, userData, "en-hi", subject, topicName, false, "full")
                  .then(noteData => {
                    if (noteData) localStorage.setItem(localKey, JSON.stringify(noteData));
                  }).catch(() => {});
              }
            }, 1500); // 1.5s delay to prioritize UI rendering
          }
        }
      }
    };

    // Auto-skip Board and Class if user has set their Goal
    if (mode === "school" && userData?.board && userData?.cls) {
      const bName = userData.board;
      const cName = userData.cls;
      if (path.length === 0 || path[0]?.name !== bName || path[1]?.name !== cName) {
        const boardItem: ContentItem = { 
          id: `boards_${bName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, 
          name: bName, type: "Boards", parentId: null 
        };
        const clsMatch = cName.match(/\d+/);
        const clsNum = clsMatch ? clsMatch[0] : "10";
        const classItem: ContentItem = { 
          id: `${boardItem.id}__classes_class_${clsNum}`, 
          name: cName, type: "Classes", parentId: boardItem.id 
        };
        setPath([boardItem, classItem]);
        return; 
      }
    }
    loadData();

    return () => { ignore = true; };
    }, [path.length, path[0]?.id, path[1]?.id, mode, userData?.board, userData?.cls]);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Auto-suggest: filter current items by query
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSuggestions(items.filter(item => item.name.toLowerCase().includes(q)));
  }, [searchQuery, items]);

  const getMetadata = (item: string) => {
    if (mode === "govt" && currentLevelIndex === 0) {
      if (item === "SSC") return { subtitle: "CGL, CHSL, MTS", icon: Building2, color: "text-blue-600", bg: "bg-blue-100/50", tag: "Popular", tagColor: "bg-blue-500" };
      if (item === "Banking") return { subtitle: "PO, Clerk, SO", icon: Landmark, color: "text-emerald-600", bg: "bg-emerald-100/50", tag: "Trending", tagColor: "bg-emerald-500" };
      if (item === "Railways") return { subtitle: "NTPC, Group D", icon: Train, color: "text-orange-600", bg: "bg-orange-100/50" };
      if (item === "UPSC") return { subtitle: "Civil Services, CDS", icon: Award, color: "text-purple-600", bg: "bg-purple-100/50" };
      if (item === "State Exams") return { subtitle: "PCS, Police, TET", icon: Briefcase, color: "text-red-600", bg: "bg-red-100/50" };
    }
    return null;
  };

  const handleSelect = (item: ContentItem) => {
    if (item.isPremiumLocked && !isSubscribed) {
      if (onUpgrade) onUpgrade();
      return;
    }
    
    setSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
    if (currentLevelIndex < currentStructure.length - 1) {
      setPath([...path, item]);
    } else {
      onFinalSelect(item);
    }
  };

  const goBack = () => {
    // If user has a locked goal, don't let them go back past Subjects (index 2)
    if (mode === "school" && userData?.board && userData?.cls && path.length <= 2) {
      return; // Locked to their Board/Class
    }
    setPath(path.slice(0, -1));
  };

  const displayItems = searchOpen && searchQuery ? suggestions : items;

  const schoolColors = [
    "bg-red-50 hover:bg-red-100 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-100",
    "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-100",
    "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-100",
    "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900 dark:bg-purple-950/20 dark:border-purple-900/40 dark:text-purple-100",
    "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900 dark:bg-orange-950/20 dark:border-orange-900/40 dark:text-orange-100",
    "bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-900 dark:bg-pink-950/20 dark:border-pink-900/40 dark:text-pink-100",
    "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-900 dark:bg-teal-950/20 dark:border-teal-900/40 dark:text-teal-100",
  ];
  const schoolIconColors = [
    "bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", 
    "bg-orange-500", "bg-pink-500", "bg-teal-500"
  ];

  return (
    <div className="glass-card rounded-[32px] border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          {path.length === 0 ? (
            <h3 className="font-black text-foreground tracking-tight flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Explore {mode === "govt" ? "Govt Exams" : "Curriculum"}
            </h3>
          ) : (
            <>
              {path.length > (mode === "school" && userData?.board ? 2 : 0) && (
                <button onClick={goBack} className="flex items-center gap-2 text-slate-500 hover:text-foreground font-bold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <ChevronLeft className="w-6 h-6" /> Back
                </button>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Exploring</span>
                <span className="text-sm font-black text-foreground tracking-tight mt-1">
                  {currentLevelName}
                </span>
              </div>
            </>
          )}
        </div>

        {/* SEARCH ICON */}
        <button
          onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); setSuggestions([]); }}
          className={`ml-3 p-2.5 rounded-xl transition-all shrink-0 ${searchOpen ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/10'}`}
        >
          {searchOpen ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
        </button>
      </div>

      {/* SEARCH INPUT with auto-suggest */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3 glass-card rounded-2xl border border-border px-4 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="w-6 h-6 text-slate-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${currentLevelName?.toLowerCase() || 'boards'}...`}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-[10px] font-bold text-slate-400 mt-2 px-1">
                  {suggestions.length > 0 ? `${suggestions.length} result${suggestions.length > 1 ? 's' : ''} found` : "No results found"}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {path.length > 0 && (
        <div className="bg-primary/5 px-5 py-2.5 text-[9px] font-black text-primary flex gap-2 flex-wrap border-b border-primary/10">
          {path.map((p, i) => (
            <span key={i} className="flex items-center glass-card px-2.5 py-1 rounded-lg border border-primary/10 shadow-sm">
              {p.name} {i < path.length - 1 && <ChevronRight className="w-3 h-3 mx-1 opacity-50" />}
            </span>
          ))}
        </div>
      )}

      {/* LIST */}
      <div className="p-3 max-h-[500px] overflow-y-auto min-h-[200px]">
        {loading ? (
          <div className="space-y-3 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex items-center gap-4 animate-pulse">
                <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-[18px]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-50 dark:bg-slate-900 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 && searchQuery ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-black text-slate-600 dark:text-slate-300">No results for "{searchQuery}"</p>
            <p className="text-xs text-slate-400">Try a different keyword</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={path.map(p => p.id).join("-") + searchQuery}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="grid grid-cols-1 gap-2.5"
            >
              {displayItems.map((item, idx) => {
                const isSchool = mode === "school";
                const meta = getMetadata(item.name);
                
                return (
                  <motion.div 
                    key={item.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSelect(item)}
                    className={`p-4 rounded-[24px] border transition-all cursor-pointer flex justify-between items-center group shadow-md hover:shadow-xl ${isSchool ? `${schoolColors[idx % 7]} hover:shadow-[0_0_20px_rgba(0,0,0,0.1)]` : 'glass-card border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`relative w-6 h-6 rounded-[18px] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 group-hover:-translate-y-1 shadow-[0_8px_15px_-3px_rgba(0,0,0,0.2),inset_0_-3px_0_0_rgba(0,0,0,0.15)] ${isSchool ? `${schoolIconColors[idx % 7]} text-white` : meta ? `${meta.bg} ${meta.color}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-primary group-hover:bg-primary/10'}`}>
                        {isSchool ? (
                          currentLevelIndex === 0 ? <School className="w-6 h-6" /> :
                          currentLevelIndex === 1 ? <GraduationCap className="w-6 h-6" /> :
                          currentLevelIndex === 2 ? <Clock className="w-6 h-6" /> :
                          <BookText className="w-6 h-6" />
                        ) : (
                          meta ? <meta.icon className="w-6 h-6" /> :
                          currentLevelIndex === 0 ? <Building2 className="w-6 h-6" /> : 
                          currentLevelIndex === 1 ? <Target className="w-6 h-6" /> : 
                          currentLevelIndex === 2 ? <Clock className="w-6 h-6" /> : 
                          currentLevelIndex === 3 ? <BookText className="w-6 h-6" /> : 
                          <Layers className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {/* Highlight matching text */}
                          <span className="font-black text-sm tracking-tight">
                            {searchQuery ? (() => {
                              const i = item.name.toLowerCase().indexOf(searchQuery.toLowerCase());
                              if (i === -1) return item.name;
                              return (
                                <>
                                  {item.name.slice(0, i)}
                                  <mark className="bg-primary/20 text-primary rounded px-0.5">{item.name.slice(i, i + searchQuery.length)}</mark>
                                  {item.name.slice(i + searchQuery.length)}
                                </>
                              );
                            })() : item.name}
                          </span>
                          {meta?.tag && (
                            <span className={`text-[8px] font-black text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${meta.tagColor} animate-pulse`}>
                              {meta.tag}
                            </span>
                          )}
                          {item.isPremiumLocked && (
                            <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1 shadow-sm">
                              🔒 Premium
                            </span>
                          )}
                        </div>
                        {meta && <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">{meta.subtitle}</span>}
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
