"use client";

import { useEffect } from "react";

export default function TeacherPageRedirect() {
  useEffect(() => {
    // Permanently redirect all legacy teacher portal accesses to home
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1023] flex items-center justify-center text-white">
      <p className="text-sm font-bold animate-pulse">Redirecting to Achivox Home...</p>
    </div>
  );
}
