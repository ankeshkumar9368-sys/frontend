"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TestRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#test");
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#070518] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Live Test Arena...</p>
      </div>
    </div>
  );
}
