"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, VolumeX, Sparkles, X, Brain, Play, Pause } from "lucide-react";
import { voiceCoach } from "../lib/voiceCoach";

export default function AIVoiceCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [adviceText, setAdviceText] = useState("");

  const handleGetMotivation = () => {
    const text = voiceCoach.getMotivation();
    setAdviceText(text);
    setIsSpeaking(true);
    voiceCoach.speak(text);
    
    // Reset speaking state after a reasonable time (or use onend if we had a callback)
    setTimeout(() => setIsSpeaking(false), 6000);
  };

  const handleStop = () => {
    voiceCoach.stop();
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[60] w-6 h-6 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white/20 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-indigo-600 rounded-2xl animate-ping opacity-20" />
        <Volume2 className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[70] w-80 bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-8"
          >
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
               <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-500 rounded-full blur-[40px]" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase italic">AI Voice Coach</h3>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Active Assistant</p>
                  </div>
                </div>
                <button onClick={() => { handleStop(); setIsOpen(false); }} className="p-2 hover:bg-white/5 rounded-lg text-white/50"><X className="w-6 h-6" /></button>
              </div>

              {/* Animated Waveform (Speaking) */}
              <div className="flex items-center justify-center h-20 gap-1.5">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      height: isSpeaking ? [10, 40, 10] : 4 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5, 
                      delay: i * 0.05 
                    }}
                    className={`w-1.5 rounded-full ${isSpeaking ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}
                  />
                ))}
              </div>

              <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                <p className="text-[11px] font-medium text-white/70 italic leading-relaxed text-center">
                  {isSpeaking ? `"${adviceText}"` : "Tap below to get personalized study advice or motivation."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {!isSpeaking ? (
                  <button 
                    onClick={handleGetMotivation}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-6 h-6" /> Start Guidance
                  </button>
                ) : (
                  <button 
                    onClick={handleStop}
                    className="w-full py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <VolumeX className="w-6 h-6" /> Stop Coach
                  </button>
                )}
                
                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-white/5 text-white/50 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:text-white transition-all">Next Topic Tip</button>
                  <button className="flex-1 py-3 bg-white/5 text-white/50 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:text-white transition-all">Daily Target</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
