'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-100 max-w-lg w-full text-center space-y-8">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">System Glitch</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Runtime Exception Caught</p>
        </div>
        
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Error Detail</p>
          <p className="text-xs font-mono text-rose-600 break-all leading-relaxed">
            {error.message || "An unexpected error occurred in the component tree."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCcw className="w-5 h-5" /> Try Recovering
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white text-slate-600 py-5 rounded-[24px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            <Home className="w-5 h-5" /> Back to Safety
          </button>
        </div>
      </div>
    </div>
  )
}
