"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect to main dashboard immediately
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    if (path.includes('explore')) router.replace('/#explore');
    else if (path.includes('tools')) router.replace('/#tools');
    else if (path.includes('analysis')) router.replace('/#analysis');
    else if (path.includes('profile')) router.replace('/#profile');
    else router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070518] text-white flex items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Achivox Curriculum...</p>
      </div>
    </div>
  );
}
