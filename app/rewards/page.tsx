"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RewardsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/#rewards");
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#070518] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-amber-400">Loading Coin Reward Shop...</p>
      </div>
    </div>
  );
}
