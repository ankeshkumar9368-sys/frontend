"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { clearLocalAnalytics } from "../lib/analytics";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, ShieldAlert } from "lucide-react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[AuthProvider] onAuthStateChanged fired. User:", user?.email ?? "null", "UID:", user?.uid ?? "null");
      if (!user) {
        console.log("[AuthProvider] No user detected. Pathname:", pathnameRef.current);
        if (pathnameRef.current !== "/login" && !pathnameRef.current.startsWith("/__/")) {
          console.log("[AuthProvider] Protected page detected. Redirecting to /login");
          router.push("/login");
        } else {
          console.log("[AuthProvider] System path or login page. No redirect needed.");
        }
        setLoading(false);
      } else {
        console.log("[AuthProvider] User detected. Checking block status in Firestore...");
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          console.log("[AuthProvider] Firestore user doc read successful. Exists:", userDoc.exists());
          if (userDoc.exists() && userDoc.data().isBlocked === true) {
            console.warn("[AuthProvider] User is blocked! Signing out and redirecting...");
            setIsBlocked(true);
            clearLocalAnalytics();
            await signOut(auth);
            setLoading(false);
            return;
          }
        } catch (e: any) {
          console.error("[AuthProvider] Failed to check block status in Firestore:", e.message, e);
        }
        console.log("[AuthProvider] User is not blocked. Allowing access, setting loading to false.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <BookOpen className="w-6 h-6 text-primary animate-pulse mb-4" />
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-sm font-bold text-slate-500 mt-4 tracking-widest uppercase">Achivox</p>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-500/20">
           <ShieldAlert className="w-6 h-6 text-rose-500" />
        </div>
        <h1 className="text-3xl font-black uppercase italic mb-2 tracking-tight">Account Suspended</h1>
        <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed mb-8">
          Your Achivox account has been permanently restricted due to a violation of our terms of service or abnormal activity.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="px-8 py-3 bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
