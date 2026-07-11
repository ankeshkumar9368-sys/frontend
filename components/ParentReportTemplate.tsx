"use client";

import { Star, TrendingUp, Target, Award, Brain, Clock, Sparkles } from "lucide-react";

interface ReportData {
  userName: string;
  totalSolved: number;
  accuracy: number;
  streak: number;
  points: number;
  rank: string;
  weakTopics: any[];
  strongTopics: any[];
  roadmapProgress: number;
}

export default function ParentReportTemplate({ data }: { data: ReportData }) {
  return (
    <div id="parent-report-template" className="p-16 bg-white text-slate-900 font-sans max-w-[800px] mx-auto border-[12px] border-slate-50 relative overflow-hidden">
      {/* Official Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-30deg] pointer-events-none">
        <h1 className="text-[120px] font-black uppercase tracking-[0.5em]">ACHIVOX</h1>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-12 relative z-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-indigo-600">Achivox Official</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Performance Audit & Progress Report</p>
          <div className="mt-8 space-y-1">
            <p className="text-xs font-black uppercase text-slate-400">Date of Issue</p>
            <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center text-white text-3xl font-black italic mx-auto mb-4 shadow-xl">A</div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Academic Excellence</p>
        </div>
      </div>

      {/* Student Identity */}
      <div className="bg-slate-50 rounded-[40px] p-10 mb-12 flex justify-between items-center border border-slate-100 relative z-10">
        <div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Student Profile</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{data.userName}</h2>
          <div className="flex gap-4 mt-4">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
               <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
               <span className="text-[10px] font-black uppercase">Premium Member</span>
             </div>
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
               <Award className="w-6 h-6 text-indigo-600" />
               <span className="text-[10px] font-black uppercase">Rank: {data.rank}</span>
             </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-6xl font-black text-indigo-600 tracking-tighter">{data.accuracy}%</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Accuracy</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12 relative z-10">
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm flex items-center gap-6">
              <div className="w-6 h-6 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><Target className="w-6 h-6" /></div>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{data.totalSolved}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Questions Solved</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm flex items-center gap-6">
              <div className="w-6 h-6 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{data.streak} Days</p>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Continuous Streak</p>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Roadmap Mastery</p>
                <span className="text-xs font-black text-indigo-400">{data.roadmapProgress}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div style={{ width: `${data.roadmapProgress}%` }} className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Accumulated XP</p>
                <h4 className="text-3xl font-black">{data.points.toLocaleString()}</h4>
              </div>
           </div>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="grid grid-cols-2 gap-10 mb-16 relative z-10">
        <div>
          <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Core Strengths
          </h3>
          <div className="space-y-3">
            {data.strongTopics.length > 0 ? data.strongTopics.map((t, i) => (
              <div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-xs font-black text-emerald-700 uppercase">{t.name || t}</p>
                <p className="text-[9px] font-bold text-emerald-500 mt-1">Consistency Level: High</p>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold italic">Building momentum...</p>}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6" /> Attention Required
          </h3>
          <div className="space-y-3">
            {data.weakTopics.length > 0 ? data.weakTopics.map((t, i) => (
              <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-xs font-black text-rose-700 uppercase">{t.name || t}</p>
                <p className="text-[9px] font-bold text-rose-400 mt-1">Recommended Action: AI Revision</p>
              </div>
            )) : <p className="text-xs text-slate-400 font-bold italic">No critical gaps identified.</p>}
          </div>
        </div>
      </div>

      {/* AI Counselor's Observation */}
      <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden mb-16 shadow-2xl shadow-indigo-600/30">
        <Sparkles className="absolute -right-10 -top-10 w-48 h-48 text-white/5 rotate-12" />
        <div className="relative z-10">
          <h3 className="text-xl font-black italic uppercase mb-4">AI Counselor's Observation</h3>
          <p className="text-sm font-medium leading-relaxed text-indigo-100 italic">
            "Based on the analysis of {data.totalSolved} attempts, {data.userName} has shown exceptional resilience in {data.strongTopics[0] || 'core concepts'}. 
            The consistent accuracy of {data.accuracy}% indicates a strong foundation. We recommend prioritizing {data.weakTopics[0] || 'next-level'} topics to bridge the remaining conceptual gaps. 
            Overall, the progress trajectory is highly positive and ahead of platform benchmarks."
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pt-10 border-t border-slate-100 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em] mb-4 italic">Education Redefined by Achivox</p>
        <div className="flex justify-center gap-6 opacity-30">
          <div className="w-8 h-[1px] bg-slate-900 my-auto" />
          <p className="text-[8px] font-black uppercase">Official Academic Record v2.5</p>
          <div className="w-8 h-[1px] bg-slate-900 my-auto" />
        </div>
      </div>

      {/* Signature Area */}
      <div className="mt-16 flex justify-end pr-10">
        <div className="text-center">
           <div className="w-40 h-[1px] bg-slate-400 mb-2" />
           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Achivox Academic Head</p>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
