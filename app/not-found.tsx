import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-100 max-w-lg w-full text-center space-y-8">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-10 h-10 text-indigo-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Void Path</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">The requested resource does not exist</p>
        </div>
        
        <p className="text-slate-500 font-medium leading-relaxed">
          It seems you've wandered into an uncharted board. Let's get you back to the main curriculum.
        </p>

        <Link
          href="/"
          className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 inline-block"
        >
          <Home className="w-5 h-5" /> Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
