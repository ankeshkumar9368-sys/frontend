"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Info, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  createdAt: string;
  read: boolean;
}

export default function NotificationSidebar({ 
  notifications,
  onClose
}: { 
  notifications: AppNotification[];
  onClose: () => void;
}) {

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid, "notifications", id), {
      read: true
    });
  };

  const deleteNotification = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "notifications", id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case "success": return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="relative w-full max-w-sm h-full bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-white font-black text-xl">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Bell className="w-6 h-6 mb-4 text-slate-500" />
              <p className="text-white font-bold text-lg">All caught up!</p>
              <p className="text-sm text-slate-400 mt-1">You have no new messages.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <motion.div 
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-[20px] border relative overflow-hidden ${notif.read ? 'bg-slate-800/50 border-white/5' : 'bg-slate-800 border-primary/30'}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                {!notif.read && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold ${notif.read ? 'text-slate-300' : 'text-white'}`}>{notif.title}</h4>
                    <p className={`text-sm mt-1 leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-300'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-3 block">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="shrink-0 p-2 opacity-50 hover:opacity-100 hover:text-red-500 transition-all self-start"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
