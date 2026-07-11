"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, Star, 
  Gift, Check, ChevronRight,
  X, Coins, MapPin, Phone, User, Edit3, Truck
} from "lucide-react";
import { redeemWithCoins } from "../lib/gamification";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";

const MERCH_ITEMS = [
  {
    id: "premium_tshirt",
    name: "Achivox Premium T-Shirt",
    description: "High quality custom fitted t-shirt with your Name & Rank printed on the back.",
    coinCost: 5000,
    icon: <Gift className="w-6 h-6" />,
    image: "/merch/tshirt.png",
    color: "bg-purple-600 border-purple-500",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.6)]",
    rarity: "Legendary",
    customPlaceholder: "Name & Size (e.g., Aryan - M)"
  },
  {
    id: "smart_backpack",
    name: "Achivox Smart Backpack",
    description: "Premium study bag with anti-theft design and customized Achivox metal tag.",
    coinCost: 10000,
    icon: <ShoppingBag className="w-6 h-6" />,
    image: "/merch/backpack.png",
    color: "bg-blue-600 border-blue-500",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.6)]",
    rarity: "Mythic",
    customPlaceholder: "Name for Metal Tag"
  },
  {
    id: "signature_pen",
    name: "Achivox Signature Pen",
    description: "A luxury metallic ballpoint pen engraved beautifully with your name.",
    coinCost: 2500,
    icon: <Edit3 className="w-6 h-6" />,
    image: "/merch/pen.png",
    color: "bg-yellow-600 border-yellow-500",
    glow: "shadow-[0_0_15px_rgba(202,138,4,0.6)]",
    rarity: "Epic",
    customPlaceholder: "Name to Engrave"
  },
  {
    id: "mastery_notebook",
    name: "Mastery Notebook (Copy)",
    description: "Hardcover premium notebook with your favorite motivational quote on the cover.",
    coinCost: 1500,
    icon: <Star className="w-6 h-6" />,
    image: "/merch/notebook.png",
    color: "bg-emerald-600 border-emerald-500",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.6)]",
    rarity: "Rare",
    customPlaceholder: "Motivational Quote (Max 10 words)"
  }
];

const RARITY_COLORS: Record<string, string> = {
  Rare:      "text-emerald-400 bg-emerald-400/10",
  Epic:      "text-yellow-500 bg-yellow-500/10",
  Legendary: "text-purple-400 bg-purple-400/10",
  Mythic:    "text-blue-400 bg-blue-400/10"
};

export default function RewardShop({ 
  userId, 
  onClose
}: { 
  userId: string; 
  onClose: () => void;
}) {
  const [coins, setCoins] = useState(0);
  const [selectedItem, setSelectedItem] = useState<typeof MERCH_ITEMS[0] | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customText, setCustomText] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!userId || userId === "anonymous") return;
    const unsubStats = onSnapshot(doc(db, "user_stats", userId), (snap) => {
      if (snap.exists()) setCoins(snap.data().coins || 0);
    });
    return () => unsubStats();
  }, [userId]);

  const handleOpenForm = (item: typeof MERCH_ITEMS[0]) => {
    if (coins < item.coinCost) {
      alert(`Not enough Achivox Coins! You need ${item.coinCost} coins.`);
      return;
    }
    setSelectedItem(item);
    setFormError("");
  };

  const handleBuy = async () => {
    if (!selectedItem) return;

    if (!fullName.trim() || !phone.trim() || !address.trim() || !customText.trim()) {
      setFormError("Please fill out all the fields properly.");
      return;
    }
    if (phone.length < 10) {
      setFormError("Please enter a valid phone number.");
      return;
    }

    setFormError("");
    setPurchasing(true);

    const ok = await redeemWithCoins(userId, selectedItem.coinCost, selectedItem.name);

    if (ok) {
      try {
        // Save Merch Order to Firestore
        await addDoc(collection(db, "merch_orders"), {
          userId,
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          cost: selectedItem.coinCost,
          fullName,
          phone,
          address,
          customText,
          status: "Pending",
          orderedAt: serverTimestamp()
        });

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#8b5cf6', '#eab308']
        });

        setSuccess(selectedItem.id);
        setSelectedItem(null);

        // Reset form
        setFullName(""); setPhone(""); setAddress(""); setCustomText("");

        setTimeout(() => {
          setSuccess(null);
        }, 4000);
      } catch (err) {
        console.error("Order processing error:", err);
        alert("There was an error saving your order. Please contact support.");
      }
    } else {
      alert("Purchase failed. Please try again.");
    }
    setPurchasing(false);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center py-10 px-6 overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase">Achivox Merch</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Exclusive Physical Rewards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-yellow-400/50">
            <Coins className="w-6 h-6 text-white" />
            <span className="text-white font-black text-sm">{coins.toLocaleString()}</span>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-xl grid gap-4 pb-20">
        {MERCH_ITEMS.map((item) => {
          const isAffordable = coins >= item.coinCost;
          const isSuccess = success === item.id;

          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden rounded-2xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${isAffordable ? "bg-slate-900 border-slate-700/50 hover:border-blue-500/50" : "bg-slate-900/50 border-slate-800 opacity-60 grayscale-[0.5]"}`}
            >
              <div className="flex items-start gap-4">
                <div 
                  onClick={() => !isSuccess && setPreviewImage(item.image)}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center overflow-hidden relative shrink-0 ${item.glow} border border-white/10 ${!isSuccess ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
                >
                  {isSuccess ? (
                    <div className={`absolute inset-0 flex items-center justify-center text-white ${item.color}`}>
                      <Check className="w-8 h-8" />
                    </div>
                  ) : (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm">{item.name}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${RARITY_COLORS[item.rarity]}`}>
                      {item.rarity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug pr-4 mt-0.5">{item.description}</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleOpenForm(item)}
                disabled={!isAffordable || isSuccess}
                className={`shrink-0 px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm transition-all ${
                  isSuccess 
                    ? "bg-green-500 text-white"
                    : isAffordable
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {isSuccess ? (
                  <>Ordered <Check className="w-6 h-6" /></>
                ) : (
                  <>
                    <Coins className="w-6 h-6" />
                    {item.coinCost.toLocaleString()}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Merch Customization Modal Form */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2">
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center mb-6 mt-4">
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center shadow-md text-white mb-2 ${selectedItem.color}`}>
                  {selectedItem.icon}
                </div>
                <h3 className="text-lg font-bold text-white text-center">{selectedItem.name}</h3>
                <p className="text-slate-400 text-xs text-center mt-1">Fill out the details for shipping.</p>
              </div>

              {formError && (
                <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-300 text-sm p-3 rounded-xl text-center font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Shipping Address</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 w-6 h-6 text-slate-500" />
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House No., Street, City, State, PIN Code"
                      rows={3}
                      className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-600 outline-none resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Customization Details</label>
                  <div className="relative mt-1">
                    <Edit3 className="absolute left-3 top-3 w-6 h-6 text-slate-500" />
                    <textarea 
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder={selectedItem.customPlaceholder}
                      rows={2}
                      className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 placeholder-slate-600 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3.5 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBuy}
                  disabled={purchasing}
                  className="flex-[2] py-3.5 rounded-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {purchasing ? "Processing..." : "Confirm Order"}
                  {!purchasing && <Truck className="w-6 h-6" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-2xl aspect-square rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={previewImage} alt="Reward Preview" fill className="object-contain" />
              <button 
                onClick={() => setPreviewImage(null)} 
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
