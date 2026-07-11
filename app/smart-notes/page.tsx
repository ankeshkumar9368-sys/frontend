import { Suspense } from "react";
import SmartNotesClient from "./SmartNotesClient";

export default function SmartNotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-300 font-semibold">Loading Smart Notes...</p>
        </div>
      </div>
    }>
      <SmartNotesClient />
    </Suspense>
  );
}
