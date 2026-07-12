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

  // Keep a ref to pathname so the auth callback always has the latest value
  // WITHOUT triggering a re-subscription when pathname changes.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Subscribe ONCE — never re-subscribe just because the URL changed.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in: redirect to login unless already there.
        if (pathnameRef.current !== "/login") {
          router.push("/login");
        }
        setLoading(false);
      } else {
        // Logged in: check if account is blocked.
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().isBlocked === true) {
            setIsBlocked(true);
            clearLocalAnalytics();
            await signOut(auth);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to check block status", e);
        }

        // If user somehow lands on /login while authenticated, redirect home.
        if (pathnameRef.current === "/login") {
          router.push("/");
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Empty array: runs ONCE, never re-subscribes on navigation.

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
