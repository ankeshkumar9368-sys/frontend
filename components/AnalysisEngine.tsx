"use client";

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  RadialLinearScale,
  ArcElement
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import { motion } from "framer-motion";
import { TrendingUp, Target, Zap, Award, Clock, AlertCircle, Sparkles, Lightbulb, Loader2, Brain } from "lucide-react";
import { analyzePerformance } from "../lib/content";
import { useState, useEffect } from 'react';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  RadialLinearScale,
  ArcElement
);

export default function AnalysisEngine({ userData, onUpgrade }: { userData: any, onUpgrade?: () => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    const runAnalysis = async () => {
      if (!userData?.id || !userData?.history) return;
      setLoadingAnalysis(true);
      const data = await analyzePerformance(userData.id, userData.history);
      setAnalysis(data);
      setLoadingAnalysis(false);
    };
    runAnalysis();
  }, [userData]);

  // Use real data or fallback to zero for new users
  const totalSolved = userData?.totalSolved || 0;
  const correctOnes = userData?.correctAnswers || 0;
  const accuracy = totalSolved > 0 ? ((correctOnes / totalSolved) * 100).toFixed(1) : 0;
  
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Accuracy %',
        data: userData?.history?.accuracy || [0, 0, 0, 0, 0, 0, 0], // Zero for new users
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
      }
    ]
  };

  const subjectData = {
    labels: ['Quant', 'Reasoning', 'English', 'Science', 'History'],
    datasets: [
      {
        label: 'Accuracy',
        data: userData?.subjectStats || [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 8,
      }
    ]
  };

  const radarData = {
    labels: ['Speed', 'Accuracy', 'Focus', 'Retention', 'Hardwork'],
    datasets: [
      {
        label: 'Current Level',
        data: userData?.skillProfile || [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false }, ticks: { display: false } },
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-5 rounded-[28px] border border-border shadow-sm flex flex-col gap-2"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/30 w-6 h-6 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
          <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{userData?.rank || "N/A"}</span>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">{userData?.rank ? "↑ Top 5% this week" : "Take a test to rank"}</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-5 rounded-[28px] border border-border shadow-sm flex flex-col gap-2"
        >
          <div className="bg-indigo-100 dark:bg-indigo-900/30 w-6 h-6 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
          <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{accuracy}%</span>
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">{totalSolved > 0 ? "↑ Recent Improvement" : "No tests taken yet"}</span>
        </motion.div>
      </div>

      {/* Accuracy Trend Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card p-6 rounded-[32px] border border-border shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full" />
            Accuracy Trend
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase">Last 7 Days</span>
        </div>
        <div className="h-48">
          <Line data={weeklyData} options={chartOptions as any} />
        </div>
      </motion.div>

      {/* Subject Wise Accuracy */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card p-6 rounded-[32px] border border-border shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            Subject Mastery
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase">Percentage</span>
        </div>
        <div className="h-48">
          <Bar data={subjectData} options={chartOptions as any} />
        </div>
      </motion.div>

      {/* Personal Strengths Radar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card p-6 rounded-[32px] border border-border shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            Skill Balance
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase">Aptitude Profile</span>
        </div>
        <div className="h-64 flex items-center justify-center">
          <Radar 
            data={radarData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: { r: { grid: { color: 'rgba(0,0,0,0.05)' }, angleLines: { display: false }, ticks: { display: false } } },
              plugins: { legend: { display: false } }
            }} 
          />
        </div>
      </motion.div>

      {/* AI Performance Report */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 dark:bg-indigo-950 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden border-4 border-indigo-500/20"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain className="w-32 h-32" />
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-6 h-6 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-black text-xl tracking-tight">AI Performance Analysis</h4>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Powered by Gemini 1.5 Flash</p>
          </div>
        </div>

        {loadingAnalysis ? (
          <div className="py-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs font-black text-indigo-300 uppercase tracking-widest animate-pulse">Consulting AI Brain...</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            {/* 🔒 PREMIUM BLUR OVERLAY */}
            {!userData?.isSubscribed && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[6px] rounded-2xl">
                <div className="bg-indigo-600/90 text-white p-6 rounded-3xl shadow-2xl text-center max-w-sm border border-indigo-400/30">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h4 className="font-black text-lg mb-2">Unlock Your AI Profile</h4>
                  <p className="text-xs text-indigo-100 mb-4 font-medium leading-relaxed">
                    AI ne aapki kamzoriyaan (weak spots) dhund li hain. Premium lijiye aur personalized improvement tips paayein!
                  </p>
                  <button onClick={onUpgrade} className="w-full py-3 bg-white text-indigo-600 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all shadow-lg">
                    Go Premium Now
                  </button>
                </div>
              </div>
            )}

            <div className={`p-5 bg-white/5 rounded-3xl border border-white/10 italic text-sm font-medium text-slate-300 leading-relaxed ${!userData?.isSubscribed ? 'blur-sm select-none' : ''}`}>
              {analysis?.analysisReport || "Start taking more tests for a personalized AI performance report."}
            </div>

            {analysis?.weakAreas && analysis.weakAreas.length > 0 && (
              <div className={`space-y-3 ${!userData?.isSubscribed ? 'blur-sm select-none' : ''}`}>
                <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Identified Weak Areas
                </h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.weakAreas.map((area: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-rose-500/20 text-rose-300 text-[10px] font-black rounded-xl border border-rose-500/30 uppercase">{area}</span>
                  ))}
                </div>
              </div>
            )}

            {analysis?.improvementTips && (
              <div className={`space-y-3 ${!userData?.isSubscribed ? 'blur-sm select-none opacity-50' : ''}`}>
                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" />
                  Improvement Tips
                </h5>
                <div className="space-y-2">
                  {analysis.improvementTips.slice(0, 3).map((tip: any, i: number) => (
                    <div key={i} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <p className="text-xs font-bold text-slate-200">{tip.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Actionable Insight Fallback */}
      {!analysis && (
        <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target className="w-20 h-20" />
          </div>
          <h4 className="font-black text-lg mb-2">Smart Action Plan</h4>
          <p className="text-xs font-bold text-white/80 leading-relaxed mb-4">
            Take your first mock test to unlock AI-powered insights and a personalized study plan.
          </p>
          <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Take First Test</button>
        </div>
      )}
    </div>
  );
}
