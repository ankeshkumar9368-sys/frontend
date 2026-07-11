import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, Beaker, CheckCircle2, ChevronRight, Download, Sparkles, Target, ListOrdered } from "lucide-react";
import { generateSchoolProject } from "../lib/gemini";
import AILoadingOverlay from "./AILoadingOverlay";

export default function SchoolProjectAssistant({
  userData,
  onClose
}: {
  userData: any;
  onClose: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [isBilingual, setIsBilingual] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const data = await generateSchoolProject(topic, userData, isBilingual);
    if (data) {
      setProjectData(data);
    } else {
      alert("Failed to generate project. Please try again.");
    }
    setLoading(false);
  };

  const exportToPDF = async () => {
    const element = document.getElementById('project-content');
    if (!element) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       10,
        filename:     `${projectData?.title || 'Achivox_Project'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Export failed", error);
      alert("Failed to generate PDF.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-lg">Project Maker</h2>
            <p className="text-xs font-bold text-slate-500">AI-Powered School Projects</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {!projectData ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 max-w-md mx-auto text-center px-4">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
              <Beaker className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-2">What's your project?</h3>
              <p className="text-sm font-medium text-slate-500">Enter a topic and our AI will build a realistic step-by-step project guide with images and materials.</p>
            </div>
            <div className="w-full relative">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Volcano Eruption, Electric Motor..."
                className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-2xl px-5 py-4 font-bold text-lg focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            
            <div className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-indigo-900/30 p-4 rounded-2xl">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">Bilingual Output</h4>
                <p className="text-xs font-medium text-slate-500">English + Your Board's Language</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isBilingual}
                  onChange={() => setIsBilingual(!isBilingual)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!topic.trim() || loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-6 h-6" />
              Generate Project Report
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            <div id="project-content" className="space-y-6 bg-slate-50 dark:bg-slate-950 pb-6 rounded-3xl">
              <div className="relative h-64 rounded-3xl overflow-hidden shadow-md">
                <img 
                  src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(projectData.title + " science project")}&w=800&h=600&c=7&rs=1&p=0`}
                  alt="Project Cover" 
                  className="w-full h-full object-cover"
                />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6">
                <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-1 rounded-md w-max mb-2 uppercase tracking-widest">Project Report</span>
                <h1 className="text-3xl font-black text-white">{projectData.title}</h1>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-lg text-indigo-600 flex items-center gap-2">
                <Target className="w-6 h-6" /> Objective
              </h3>
              <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{projectData.objective}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="font-black text-lg text-amber-600 flex items-center gap-2">
                <Beaker className="w-6 h-6" /> Materials Required
              </h3>
              <ul className="grid grid-cols-2 gap-3">
                {projectData.materials?.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100 px-3 py-2 rounded-xl font-bold text-sm">
                    <CheckCircle2 className="w-6 h-6 text-amber-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <h3 className="font-black text-lg text-emerald-600 flex items-center gap-2">
                <ListOrdered className="w-6 h-6" /> Step-by-Step Procedure
              </h3>
              <div className="space-y-4">
                {projectData.steps?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center font-black">{step.step}</div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-1">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white space-y-4">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Lightbulb className="w-6 h-6" /> Conclusion / Principle
              </h3>
              <p className="font-semibold text-white/90 leading-relaxed">{projectData.conclusion}</p>
            </div>

            {projectData.gallery && projectData.gallery.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 px-2">Visual Guide & Components</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectData.gallery.map((item: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                      <div className="h-40 w-full relative bg-slate-100 dark:bg-slate-800">
                        <img 
                          src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(item.imagePrompt || item.partName)}&w=600&h=400&c=7&rs=1&p=0`} 
                          alt={item.partName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-4">
                          <h4 className="text-white font-black text-lg leading-tight">{item.partName}</h4>
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Achivox Watermark & Benefits (Included in PDF) */}
            <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 text-center space-y-3">
              <h4 className="font-black text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" /> Generated by Achivox AI
              </h4>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Achivox is your ultimate AI Learning Companion. It provides personalized Masterclasses, AI Doubts solving, and 1-click School Projects to help you score the highest marks with zero stress.
              </p>
            </div>
            </div> {/* End of project-content */}

            <button onClick={exportToPDF} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform">
              <Download className="w-6 h-6" /> Save PDF Report
            </button>
          </motion.div>
        )}
      </div>

      <AILoadingOverlay isOpen={loading} onCancel={() => setLoading(false)} type="notes" />
    </div>
  );
}
