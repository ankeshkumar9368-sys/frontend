"use client";

import { motion } from "framer-motion";
import { Plus, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { signOut } from "firebase/auth";
import { clearLocalAnalytics } from "../../lib/analytics";

export default function Profiles() {
  const router = useRouter();

  const handleSelectProfile = (profile: any) => {
    localStorage.setItem("activeProfile", JSON.stringify(profile));
    router.push("/");
  };

  const handleLogout = async () => {
    clearLocalAnalytics();
    await signOut(auth);
    localStorage.removeItem("activeProfile");
    router.push("/login");
  };

  // Mock Family Profiles (Later fetched from Firestore)
  const profiles = [
    { id: 1, name: "Aman", type: "Govt Prep", color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/35", icon: "A" },
    { id: 2, name: "Rahul", type: "Class 10 Core", color: "from-orange-500 to-amber-600", shadow: "shadow-orange-500/35", icon: "R" },
    { id: 3, name: "Priya", type: "Class 12 Core", color: "from-purple-500 to-pink-600", shadow: "shadow-purple-500/35", icon: "P" },
  ];

  return (
    <div className="mobile-container justify-center text-white bg-slate-950 relative overflow-hidden flex flex-col min-h-screen">
      
      {/* Background decoration */}
      <div className="blur-glow-bubble w-72 h-72 bg-indigo-500/10 top-10 -left-20" />
      <div className="blur-glow-bubble w-80 h-80 bg-purple-500/10 bottom-20 -right-20" style={{ animationDelay: '-4s' }} />

      <div className="text-center w-full px-8 z-10 relative">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black mb-12 tracking-tight uppercase italic bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
        >
          Who's learning?
        </motion.h1>

        <div className="grid grid-cols-2 gap-6 mb-12 max-w-sm mx-auto">
          {profiles.map((profile, index) => (
            <motion.div 
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 15, delay: index * 0.08 }}
              onClick={() => handleSelectProfile(profile)}
              className="flex flex-col items-center cursor-pointer group"
            >
              <motion.div 
                whileHover={{ scale: 1.08, translateY: -4, rotateY: -10, rotateX: 10 }}
                whileTap={{ scale: 0.95 }}
                className={`w-24 h-24 bg-gradient-to-tr ${profile.color} rounded-[28px] flex items-center justify-center text-4xl font-black mb-3 border-2 border-white/10 group-hover:border-white/40 transition-colors shadow-lg ${profile.shadow}`}
                style={{ transformStyle: "preserve-3d", perspective: "100px" }}
              >
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{profile.icon}</span>
              </motion.div>
              <h3 className="text-base font-extrabold text-slate-200 group-hover:text-white transition-colors">{profile.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{profile.type}</p>
            </motion.div>
          ))}

          {/* Add Profile Button */}
          {profiles.length < 4 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 15, delay: profiles.length * 0.08 }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <motion.div 
                whileHover={{ scale: 1.08, translateY: -4 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 bg-slate-900/60 rounded-[28px] flex items-center justify-center mb-3 border-2 border-dashed border-slate-700/60 group-hover:border-slate-500/80 group-hover:bg-slate-800/60 transition-all shadow-md"
              >
                <Plus className="w-8 h-8 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </motion.div>
              <h3 className="text-base font-extrabold text-slate-500 group-hover:text-slate-300 transition-colors">Add Profile</h3>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Sibling account</p>
            </motion.div>
          )}
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all bg-slate-900/40"
        >
          Manage Profiles
        </motion.button>
        
        <br/>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout} 
          className="text-rose-500/80 hover:text-rose-400 flex items-center justify-center gap-2 mx-auto mt-6 text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </motion.button>
      </div>
    </div>
  );
}
