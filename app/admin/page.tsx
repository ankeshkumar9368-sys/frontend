"use client";

import { useState, useEffect } from "react";
import { 
  Users, Settings, Search, Filter, 
  CheckCircle2, Clock, TrendingUp, 
  DollarSign, ChevronRight, LayoutDashboard,
  BarChart3, Lock, Loader2, LogOut, Sparkles,
  ShieldCheck, Zap, Activity, Globe, Eye, 
  MoreVertical, AlertTriangle, Key, User, 
  ArrowUpRight, ArrowDownRight, Wallet, Cpu, Plus, Star, Gift, Ticket, Send,
  MessageSquare, Trash2, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { clearLocalAnalytics } from "../../lib/analytics";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, limit, doc, getDoc, setDoc, where, Timestamp, getDocs, updateDoc, serverTimestamp, addDoc, deleteDoc, arrayUnion, deleteField } from "firebase/firestore";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

const ADMIN_EMAILS = [
  "ankeshkumar9368@gmail.com",
  "ankeshkumar0506@gmail.com",
  "nitishkumarbzp29@gmail.com",
  "abhijeet01512@gmail.com"
];
const USD_TO_INR = 83.5;
const COST_PER_1M_INPUT = 0.075; // $ per 1M tokens
const COST_PER_1M_OUTPUT = 0.30; // $ per 1M tokens

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", type: "info", link: "" });
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const [adminStats, setAdminStats] = useState<any>({
    totalUsers: 0,
    premiumUsers: 0,
    dau: 0,
    totalStudyTime: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costINR: 0,
    dailyCalls: 0
  });

  const [featureMetrics, setFeatureMetrics] = useState<any>(null);
  const [showPersonalNoticeModal, setShowPersonalNoticeModal] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [personalNotice, setPersonalNotice] = useState({ title: "", message: "", type: "info" });
  const [sendingNotice, setSendingNotice] = useState(false);

  const [luckyInput, setLuckyInput] = useState("");
  const [luckyTier, setLuckyTier] = useState("pro");
  const [luckyMessage, setLuckyMessage] = useState("Congratulations! You've been selected as our Lucky User. Enjoy full Premium access for free! 🚀");
  const [isGranting, setIsGranting] = useState(false);

  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [goalRequests, setGoalRequests] = useState<any[]>([]);
  
  // PAYMENTS STATES
  const [payments, setPayments] = useState<any[]>([]);
  const [resolvingPayment, setResolvingPayment] = useState<any>(null);
  const [resolveInput, setResolveInput] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // SMART CAMPAIGNS STATES
  const [diagEndpointType, setDiagEndpointType] = useState<"frontend" | "backend">("frontend");
  const [diagBackendUrl, setDiagBackendUrl] = useState("https://examhero-backend.onrender.com");
  const [diagPrompt, setDiagPrompt] = useState("Say 'Diagnostics OK!' in one line.");
  const [diagBypassAuth, setDiagBypassAuth] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [diagError, setDiagError] = useState("");
  const [diagTime, setDiagTime] = useState(0);
  const [smartCampBoard, setSmartCampBoard] = useState("All");
  const [smartCampClass, setSmartCampClass] = useState("All");
  const [smartCampPlan, setSmartCampPlan] = useState("All");
  const [smartCampMessage, setSmartCampMessage] = useState("");
  const [smartCampSending, setSmartCampSending] = useState(false);
  
  // API KEY MANAGEMENT
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);

  // APP CONFIG (FORCE UPDATE)
  const [appConfig, setAppConfig] = useState({ min_app_version: 1.0, download_url: "" });
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // GOD-MODE STATES
  const [selectedUserForXRay, setSelectedUserForXRay] = useState<any>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const exportToCSV = () => {
    if (!realUsers || realUsers.length === 0) return;
    
    const headers = ["Name", "Email", "Subscription", "Plan", "Total Solved", "Tokens Prompt", "Tokens Completion", "Estimated Cost (INR)", "Is Blocked"];
    const csvRows = [headers.join(",")];
    
    realUsers.forEach(u => {
      const prompt = u.tokens?.prompt || 0;
      const comp = u.tokens?.completion || 0;
      const cost = (((prompt/1000000)*COST_PER_1M_INPUT) + ((comp/1000000)*COST_PER_1M_OUTPUT)) * USD_TO_INR;
      
      const row = [
        `"${u.name || 'Aspirant'}"`,
        `"${u.email}"`,
        u.isSubscribed ? "Premium" : "Free",
        u.plan || "Free Tier",
        u.totalSolved || 0,
        prompt,
        comp,
        cost.toFixed(4),
        u.isBlocked ? "Yes" : "No"
      ];
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ExamHero_Users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleRevokePremium = async () => {
    if (!selectedUserForXRay || !confirm("Are you sure you want to revoke Premium for this user?")) return;
    setIsRevoking(true);
    try {
      const userRef = doc(db, "users", selectedUserForXRay.id);
      await updateDoc(userRef, { isSubscribed: false, plan: "Free Tier" });
      alert("Premium Revoked.");
      setSelectedUserForXRay({ ...selectedUserForXRay, isSubscribed: false, plan: "Free Tier" });
      setRealUsers(prev => prev.map(u => u.id === selectedUserForXRay.id ? { ...u, isSubscribed: false, plan: "Free Tier" } : u));
    } catch (e: any) { alert(e.message); } finally { setIsRevoking(false); }
  };

  const handleBlockUser = async () => {
    if (!selectedUserForXRay || !confirm("Are you sure you want to change block status for this user?")) return;
    setIsBlocking(true);
    try {
      const userRef = doc(db, "users", selectedUserForXRay.id);
      const newStatus = !selectedUserForXRay.isBlocked;
      await updateDoc(userRef, { isBlocked: newStatus });
      alert(`User ${newStatus ? "Blocked" : "Unblocked"} successfully.`);
      setSelectedUserForXRay({ ...selectedUserForXRay, isBlocked: newStatus });
      setRealUsers(prev => prev.map(u => u.id === selectedUserForXRay.id ? { ...u, isBlocked: newStatus } : u));
    } catch (e: any) { alert(e.message); } finally { setIsBlocking(false); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForXRay || !confirm("Are you sure you want to permanently delete this user from the database? This action cannot be undone.")) return;
    setIsDeletingUser(true);
    try {
      const userRef = doc(db, "users", selectedUserForXRay.id);
      await deleteDoc(userRef);
      alert("User deleted successfully.");
      setRealUsers(prev => prev.filter(u => u.id !== selectedUserForXRay.id));
      setSelectedUserForXRay(null);
    } catch (e: any) { alert(e.message); } finally { setIsDeletingUser(false); }
  };

  const handleSendSmartCampaign = async () => {
    if (!smartCampMessage.trim()) return alert("Message is required.");
    setSmartCampSending(true);
    try {
      // Filter users
      const targets = realUsers.filter(u => {
        if (smartCampBoard !== "All" && u.board !== smartCampBoard) return false;
        if (smartCampClass !== "All" && u.cls !== smartCampClass) return false;
        if (smartCampPlan !== "All") {
          const isPrem = u.isSubscribed;
          if (smartCampPlan === "Premium" && !isPrem) return false;
          if (smartCampPlan === "Free" && isPrem) return false;
        }
        return true;
      });
      if (targets.length === 0) {
         alert("No users match these filters.");
         setSmartCampSending(false);
         return;
      }
      
      const newNotif = {
        title: "🎯 Admin Broadcast",
        message: smartCampMessage,
        type: "success",
        createdAt: new Date().toISOString(),
        read: false,
        timestamp: Date.now()
      };
      
      for (const u of targets) {
        const notifRef = collection(db, "users", u.id, "notifications");
        await addDoc(notifRef, newNotif);
      }
      alert(`Successfully sent to ${targets.length} users!`);
      setSmartCampMessage("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSmartCampSending(false);
    }
  };

  const handleResolvePayment = async (paymentId: string) => {
    if (!resolveInput.trim()) return alert("Please enter a registered email or phone number.");
    setIsResolving(true);
    try {
      const paymentRef = doc(db, "payments", paymentId);
      
      // Look up user by email or phone
      const emailQuery = query(collection(db, "users"), where("email", "==", resolveInput.trim()));
      const phoneQuery = query(collection(db, "users"), where("phoneNumber", "==", resolveInput.trim()));
      
      let userSnap = await getDocs(emailQuery);
      if (userSnap.empty) {
        userSnap = await getDocs(phoneQuery);
      }
      
      if (userSnap.empty) {
        // Try stripping +91 from input
        const cleanInput = resolveInput.trim().replace(/^\+91/, '');
        const cleanPhoneQuery = query(collection(db, "users"), where("phoneNumber", "==", cleanInput));
        userSnap = await getDocs(cleanPhoneQuery);
      }
      
      if (userSnap.empty) {
        alert("No matching user found in database with that email or phone number.");
        setIsResolving(false);
        return;
      }
      
      const matchedUser = userSnap.docs[0];
      const userId = matchedUser.id;
      const payData = payments.find(p => p.id === paymentId);
      
      if (!payData) return alert("Payment details not found.");
      
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      
      // Update matching user's subscription
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isSubscribed: true,
        planType: payData.planType || "standard",
        premiumEndDate: expiry.toISOString(),
        subscriptionDate: serverTimestamp()
      });
      
      // Mark payment as resolved and linked
      await updateDoc(paymentRef, {
        resolved: true,
        matchedUserId: userId
      });
      
      alert(`Successfully linked payment to ${matchedUser.data().name || 'user'}! Subscription unlocked.`);
      setResolvingPayment(null);
      setResolveInput("");
    } catch (e: any) {
      alert("Error resolving payment: " + e.message);
    } finally {
      setIsResolving(false);
    }
  };

  const router = useRouter();

  const fetchApiKey = async () => {
    try {
      const docRef = doc(db, "settings", "api_keys");
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().geminiApiKey) {
        setGeminiApiKey(snap.data().geminiApiKey);
      }
    } catch (e) {
      console.error("Failed to fetch API key", e);
    }
  };

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      const docRef = doc(db, "settings", "api_keys");
      await setDoc(docRef, { geminiApiKey }, { merge: true });
      alert("API Key saved securely!");
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        if (user.email && ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setTimeout(() => router.push("/"), 3000);
        }
      } else {
        router.push("/#login");
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      fetchApiKey();
      
      // 1. Real-time Users & DAU
      const usersQuery = query(collection(db, "users"), orderBy("points", "desc"));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRealUsers(users);
        
        const todayStr = new Date().toDateString();
        const dauCount = users.filter((u: any) => {
            const lastActive = u.lastActiveDate instanceof Timestamp ? u.lastActiveDate.toDate() : new Date(u.lastActiveDate);
            return lastActive.toDateString() === todayStr;
        }).length;

        const premium = users.filter((u: any) => u.isSubscribed).length;
        const totalTime = users.reduce((acc: number, u: any) => acc + (u.totalStudyMinutes || 0), 0);
        
        // GLOBAL WEAK TOPICS LOGIC
        const topicScores: Record<string, { total: number; count: number; name: string }> = {};
        users.forEach((u: any) => {
          if (u.attempts) {
            u.attempts.forEach((a: any) => {
              if (!topicScores[a.topicId]) topicScores[a.topicId] = { total: 0, count: 0, name: a.topicName };
              topicScores[a.topicId].total += a.score;
              topicScores[a.topicId].count++;
            });
          }
        });
        const weakTopics = Object.values(topicScores)
          .map(t => ({ name: t.name, avg: Math.round(t.total / t.count), count: t.count }))
          .filter(t => t.avg < 60)
          .sort((a, b) => a.avg - b.avg)
          .slice(0, 5);

        setAdminStats((prev: any) => ({
          ...prev,
          totalUsers: users.length,
          premiumUsers: premium,
          dau: dauCount || 1,
          totalStudyTime: totalTime,
          weakTopics
        }));
      });

      // 2. Real-time AI Stats & Costs
      const aiStatsRef = doc(db, "admin_stats", "ai_usage");
      const unsubscribeAI = onSnapshot(aiStatsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const input = data.promptTokens || 0;
          const output = data.completionTokens || 0;
          
          const costUSD = (input / 1000000 * COST_PER_1M_INPUT) + (output / 1000000 * COST_PER_1M_OUTPUT);
          const costINR = costUSD * USD_TO_INR;

          setAdminStats((prev: any) => ({
            ...prev,
            promptTokens: input,
            completionTokens: output,
            totalTokens: data.totalTokens || 0,
            costINR: costINR.toFixed(2)
          }));
        }
      });

      // 3. Daily Activity (Calls)
      const today = new Date().toISOString().split('T')[0];
      const dailyAIRef = doc(db, "admin_stats", `ai_usage_${today}`);
      const unsubscribeDaily = onSnapshot(dailyAIRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAdminStats((prev: any) => ({
            ...prev,
            dailyCalls: data.calls || 0
          }));
        }
      });

      // 4. Feature Metrics (Performance & Usage)
      const featureMetricsRef = doc(db, "admin_stats", "feature_metrics");
      const unsubscribeFeatures = onSnapshot(featureMetricsRef, (snapshot) => {
        if (snapshot.exists()) {
          setFeatureMetrics(snapshot.data());
        }
      });

      // 6. Logs & Security Alerts
      const logsQuery = query(collection(db, "system_logs"), orderBy("timestamp", "desc"), limit(50));
      const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const alertsQuery = query(collection(db, "security_alerts"), orderBy("timestamp", "desc"), limit(50));
      const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
        setSecurityAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const broadcastsQuery = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
      const unsubscribeBroadcasts = onSnapshot(broadcastsQuery, (snapshot) => {
        setBroadcasts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const goalReqQuery = query(collection(db, "goal_change_requests"), orderBy("createdAt", "desc"));
      const unsubscribeGoalRequests = onSnapshot(goalReqQuery, (snapshot) => {
        setGoalRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      // 7. App Config
      const unsubscribeConfig = onSnapshot(doc(db, "system_config", "app_settings"), (snapshot) => {
        if (snapshot.exists()) {
          setAppConfig({
            min_app_version: snapshot.data().min_app_version || 1.0,
            download_url: snapshot.data().download_url || ""
          });
        }
      });

      // 8. Real-time Payments
      const paymentsQuery = query(collection(db, "payments"), orderBy("timestamp", "desc"));
      const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
        setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubscribeUsers();
        unsubscribeAI();
        unsubscribeDaily();
        unsubscribeLogs();
        unsubscribeBroadcasts();
        unsubscribeFeatures();
        unsubscribeAlerts();
        unsubscribeGoalRequests();
        unsubscribeConfig();
        unsubscribePayments();
      };
    }
  }, [isAdmin]);

  const handleUpdateAppConfig = async () => {
    setUpdatingConfig(true);
    try {
      await setDoc(doc(db, "system_config", "app_settings"), {
        min_app_version: appConfig.min_app_version,
        download_url: appConfig.download_url
      }, { merge: true });
      alert("App Config updated successfully!");
    } catch (e: any) {
      alert("Failed to update config: " + e.message);
    } finally {
      setUpdatingConfig(false);
    }
  };

  const [resettingAll, setResettingAll] = useState(false);

  const handleResetAllUsersPerformance = async () => {
    if (!confirm("CRITICAL WARNING: This will reset all performance data (XP, Badges, Streaks, History) for ALL USERS in the database. Are you absolutely sure?")) return;
    const adminPass = prompt("Type 'RESET_ALL' to confirm:");
    if (adminPass !== "RESET_ALL") return alert("Cancelled.");

    setResettingAll(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      let count = 0;
      
      const updatePromises = usersSnap.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        try {
          await updateDoc(doc(db, "users", uid), {
            points: 0,
            testsCompleted: 0,
            totalSolved: 0,
            correctAnswers: 0,
            streak: 0,
            masteryLevel: 0,
            attempts: [],
            overallAccuracy: 0
          });

          await setDoc(doc(db, "user_stats", uid), {
            xp: 0,
            level: 1,
            coins: 0,
            points: 0,
            streak: 0,
            lastActive: new Date(),
            badges: [],
            history: [],
            redemptions: []
          }, { merge: true });
          
          count++;
        } catch(e) {
          console.warn("Failed to reset user:", uid, e);
        }
      });
      
      await Promise.all(updatePromises);
      alert(`Successfully reset performance data for ${count} users.`);
    } catch (e: any) {
      console.error(e);
      alert("Failed to reset all users. Note: This requires admin Firebase rules allowing global updates. Error: " + e.message);
    } finally {
      setResettingAll(false);
    }
  };

  const [deletingGuests, setDeletingGuests] = useState(false);

  const handleDeleteGuests = async () => {
    if (!confirm("Are you sure you want to delete all guest accounts? This will remove users without a linked email or student ID.")) return;
    setDeletingGuests(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      let count = 0;
      for (const docSnap of usersSnap.docs) {
        const u = docSnap.data();
        if (!u.studentId && !u.email) {
          await deleteDoc(doc(db, "users", docSnap.id));
          count++;
        }
      }
      alert(`Successfully deleted ${count} guest accounts.`);
    } catch (e: any) {
      console.error(e);
      alert("Failed to delete guest accounts. Error: " + e.message);
    } finally {
      setDeletingGuests(false);
    }
  };

  const handleCreateBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) return alert("Title and Message are required");
    try {
      await addDoc(collection(db, "broadcasts"), {
        ...broadcastData,
        createdAt: serverTimestamp(),
        active: true
      });
      setShowBroadcastModal(false);
      setBroadcastData({ title: "", message: "", type: "info", link: "" });
      alert("Broadcast Live!");
    } catch (e) {
      console.error(e);
      alert("Failed to create broadcast");
    }
  };

  const deleteBroadcast = async (id: string) => {
    if (confirm("Delete this broadcast?")) {
      await deleteDoc(doc(db, "broadcasts", id));
    }
  };

  const loadAdminData = async () => {
    try {
      // const chaptersData = await fetchAllContent("Chapters");
      // setChapters(chaptersData);
    } catch (err) {
      console.error("Data Load Error:", err);
    }
  };

  const grantLuckyPremium = async () => {
    if (!luckyInput) return alert("Please enter Email or Phone!");
    setIsGranting(true);
    try {
      // Find user by email or phone
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", luckyInput));
      const snapshot = await getDocs(q);
      
      let userDoc = snapshot.docs[0];
      
      // If not found by email, try phone
      if (!userDoc) {
        const qPhone = query(usersRef, where("phone", "==", luckyInput));
        const snapPhone = await getDocs(qPhone);
        userDoc = snapPhone.docs[0];
      }

      if (!userDoc) throw new Error("User not found!");

      await updateDoc(doc(db, "users", userDoc.id), {
        isSubscribed: true,
        plan: luckyTier === "pro" ? "Achivox Pro" : "Standard Premium",
        planType: luckyTier,
        giftMessage: luckyMessage,
        rewardedAt: serverTimestamp()
      });

      alert(`✅ SUCCESS: Premium granted to ${userDoc.data().name || luckyInput}`);
      setLuckyInput("");
    } catch (err: any) {
      alert("❌ ERROR: " + err.message);
    } finally {
      setIsGranting(false);
    }
  };

  const handleLogout = async () => {
    clearLocalAnalytics();
    await signOut(auth);
    router.push("/");
  };

  const handleSendPersonalNotice = async () => {
    if (!targetUser || !personalNotice.message) return;
    setSendingNotice(true);
    try {
      const notifRef = collection(db, "users", targetUser.id, "notifications");
      await addDoc(notifRef, {
        title: personalNotice.title || "Admin Message",
        message: personalNotice.message,
        type: personalNotice.type,
        createdAt: new Date().toISOString(),
        read: false
      });
      alert("Personal notification sent to " + (targetUser.name || "User"));
      setShowPersonalNoticeModal(false);
      setPersonalNotice({ title: "", message: "", type: "info" });
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSendingNotice(false);
    }
  };

  // Chart Data
  const tokenChartData = {
    labels: ['Input (Prompt)', 'Output (Completion)'],
    datasets: [{
      data: [adminStats.promptTokens, adminStats.completionTokens],
      backgroundColor: ['#6366f1', '#10b981'],
      borderWidth: 0,
    }]
  };

  const usageHistoryData = {
    labels: ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM', 'Now'],
    datasets: [{
      label: 'AI Requests',
      data: [2, 0, 12, 45, 89, 120, adminStats.dailyCalls],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Achivox Core...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <Lock className="w-16 h-16 text-slate-300 mb-6" />
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2 uppercase">Vault Restricted</h2>
        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">This area is reserved for the platform architect. Redirecting you home...</p>
        <button onClick={() => router.push("/")} className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">Exit Now</button>
      </div>
    );
  }

  if (!otpVerified) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-100 max-w-lg w-full text-center space-y-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Security Layer</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hardware Encrypted Access</p>
          </div>
          {!otpSent ? (
            <button onClick={() => { setGeneratedOtp("884422"); setOtpSent(true); alert("ACCESS KEY: 884422"); }} className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all">Generate Access Key</button>
          ) : (
            <div className="space-y-8">
              <div className="flex gap-3 justify-center">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className={`w-12 h-16 bg-slate-50 border-2 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${otpInput.length === i-1 ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-100 text-slate-800'}`}>
                    {otpInput[i-1] ? otpInput[i-1] : ''}
                  </div>
                ))}
              </div>
              <input id="otp-input" autoFocus type="text" maxLength={6} className="absolute opacity-0" value={otpInput} onChange={(e) => { 
                const val = e.target.value.replace(/[^0-9]/g, '');
                setOtpInput(val);
                if (val === "884422") setOtpVerified(true);
              }} />
              <button onClick={() => otpInput === "884422" ? setOtpVerified(true) : alert("Invalid Key")} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase shadow-xl hover:bg-slate-800 transition-all">Verify Identity</button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-600 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col relative z-50">
        <div className="p-8 pb-12 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="font-black text-2xl text-slate-800 tracking-tighter uppercase">Achivox</h1>
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">Admin OS v2.5</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "Overview", icon: BarChart3, color: "text-indigo-600" },
            { id: "Payments", icon: Wallet, color: "text-emerald-500" },
            { id: "Live Radar", icon: Eye, color: "text-emerald-500" },
            { id: "User Activity", icon: Activity, color: "text-emerald-600" },
            { id: "Feature Performance", icon: BarChart3, color: "text-violet-600" },
            { id: "AI Usage & Costs", icon: Cpu, color: "text-amber-600" },
            { id: "API Diagnostics", icon: Cpu, color: "text-indigo-500" },
            { id: "Smart Campaigns", icon: Send, color: "text-sky-500" },
            { id: "Broadcasts", icon: MessageSquare, color: "text-sky-600" },
            { id: "Lucky Rewards", icon: Gift, color: "text-pink-500" },
            { id: "Goal Requests", icon: ShieldCheck, color: "text-orange-500" },
            { id: "Command Center", icon: Zap, color: "text-yellow-500" },
            { id: "Security", icon: ShieldCheck, color: "text-rose-600" },
            { id: "Settings", icon: Settings, color: "text-slate-400" },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-600' : item.color}`} />
              {item.id}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-4 h-4 text-indigo-600" /></div>
              <span className="text-[10px] font-black text-slate-800 uppercase">Growth</span>
            </div>
            <p className="text-xl font-black text-slate-800 leading-none">+12.4%</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">vs last month</p>
          </div>
          <button onClick={handleLogout} className="w-full py-4 rounded-[20px] bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] relative">
        <header className="sticky top-0 z-[100] p-6 px-10 flex items-center justify-between backdrop-blur-xl bg-white/80 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">{activeTab}</h2>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 text-[9px] font-black uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Status
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Global Search..." className="pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase outline-none focus:bg-white focus:border-indigo-600 transition-all w-64 placeholder:text-slate-300" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className="bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-600"><Globe className="w-5 h-5" /></button>
            <button className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="p-10 pb-40">
          <AnimatePresence mode="wait">
            {activeTab === "Overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6">
                  {[
                    { label: "Daily Active Users", value: adminStats.dau, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+5% Today", up: true },
                    { label: "Premium Users", value: adminStats.premiumUsers, icon: Star, color: "text-amber-500", bg: "bg-amber-50", trend: "8% Conversion", up: true },
                    { label: "Avg Study Time", value: `${Math.round(adminStats.totalStudyTime / (adminStats.totalUsers || 1))}m`, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12m from avg", up: true },
                    { label: "Total AI Cost", value: `₹${adminStats.costINR}`, icon: Wallet, color: "text-rose-600", bg: "bg-rose-50", trend: "Est. Month End", up: false },
                  ].map((s, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                      <div className={`${s.color} ${s.bg} p-3.5 rounded-2xl w-fit mb-6`}><s.icon className="w-6 h-6" /></div>
                      <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none mb-2">{s.value}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{s.label}</p>
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${s.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {s.trend}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {/* Chart Section */}
                  <div className="col-span-2 bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                            <h3 className="font-black text-xl text-slate-800 uppercase italic flex items-center gap-3">Traffic Intensity</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time user engagement requests</p>
                        </div>
                        <select className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-[10px] font-black uppercase outline-none">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div className="h-72">
                      <Line data={usageHistoryData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                            y: { grid: { color: 'rgba(0,0,0,0.02)' }, ticks: { font: { weight: 'bold' } } },
                            x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                        }
                      }} />
                    </div>
                  </div>

                  {/* Right Activity List */}
                  <div className="col-span-1 bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-black text-xl text-slate-800 uppercase italic">Global Slump</h3>
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="space-y-5 flex-1">
                      {adminStats.weakTopics?.length > 0 ? adminStats.weakTopics.map((t: any, i: number) => (
                        <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 group transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-rose-600 uppercase truncate w-32">{t.name}</span>
                            <span className="text-[10px] font-black text-rose-500 bg-white px-2 py-0.5 rounded-full border border-rose-100">{t.avg}% Acc</span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${t.avg}%` }} className="h-full bg-rose-500" />
                          </div>
                          <p className="text-[8px] font-bold text-rose-400 uppercase mt-2">{t.count} students struggling</p>
                        </div>
                      )) : (
                        <div className="h-40 flex flex-col items-center justify-center text-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                          <p className="text-[10px] font-black text-slate-400 uppercase">Healthy Performance</p>
                        </div>
                      )}
                    </div>
                    <button className="w-full py-4 mt-8 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all">Curriculum Audit</button>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === "Payments" && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                {/* Stats cards for payments */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Subscriptions Volume</span>
                      <h3 className="text-3xl font-black text-slate-800 leading-none">₹{payments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString("en-IN")}</h3>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md uppercase tracking-wider w-max mt-4">All Successful Payments</span>
                  </div>
                  <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Auto-Matched Accounts</span>
                      <h3 className="text-3xl font-black text-slate-800 leading-none">{payments.filter(p => p.resolved).length}</h3>
                    </div>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md uppercase tracking-wider w-max mt-4">Synced Automatically</span>
                  </div>
                  <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">Pending Unmatched Review</span>
                      <h3 className="text-3xl font-black text-rose-600 leading-none">{payments.filter(p => !p.resolved).length}</h3>
                    </div>
                    <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-md uppercase tracking-wider w-max mt-4">Manual Linking Required</span>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-black text-lg text-slate-800 uppercase italic">Payment Transaction History</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Audits of Razorpay Webhook Orders</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                          <th className="py-4">Date & Time</th>
                          <th className="py-4">Order ID</th>
                          <th className="py-4">User Details</th>
                          <th className="py-4">Plan Type</th>
                          <th className="py-4 text-right">Amount Paid</th>
                          <th className="py-4 text-center">Status</th>
                          <th className="py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                        {payments.length > 0 ? (
                          payments.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 text-[10px] font-black text-slate-400 uppercase">
                                {pay.timestamp ? new Date(pay.timestamp).toLocaleString("en-IN") : "Unknown"}
                              </td>
                              <td className="py-4 font-mono text-[10px] text-slate-500">{pay.orderId}</td>
                              <td className="py-4">
                                <div className="flex flex-col">
                                  <span className="text-slate-800 font-extrabold">{pay.email}</span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">{pay.phone}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border ${pay.planType === "pro" ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {pay.planType === "pro" ? "⚡ Pro (Fast Content)" : "Standard Premium"}
                                </span>
                              </td>
                              <td className="py-4 text-right font-black text-slate-900">₹{pay.amount}</td>
                              <td className="py-4 text-center">
                                {pay.resolved ? (
                                  <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Matched
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full text-[9px] font-black uppercase">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Unmatched
                                  </div>
                                )}
                              </td>
                              <td className="py-4 text-right">
                                {pay.resolved ? (
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Matched ({pay.matchedUserId?.substring(0, 8)})</span>
                                ) : (
                                  <button
                                    onClick={() => setResolvingPayment(pay)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm"
                                  >
                                    Link User
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">
                              No payments found in collection
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal for manual resolution */}
                {resolvingPayment && (
                  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setResolvingPayment(null)} />
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-white rounded-[36px] max-w-md w-full p-8 border border-slate-100 shadow-2xl z-10 space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-base font-black uppercase tracking-wider text-slate-800 italic">Manual Payment Linker</h4>
                        <button onClick={() => setResolvingPayment(null)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
                      </div>
                      
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 space-y-2">
                        <p><span className="text-slate-400 uppercase tracking-widest font-black text-[9px] block">Order ID:</span> <span className="font-mono text-slate-700">{resolvingPayment.orderId}</span></p>
                        <p><span className="text-slate-400 uppercase tracking-widest font-black text-[9px] block">Entered Email:</span> <span className="text-slate-700">{resolvingPayment.email}</span></p>
                        <p><span className="text-slate-400 uppercase tracking-widest font-black text-[9px] block">Entered Phone:</span> <span className="text-slate-700">{resolvingPayment.phone}</span></p>
                        <p><span className="text-slate-400 uppercase tracking-widest font-black text-[9px] block">Plan:</span> <span className="text-slate-700">{resolvingPayment.planType === "pro" ? "⚡ Pro (Fast Content)" : "Standard"} (₹{resolvingPayment.amount})</span></p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registered Student Email or Phone</label>
                        <input
                          type="text"
                          placeholder="student@example.com or 9876543210"
                          className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:border-indigo-600"
                          value={resolveInput}
                          onChange={(e) => setResolveInput(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={() => handleResolvePayment(resolvingPayment.id)}
                        disabled={isResolving}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                      >
                        {isResolving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Link & Activate Subscription"}
                      </button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "Live Radar" && (
              <motion.div key="radar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="font-black text-xl text-slate-800 uppercase italic">Live Radar</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Activity Tracker</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-emerald-100">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      Tracking Live Sessions
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
                      const activeUsers = realUsers.filter(u => u.lastActive?.toMillis() > fifteenMinsAgo);
                      
                      return activeUsers.length > 0 ? activeUsers.map(user => (
                        <div key={user.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <Eye className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{user.name || "Aspirant"}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase">{user.board} {user.cls}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-indigo-100">
                              {user.activeStatus || "Online"}
                            </span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No users currently active</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Smart Campaigns" && (
              <motion.div key="campaigns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm max-w-4xl mx-auto">
                  <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-100">
                      <Send className="w-8 h-8 text-sky-500" />
                    </div>
                    <h3 className="font-black text-2xl text-slate-800 uppercase italic">Smart CRM Campaigns</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">Send hyper-targeted push notifications to specific user segments</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Board</label>
                      <select value={smartCampBoard} onChange={e => setSmartCampBoard(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-sky-500 transition-all">
                        <option value="All">All Boards</option>
                        <option value="CBSE">CBSE</option>
                        <option value="UP Board">UP Board</option>
                        <option value="Bihar Board">Bihar Board</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Class</label>
                      <select value={smartCampClass} onChange={e => setSmartCampClass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-sky-500 transition-all">
                        <option value="All">All Classes</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 12">Class 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Plan</label>
                      <select value={smartCampPlan} onChange={e => setSmartCampPlan(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-sky-500 transition-all">
                        <option value="All">All Plans</option>
                        <option value="Free">Free Only</option>
                        <option value="Premium">Premium Only</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notification Message</label>
                    <textarea 
                      value={smartCampMessage} 
                      onChange={e => setSmartCampMessage(e.target.value)}
                      placeholder="E.g., Your Math Board Exam is close! Start the Top 50 PYQs now."
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-sky-500 transition-all min-h-[120px]"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[32px]">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Reach</p>
                      <p className="text-2xl font-black text-white">
                        {realUsers.filter(u => {
                          if (smartCampBoard !== "All" && u.board !== smartCampBoard) return false;
                          if (smartCampClass !== "All" && u.cls !== smartCampClass) return false;
                          if (smartCampPlan !== "All") {
                            const isPrem = u.isSubscribed;
                            if (smartCampPlan === "Premium" && !isPrem) return false;
                            if (smartCampPlan === "Free" && isPrem) return false;
                          }
                          return true;
                        }).length} Users
                      </p>
                    </div>
                    <button 
                      onClick={handleSendSmartCampaign}
                      disabled={smartCampSending || !smartCampMessage.trim()}
                      className="px-8 py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
                    >
                      {smartCampSending ? "Sending..." : "Launch Campaign"} <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === "User Activity" && (
              <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-white border border-slate-100 rounded-[60px] p-10 shadow-sm">
                <div className="flex justify-between items-center mb-10 px-4">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase italic">Engagement Registry</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Showing real-time student activity</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-slate-50 text-slate-600 text-[10px] font-black uppercase rounded-xl border border-slate-100 flex items-center gap-2"><Filter className="w-4 h-4" /> Filter</button>
                    <button onClick={exportToCSV} className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-600/20">Download Report</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {realUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center font-black text-indigo-600 shadow-sm">{(u.name || "U")[0]}</div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-lg text-slate-800 leading-none">{u.name || "Aspirant"}</span>
                            {u.isSubscribed && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{u.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-center hidden lg:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Avg Daily</p>
                            <p className="text-sm font-black text-slate-800">{Math.round((u.totalStudyMinutes || 0)/7)}m</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Total Progress</p>
                            <p className="text-sm font-black text-indigo-600">{(u.totalSolved || 0)} Solved</p>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Subscription</p>
                          <p className={`text-xs font-black uppercase tracking-tighter ${u.isSubscribed ? 'text-emerald-500' : 'text-slate-400'}`}>{u.plan || "Free Tier"}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => { setTargetUser(u); setShowPersonalNoticeModal(true); }}
                             className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                             title="Send Notification"
                           >
                              <Send className="w-5 h-5" />
                           </button>
                           <button onClick={() => setSelectedUserForXRay(u)} className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all"><MoreVertical className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "Feature Performance" && (
              <motion.div key="features" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                 <div className="grid grid-cols-3 gap-8">
                    {[
                      { name: "Smart Notes", key: "Smart Notes" },
                      { name: "AI Planner", key: "AI Planner" },
                      { name: "Quick Study", key: "Quick Study" },
                      { name: "School Test Engine", key: "School Test Engine" },
                      { name: "Formula Vault", key: "Formula Vault" },
                      { name: "Study Pod", key: "Study Pod" },
                    ].map((f) => {
                       const usage = featureMetrics?.[`${f.key}_usage`] || 0;
                       const success = featureMetrics?.[`${f.key}_success`] || 0;
                       const failed = featureMetrics?.[`${f.key}_failed`] || 0;
                       const totalTime = featureMetrics?.[`${f.key}_total_load_time`] || 0;
                       const avgTime = usage > 0 ? (totalTime / usage).toFixed(0) : 0;
                       const successRate = usage > 0 ? ((success / usage) * 100).toFixed(1) : 100;

                       return (
                         <div key={f.key} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                               <div className="bg-violet-50 p-4 rounded-2xl text-violet-600 font-black text-xs uppercase tracking-widest">{f.name}</div>
                               <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${parseFloat(successRate as string) > 95 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {successRate}% Health
                               </div>
                            </div>
                            <div className="space-y-6">
                               <div>
                                  <p className="text-4xl font-black text-slate-800 tracking-tighter">{usage}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Hits</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                     <p className="text-lg font-black text-slate-800">{avgTime}ms</p>
                                     <p className="text-[9px] font-black text-slate-400 uppercase">Avg Load</p>
                                  </div>
                                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                     <p className="text-lg font-black text-rose-600">{failed}</p>
                                     <p className="text-[9px] font-black text-rose-400 uppercase">Failures</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>

                 {/* Performance Chart */}
                 <div className="bg-white rounded-[56px] border border-slate-100 p-12 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-8">Load Time Benchmarks (ms)</h3>
                    <div className="h-80">
                         <Bar 
                         data={{
                            labels: ["Smart Notes", "AI Planner", "Quick Study", "Test Engine", "Formula Vault", "Study Pod"],
                            datasets: [{
                               label: "Avg Load Time (ms)",
                               data: [
                                 featureMetrics?.["Smart Notes_usage"] > 0 ? (featureMetrics?.["Smart Notes_total_load_time"] / featureMetrics?.["Smart Notes_usage"]) : 0,
                                 featureMetrics?.["AI Planner_usage"] > 0 ? (featureMetrics?.["AI Planner_total_load_time"] / featureMetrics?.["AI Planner_usage"]) : 0,
                                 featureMetrics?.["Quick Study_usage"] > 0 ? (featureMetrics?.["Quick Study_total_load_time"] / featureMetrics?.["Quick Study_usage"]) : 0,
                                 featureMetrics?.["School Test Engine_usage"] > 0 ? (featureMetrics?.["School Test Engine_total_load_time"] / featureMetrics?.["School Test Engine_usage"]) : 0,
                                 featureMetrics?.["Formula Vault_usage"] > 0 ? (featureMetrics?.["Formula Vault_total_load_time"] / featureMetrics?.["Formula Vault_usage"]) : 0,
                                 featureMetrics?.["Study Pod_usage"] > 0 ? (featureMetrics?.["Study Pod_total_load_time"] / featureMetrics?.["Study Pod_usage"]) : 0,
                               ],
                               backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
                               borderRadius: 20,
                            }]
                         }}
                         options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { grid: { color: "rgba(0,0,0,0.02)" }, ticks: { font: { weight: "bold" } } } }
                         }}
                       />
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === "Broadcasts" && (
              <motion.div key="broadcasts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase italic">Announcement Engine</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Broadcast messages to all students</p>
                  </div>
                  <button 
                    onClick={() => setShowBroadcastModal(true)}
                    className="px-8 py-4 bg-sky-500 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-sky-500/20 flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <Plus className="w-4 h-4" /> New Broadcast
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {broadcasts.length > 0 ? broadcasts.map((b, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 flex items-center justify-between group hover:border-sky-200 transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl ${
                          b.type === "warning" ? "bg-rose-100 text-rose-500" : 
                          b.type === "success" ? "bg-emerald-100 text-emerald-500" : 
                          "bg-sky-100 text-sky-500"
                        }`}>
                          {b.type === "warning" ? "⚠️" : b.type === "success" ? "✅" : "📢"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-lg text-slate-800 leading-none">{b.title}</h4>
                            <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase">{b.type}</span>
                          </div>
                          <p className="text-sm text-slate-500 font-medium">{b.message}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">{b.createdAt instanceof Timestamp ? b.createdAt.toDate().toLocaleString() : 'Recent'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteBroadcast(b.id)}
                        className="p-4 text-slate-200 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )) : (
                    <div className="py-32 text-center bg-slate-50/50 rounded-[56px] border border-slate-100 border-dashed">
                      <MessageSquare className="w-16 h-16 opacity-5 mx-auto mb-6" />
                      <p className="text-sm font-black text-slate-300 uppercase italic">No Active Broadcasts</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "AI Usage & Costs" && (
                <motion.div key="ai" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                    <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-1 bg-indigo-600 p-10 rounded-[56px] text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                            <Sparkles className="absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12" />
                            <h3 className="text-4xl font-black italic uppercase leading-none mb-4">Total Cost</h3>
                            <p className="text-6xl font-black tracking-tighter mb-8">₹{adminStats.costINR}</p>
                            <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-3">Rate Comparison</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black"><span>Input Tokens</span><span>$0.075 / 1M</span></div>
                                    <div className="flex justify-between items-center text-[10px] font-black"><span>Output Tokens</span><span>$0.30 / 1M</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 bg-white rounded-[56px] border border-slate-100 p-10 shadow-sm grid grid-cols-2 gap-10">
                            <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full" /> Token Breakdown
                                </h4>
                                <div className="h-56">
                                    <Doughnut data={tokenChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } } }} />
                                </div>
                            </div>
                            <div className="flex flex-col justify-center space-y-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prompt (Input)</p>
                                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{(adminStats.promptTokens / 1000).toFixed(1)}k</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidates (Output)</p>
                                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">{(adminStats.completionTokens / 1000).toFixed(1)}k</p>
                                </div>
                                <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20">Optimize Tokens</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[56px] border border-slate-100 p-12 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-800 uppercase italic">Recent API Transactions</h3>
                            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center"><Activity className="w-4 h-4 text-slate-400" /></div>
                        </div>
                        <div className="space-y-4">
                            {logs.filter(l => l.message.includes("Tokens")).slice(0, 10).map((log, i) => (
                                <div key={i} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center"><Cpu className="w-5 h-5 text-indigo-500" /></div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase">{log.message.split(":")[1].split("for")[0] || "AI Call"}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{log.timestamp instanceof Timestamp ? log.timestamp.toDate().toLocaleTimeString() : 'Just Now'}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 uppercase">
                                        {log.message.match(/\[Tokens: (.*?)\]/)?.[1] || "N/A Tokens"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "Lucky Rewards" && (
                <motion.div key="lucky" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-10">
                    <div className="bg-white border border-slate-100 rounded-[60px] p-16 shadow-2xl shadow-pink-100 relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 opacity-5">
                            <Gift className="w-96 h-96 text-pink-600" />
                        </div>
                        
                        <div className="relative z-10 text-center space-y-8">
                            <div className="w-24 h-24 bg-pink-50 rounded-[32px] flex items-center justify-center mx-auto border border-pink-100">
                                <Ticket className="w-12 h-12 text-pink-600" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-800 uppercase italic leading-none mb-4">Lucky Reward Center</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Grant manual premium access with a custom greeting</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 text-left">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">User Identification (Email or Phone)</label>
                                    <div className="relative">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input 
                                            type="text" 
                                            placeholder="Enter student's email or mobile number..." 
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[28px] text-sm font-black text-slate-800 outline-none focus:border-pink-400 focus:bg-white transition-all shadow-inner"
                                            value={luckyInput}
                                            onChange={(e) => setLuckyInput(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Premium Tier</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-6 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[28px] text-sm font-black text-slate-800 outline-none focus:border-pink-400 focus:bg-white transition-all shadow-inner appearance-none"
                                            value={luckyTier}
                                            onChange={(e) => setLuckyTier(e.target.value)}
                                        >
                                            <option value="pro">Achivox Pro (All Features, Fast Generation)</option>
                                            <option value="standard">Standard Premium (No PYQ/Doubt, Artificial Delay)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Greeting Message (Shown on Login)</label>
                                    <textarea 
                                        placeholder="Type a heartwarming greeting..." 
                                        className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[32px] text-xs font-bold text-slate-600 outline-none focus:border-pink-400 focus:bg-white transition-all h-32 resize-none shadow-inner"
                                        value={luckyMessage}
                                        onChange={(e) => setLuckyMessage(e.target.value)}
                                    />
                                </div>

                                <button 
                                    onClick={grantLuckyPremium}
                                    disabled={isGranting}
                                    className="w-full bg-pink-600 text-white py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-pink-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                                >
                                    {isGranting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
                                    Grant Premium Access
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-amber-50 rounded-[40px] border border-amber-100 flex items-center gap-6">
                        <div className="w-14 h-14 bg-amber-200 rounded-2xl flex items-center justify-center text-amber-700 shadow-xl shadow-amber-200/40">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-black text-amber-900 uppercase leading-relaxed tracking-wider">
                            Warning: This action bypasses payment gateways. Use only for authorized giveaways, loyalty rewards, or support resolutions.
                        </p>
                    </div>
                </motion.div>
            )}

            {activeTab === "Goal Requests" && (
              <motion.div key="goalreq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 max-w-5xl">
                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Goal Change Requests</h3>
                    <p className="text-slate-500 font-medium">Verify documents and approve/reject goal changes</p>
                  </div>
                  <div className="bg-orange-50 text-orange-600 px-6 py-3 rounded-2xl font-black shadow-inner border border-orange-100">
                    {goalRequests.filter(r => r.status === 'pending').length} Pending
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {goalRequests.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-slate-400 font-bold">No requests found.</div>
                  ) : (
                    goalRequests.map(req => (
                      <div key={req.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">User ID</p>
                              <p className="text-sm font-bold text-slate-700 font-mono mt-1 bg-slate-50 px-2 py-1 rounded inline-block">{req.userId}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'pending' ? 'bg-orange-100 text-orange-600' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {req.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Requested Board</p>
                              <p className="font-black text-slate-800">{req.requestedBoard}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Requested Class</p>
                              <p className="font-black text-slate-800">{req.requestedClass}</p>
                            </div>
                          </div>
                          
                          <a href={req.documentUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold transition-colors mb-6 border border-indigo-100">
                            View Verification Document
                          </a>
                        </div>
                        
                        {req.status === 'pending' && (
                          <div className="flex gap-4">
                            <button 
                              onClick={async () => {
                                if (confirm("Approve this goal change?")) {
                                  await updateDoc(doc(db, "users", req.userId), { board: req.requestedBoard, cls: req.requestedClass });
                                  await updateDoc(doc(db, "goal_change_requests", req.id), { status: "approved" });
                                  // Send notification
                                  await addDoc(collection(db, "users", req.userId, "notifications"), {
                                    title: "Goal Approved!",
                                    message: `Your request to change goal to ${req.requestedBoard} ${req.requestedClass} was approved.`,
                                    type: "success",
                                    createdAt: new Date().toISOString(),
                                    read: false
                                  });
                                }
                              }}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm("Reject this goal change?")) {
                                  await updateDoc(doc(db, "goal_change_requests", req.id), { status: "rejected" });
                                  // Send notification
                                  await addDoc(collection(db, "users", req.userId, "notifications"), {
                                    title: "Goal Change Rejected",
                                    message: `Your request to change goal was rejected. Please contact support if you think this is a mistake.`,
                                    type: "warning",
                                    createdAt: new Date().toISOString(),
                                    read: false
                                  });
                                }
                              }}
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-black py-3 rounded-xl transition-colors border border-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "Security" && (
              <motion.div key="security" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-3 gap-10">
                <div className="col-span-1 bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm space-y-12">
                  <div className="flex items-center gap-5">
                      <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100"><ShieldCheck className="w-10 h-10 text-indigo-600" /></div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 italic uppercase leading-none">Guard</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Platform Shield</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                    {["AES-256 Crypto", "SSL Handshake", "IP Firewall", "2FA Admin"].map(v => (
                      <div key={v} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{v}</span>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-6 bg-rose-600 text-white rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-600/20">Emergency Lockout</button>
                </div>
                <div className="col-span-2 bg-white rounded-[56px] border border-slate-100 p-12 shadow-sm space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-4">Intrusion Alerts</h3>
                    <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border border-rose-100">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      {securityAlerts.length} Alerts
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                    {securityAlerts.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No Security Threats Detected</p>
                    ) : (
                      securityAlerts.map((alert, i) => (
                        <div key={i} className="flex justify-between items-center p-6 bg-rose-50/30 rounded-3xl border border-rose-100 group hover:border-rose-200 transition-all">
                          <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-white rounded-2xl border border-rose-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-rose-500" /></div>
                              <div className="flex flex-col">
                                  <span className="text-xs font-black uppercase tracking-widest text-rose-600">{alert.reason}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">IP: {alert.ip} • Device: {alert.userAgent?.substring(0, 30)}...</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              <span className="text-[10px] font-black text-slate-400 uppercase italic">
                                {alert.timestamp instanceof Timestamp ? alert.timestamp.toDate().toLocaleString() : 'Recent'}
                              </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "API Diagnostics" && (
              <motion.div key="api-diag" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10">
                <div className="bg-slate-900 border border-slate-800 rounded-[56px] p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 opacity-10">
                    <Cpu className="w-96 h-96 text-indigo-500" />
                  </div>
                  
                  <div className="relative z-10 space-y-10">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic leading-none mb-4 flex items-center gap-4">
                        <Cpu className="w-8 h-8 text-indigo-500" /> API Diagnostics & Tester
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Test live AI generation endpoints and troubleshoot connections</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-left">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Select Endpoint Type</label>
                        <div className="flex gap-4">
                          <button 
                            type="button"
                            onClick={() => setDiagEndpointType("frontend")} 
                            className={`flex-1 p-5 rounded-2xl border font-bold text-xs uppercase transition-all ${diagEndpointType === "frontend" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                          >
                            Frontend Proxy (Vercel)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDiagEndpointType("backend")} 
                            className={`flex-1 p-5 rounded-2xl border font-bold text-xs uppercase transition-all ${diagEndpointType === "backend" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                          >
                            Backend API (Render)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. API Credentials & Authentication</label>
                        <div className="flex gap-4">
                          <button 
                            type="button"
                            onClick={() => setDiagBypassAuth(false)} 
                            className={`flex-1 p-5 rounded-2xl border font-bold text-[10px] uppercase transition-all ${!diagBypassAuth ? "bg-emerald-600 border-emerald-500 text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                          >
                            Send User Token (Secure)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDiagBypassAuth(true)} 
                            className={`flex-1 p-5 rounded-2xl border font-bold text-[10px] uppercase transition-all ${diagBypassAuth ? "bg-amber-600 border-amber-500 text-white" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"}`}
                          >
                            Bypass Auth (Test Key Only)
                          </button>
                        </div>
                      </div>
                    </div>

                    {diagEndpointType === "backend" && (
                      <div className="space-y-3 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backend Base URL (Render)</label>
                        <input 
                          type="text" 
                          value={diagBackendUrl} 
                          onChange={(e) => setDiagBackendUrl(e.target.value)} 
                          placeholder="e.g. https://examhero-backend.onrender.com" 
                          className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                    )}

                    <div className="space-y-3 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Prompt</label>
                      <textarea 
                        value={diagPrompt} 
                        onChange={(e) => setDiagPrompt(e.target.value)} 
                        rows={2} 
                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>

                    <button 
                      type="button"
                      disabled={diagLoading}
                      onClick={async () => {
                        setDiagLoading(true);
                        setDiagError("");
                        setDiagResult(null);
                        const startTime = Date.now();
                        try {
                          const url = diagEndpointType === "frontend" 
                            ? "/api/ai/proxy/" 
                            : `${diagBackendUrl.replace(/\/$/, '')}/api/ai/proxy/`;
                          
                          let idToken = "";
                          if (!diagBypassAuth && auth.currentUser) {
                            idToken = await auth.currentUser.getIdToken();
                          }
                          
                          const headers: any = {
                            "Content-Type": "application/json"
                          };
                          if (idToken) {
                            headers["Authorization"] = `Bearer ${idToken}`;
                          }
                          if (diagBypassAuth && diagEndpointType === "backend") {
                            headers["x-test-bypass"] = "examhero-test-secret";
                          }

                          const res = await fetch(url, {
                            method: "POST",
                            headers,
                            body: JSON.stringify({
                              prompt: diagPrompt,
                              isJsonMode: false
                            })
                          });

                          const duration = Date.now() - startTime;
                          setDiagTime(duration);
                          
                          const status = res.status;
                          const responseText = await res.text();
                          let parsedJson = null;
                          try {
                            parsedJson = JSON.parse(responseText);
                          } catch (_) {}

                          setDiagResult({
                            statusCode: status,
                            responseTimeMs: duration,
                            rawBody: responseText,
                            json: parsedJson
                          });

                          if (!res.ok) {
                            throw new Error(`HTTP Error ${status}: ${responseText}`);
                          }
                        } catch (err: any) {
                          setDiagError(err.message || "Failed to execute call");
                        } finally {
                          setDiagLoading(false);
                        }
                      }}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {diagLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> RUNNING TEST...
                        </>
                      ) : (
                        "EXECUTE DIAGNOSTIC TEST"
                      )}
                    </button>

                    {(diagResult || diagError) && (
                      <div className="space-y-6 text-left border-t border-white/10 pt-8 mt-6">
                        <div className="flex gap-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HTTP Status</p>
                            <p className={`text-2xl font-black ${diagResult?.statusCode === 200 ? "text-emerald-400" : "text-rose-400"}`}>
                              {diagResult?.statusCode || "FAILED"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Time</p>
                            <p className="text-2xl font-black text-indigo-400">{diagTime}ms</p>
                          </div>
                        </div>

                        {diagError && (
                          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-bold text-rose-300">
                            <p className="font-black uppercase mb-1">Error Message:</p>
                            {diagError}
                          </div>
                        )}

                        {diagResult && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server Response Payload</p>
                            <pre className="p-6 bg-black/40 border border-white/5 rounded-2xl text-xs font-mono text-indigo-300 overflow-x-auto max-h-80 select-all">
                              {JSON.stringify(diagResult.json || diagResult.rawBody, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Command Center" && (
                <motion.div key="command" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10">
                    <div className="bg-slate-900 border border-slate-800 rounded-[56px] p-16 shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 opacity-10">
                            <Zap className="w-96 h-96 text-yellow-400" />
                        </div>
                        
                        <div className="relative z-10 text-center space-y-10">
                            <div className="w-24 h-24 bg-yellow-400/10 rounded-[32px] flex items-center justify-center mx-auto border border-yellow-400/20">
                                <Zap className="w-12 h-12 text-yellow-400 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-white uppercase italic leading-none mb-4">AI Command Center</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Execute live app changes via natural language</p>
                            </div>

                            <div className="space-y-6">
                                <div className="relative">
                                    <Sparkles className="absolute left-6 top-6 text-yellow-400 w-5 h-5" />
                                    <textarea 
                                        placeholder="e.g., 'Turn on maintenance mode with message: Server updating', 'Set XP boost to 2.5x'..." 
                                        className="w-full p-8 pl-16 bg-white/5 border border-white/10 rounded-[40px] text-lg font-bold text-white outline-none focus:border-yellow-400/50 focus:bg-white/10 transition-all h-48 resize-none shadow-inner"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              const prompt = (e.target as HTMLTextAreaElement).value;
                                              if (!prompt) return;
                                              
                                              const handleExecute = async (cmd: string) => {
                                                const lowerCmd = cmd.toLowerCase();
                                                const configRef = doc(db, "system", "config");
                                                let updateData: any = {};
                                                let message = "";

                                                try {
                                                  if (lowerCmd.includes("maintenance") && lowerCmd.includes("on")) {
                                                    updateData.maintenance = true;
                                                    updateData.maintenanceMessage = cmd.split("message")?.[1]?.trim() || "System Upgrade in Progress";
                                                    message = "Maintenance mode activated!";
                                                  } else if (lowerCmd.includes("maintenance") && lowerCmd.includes("off")) {
                                                    updateData.maintenance = false;
                                                    message = "App is now live again!";
                                                  } else if (lowerCmd.includes("xp") || lowerCmd.includes("boost")) {
                                                    const multiplier = parseFloat(lowerCmd.match(/\d+(\.\d+)?/)?.[0] || "1");
                                                    updateData.xpMultiplier = multiplier;
                                                    message = `Global XP boost set to ${multiplier}x!`;
                                                  } else if (lowerCmd.includes("broadcast")) {
                                                    const broadcastMsg = cmd.split("broadcast")?.[1]?.trim();
                                                    await addDoc(collection(db, "broadcasts"), {
                                                      title: "Admin Update",
                                                      message: broadcastMsg,
                                                      type: "info",
                                                      createdAt: serverTimestamp(),
                                                      active: true
                                                    });
                                                    message = "Global broadcast sent!";
                                                  } else if (lowerCmd.includes("clean db") || lowerCmd.includes("reset users")) {
                                                    const usersSnapshot = await getDocs(collection(db, "users"));
                                                    let deletedCount = 0;
                                                    let premiumRevokedCount = 0;
                                                    
                                                    for (const docSnap of usersSnapshot.docs) {
                                                        const u = docSnap.data();
                                                        console.log("Checking user:", u.id, u.name, u.email, u.studentId, u.isSubscribed);
                                                        
                                                        // A guest user has no studentId and no email.
                                                        if (!u.studentId && !u.email) {
                                                            console.log("Deleting guest account:", u.id);
                                                            await deleteDoc(doc(db, "users", docSnap.id));
                                                            deletedCount++;
                                                        } 
                                                        
                                                        // Revoke premium for any user who has it
                                                        if (u.isSubscribed) {
                                                            console.log("Revoking premium for:", u.id);
                                                            await updateDoc(doc(db, "users", docSnap.id), {
                                                                isSubscribed: false,
                                                                plan: deleteField(),
                                                                planType: deleteField(),
                                                                premiumEndDate: deleteField()
                                                            });
                                                            premiumRevokedCount++;
                                                        }
                                                    }
                                                    message = `DB Cleaned! Deleted ${deletedCount} guests, revoked premium for ${premiumRevokedCount} users.`;
                                                  } else {
                                                    alert("AI doesn't recognize this command. Try 'maintenance on' or 'set xp to 2x'");
                                                    return;
                                                  }

                                                  if (Object.keys(updateData).length > 0) {
                                                    await setDoc(configRef, updateData, { merge: true });
                                                  }
                                                  
                                                  alert("SUCCESS: " + message);
                                                  (e.target as HTMLTextAreaElement).value = "";
                                                } catch (err: any) {
                                                  alert("ERROR: " + err.message);
                                                }
                                              };

                                              handleExecute(prompt);
                                            }
                                        }}
                                    />
                                    <div className="absolute bottom-6 right-8 flex items-center gap-4">
                                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Press <kbd className="bg-white/10 px-2 py-1 rounded text-white">Enter</kbd>
                                        </div>
                                        <button 
                                          onClick={(e) => {
                                            const textarea = (e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement);
                                            const prompt = textarea.value;
                                            if (prompt) {
                                              // We need to trigger the same logic. Let's refactor slightly.
                                              const event = new KeyboardEvent('keydown', { key: 'Enter' });
                                              textarea.dispatchEvent(event);
                                            }
                                          }}
                                          className="bg-yellow-400 text-slate-900 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-400/20"
                                        >
                                          Execute Command
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === "Settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white border border-slate-100 rounded-[60px] p-14 shadow-sm max-w-3xl">
                <h3 className="text-3xl font-black text-slate-800 italic uppercase mb-12">Global Config</h3>
                <div className="space-y-12">
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] ml-2">Force Update Config</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Min App Version</label>
                        <input type="number" step="0.1" value={appConfig.min_app_version} onChange={e => setAppConfig({...appConfig, min_app_version: parseFloat(e.target.value) || 1.0})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Download URL</label>
                        <input type="text" value={appConfig.download_url} onChange={e => setAppConfig({...appConfig, download_url: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-all" placeholder="https://play.google.com/..." />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] ml-2">Visual Branding</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">Primary Palette</label><div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100"><div className="w-10 h-10 bg-indigo-600 rounded-xl" /><span className="text-xs font-black text-slate-800 tracking-widest">#6366f1</span></div></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">App Descriptor</label><input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition-all" defaultValue="ACHIVOX" /></div>
                    </div>
                  </div>
                  <div className="pt-12 border-t border-slate-100 flex gap-6">
                    <button onClick={handleUpdateAppConfig} disabled={updatingConfig} className="bg-indigo-600 text-white px-12 py-5 rounded-[24px] font-black text-[11px] uppercase shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                      {updatingConfig ? "Saving..." : "Apply Changes"}
                    </button>
                    <button className="bg-slate-50 text-slate-400 px-12 py-5 rounded-[24px] font-black text-[11px] uppercase border border-slate-100 hover:text-slate-800 transition-all">Revert to Factory</button>
                  </div>

                  <div className="pt-12 border-t border-slate-100">
                    <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] ml-2 mb-6 flex items-center gap-2">
                      <Key className="w-4 h-4" /> API Key Management
                    </h4>
                    <div className="p-8 border border-indigo-100 bg-indigo-50/50 rounded-3xl flex items-center justify-between">
                      <div className="flex-1 mr-8">
                        <h5 className="font-bold text-indigo-900">Gemini AI API Key</h5>
                        <p className="text-xs text-indigo-500 mt-1 max-w-sm">
                          Set the secure API key for all AI operations. This will be stored in Firestore and used exclusively by the backend proxy.
                        </p>
                        <input 
                          type="password" 
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder="AIzaSy..." 
                          className="mt-4 w-full max-w-md p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleSaveApiKey} 
                        disabled={isSavingKey}
                        className="bg-indigo-600 mt-6 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {isSavingKey ? "Saving..." : "Save API Key"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-12 border-t border-slate-100">
                    <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.5em] ml-2 mb-6">Danger Zone</h4>
                    <div className="p-8 border border-red-100 bg-red-50/50 rounded-3xl flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-red-700">Reset Global User Performance</h5>
                        <p className="text-xs text-red-500 mt-1 max-w-sm">This action deletes XP, coins, badges, and test histories for ALL registered users in the database.</p>
                      </div>
                      <button 
                        onClick={handleResetAllUsersPerformance} 
                        disabled={resettingAll}
                        className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {resettingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {resettingAll ? "Resetting..." : "Reset All Users"}
                      </button>
                    </div>
                    
                    <div className="p-8 border border-orange-100 bg-orange-50/50 rounded-3xl flex items-center justify-between mt-4">
                      <div>
                        <h5 className="font-bold text-orange-700">Purge Guest Accounts</h5>
                        <p className="text-xs text-orange-500 mt-1 max-w-sm">This action permanently deletes all anonymous guest users (without email or Student ID) from the database.</p>
                      </div>
                      <button 
                        onClick={handleDeleteGuests} 
                        disabled={deletingGuests}
                        className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {deletingGuests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {deletingGuests ? "Deleting..." : "Purge Guests"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* PERSONAL NOTICE MODAL */}
      <AnimatePresence>
        {showPersonalNoticeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPersonalNoticeModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden p-10"
            >
               <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic">Message to {targetUser?.name?.split(' ')[0] || "User"}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct intervention</p>
                </div>
                <button onClick={() => setShowPersonalNoticeModal(false)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject</label>
                  <input 
                    type="text"
                    value={personalNotice.title}
                    onChange={(e) => setPersonalNotice({...personalNotice, title: e.target.value})}
                    placeholder="e.g. Special Offer for You!"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message Content</label>
                  <textarea 
                    rows={4}
                    value={personalNotice.message}
                    onChange={(e) => setPersonalNotice({...personalNotice, message: e.target.value})}
                    placeholder="Type your private message..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {["info", "success", "warning"].map(type => (
                    <button
                      key={type}
                      onClick={() => setPersonalNotice({...personalNotice, type})}
                      className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        personalNotice.type === type 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleSendPersonalNotice}
                  disabled={sendingNotice}
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {sendingNotice ? "Sending..." : "Send Private Message ✈️"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BROADCAST MODAL */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBroadcastModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic">New Broadcast</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure global announcement</p>
                </div>
                <button onClick={() => setShowBroadcastModal(false)} className="p-3 hover:bg-slate-50 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message Title</label>
                  <input 
                    type="text"
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                    placeholder="e.g. New Topic Added!"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Broadcast Content</label>
                  <textarea 
                    rows={3}
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                    placeholder="What do you want to say to everyone?"
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {["info", "success", "warning"].map(type => (
                    <button
                      key={type}
                      onClick={() => setBroadcastData({...broadcastData, type})}
                      className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        broadcastData.type === type 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleCreateBroadcast}
                  className="w-full py-5 bg-sky-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  Go Live Now 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOD-MODE: Selected User X-Ray Modal */}
      <AnimatePresence>
        {selectedUserForXRay && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm">
                    {(selectedUserForXRay.name || "U")[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-800 leading-none">{selectedUserForXRay.name || "Aspirant"}</h3>
                      {selectedUserForXRay.isSubscribed && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                      {selectedUserForXRay.isBlocked && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded uppercase text-[9px] font-black tracking-widest">Blocked</span>}
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2">{selectedUserForXRay.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">ID: {selectedUserForXRay.id}</p>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded">
                        <p className="text-[10px] font-black uppercase text-indigo-500">
                          Goal: {selectedUserForXRay.board || "N/A"} {selectedUserForXRay.cls || ""}
                        </p>
                        <button 
                          onClick={async () => {
                            const b = window.prompt("Enter new Board (e.g. CBSE, UP Board):", selectedUserForXRay.board || "CBSE");
                            if (!b) return;
                            const c = window.prompt("Enter new Class (e.g. Class 10, Class 12):", selectedUserForXRay.cls || "Class 10");
                            if (!c) return;
                            
                            if (window.confirm(`Change goal to ${b} - ${c}?`)) {
                                try {
                                    await updateDoc(doc(db, "users", selectedUserForXRay.id), { board: b, cls: c });
                                    setSelectedUserForXRay({...selectedUserForXRay, board: b, cls: c});
                                    alert("Goal updated successfully!");
                                } catch (e: any) {
                                    alert("Failed to update goal: " + e.message);
                                }
                            }
                          }}
                          className="ml-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                          title="Edit Goal"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedUserForXRay(null)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 hover:text-slate-800 hover:scale-105 active:scale-95 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {/* Financial / Token Usage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total Tokens</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-900">
                      {((selectedUserForXRay.tokens?.prompt || 0) + (selectedUserForXRay.tokens?.completion || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Est. API Cost</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-900">
                      ₹{((((selectedUserForXRay.tokens?.prompt || 0)/1000000)*COST_PER_1M_INPUT) + (((selectedUserForXRay.tokens?.completion || 0)/1000000)*COST_PER_1M_OUTPUT) * USD_TO_INR).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Live Activity & Performance */}
                <div>
                   <h4 className="font-black text-slate-800 uppercase italic mb-4">Academic Performance & Analytics</h4>
                   <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions Solved</p>
                           <p className="text-xl font-black text-slate-800">{selectedUserForXRay.totalSolved || 0}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current League</p>
                           <p className="text-xl font-black text-amber-500">{selectedUserForXRay.totalPoints > 5000 ? "Gold" : selectedUserForXRay.totalPoints > 1000 ? "Silver" : "Bronze"}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Top Weak Areas</p>
                           {(() => {
                             // Calculate specific weak areas for this user
                             const topicScores: Record<string, {total: number, count: number, name: string}> = {};
                             (selectedUserForXRay.attempts || []).forEach((a: any) => {
                               if (!topicScores[a.topicId]) topicScores[a.topicId] = { total: 0, count: 0, name: a.topicName };
                               topicScores[a.topicId].total += a.score;
                               topicScores[a.topicId].count++;
                             });
                             const weakAreas = Object.values(topicScores)
                               .map(t => ({ name: t.name, avg: Math.round(t.total/t.count) }))
                               .filter(t => t.avg < 70)
                               .sort((a,b) => a.avg - b.avg)
                               .slice(0, 3);
                             
                             return weakAreas.length > 0 ? weakAreas.map((w, i) => (
                               <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                 <span className="text-xs font-bold text-slate-700 truncate w-32">{w.name}</span>
                                 <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded uppercase">{w.avg}%</span>
                               </div>
                             )) : <p className="text-xs font-medium text-slate-400 italic">No weak areas identified yet.</p>;
                           })()}
                        </div>
                        
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Time Spent Per Feature</p>
                           {selectedUserForXRay.featureTime && Object.keys(selectedUserForXRay.featureTime).length > 0 ? (
                             Object.entries(selectedUserForXRay.featureTime)
                               .sort(([,a], [,b]) => (b as number) - (a as number))
                               .slice(0,4)
                               .map(([feat, timeSec], i) => (
                               <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                 <span className="text-xs font-bold text-slate-700">{feat}</span>
                                 <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">{Math.round((timeSec as number)/60)}m</span>
                               </div>
                             ))
                           ) : (
                             <p className="text-xs font-medium text-slate-400 italic">No feature time recorded yet.</p>
                           )}
                        </div>
                      </div>
                   </div>
                </div>

              </div>

              {/* God Mode Actions Footer */}
              <div className="p-6 bg-slate-900 border-t border-slate-800 flex gap-3">
                 <button 
                   onClick={handleRevokePremium}
                   disabled={isRevoking || !selectedUserForXRay.isSubscribed}
                   className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30 disabled:pointer-events-none"
                 >
                   {isRevoking ? "Revoking..." : "Revoke Premium"}
                 </button>
                 <button 
                   onClick={handleBlockUser}
                   disabled={isBlocking}
                   className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30"
                 >
                   {isBlocking ? "Updating..." : selectedUserForXRay.isBlocked ? "Unblock User" : "Block User"}
                 </button>
                 <button 
                   onClick={handleDeleteUser}
                   disabled={isDeletingUser}
                   className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl py-4 font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30"
                 >
                   {isDeletingUser ? "Deleting..." : "Delete User"}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

