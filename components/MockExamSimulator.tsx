"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, ChevronRight, Eye, RefreshCcw, ScrollText, PenTool } from "lucide-react";
import { fetchMockExamPaper } from "../lib/content";

export default function MockExamSimulator({ userData, onClose }: { userData: any, onClose: () => void }) {
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"mcq" | "subjective">("mcq");
  const [revealedAnswers, setRevealedAnswers] = useState<{ [key: string]: boolean }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});

  const loadExam = async () => {
    setLoading(true);
    setExamData(null);
    setRevealedAnswers({});
    setSelectedOptions({});
    const data = await fetchMockExamPaper(userData);
    setExamData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadExam();
  }, []);

  const toggleAnswer = (id: string) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectOption = (questionId: string, option: string) => {
    setSelectedOptions(prev => ({ ...prev, [questionId]: option }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Setting Exam Paper</h3>
        <p className="text-sm font-bold text-slate-500 mt-2 text-center">AI is filtering 100% confidence questions for {userData?.goal || 'your goal'}...</p>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <h3 className="text-xl font-black text-rose-500 uppercase tracking-tight">Generation Failed</h3>
        <button onClick={loadExam} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-full font-black text-sm">
          Try Again
        </button>
        <button onClick={onClose} className="mt-4 text-slate-500 font-bold">Cancel</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-indigo-600" />
              <h1 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Mock Exam Simulator</h1>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">{examData.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-4 mt-6 max-w-4xl mx-auto">
          <button 
            onClick={() => setActiveSection("mcq")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeSection === 'mcq' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
          >
            Section A: MCQs
          </button>
          <button 
            onClick={() => setActiveSection("subjective")}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeSection === 'subjective' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
          >
            Section B: Subjective
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-32">
        
        {/* Instructions block */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl mb-8">
          <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2">Exam Instructions</h4>
          <ul className="space-y-1">
            {examData.instructions?.map((inst: string, i: number) => (
              <li key={i} className="text-sm font-medium text-amber-800 dark:text-amber-400 flex gap-2">
                <span className="text-amber-500">•</span> {inst}
              </li>
            ))}
          </ul>
        </div>

        {/* Section A: MCQs */}
        <AnimatePresence mode="wait">
          {activeSection === "mcq" && (
            <motion.div 
              key="mcq"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {examData.mcqs?.map((q: any, i: number) => {
                const isAnswered = selectedOptions[q.id] !== undefined;
                const isCorrect = selectedOptions[q.id] === q.correctAnswer;
                
                return (
                  <div key={q.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex gap-4">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-full font-black text-sm">
                        Q{i + 1}
                      </span>
                      <div>
                        <p className="text-base font-bold text-slate-800 dark:text-white mb-6 leading-relaxed">
                          {q.question}
                        </p>
                        
                        <div className="space-y-3">
                          {q.options?.map((opt: string, j: number) => {
                            const isSelected = selectedOptions[q.id] === opt;
                            const isActualCorrect = q.correctAnswer === opt;
                            
                            let optClass = "border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-700 dark:text-slate-300";
                            
                            if (isAnswered) {
                              if (isActualCorrect) {
                                optClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold";
                              } else if (isSelected) {
                                optClass = "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 font-bold";
                              } else {
                                optClass = "border-slate-100 dark:border-slate-800 text-slate-400 opacity-50";
                              }
                            } else if (isSelected) {
                              optClass = "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700";
                            }

                            return (
                              <button 
                                key={j}
                                disabled={isAnswered}
                                onClick={() => selectOption(q.id, opt)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${optClass}`}
                              >
                                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${isAnswered && isActualCorrect ? 'border-emerald-500 text-emerald-600 bg-emerald-100' : 'border-slate-300'}`}>
                                  {String.fromCharCode(65 + j)}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        
                        {isAnswered && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800"
                          >
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              <span className="text-indigo-500 font-black">Explanation:</span> {q.explanation}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Section B: Subjectives */}
          {activeSection === "subjective" && (
            <motion.div 
              key="subjective"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
                <PenTool className="w-6 h-6 text-indigo-500" />
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                  Read these high-probability questions. Try to answer in your mind, then tap "Show Answer" to memorize the perfect response.
                </p>
              </div>

              {examData.subjectives?.map((q: any, i: number) => {
                const isRevealed = revealedAnswers[q.id];
                
                return (
                  <div key={q.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center rounded-full font-black text-sm">
                        Q{i + 1}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700">
                        {q.marks} Marks
                      </span>
                    </div>
                    
                    <p className="text-base font-bold text-slate-800 dark:text-white mb-6 leading-relaxed ml-2">
                      {q.question}
                    </p>

                    <button 
                      onClick={() => toggleAnswer(q.id)}
                      className="w-full py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-600 dark:text-slate-400 flex justify-center items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="w-6 h-6" />
                      {isRevealed ? "Hide Answer" : "Show Answer & Marking Scheme"}
                    </button>

                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                            <h5 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">Ideal Answer</h5>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {q.answer}
                            </p>
                            
                            {q.markingScheme && q.markingScheme.length > 0 && (
                              <div className="mt-5 pt-5 border-t border-emerald-200/50 dark:border-emerald-800/50">
                                <h5 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Marking Scheme (Step-by-step)</h5>
                                <ul className="space-y-2">
                                  {q.markingScheme.map((step: string, j: number) => (
                                    <li key={j} className="flex gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                      <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      
      {/* Generate New Paper Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button 
            onClick={loadExam}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-sm hover:scale-105 transition-transform"
          >
            <RefreshCcw className="w-6 h-6" />
            Generate New Paper
          </button>
        </div>
      </div>
    </motion.div>
  );
}
