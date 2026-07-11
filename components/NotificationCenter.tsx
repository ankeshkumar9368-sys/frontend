"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Clock, Trash2, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: any;
  type: "alert" | "update" | "motivational";
  read: boolean;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onClear: () => void;
}

export default function NotificationCenter({ notifications, onClose, onClear }: NotificationCenterProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl z-[200] border-l border-border flex flex-col"
    >
      <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">AI Inbox</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Sparkles className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-bold uppercase tracking-widest">No new updates from Gemini</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-[28px] border-2 transition-all relative overflow-hidden group ${notif.read ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-primary/5 border-primary/20 shadow-lg'}`}
            >
              {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-ping" />}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {notif.type}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Just Now
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{notif.title}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{notif.body}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-border bg-slate-50 dark:bg-slate-800/50">
        <button 
          onClick={onClear}
          className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border border-border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
        >
          <Trash2 className="w-6 h-6" /> Clear All History
        </button>
      </div>
    </motion.div>
  );
}
