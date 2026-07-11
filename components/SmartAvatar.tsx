"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";

interface SmartAvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isPremium?: boolean;
}

const sizeMap = {
  sm: "w-6 h-6 text-[10px] rounded-lg",
  md: "w-11 h-11 text-xs rounded-xl",
  lg: "w-6 h-6 text-xl rounded-2xl",
  xl: "w-24 h-24 text-3xl rounded-[32px]",
};

const gradients = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-500",
];

export default function SmartAvatar({ 
  name = "Aspirant", 
  src, 
  size = "md", 
  className = "",
  isPremium = false
}: SmartAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Pick a gradient based on the first letter
  const charCode = name.charCodeAt(0) || 0;
  const gradient = gradients[charCode % gradients.length];

  return (
    <div className={`relative shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Premium Border Glow */}
      {isPremium && (
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-[inherit] blur-[2px] opacity-70 animate-pulse" />
      )}
      
      <div className={`relative h-full w-full bg-white dark:bg-slate-800 border border-border shadow-sm overflow-hidden flex items-center justify-center rounded-[inherit] transition-transform active:scale-95`}>
        {src && src.startsWith("http") ? (
          <img 
            src={src} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as any).src = ""; // Fallback to initials if image fails
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="font-black text-white drop-shadow-sm tracking-tighter">
              {initials || <User className="w-1/2 h-1/2" />}
            </span>
          </div>
        )}

        {/* Glassmorphism Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
      </div>
    </div>
  );
}
