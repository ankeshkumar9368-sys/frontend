"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/**
 * OPTIMIZED SPLASH SCREEN
 * Reduced concurrent animations for smoother mobile performance.
 * Replaced expensive CSS filters with lighter alternatives.
 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 1200);
    const t2 = setTimeout(() => {
      if (onDoneRef.current) onDoneRef.current();
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <AnimatePresence>
      {!out && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "#07091a" }}
        >
          {/* ── Optimized Ambient Background ── */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[120%] h-[120%] pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(79, 70, 229, 0.15) 0%, transparent 60%)",
              willChange: "transform, opacity"
            }}
          />

          {/* ── Simplified Light Rays (Reduced to 4) ── */}
          {[0, 90, 180, 270].map((deg, i) => (
            <motion.div
              key={deg}
              animate={{ opacity: [0, 0.2, 0], scaleY: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
              className="absolute pointer-events-none"
              style={{
                width: 2,
                height: 100,
                background: "linear-gradient(to bottom, #818cf8, transparent)",
                top: "50%", left: "50%",
                transformOrigin: "bottom center",
                transform: `translate(-50%, -100%) rotate(${deg}deg) translateY(-100px)`,
                willChange: "opacity, transform"
              }}
            />
          ))}

          {/* ── Main Logo ── */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="relative z-10"
          >
            {/* Optimized Glow */}
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-[40px] blur-xl bg-indigo-600/30 -z-10"
              style={{ willChange: "opacity" }}
            />

            {/* Logo image container */}
            <div
              className="relative overflow-hidden"
              style={{
                width: 140,
                height: 140,
                borderRadius: 36,
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
              }}
            >
              <Image
                src="/achivox-logo.png"
                alt="Achivox"
                fill
                className="object-cover"
                priority
              />

              {/* Shimmer sweep (Optimized) */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  zIndex: 2,
                  willChange: "transform"
                }}
              />
            </div>
          </motion.div>

          {/* ── Reduced Sparkle Dots (Reduced to 6) ── */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={`sp-${i}`}
              animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
              className="absolute w-1 h-1 rounded-full pointer-events-none bg-indigo-400"
              style={{
                top: `${25 + (i * 123) % 50}%`,
                left: `${15 + (i * 456) % 70}%`,
                boxShadow: "0 0 4px #818cf8",
                willChange: "opacity, transform"
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
