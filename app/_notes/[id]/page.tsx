"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Bookmark, Highlighter, PlayCircle, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SmartNotesViewer({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);

  // Calculate reading progress based on scroll
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const element = e.currentTarget;
    const totalScroll = element.scrollTop;
    const windowHeight = element.scrollHeight - element.clientHeight;
    if (windowHeight === 0) return;
    const scroll = `${(totalScroll / windowHeight) * 100}`;
    setScrollProgress(Number(scroll));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950">
      
      {/* Top Navbar */}
      <header className="bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-20">
        <div className="flex justify-between items-center px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          
          <div className="flex-1 px-4 text-center">
            <h1 className="text-sm font-bold truncate">Chapter 4: Motion in a Straight Line</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Physics • Class 11</p>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Reading Progress Bar */}
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800">
          <div 
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          ></div>
        </div>
      </header>

      {/* PDF / Notes Viewer Area */}
      <main 
        className="flex-1 overflow-y-auto relative bg-[#525659] dark:bg-[#323639]"
        onScroll={handleScroll}
      >
        {/* Tools Overlay */}
        <div className="absolute right-4 top-4 flex flex-col gap-3 z-10">
          <button 
            onClick={() => setIsHighlightMode(!isHighlightMode)}
            className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all ${isHighlightMode ? 'bg-yellow-400 text-yellow-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            <Highlighter className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-lg flex items-center justify-center transition-all">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Dummy PDF Pages (Simulating fast-loading PDF structure) */}
        <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col gap-6">
          {[1, 2, 3, 4, 5].map((page) => (
            <motion.div 
              key={page}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white rounded-md shadow-2xl aspect-[1/1.414] w-full p-8 md:p-12"
            >
              <div className="w-full h-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                <span className="text-4xl font-black opacity-20">PAGE {page}</span>
                <p className="mt-4 text-sm font-medium">Smart PDF Renderer Placeholder</p>
                {isHighlightMode && <p className="text-xs text-yellow-600 mt-2 bg-yellow-100 px-3 py-1 rounded-full">Highlight Mode Active</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Learning Loop Action Bar */}
      <div className="bg-card border-t border-border p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Next Step in Loop</p>
            <h4 className="text-sm font-bold">Check your understanding</h4>
          </div>
          <button 
            onClick={() => router.push("/test/algebra-test-1")}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/30 transition-all active:scale-95"
          >
            <PlayCircle className="w-5 h-5" /> Take Test
          </button>
        </div>
      </div>

    </div>
  );
}
