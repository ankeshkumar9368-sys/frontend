"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useTheme } from "next-themes";
import { 
  Moon, Sun, BookOpen, User, Flame, Play, Target, Award, 
  ChevronRight, FileSpreadsheet, Activity, BookText, 
  GraduationCap, Building2, LogOut, TrendingUp, Trophy, 
  CheckCircle2, Zap, RotateCcw, Plus, Clock, Sparkles, X, Loader2, LayoutDashboard, Brain, Lock, Bell, BellOff, ArrowDownRight,
  Wrench, Info, Map, BarChart2, BarChart3, Star, Shield, Book, Gift, PartyPopper, Heart, Bookmark, Settings, Share2, ShieldCheck, UserPlus, Crown, PenTool
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp, collection, query, where, getDocs, orderBy, onSnapshot, limit, deleteField } from "firebase/firestore";
import AIDoubtSolver from "../components/AIDoubtSolver";
import { fetchContent, fetchQuestions, ContentItem, fetchDoubtResponse, generateAIPYQs, fetchChapterNotes, generateAIQuestions, getTestBankId, generateSingleReplacementQuestion } from "../lib/content";
import ExploreEngine from "../components/ExploreEngine";
import { trackTopicOpen, trackTopicClose, recordTestResult, updateStreak, getAISuggestion, AISuggestion, calculateWeightedAccuracy, checkAndIncrementUsage, clearLocalAnalytics } from "../lib/analytics";
const MockTestEngine = dynamic(() => import("../components/MockTestEngine"));
const SchoolTestEngine = dynamic(() => import("../components/SchoolTestEngine"));

const SubjectiveEngine = dynamic(() => import("../components/SubjectiveEngine"));
import AnalysisEngine from "../components/AnalysisEngine";
import SmartAvatar from "../components/SmartAvatar";
const RevisionVault = dynamic(() => import("../components/RevisionVault"));
const MasteryRoadmap = dynamic(() => import("../components/MasteryRoadmap"));
import { getMasterySequence } from "../lib/curriculum";
import SmartNotesViewer from "../components/SmartNotesViewer";
import TopperNotes from "../components/TopperNotes";
import Leaderboard from "../components/Leaderboard";
import StudyPlan from "../components/StudyPlan";
import NotificationSidebar, { AppNotification } from "../components/NotificationSidebar";
import StreakCelebration from "../components/StreakCelebration";
import ProgressDashboard from "../components/ProgressDashboard";
import DailyTasksTracker from "../components/DailyTasksTracker";
import SavedMCQs from "../components/SavedMCQs";
import SplashScreen from "../components/SplashScreen";

import WeaknessHeatmap from "../components/WeaknessHeatmap";
import QuickRevisionMode from "../components/QuickRevisionMode";
import GamificationHub from "../components/GamificationHub";
import WhyGotWrong from "../components/WhyGotWrong";
import PerformanceGraph from "../components/PerformanceGraph";
import SpacedRevisionSystem from "../components/SpacedRevisionSystem";
import SystemFlowModal from "../components/SystemFlowModal";
import LandingPage from "../components/LandingPage";
import OnboardingFlow from "../components/OnboardingFlow";
// Subscriptions removed
import GoalSelector from "../components/GoalSelector";
import AILoadingOverlay from "../components/AILoadingOverlay";
import { getWeakAreas } from "../lib/analytics";

const tapEffect = { 
  scale: 0.95, 
  transition: { type: "spring" as const, stiffness: 400, damping: 17 } 
};



import FlashcardForge from "../components/FlashcardForge";
import AIVoiceCoach from "../components/AIVoiceCoach";
const BattleQuiz = dynamic(() => import("../components/BattleQuiz"));
import ScanAndSolve from "../components/ScanAndSolve";
import SmartTimetable from "../components/SmartTimetable";
import FormulaVault from "../components/FormulaVault";
import RewardShop from "../components/RewardShop";
import ReferralCenter from "../components/ReferralCenter";
import { checkAndUnlockBadges, addXP, getLevel } from "../lib/gamification";
import BadgeUnlockOverlay from "../components/BadgeUnlockOverlay";
import ParentReportTemplate from "../components/ParentReportTemplate";
import StudyBuddy from "../components/StudyBuddy";

import QuickStudyCards from "../components/QuickStudyCards";
import SchoolProjectAssistant from "../components/SchoolProjectAssistant";
import { SUBJECTS_BY_BOARD_CLASS, SUBJECTS_BY_CLASS, getSubjects } from "../lib/curriculum";
import QuestLog from "../components/QuestLog";
import StudyPod from "../components/StudyPod";
import MockExamSimulator from "../components/MockExamSimulator";
import ForceUpdateModal from "../components/ForceUpdateModal";
const generateUniqueId = async ()=>{
    try {
        let attempts = 0;
        while(attempts < 10){
            const candidateId = `EXH-${Math.floor(100000 + Math.random() * 900000)}`;
            const q = query(collection(db, "users"), where("studentId", "==", candidateId));
            const snap = await getDocs(q);
            if (snap.empty) {
                return candidateId;
            }
            attempts++;
        }
    } catch (error) {
        console.warn("[Auth] Firestore query for unique student ID failed (likely permissions). Using fallback ID:", error);
    }
    return `EXH-${Math.floor(100000 + Math.random() * 900000)}`;
};


export default function Home() {
    const { theme, setTheme } = useTheme();
    // ... existing states ...
    const [mode, setMode] = useState("govt");
    const [activeTab, setActiveTab] = useState("Home");
    const [realUserData, setRealUserData] = useState(null);
    const isSubscribed = realUserData?.isSubscribed || false;
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [profiles, setProfiles] = useState([
        {
            id: 1,
            name: "Main Aspirant",
            icon: User,
            active: true
        }
    ]);
    const [activeTest, setActiveTest] = useState(null);
    const [showSavedMCQs, setShowSavedMCQs] = useState(false);
    const [activeNotes, setActiveNotes] = useState(null);
    const [selectionModal, setSelectionModal] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const setUserData = (val: any) => {
        if (val === null) {
            setRealUserData(null);
        } else if (typeof val === 'function') {
            setRealUserData((prev) => {
                const res = val(prev);
                return res;
            });
        } else {
            setRealUserData(val);
        }
    };
    const userData = realUserData;
    const [showDoubtSolver, setShowDoubtSolver] = useState(false);
    const [autoStartMic, setAutoStartMic] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsList, setNotificationsList] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [showSplash, setShowSplash] = useState(false);
    // New feature states
    const [showQuickRevision, setShowQuickRevision] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [showTopperNotes, setShowTopperNotes] = useState(false);
    const [topperNotesTopic, setTopperNotesTopic] = useState("");
    const [topperNotesSubject, setTopperNotesSubject] = useState("");
    const [quickRevisionTopic, setQuickRevisionTopic] = useState("");
    const [showGamification, setShowGamification] = useState(false);
    const [showFormulaVault, setShowFormulaVault] = useState(false);
    const [showSubjective, setShowSubjective] = useState(false);
    const [showQuestLog, setShowQuestLog] = useState(false);
    const [showTimetable, setShowTimetable] = useState(false);
    const [showStudyPods, setShowStudyPods] = useState(false);
    const [showWhyWrong, setShowWhyWrong] = useState(false);
    const [wrongQuestions, setWrongQuestions] = useState([]);
    const [showSystemFlow, setShowSystemFlow] = useState(false);
    const [xpPoints, setXpPoints] = useState(0);
    const [masterySequence, setMasterySequence] = useState([]);
    const [masteryLevel, setMasteryLevel] = useState(0);
    const [isAuth, setIsAuth] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [showGoalSelector, setShowGoalSelector] = useState(false);
    const [showRevisionVault, setShowRevisionVault] = useState(false);
    const [showQuickStudy, setShowQuickStudy] = useState(false);
    const [showProjectAssistant, setShowProjectAssistant] = useState(false);
    const [analyticsUpdateTrigger, setAnalyticsUpdateTrigger] = useState(0);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showBattle, setShowBattle] = useState(false);
    const [showScanSolve, setShowScanSolve] = useState(false);
    const [showRewardShop, setShowRewardShop] = useState(false);
    const [showReferralCenter, setShowReferralCenter] = useState(false);
    const [unlockedBadge, setUnlockedBadge] = useState(null);
    const [showRoadmap, setShowRoadmap] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [showAILoading, setShowAILoading] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const activeAICoreTaskRef = useRef(null);
    const [aiLoadingType, setAILoadingType] = useState("analysis");
    const [systemConfig, setSystemConfig] = useState<any>({
        maintenance: false,
        xpBoost: 1
    });
    const [showMockExam, setShowMockExam] = useState(false);
    const [forceUpdateUrl, setForceUpdateUrl] = useState(null);
    const [currentAppVersion, setCurrentAppVersion] = useState(1.0);
    null;
    null;
    const router = useRouter();
    // Performance optimizations
    const springConfig = {
        type: "spring",
        damping: 30,
        stiffness: 300,
        restDelta: 0.001
    };
    const fadeUp = {
        initial: {
            opacity: 0,
            y: 10
        },
        animate: {
            opacity: 1,
            y: 0
        },
        transition: {
            duration: 0.3
        }
    };
    const downloadParentReport = async ()=>{
        if (!userData) return;
        setIsGeneratingReport(true);
        try {
            const html2pdf = (await import("html2pdf.js")).default;
            const element = document.getElementById("parent-report-template");
            const opt: any = {
                margin: 0,
                filename: `ExamHero_Report_${userData.name.replace(/\s+/g, "_")}.pdf`,
                image: {
                    type: "jpeg",
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true
                },
                jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait"
                }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to generate report. Please try again.");
        } finally{
            setIsGeneratingReport(false);
        }
    };
    // SECURE AUTH: Listen for state changes
    useEffect(() => {
        let userUnsub = null;
        let statsUnsub = null;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuth(true);
                setShowSplash(true);
                try {
                    await updateStreak();
                    const userRef = doc(db, "users", user.uid);
                    if (userUnsub) userUnsub();
                    userUnsub = onSnapshot(userRef, async (userSnap) => {
                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            setUserData({ id: user.uid, ...data });
                            if (!user.isAnonymous && !data.studentId) {
                                const uniqueId = await generateUniqueId();
                                await updateDoc(userRef, { studentId: uniqueId });
                                setUserData((prev) => ({ ...prev, studentId: uniqueId }));
                            }
                            if (data?.giftMessage && !localStorage.getItem(`gift_seen_${user.uid}`)) {
                                setTimeout(() => setShowGiftModal(true), 2000);
                            }
                            const onboarded = localStorage.getItem("achivox_onboarded");
                            if (!onboarded) setShowOnboarding(true);
                        } else {
                            let uniqueId = null;
                            if (!user.isAnonymous) {
                                uniqueId = await generateUniqueId();
                            }
                            const initialData: any = {
                                id: user.uid,
                                name: user.displayName || "New Aspirant",
                                email: user.email,
                                totalSolved: 0,
                                correctAnswers: 0,
                                streak: 0,
                                rank: "N/A",
                                points: 0,
                                isSubscribed: false,
                                createdAt: serverTimestamp(),
                                attempts: []
                            };
                            if (uniqueId) {
                                initialData.studentId = uniqueId;
                            }
                            await setDoc(userRef, initialData);
                            setUserData(initialData);
                            setShowOnboarding(true);
                        }
                    }, (err) => {
                        console.warn("User profile sync failed:", err.message);
                    });

                    if (statsUnsub) statsUnsub();
                    statsUnsub = onSnapshot(doc(db, "user_stats", user.uid), (statsSnap) => {
                        if (statsSnap.exists()) {
                            const statsData = statsSnap.data();
                            const authoritativeXP = statsData.xp || 0;
                            setUserData((prev) => {
                                if (!prev) return prev;
                                if ((prev.points || 0) === authoritativeXP) return prev;
                                return { ...prev, points: authoritativeXP };
                            });
                        }
                    }, (err) => {
                        console.warn("User stats sync failed:", err.message);
                    });

                    setTimeout(() => {
                        setShowWelcome(true);
                    }, 800);
                } catch (error) {
                    console.error("Firestore Error:", error);
                    const saved = localStorage.getItem(`achivox_user_${user.uid}`);
                    if (saved) setUserData(JSON.parse(saved));
                }
            } else {
                setIsAuth(false);
                if (userUnsub) userUnsub();
                if (statsUnsub) statsUnsub();
            }
        });

        const bQuery = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"), limit(3));
        const unsubscribeB = onSnapshot(bQuery, (snapshot) => {
            setBroadcasts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
        }, (err) => {
            console.warn("Broadcasts sync failed:", err.message);
        });

        const configUnsub = onSnapshot(doc(db, "system_config", "app_settings"), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setSystemConfig(data);
            }
        }, (err) => {
            console.warn("System config sync failed:", err.message);
        });

        return () => {
            unsubscribe();
            if (userUnsub) userUnsub();
            if (statsUnsub) statsUnsub();
            unsubscribeB();
            configUnsub();
        };
    }, []);

    // Automatically force Goal Selection popup if user is logged in but goal is not set!
    useEffect(() => {
        if (userData && (!userData.board || !userData.cls)) {
            setShowGoalSelector(true);
        }
    }, [userData]);

    // 🛤️ GENERATE MASTERY SEQUENCE
    useEffect(() => {
        if (userData?.board && userData?.cls) {
            const seq = getMasterySequence(userData.board, userData.cls);
            setMasterySequence(seq as any);
            setMasteryLevel(userData.masteryLevel || 0);
        }
    }, [userData?.board, userData?.cls, userData?.masteryLevel]);

    // Save user data to localStorage
    useEffect(() => {
        if (userData && auth.currentUser) {
            localStorage.setItem(`achivox_user_${auth.currentUser.uid}`, JSON.stringify(userData));
        }
    }, [userData]);

    // Prefetch government/school syllabus categories
    useEffect(() => {
        const prefetch = async () => {
            await fetchContent("govt", null, "Categories");
            await fetchContent("school", null, "Boards");
        };
        prefetch();
    }, []);

    // Handle premium redirect success url
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("subscribed") === "true") {
            window.history.replaceState({}, document.title, "/");
        }
    }, []);

    // Notifications sync
    useEffect(() => {
        if (!userData?.id) return;
        const q = query(collection(db, "users", userData.id, "notifications"), orderBy("createdAt", "desc"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = [];
            snapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
            if (notifs.length > notificationsList.length && notificationsList.length > 0) {
                const newest = notifs[0];
                if (notificationsEnabled && "Notification" in window && !newest.read) {
                    new Notification(newest.title, { body: newest.message });
                }
            }
            setNotificationsList(notifs as any);
        }, (err) => {
            console.warn("Notifications sync failed:", err.message);
        });
        return () => unsubscribe();
    }, [userData?.id, notificationsEnabled, notificationsList.length]);
    const handleDoubtSolverClick = ()=>{
        setShowDoubtSolver(true);
    };
    const handleLogout = async ()=>{
        clearLocalAnalytics();
        await signOut(auth);
        router.push("/login");
    };
    const handleAddProfile = ()=>{
        const name = prompt("Enter sibling's name for new profile:");
        if (name) {
            const newProfile = {
                id: Date.now(),
                name,
                icon: User,
                active: false
            };
            setProfiles([
                ...profiles,
                newProfile
            ]);
        }
    };
    const handleAICoreAction = async (type: any, target: any, parentId: any = undefined, isMastery: any = false, overrideSubject: any = undefined)=>{
        setAILoadingType(type === "quiz" ? "test" : type);
        setShowAILoading(true);
        const taskId = Math.random().toString(36);
        activeAICoreTaskRef.current = taskId;
        try {
            if (type === "notes") {
                const classRaw = parentId?.match(/classes_class_(\d+)/)?.[1];
                const clsName = classRaw ? `Class ${classRaw}` : userData?.cls || "Class 12";
                const subRaw = parentId?.match(/subjects_([a-z0-9_]+?)(?:__|$)/)?.[1];
                const subName = overrideSubject || (subRaw ? subRaw.split("_").map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "General");
                const chapRaw = parentId?.match(/chapters_([a-z0-9_]+?)(?:__|$)/)?.[1];
                const chapName = chapRaw ? chapRaw.split("_").map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : target;
                // Instant local storage cache check
                if ("undefined" !== "undefined") {
                    const cacheKey = `achivox_notes_full_${subName || "gen"}_${chapName || "none"}_${target || "none"}_${userData?.id || "guest"}`.replace(/[^a-zA-Z0-9_]/g, "_");
                    try {
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) {
                            const parsed = JSON.parse(cached);
                            if (parsed && parsed.topics) {
                                setShowAILoading(false);
                                setActiveNotes({
                                    title: target,
                                    chapter: chapName,
                                    subjectContext: subName,
                                    classContext: clsName,
                                    mode: "full",
                                    data: parsed
                                });
                                return;
                            }
                        }
                    } catch (e) {
                        console.warn("Local cache check failed:", e);
                    }
                }
                const notes = await fetchChapterNotes(target, userData, "dual", subName, chapName);
                if (activeAICoreTaskRef.current !== taskId) return; // Task was cancelled
                if (notes) {
                    setActiveNotes({
                        title: target,
                        chapter: chapName,
                        subjectContext: subName,
                        classContext: clsName,
                        data: notes // Pass fetched data
                    });
                    trackTopicOpen({
                        topicId: target.toLowerCase().replace(/\s+/g, "-"),
                        topicName: target,
                        subject: subName,
                        chapter: chapName,
                        cls: clsName,
                        board: userData?.board || "CBSE"
                    });
                }
            } else if (type === "test" || type === "quiz") {
                // Dashboard Analysis for Test
                const weakAreas = getWeakAreas();
                let finalTarget = target;
                let subjectContext = "";
                if (target === "Daily Challenge" || !target) {
                    if (weakAreas.length > 0) {
                        finalTarget = weakAreas[0].topic;
                        subjectContext = weakAreas[0].subject;
                    } else {
                        finalTarget = "General Science & Logic"; // Default fallback
                    }
                } else if (parentId) {
                    // Check if parentId is actually a subject name (from MasteryRoadmap)
                    if (!parentId.includes("_")) {
                        subjectContext = parentId;
                    } else {
                        const subRaw = parentId?.match(/subjects_([a-z0-9_]+?)(?:__|$)/)?.[1];
                        subjectContext = subRaw ? subRaw.split("_").map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "General";
                    }
                }
                const questions = await fetchQuestions("full", finalTarget, userData, subjectContext);
                if (activeAICoreTaskRef.current !== taskId) return; // Task was cancelled
                if (questions && questions.length > 0) {
                    setActiveTest({
                        title: finalTarget,
                        subTitle: subjectContext ? `Context: ${subjectContext}` : "Practice Test",
                        questions,
                        isMastery,
                        subject: subjectContext || "General",
                        mode: mode
                    });
                } else {
                    alert("AI core was unable to generate questions for this specific topic. Please try a different topic or board.");
                }
            }
        } catch (err) {
            console.error("AI Action Error:", err);
            alert("AI Neural Core connection timeout. Please check your network.");
        } finally{
            setShowAILoading(false);
        }
    };
    const handleTestComplete = async (score, total, results)=>{
        setTestResult({
            score,
            total,
            results,
            title: activeTest.title
        });
        // 1. Record in Local Analytics
        recordTestResult({
            topicId: activeTest.title.toLowerCase().replace(/\s+/g, "-"),
            topicName: activeTest.title,
            subject: activeTest.subject || "General",
            cls: userData?.cls || "12th",
            score: Math.round(score / total * 100),
            totalQ: total,
            correctQ: score,
            timeTakenSec: 0 // Mock for now
        });
        if (activeTest?.isSchoolTest) {
            setActiveTest(null);
            return;
        }
        setTestResult({
            score,
            total,
            percentage: Math.round(score / total * 100),
            results
        });
        // 2. Update Firestore
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            // Right answers yield +5 XP, wrong answers deduct -2 XP
            const pointsEarned = score * 5 - (total - score) * 2;
            const updatePayload: any = {
                totalSolved: increment(total),
                correctAnswers: increment(score),
                testsCompleted: increment(1),
                attempts: arrayUnion({
                    title: activeTest.title,
                    score: Math.round(score / total * 100),
                    date: new Date().toISOString()
                }),
                overallAccuracy: calculateWeightedAccuracy(userData?.overallAccuracy || 70, score, total)
            };
            if (score === total && total > 0) {
                updatePayload.perfectTests = increment(1);
            }
            // 🚀 Advance Mastery Level if this was a mastery test and user passed (e.g. > 60%)
            if (activeTest.isMastery && score / total >= 0.6) {
                updatePayload.masteryLevel = increment(1);
                setMasteryLevel((prev)=>prev + 1);
            }
            await updateDoc(userRef, updatePayload);
            // Award/Deduct XP securely using addXP (clamped at 0 in user_stats, synced to users points)
            await addXP(auth.currentUser.uid, pointsEarned, `Mock Test: ${activeTest.title}`);
            setAnalyticsUpdateTrigger((prev)=>prev + 1);
            // Update local state to reflect changes immediately.
            setUserData((prev)=>({
                    ...prev,
                    totalSolved: (prev?.totalSolved || 0) + total,
                    correctAnswers: (prev?.correctAnswers || 0) + score,
                    testsCompleted: (prev?.testsCompleted || 0) + 1,
                    points: (prev?.points || 0) + pointsEarned
                }));
            // 3. Check for Badge Unlocks
            const userStatsSnap = await getDoc(doc(db, "user_stats", auth.currentUser.uid));
            const stats = userStatsSnap.exists() ? userStatsSnap.data() : {
                badges: []
            };
            const newlyUnlocked = await checkAndUnlockBadges(auth.currentUser.uid, userData, stats);
            if (newlyUnlocked.length > 0) {
                // Just show the first one for now
                const badgeId = newlyUnlocked[0];
                const badgeInfo = {
                    first_quiz: {
                        name: "First Step",
                        icon: "\uD83C\uDFAF"
                    },
                    streak_3: {
                        name: "On Fire!",
                        icon: "\uD83D\uDD25"
                    },
                    consistent: {
                        name: "Consistency King",
                        icon: "\uD83C\uDFC6"
                    },
                    perfect_score: {
                        name: "Perfect Mind",
                        icon: "⭐"
                    },
                    notes_5: {
                        name: "Scholar",
                        icon: "\uD83D\uDCDA"
                    },
                    ai_chat: {
                        name: "AI Whisperer",
                        icon: "\uD83E\uDD16"
                    },
                    xp_5000: {
                        name: "Glory Chaser",
                        icon: "\uD83D\uDC51"
                    },
                    mastery_5: {
                        name: "Concept Conqueror",
                        icon: "\uD83D\uDD2E"
                    },
                    solver_100: {
                        name: "Super Solver",
                        icon: "\uD83D\uDEE1️"
                    },
                    streak_15: {
                        name: "Unstoppable",
                        icon: "\uD83D\uDD25"
                    },
                    focus_10: {
                        name: "Focus Master",
                        icon: "⏱️"
                    },
                    doubts_25: {
                        name: "Doubt Buster",
                        icon: "\uD83E\uDDE0"
                    },
                    test_15: {
                        name: "Grand Champion",
                        icon: "\uD83C\uDF1F"
                    },
                    xp_10000: {
                        name: "Elite Learner",
                        icon: "\uD83C\uDF0C"
                    }
                }[badgeId] || {
                    name: "New Achievement",
                    icon: "\uD83C\uDFC5"
                };
                setUnlockedBadge(badgeInfo);
            }
        }
        setActiveTest(null);
    };
    const handleCorrectAnswer = async (questionText)=>{
        if (!userData?.id || !activeTest) return;
        // Fire and forget
        (async ()=>{
            const topicName = activeTest.title.replace("PYQs: ", "");
            const mode = activeTest.mode || (activeTest.title.includes("PYQs") ? "pyq" : "mock");
            const safeId = getTestBankId(mode, topicName, userData, activeTest.subTitle);
            const personalTestBankRef = doc(db, "users", userData.id, "test_banks", safeId);
            try {
                const newQ = await generateSingleReplacementQuestion(topicName, questionText, userData, activeTest.subTitle);
                if (newQ) {
                    const oldQObj = activeTest.questions.find((q)=>q.text === questionText);
                    if (oldQObj) {
                        await updateDoc(personalTestBankRef, {
                            questions: arrayRemove(oldQObj)
                        });
                        await updateDoc(personalTestBankRef, {
                            questions: arrayUnion(newQ)
                        });
                        console.log("Background replaced question:", questionText, "with:", newQ.text);
                    }
                }
            } catch (e) {
                console.error("Background replacement failed", e);
            }
        })();
    };
    const switchProfile = (id)=>{
        setProfiles(profiles.map((p)=>({
                ...p,
                active: p.id === id
            })));
        alert(`Switched to profile!`);
    };
    // Real-time dynamic performance analyzer for Glowing recommended prep cards
    const getGlowRecommendations = useCallback(()=>{
        const recommends = {
            revisionVault: false,
            flashcards: false,
            timetable: false,
            quickStudy: false,
            battle: false,
            scanSolve: false,
            roadmap: false
        };
        if (!userData) return recommends;
        const totalSolved = userData.totalSolved || 0;
        const correctAnswers = userData.correctAnswers || 0;
        const accuracy = totalSolved > 0 ? correctAnswers / totalSolved * 100 : 100;
        const attempts = userData.attempts || [];
        // 1. Low accuracy (< 70%) or high attempts with failures -> review mistakes
        if (accuracy < 70 || attempts.length > 0 && attempts.some((a)=>a.score < 60)) {
            recommends.revisionVault = true;
            recommends.flashcards = true;
        }
        // 2. Active but weak spots -> Skill roadmap
        if (totalSolved > 15 && accuracy < 85) {
            recommends.roadmap = true;
        }
        // 3. Low study engagement -> AI Timetable Planner
        if ((userData.streak || 0) === 0 || (userData.points || 0) < 1500) {
            recommends.timetable = true;
        }
        // 4. Brand new user -> Quick Study Swipe Cards & Battle Quiz
        if (totalSolved < 5) {
            recommends.quickStudy = true;
            recommends.battle = true;
        }
        // 5. Hard doubts solver -> Scan Camera
        if (attempts.length > 8) {
            recommends.scanSolve = true;
        }
        return recommends;
    }, [
        userData
    ]);
    const toggleNotifications = async ()=>{
        if (!notificationsEnabled) {
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    setNotificationsEnabled(true);
                    alert("Success! AI Study Reminders are now active. \uD83D\uDE80");
                } else {
                    alert("Please enable notifications in your browser settings to stay updated!");
                }
            }
        } else {
            setNotificationsEnabled(false);
        }
    };
    const sendTestNotification = ()=>{
        if (notificationsEnabled && "Notification" in window) {
            new Notification("\uD83D\uDE80 Achivox Study Alert", {
                body: "Time to crush your goals! Your daily streak is waiting for you.",
                icon: "/favicon.ico"
            });
        } else {
            alert("Please enable 'Study Reminders' first to test notifications!");
        }
    };
    if (forceUpdateUrl) {
        return /*#__PURE__*/ _jsx(ForceUpdateModal, {
            downloadUrl: forceUpdateUrl
        });
    }
    if (isAuth === false) {
        return /*#__PURE__*/ _jsx(LandingPage, {
            onLogin: ()=>router.push("/login")
        });
    }
    if (isAuth === null) {
        return /*#__PURE__*/ _jsx("div", {
            className: "min-h-screen bg-slate-950 flex items-center justify-center",
            children: /*#__PURE__*/ _jsx(Loader2, {
                className: "w-5 h-5 text-primary animate-spin"
            })
        });
    }
    if (systemConfig?.maintenance) {
        return /*#__PURE__*/ _jsxs("div", {
            className: "min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-6",
            children: [
                /*#__PURE__*/ _jsx("div", {
                    className: "w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center border-2 border-primary/20 shadow-2xl animate-pulse",
                    children: /*#__PURE__*/ _jsx(Wrench, {
                        className: "w-5 h-5 text-primary"
                    })
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "space-y-2",
                    children: [
                        /*#__PURE__*/ _jsx("h2", {
                            className: "text-2xl font-black text-white italic uppercase tracking-tighter",
                            children: "System Upgrade"
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-slate-400 font-medium max-w-xs mx-auto",
                            children: systemConfig?.maintenanceMessage || "We are improving ExamHero. Back in a few minutes!"
                        })
                    ]
                }),
                /*#__PURE__*/ _jsx("div", {
                    className: "glass-card px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-black text-primary uppercase tracking-widest",
                    children: "Live Update in Progress"
                })
            ]
        });
    }
    if (showSplash) {
        return /*#__PURE__*/ _jsx(SplashScreen, {
            onDone: ()=>setShowSplash(false)
        });
    }
    const hasGoldenFrame = userData?.redemptions?.some((r)=>r.itemName === "Golden Topper Frame");
    const hasMythicAura = userData?.redemptions?.some((r)=>r.itemName === "Mythic Profile Aura");
    const hasNeonTheme = userData?.redemptions?.some((r)=>r.itemName === "Secret App Theme");
    const hasVVIPFormulas = userData?.redemptions?.some((r)=>r.itemName === "VVIP Formula Bank");
    return /*#__PURE__*/ _jsxs(motion.div, {
        initial: {
            opacity: 0
        },
        animate: {
            opacity: 1
        },
        transition: {
            duration: 0.5
        },
        className: `mobile-container hide-scrollbar relative ${hasNeonTheme ? "theme-neon bg-slate-950 text-pink-400" : ""}`,
        children: [
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showOnboarding && /*#__PURE__*/ _jsx(OnboardingFlow, {
                    onComplete: ()=>{
                        setShowOnboarding(false);
                        localStorage.setItem("achivox_onboarded", "true");
                    }
                })
            }),

            /*#__PURE__*/ _jsxs("header", {
                className: "px-4 py-3 flex justify-between items-center shrink-0 z-50",
                style: {
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(24px)",
                    borderBottom: "1px solid rgba(99,102,241,0.1)"
                },
                children: [
                    /*#__PURE__*/ _jsxs(motion.div, {
                        className: "flex items-center gap-3",
                        initial: {
                            opacity: 0,
                            x: -20
                        },
                        animate: {
                            opacity: 1,
                            x: 0
                        },
                        transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        },
                        children: [
                            /*#__PURE__*/ _jsx(motion.div, {
                                className: "w-10 h-10 rounded-2xl overflow-hidden shadow-xl border-2 border-indigo-100 dark:border-indigo-900/50 shrink-0",
                                whileTap: {
                                    scale: 0.9,
                                    rotate: -5
                                },
                                style: {
                                    boxShadow: "0 4px 20px rgba(99,102,241,0.3)"
                                },
                                children: /*#__PURE__*/ _jsx(Image, {
                                    src: "/achivox-logo.png",
                                    alt: "Achivox",
                                    width: 40,
                                    height: 40,
                                    className: "object-cover w-full h-full",
                                    priority: true
                                })
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("h1", {
                                        className: "text-xl font-black tracking-tighter leading-none",
                                        style: {
                                            background: "linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent"
                                        },
                                        children: "ACHIVOX"
                                    }),
                                    /*#__PURE__*/ _jsx("p", {
                                        className: "text-[9px] font-black uppercase tracking-[0.25em]",
                                        style: {
                                            color: "#8b5cf6"
                                        },
                                        children: mode === "govt" ? "⚡ Gov Prep" : "\uD83C\uDF93 School Core"
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsxs(motion.div, {
                                className: "glass-icon-3d flex items-center gap-1.5 px-3 py-1.5 rounded-2xl cursor-pointer",
                                whileHover: {
                                    scale: 1.05,
                                    translateY: -2
                                },
                                whileTap: {
                                    scale: 0.95
                                },
                                animate: {
                                    scale: [
                                        1,
                                        1.03,
                                        1
                                    ]
                                },
                                transition: {
                                    duration: 2.5,
                                    repeat: Infinity
                                },
                                children: [
                                    /*#__PURE__*/ _jsx(Flame, {
                                        className: "w-4.5 h-4.5 text-orange-500",
                                        style: {
                                            filter: "drop-shadow(0 0 5px rgba(249,115,22,0.45))"
                                        }
                                    }),
                                    /*#__PURE__*/ _jsxs("span", {
                                        className: "text-[10px] font-black text-orange-600 dark:text-orange-400",
                                        children: [
                                            userData?.streak || 0,
                                            "d"
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs(motion.div, {
                                onClick: ()=>setShowNotifications(true),
                                className: "glass-icon-3d relative w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer",
                                whileHover: {
                                    scale: 1.1,
                                    translateY: -2
                                },
                                whileTap: {
                                    scale: 0.9
                                },
                                children: [
                                    /*#__PURE__*/ _jsx(Bell, {
                                        className: "w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400"
                                    }),
                                    notificationsList.filter((n)=>!n.read).length > 0 && /*#__PURE__*/ _jsx(motion.span, {
                                        className: "absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg",
                                        style: {
                                            background: "linear-gradient(135deg, #ef4444, #dc2626)"
                                        },
                                        initial: {
                                            scale: 0
                                        },
                                        animate: {
                                            scale: 1
                                        },
                                        transition: {
                                            type: "spring",
                                            stiffness: 500
                                        },
                                        children: notificationsList.filter((n)=>!n.read).length
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx(motion.button, {
                                whileHover: {
                                    scale: 1.1,
                                    translateY: -2
                                },
                                whileTap: {
                                    scale: 0.9
                                },
                                onClick: ()=>setShowReferralCenter(true),
                                className: "glass-icon-3d w-9 h-9 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400",
                                children: /*#__PURE__*/ _jsx(UserPlus, {
                                    className: "w-4 h-4"
                                })
                            }),
                            /*#__PURE__*/ _jsx(motion.button, {
                                whileHover: {
                                    scale: 1.1,
                                    translateY: -2
                                },
                                whileTap: {
                                    scale: 0.9
                                },
                                onClick: ()=>setShowRewardShop(true),
                                className: "glass-icon-3d w-9 h-9 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400",
                                children: /*#__PURE__*/ _jsx(Gift, {
                                    className: "w-4.5 h-4.5"
                                })
                            })
                        ]
                    })
                ]
            }),
            activeTab === "Home" && /*#__PURE__*/ _jsx("div", {
                className: "px-4 pt-3 pb-2 shrink-0 z-40",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "relative flex gap-1 p-1.5 rounded-2xl",
                    style: {
                        background: "rgba(99,102,241,0.06)",
                        border: "1px solid rgba(99,102,241,0.1)"
                    },
                    children: [
                        /*#__PURE__*/ _jsx(motion.div, {
                            className: "absolute inset-1.5 rounded-xl",
                            style: {
                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                boxShadow: "0 4px 20px rgba(99,102,241,0.35)"
                            },
                            animate: {
                                left: mode === "govt" ? "6px" : "50%",
                                width: mode === "govt" ? "calc(50% - 6px)" : "calc(50% - 6px)"
                            },
                            transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 35
                            }
                        }),
                        /*#__PURE__*/ _jsxs("button", {
                            onClick: ()=>setMode("govt"),
                            className: `flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 relative z-10 transition-colors duration-300 ${mode === "govt" ? "text-white" : "text-slate-500 dark:text-slate-400"}`,
                            children: [
                                /*#__PURE__*/ _jsx(Building2, {
                                    className: "w-4 h-4"
                                }),
                                " Gov Prep ",
                                /*#__PURE__*/ _jsx(Lock, {
                                    className: "w-3 h-3 opacity-60"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("button", {
                            onClick: ()=>setMode("school"),
                            className: `flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 relative z-10 transition-colors duration-300 ${mode === "school" ? "text-white" : "text-slate-500 dark:text-slate-400"}`,
                            children: [
                                /*#__PURE__*/ _jsx(GraduationCap, {
                                    className: "w-4 h-4"
                                }),
                                " School Prep"
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsxs("main", {
                className: "flex-1 overflow-y-auto",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "px-4 py-3 space-y-4 pb-28",
                        children: [
                            activeTab === "Home" && /*#__PURE__*/ _jsx(AnimatePresence, {
                                mode: "wait",
                                children: mode === "govt" ? /*#__PURE__*/ _jsxs(motion.div, {
                                    initial: {
                                        opacity: 0,
                                        y: 20
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0
                                    },
                                    exit: {
                                        opacity: 0,
                                        y: -20
                                    },
                                    className: "flex flex-col items-center justify-center py-20 text-center space-y-6",
                                    children: [
                                        /*#__PURE__*/ _jsx("div", {
                                            className: "w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center border-2 border-primary/20 shadow-2xl shadow-primary/10",
                                            children: /*#__PURE__*/ _jsx(Lock, {
                                                className: "w-5 h-5 text-primary"
                                            })
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ _jsx("h2", {
                                                    className: "text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase italic",
                                                    children: "Gov Prep Vault"
                                                }),
                                                /*#__PURE__*/ _jsx("p", {
                                                    className: "text-primary font-black text-xs uppercase tracking-[0.3em]",
                                                    children: "Launching Very Soon"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsx("p", {
                                            className: "text-slate-500 dark:text-slate-400 text-sm font-medium max-w-[280px] leading-relaxed",
                                            children: "We are currently indexing 50,000+ government exam questions."
                                        }),
                                        /*#__PURE__*/ _jsx(motion.div, {
                                            animate: {
                                                scale: [
                                                    1,
                                                    1.1,
                                                    1
                                                ]
                                            },
                                            transition: {
                                                duration: 2,
                                                repeat: Infinity
                                            },
                                            className: "bg-emerald-500/10 text-emerald-500 px-4 py-2.5 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest",
                                            children: "94% Completed"
                                        })
                                    ]
                                }, "govt-locked") : /*#__PURE__*/ _jsxs(motion.div, {
                                    initial: {
                                        opacity: 0
                                    },
                                    animate: {
                                        opacity: 1
                                    },
                                    exit: {
                                        opacity: 0
                                    },
                                    className: "space-y-4 overflow-x-hidden",
                                    children: [
                                        /*#__PURE__*/ _jsxs(motion.div, {
                                            className: "relative overflow-hidden rounded-[28px] p-5 mb-2",
                                            initial: {
                                                opacity: 0,
                                                y: 20,
                                                scale: 0.95
                                            },
                                            animate: {
                                                opacity: 1,
                                                y: 0,
                                                scale: 1
                                            },
                                            transition: {
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30,
                                                delay: 0.1
                                            },
                                            style: {
                                                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                                                boxShadow: "0 8px 40px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.1)"
                                            },
                                            children: [
                                                /*#__PURE__*/ _jsx("div", {
                                                    className: "absolute inset-0 overflow-hidden",
                                                    children: [
                                                        ...Array(6)
                                                    ].map((_, i)=>/*#__PURE__*/ _jsx(motion.div, {
                                                            className: "absolute rounded-full",
                                                            style: {
                                                                width: Math.random() * 60 + 20,
                                                                height: Math.random() * 60 + 20,
                                                                top: `${Math.random() * 100}%`,
                                                                left: `${Math.random() * 100}%`,
                                                                background: "rgba(255,255,255,0.06)"
                                                            },
                                                            animate: {
                                                                y: [
                                                                    0,
                                                                    -15,
                                                                    0
                                                                ],
                                                                scale: [
                                                                    1,
                                                                    1.1,
                                                                    1
                                                                ],
                                                                opacity: [
                                                                    0.4,
                                                                    0.8,
                                                                    0.4
                                                                ]
                                                            },
                                                            transition: {
                                                                duration: 3 + i * 0.5,
                                                                repeat: Infinity,
                                                                delay: i * 0.4,
                                                                ease: "easeInOut"
                                                            }
                                                        }, i))
                                                }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    className: "relative z-10 flex justify-between items-center",
                                                    children: [
                                                        /*#__PURE__*/ _jsxs("div", {
                                                            children: [
                                                                /*#__PURE__*/ _jsx(motion.p, {
                                                                    className: "text-white/70 text-[11px] font-black uppercase tracking-widest mb-1",
                                                                    initial: {
                                                                        opacity: 0
                                                                    },
                                                                    animate: {
                                                                        opacity: 1
                                                                    },
                                                                    transition: {
                                                                        delay: 0.3
                                                                    },
                                                                    children: "Daily Mastery Session ✨"
                                                                }),
                                                                /*#__PURE__*/ _jsxs(motion.h2, {
                                                                    className: "text-2xl font-black text-white leading-tight tracking-tight",
                                                                    initial: {
                                                                        opacity: 0,
                                                                        x: -10
                                                                    },
                                                                    animate: {
                                                                        opacity: 1,
                                                                        x: 0
                                                                    },
                                                                    transition: {
                                                                        delay: 0.2
                                                                    },
                                                                    children: [
                                                                        "Hi, ",
                                                                        auth.currentUser?.displayName?.split(" ")[0] || "Aspirant",
                                                                        "! \uD83D\uDC4B"
                                                                    ]
                                                                }),
                                                                /*#__PURE__*/ _jsx("div", {
                                                                    className: "flex items-center gap-2 mt-3",
                                                                    children: /*#__PURE__*/ _jsxs(motion.div, {
                                                                        onClick: ()=>setShowRewardShop(true),
                                                                        className: "flex items-center gap-2 px-3 py-1.5 rounded-2xl cursor-pointer",
                                                                        style: {
                                                                            background: "rgba(255,255,255,0.18)",
                                                                            backdropFilter: "blur(8px)"
                                                                        },
                                                                        whileTap: {
                                                                            scale: 0.95
                                                                        },
                                                                        whileHover: {
                                                                            scale: 1.03
                                                                        },
                                                                        children: [
                                                                            /*#__PURE__*/ _jsx(Zap, {
                                                                                className: "w-4 h-4 text-yellow-300 fill-yellow-300",
                                                                                style: {
                                                                                    filter: "drop-shadow(0 0 6px rgba(253,224,71,0.8))"
                                                                                }
                                                                            }),
                                                                            /*#__PURE__*/ _jsxs("span", {
                                                                                className: "text-sm font-black text-white",
                                                                                children: [
                                                                                    "Lvl ",
                                                                                    Math.floor((userData?.points || 0) / 500) + 1,
                                                                                    " • ",
                                                                                    (userData?.points || 0).toLocaleString(),
                                                                                    " XP"
                                                                                ]
                                                                            }),
                                                                            /*#__PURE__*/ _jsx(ChevronRight, {
                                                                                className: "w-3 h-3 text-white/60"
                                                                            })
                                                                        ]
                                                                    })
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ _jsx(StudyBuddy, {
                                                            points: userData?.points || 0,
                                                            streak: userData?.streak || 0
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "grid grid-cols-2 gap-3",
                                            children: [
                                                /*#__PURE__*/ _jsxs(motion.div, {
                                                    className: "feature-card p-4 cursor-pointer",
                                                    style: {
                                                        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
                                                        border: "1px solid rgba(99,102,241,0.15)"
                                                    },
                                                    initial: {
                                                        opacity: 0,
                                                        y: 15,
                                                        scale: 0.95
                                                    },
                                                    animate: {
                                                        opacity: 1,
                                                        y: 0,
                                                        scale: 1
                                                    },
                                                    transition: {
                                                        delay: 0.2
                                                    },
                                                    whileTap: {
                                                        scale: 0.96
                                                    },
                                                    onClick: ()=>setShowGoalSelector(true),
                                                    children: [
                                                        /*#__PURE__*/ _jsx(motion.div, {
                                                            className: "w-10 h-10 rounded-2xl flex items-center justify-center mb-3 icon-3d",
                                                            style: {
                                                                background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                                            },
                                                            whileHover: {
                                                                rotate: 5
                                                            },
                                                            children: /*#__PURE__*/ _jsx(Target, {
                                                                className: "w-5 h-5 text-white"
                                                            })
                                                        }),
                                                        /*#__PURE__*/ _jsx("p", {
                                                            className: "text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1",
                                                            children: "Your Goal"
                                                        }),
                                                        /*#__PURE__*/ _jsx("h2", {
                                                            className: "text-xs font-black text-foreground leading-tight",
                                                            children: userData?.board && userData?.cls ? `${userData.board}` : "Set Goal"
                                                        }),
                                                        userData?.cls && /*#__PURE__*/ _jsx("p", {
                                                            className: "text-[10px] text-indigo-500 font-bold mt-0.5",
                                                            children: userData.cls
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsxs(motion.div, {
                                                    className: "feature-card p-4",
                                                    style: {
                                                        background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))",
                                                        border: "1px solid rgba(16,185,129,0.15)"
                                                    },
                                                    initial: {
                                                        opacity: 0,
                                                        y: 15,
                                                        scale: 0.95
                                                    },
                                                    animate: {
                                                        opacity: 1,
                                                        y: 0,
                                                        scale: 1
                                                    },
                                                    transition: {
                                                        delay: 0.3
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ _jsxs("div", {
                                                            className: "flex items-center gap-2 mb-3",
                                                            children: [
                                                                /*#__PURE__*/ _jsx(motion.div, {
                                                                    className: "w-10 h-10 rounded-2xl flex items-center justify-center icon-3d",
                                                                    style: {
                                                                        background: "linear-gradient(135deg, #059669, #10b981)"
                                                                    },
                                                                    children: /*#__PURE__*/ _jsx(Trophy, {
                                                                        className: "w-5 h-5 text-white"
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ _jsxs("div", {
                                                                    className: "relative w-10 h-10 shrink-0",
                                                                    children: [
                                                                        /*#__PURE__*/ _jsxs("svg", {
                                                                            className: "w-full h-full -rotate-90",
                                                                            viewBox: "0 0 100 100",
                                                                            children: [
                                                                                /*#__PURE__*/ _jsx("circle", {
                                                                                    className: "text-slate-100 dark:text-slate-800",
                                                                                    strokeWidth: "10",
                                                                                    stroke: "currentColor",
                                                                                    fill: "transparent",
                                                                                    r: "40",
                                                                                    cx: "50",
                                                                                    cy: "50"
                                                                                }),
                                                                                /*#__PURE__*/ _jsx(motion.circle, {
                                                                                    className: "text-emerald-500",
                                                                                    strokeWidth: "10",
                                                                                    strokeDasharray: 2 * Math.PI * 40,
                                                                                    initial: {
                                                                                        strokeDashoffset: 2 * Math.PI * 40
                                                                                    },
                                                                                    animate: {
                                                                                        strokeDashoffset: 2 * Math.PI * 40 * (1 - (userData?.totalSolved > 0 ? 0.65 : 0))
                                                                                    },
                                                                                    transition: {
                                                                                        duration: 1.5,
                                                                                        delay: 0.8,
                                                                                        ease: "easeOut"
                                                                                    },
                                                                                    strokeLinecap: "round",
                                                                                    stroke: "currentColor",
                                                                                    fill: "transparent",
                                                                                    r: "40",
                                                                                    cx: "50",
                                                                                    cy: "50"
                                                                                })
                                                                            ]
                                                                        }),
                                                                        /*#__PURE__*/ _jsx("div", {
                                                                            className: "absolute inset-0 flex items-center justify-center",
                                                                            children: /*#__PURE__*/ _jsx("span", {
                                                                                className: "text-[9px] font-black text-emerald-600",
                                                                                children: userData?.totalSolved > 0 ? "65%" : "0%"
                                                                            })
                                                                        })
                                                                    ]
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ _jsx("p", {
                                                            className: "text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5",
                                                            children: "Weekly"
                                                        }),
                                                        /*#__PURE__*/ _jsx("h3", {
                                                            className: "text-xs font-black text-foreground",
                                                            children: "Mastery \uD83D\uDCAA"
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        (()=>{
                                            const recs = getGlowRecommendations();
                                            return /*#__PURE__*/ _jsxs("div", {
                                                className: "flex gap-3 overflow-x-auto py-2 px-1 hide-scrollbar shrink-0",
                                                children: [
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: handleDoubtSolverClick,
                                                        className: "flex flex-col items-center gap-1.5 min-w-[72px]",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 bg-indigo-50 dark:bg-indigo-950/20 rounded-[22px] flex items-center justify-center text-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm icon-3d",
                                                                children: "\uD83E\uDD16"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider",
                                                                children: "AI Doubt"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: ()=>setShowQuickStudy(true),
                                                        className: "flex flex-col items-center gap-1.5 min-w-[72px]",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: `w-5 h-5 bg-amber-50 dark:bg-amber-950/20 rounded-[22px] flex items-center justify-center text-2xl border shadow-sm icon-3d ${recs.quickStudy ? "glow-amber animate-pulse border-amber-300" : "border-amber-100 dark:border-amber-900/40"}`,
                                                                children: "\uD83C\uDFB4"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider",
                                                                children: "Quick Study"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: ()=>setShowTimetable(true),
                                                        className: "flex flex-col items-center gap-1.5 min-w-[72px]",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: `w-5 h-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-[22px] flex items-center justify-center text-2xl border shadow-sm icon-3d ${recs.timetable ? "glow-emerald animate-pulse border-emerald-300" : "border-emerald-100 dark:border-emerald-900/40"}`,
                                                                children: "\uD83D\uDDD3️"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider",
                                                                children: "AI Planner"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: ()=>setShowScanSolve(true),
                                                        className: "flex flex-col items-center gap-1.5 min-w-[72px]",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: `w-5 h-5 bg-sky-50 dark:bg-sky-950/20 rounded-[22px] flex items-center justify-center text-2xl border shadow-sm icon-3d ${recs.scanSolve ? "glow-primary animate-pulse border-sky-300" : "border-sky-100 dark:border-sky-900/40"}`,
                                                                children: "\uD83D\uDCF8"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider",
                                                                children: "AI Vision"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: ()=>{
                                                            if (!isSubscribed) return alert("\uD83D\uDD12 Revision Vault is a Premium feature!");
                                                            setShowRevisionVault(true);
                                                        },
                                                        className: "flex flex-col items-center gap-1.5 min-w-[72px]",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: `w-5 h-5 bg-rose-50 dark:bg-rose-950/20 rounded-[22px] flex items-center justify-center text-2xl border shadow-sm icon-3d ${recs.revisionVault ? "glow-rose animate-pulse border-rose-300" : "border-rose-100 dark:border-rose-900/40"}`,
                                                                children: "\uD83E\uDDE0"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider",
                                                                children: "Mistakes"
                                                            })
                                                        ]
                                                    })
                                                ]
                                            });
                                        })(),
                                        /*#__PURE__*/ _jsxs(motion.button, {
                                            whileTap: {
                                                scale: 0.97
                                            },
                                            onClick: ()=>setShowRoadmap(true),
                                            className: "w-full bg-slate-900 dark:bg-slate-800 p-4 rounded-[32px] border border-white/5 shadow-xl flex items-center justify-between group hover:border-primary/50 transition-all text-white relative overflow-hidden glow-primary",
                                            children: [
                                                /*#__PURE__*/ _jsx("div", {
                                                    className: "absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                                }),
                                                /*#__PURE__*/ _jsxs("div", {
                                                    className: "flex items-center gap-4 relative z-10",
                                                    children: [
                                                        /*#__PURE__*/ _jsx("div", {
                                                            className: "w-5 h-5 bg-indigo-500/30 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform icon-3d",
                                                            children: "\uD83D\uDEE4️"
                                                        }),
                                                        /*#__PURE__*/ _jsxs("div", {
                                                            className: "text-left",
                                                            children: [
                                                                /*#__PURE__*/ _jsxs("div", {
                                                                    className: "flex items-center gap-2 mb-1",
                                                                    children: [
                                                                        /*#__PURE__*/ _jsx("h3", {
                                                                            className: "font-black text-sm uppercase tracking-tight",
                                                                            children: "Mastery Roadmap"
                                                                        }),
                                                                        !isSubscribed && /*#__PURE__*/ _jsx("div", {
                                                                            className: "bg-amber-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase",
                                                                            children: "Trial"
                                                                        })
                                                                    ]
                                                                }),
                                                                /*#__PURE__*/ _jsxs("p", {
                                                                    className: "text-[10px] text-white/50 font-bold uppercase tracking-widest leading-none",
                                                                    children: [
                                                                        "Mixed Subjects • Level ",
                                                                        masteryLevel + 1
                                                                    ]
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsx("div", {
                                                    className: "w-5 h-5 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all",
                                                    children: /*#__PURE__*/ _jsx(ChevronRight, {
                                                        className: "w-5 h-5"
                                                    })
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsx(ExploreEngine, {
                                            mode: mode,
                                            isSubscribed: isSubscribed,
                                            userData: userData,
                                            onFinalSelect: async (item)=>{
                                                const isPYQ = item.name.toLowerCase().includes("pyq") || item.name.toLowerCase().includes("previous year");
                                                if (isPYQ) {
                                                    try {
                                                        setLoadingQuestions(true);
                                                        // Clean parent ID (e.g., topics_laws_of_motion -> Laws Of Motion)
                                                        const topicName = item.parentId?.split("_").pop()?.replace(/-/g, " ") || "this topic";
                                                        const formattedTopic = topicName.charAt(0).toUpperCase() + topicName.slice(1);
                                                        const pyqs = await generateAIPYQs(formattedTopic, userData);
                                                        if (pyqs && pyqs.length > 0) {
                                                            setActiveTest({
                                                                title: `PYQs: ${formattedTopic}`,
                                                                questions: pyqs,
                                                                mode: "pyq"
                                                            });
                                                        } else {
                                                            alert("AI failed to generate PYQs. Please try again.");
                                                        }
                                                    } catch (e) {
                                                        console.error("PYQ Error:", e);
                                                        alert("Failed to connect to AI server. Please try again.");
                                                    } finally{
                                                        setLoadingQuestions(false);
                                                    }
                                                } else {
                                                    setSelectionModal(item);
                                                }
                                            }
                                        })
                                    ]
                                }, "home-content")
                            }),
                            activeTab === "Tests" && /*#__PURE__*/ _jsxs(motion.div, {
                                initial: {
                                    opacity: 0,
                                    y: 10
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-1 shadow-inner",
                                        children: [
                                            /*#__PURE__*/ _jsx("button", {
                                                onClick: ()=>setMode("govt"),
                                                className: `flex-1 py-2.5 text-sm font-bold rounded-xl ${mode === "govt" ? "bg-white dark:bg-slate-700 shadow-md text-primary" : "text-slate-500"}`,
                                                children: "Gov Tests"
                                            }),
                                            /*#__PURE__*/ _jsx("button", {
                                                onClick: ()=>setMode("school"),
                                                className: `flex-1 py-2.5 text-sm font-bold rounded-xl ${mode === "school" ? "bg-white dark:bg-slate-700 shadow-md text-primary" : "text-slate-500"}`,
                                                children: "School Tests"
                                            })
                                        ]
                                    }),
                                    mode === "school" ? /*#__PURE__*/ _jsxs("div", {
                                        className: "space-y-6",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex gap-4",
                                                children: [
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: ()=>alert("Mock Exam Simulator is currently locked and will be available soon!"),
                                                        className: "flex-1 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 relative overflow-hidden group opacity-75",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500",
                                                                children: /*#__PURE__*/ _jsx(Lock, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("h3", {
                                                                        className: "text-sm font-black text-slate-700 dark:text-slate-300",
                                                                        children: "Daily Mock"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-500",
                                                                        children: "Unlocks soon"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs(motion.button, {
                                                        whileTap: {
                                                            scale: 0.95
                                                        },
                                                        onClick: ()=>setShowSubjective(true),
                                                        className: "flex-1 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 p-4 rounded-3xl border border-purple-500/30 flex items-center gap-3 relative overflow-hidden transition-all",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400",
                                                                children: /*#__PURE__*/ _jsx(PenTool, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("h3", {
                                                                        className: "text-sm font-black text-purple-600 dark:text-purple-400",
                                                                        children: "Subjective"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-500",
                                                                        children: "Learn & Write"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx(SchoolTestEngine, {
                                                isSubscribed: isSubscribed,
                                                userData: userData
                                            })
                                        ]
                                    }) : /*#__PURE__*/ _jsxs("div", {
                                        className: "py-24 text-center glass-card rounded-[40px] border border-border shadow-inner",
                                        children: [
                                            /*#__PURE__*/ _jsx(FileSpreadsheet, {
                                                className: "w-5 h-5 opacity-30 mx-auto mb-6"
                                            }),
                                            /*#__PURE__*/ _jsx("h2", {
                                                className: "text-2xl font-black tracking-tighter text-slate-500 uppercase",
                                                children: "Govt Test Series"
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest",
                                                children: "Coming Soon"
                                            })
                                        ]
                                    })
                                ]
                            }),
                            activeTab === "Rank" && /*#__PURE__*/ _jsx(motion.div, {
                                initial: {
                                    opacity: 0,
                                    scale: 0.98
                                },
                                animate: {
                                    opacity: 1,
                                    scale: 1
                                },
                                children: /*#__PURE__*/ _jsx(Leaderboard, {
                                    userData: userData
                                })
                            }),
                            activeTab === "Tools" && /*#__PURE__*/ _jsxs(motion.div, {
                                initial: {
                                    opacity: 0,
                                    y: 10
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ _jsx("h2", {
                                                className: "text-2xl font-black tracking-tight leading-none",
                                                children: "AI Tools"
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "text-sm text-slate-500 dark:text-slate-400 font-medium",
                                                children: "Power features for smarter study"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs(motion.button, {
                                        whileTap: {
                                            scale: 0.97
                                        },
                                        onClick: ()=>setShowSystemFlow(true),
                                        className: "w-full bg-gradient-to-r from-primary via-violet-600 to-indigo-700 text-white p-5 rounded-[28px] flex items-center justify-between shadow-xl shadow-primary/20",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "w-5 h-5 bg-white/20 rounded-2xl flex items-center justify-center text-2xl",
                                                        children: "\uD83D\uDD04"
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "text-left",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "font-black text-sm",
                                                                children: "How ExamHero AI Works"
                                                            }),
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-white/70 text-xs font-semibold",
                                                                children: "See the 8-step learning loop"
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx(Info, {
                                                className: "w-5 h-5 text-white/70"
                                            })
                                        ]
                                    }),
                                    (()=>{
                                        const recs = getGlowRecommendations();
                                        const groups = [
                                            {
                                                title: "Smart Study & Notes",
                                                emoji: "📚",
                                                tools: [
                                                    {
                                                        id: "topperNotes",
                                                        title: "Topper Notes",
                                                        subtitle: "5-Min Revision Sheets",
                                                        emoji: "✍️",
                                                        bgClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/20",
                                                        isGlowing: true,
                                                        glowClass: "glow-amber",
                                                        onClick: ()=>setShowTopperNotes(true)
                                                    },
                                                    {
                                                        id: "flashcards",
                                                        title: "AI Flashcards",
                                                        subtitle: "Flashcard Forge",
                                                        emoji: "⚡",
                                                        bgClass: "bg-orange-100 text-orange-500 dark:bg-orange-950/20",
                                                        isGlowing: recs.flashcards,
                                                        glowClass: "glow-amber",
                                                        onClick: ()=>setShowFlashcards(true)
                                                    },
                                                    {
                                                        id: "formula",
                                                        title: "Smart Formulas",
                                                        subtitle: "Formula Vault",
                                                        emoji: "📓",
                                                        bgClass: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/20",
                                                        isGlowing: false,
                                                        glowClass: "",
                                                        onClick: ()=>setShowFormulaVault(true)
                                                    },
                                                    {
                                                        id: "scanSolve",
                                                        title: "AI Vision Solver",
                                                        subtitle: "Scan & Solve",
                                                        emoji: "📸",
                                                        bgClass: "bg-sky-100 text-sky-500 dark:bg-sky-950/20",
                                                        isGlowing: recs.scanSolve,
                                                        glowClass: "glow-primary",
                                                        onClick: ()=>setShowScanSolve(true)
                                                    }
                                                ]
                                            },
                                            {
                                                title: "Practice & Revision",
                                                emoji: "🎯",
                                                tools: [
                                                    {
                                                        id: "revisionVault",
                                                        title: "Mistake Bank",
                                                        subtitle: "Revision Vault",
                                                        emoji: "🧠",
                                                        bgClass: "bg-amber-100 text-amber-500 dark:bg-amber-950/20",
                                                        isGlowing: recs.revisionVault,
                                                        glowClass: "glow-amber",
                                                        onClick: ()=>{
                                                            if (!isSubscribed) return alert("🔒 Revision Vault is a Premium feature!");
                                                            setShowRevisionVault(true);
                                                        }
                                                    },
                                                    {
                                                        id: "quickStudy",
                                                        title: "Quick Study",
                                                        subtitle: "Flashcard Swipe",
                                                        emoji: "🎴",
                                                        bgClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/20",
                                                        isGlowing: recs.quickStudy,
                                                        glowClass: "glow-amber",
                                                        onClick: ()=>setShowQuickStudy(true)
                                                    },
                                                    {
                                                        id: "battle",
                                                        title: "Battle Arena",
                                                        subtitle: "Multiplayer Quiz",
                                                        emoji: "⚔️",
                                                        bgClass: "bg-red-100 text-red-500 dark:bg-red-950/20",
                                                        isGlowing: recs.battle,
                                                        glowClass: "glow-rose",
                                                        onClick: ()=>setShowBattle(true)
                                                    },
                                                    {
                                                        id: "roadmap",
                                                        title: "Skill Journey",
                                                        subtitle: "Mastery Roadmap",
                                                        emoji: "🗺️",
                                                        bgClass: "bg-indigo-100 text-indigo-500 dark:bg-indigo-950/20",
                                                        isGlowing: recs.roadmap,
                                                        glowClass: "glow-primary",
                                                        onClick: ()=>setShowRoadmap(true)
                                                    }
                                                ]
                                            },
                                            {
                                                title: "Plan & Progress",
                                                emoji: "📅",
                                                tools: [
                                                    {
                                                        id: "timetable",
                                                        title: "AI Planner",
                                                        subtitle: "Smart Timetable",
                                                        emoji: "🗓️",
                                                        bgClass: "bg-emerald-100 text-emerald-500 dark:bg-emerald-950/20",
                                                        isGlowing: recs.timetable,
                                                        glowClass: "glow-emerald",
                                                        onClick: ()=>setShowTimetable(true)
                                                    },
                                                    {
                                                        id: "quests",
                                                        title: "Daily Quests",
                                                        subtitle: "XP Loot Box",
                                                        emoji: "🎁",
                                                        bgClass: "bg-rose-100 text-rose-500 dark:bg-rose-950/20",
                                                        isGlowing: false,
                                                        glowClass: "",
                                                        onClick: ()=>setShowQuestLog(true)
                                                    },
                                                    {
                                                        id: "studyPods",
                                                        title: "Grind Pods",
                                                        subtitle: "Live Study Pods",
                                                        emoji: "🧘‍♂️",
                                                        bgClass: "bg-teal-100 text-teal-600 dark:bg-teal-950/20",
                                                        isGlowing: false,
                                                        glowClass: "",
                                                        onClick: ()=>setShowStudyPods(true)
                                                    },
                                                    {
                                                        id: "achievements",
                                                        title: "Achievements",
                                                        subtitle: "XP & Badges",
                                                        emoji: "🏆",
                                                        bgClass: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/20",
                                                        isGlowing: false,
                                                        glowClass: "",
                                                        onClick: ()=>setShowGamification(true)
                                                    },
                                                    {
                                                        id: "analysis",
                                                        title: "Deep Analysis",
                                                        subtitle: "Skill Metrics",
                                                        emoji: "📊",
                                                        bgClass: "bg-violet-100 text-violet-500 dark:bg-violet-950/20",
                                                        isGlowing: false,
                                                        glowClass: "",
                                                        onClick: ()=>setShowAnalysis(true)
                                                    }
                                                ]
                                            }
                                        ];
                                        return /*#__PURE__*/ _jsx("div", {
                                            className: "space-y-8",
                                            children: groups.map((group)=>/*#__PURE__*/ _jsxs("div", {
                                                className: "space-y-4",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-base font-black",
                                                                children: group.emoji
                                                            }),
                                                            /*#__PURE__*/ _jsx("h3", {
                                                                className: "text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]",
                                                                children: group.title
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "grid grid-cols-2 gap-4",
                                                        children: group.tools.map((tool)=>/*#__PURE__*/ _jsxs(motion.button, {
                                                                whileHover: {
                                                                    scale: 1.03,
                                                                    y: -2
                                                                },
                                                                whileTap: {
                                                                    scale: 0.97
                                                                },
                                                                onClick: tool.onClick,
                                                                className: `relative overflow-hidden rounded-[24px] p-4 bg-white dark:bg-slate-900 border border-border shadow-md flex flex-col items-start gap-3 text-left transition-all ${tool.isGlowing ? `${tool.glowClass} animate-pulse scale-[1.01] border-red-500/40` : "hover:border-primary/40"}`,
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("div", {
                                                                        className: `w-8 h-8 rounded-xl flex items-center justify-center text-xl icon-3d ${tool.bgClass}`,
                                                                        children: tool.emoji
                                                                    }),
                                                                    /*#__PURE__*/ _jsxs("div", {
                                                                        children: [
                                                                            /*#__PURE__*/ _jsx("h4", {
                                                                                className: "font-black text-xs sm:text-sm text-foreground tracking-tight leading-tight mb-1",
                                                                                children: tool.title
                                                                            }),
                                                                            /*#__PURE__*/ _jsx("p", {
                                                                                className: "text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none",
                                                                                children: tool.subtitle
                                                                            })
                                                                        ]
                                                                    }),
                                                                    tool.isGlowing && /*#__PURE__*/ _jsxs("div", {
                                                                        className: "absolute top-2.5 right-2.5 flex items-center gap-1",
                                                                        children: [
                                                                            /*#__PURE__*/ _jsx("span", {
                                                                                className: "h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"
                                                                            }),
                                                                            /*#__PURE__*/ _jsx("span", {
                                                                                className: "text-[7px] font-black uppercase text-rose-500 tracking-wider",
                                                                                children: "Focus"
                                                                            })
                                                                        ]
                                                                    })
                                                                ]
                                                            }, tool.id))
                                                    })
                                                ]
                                            }, group.title))
                                        });
                                    })(),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "relative",
                                        children: /*#__PURE__*/ _jsx(PerformanceGraph, {
                                            isSubscribed: isSubscribed,
                                            refreshTrigger: analyticsUpdateTrigger
                                        })
                                    }),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "relative",
                                        children: /*#__PURE__*/ _jsx(SpacedRevisionSystem, {
                                            isSubscribed: isSubscribed,
                                            refreshTrigger: analyticsUpdateTrigger,
                                            onRevise: (topic, subject)=>handleAICoreAction("notes", topic, undefined, false, subject)
                                        })
                                    })
                                ]
                            }),
                            activeTab === "Analysis" && /*#__PURE__*/ _jsxs(motion.div, {
                                initial: {
                                    opacity: 0,
                                    y: 10
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "space-y-1",
                                        children: [
                                            /*#__PURE__*/ _jsx("h2", {
                                                className: "text-2xl font-black tracking-tight leading-none",
                                                children: "My Analytics"
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "text-sm text-slate-500 dark:text-slate-400 font-medium",
                                                children: "Real-time performance insights"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx(ProgressDashboard, {}),
                                    /*#__PURE__*/ _jsxs(motion.div, {
                                        whileHover: {
                                            y: -4
                                        },
                                        className: "bg-indigo-600 rounded-[32px] p-4 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden",
                                        children: [
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "absolute top-0 right-0 p-4 opacity-10",
                                                children: /*#__PURE__*/ _jsx(Share2, {
                                                    className: "w-24 h-24 rotate-12"
                                                })
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "relative z-10 flex flex-col gap-4",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 bg-white/20 rounded-xl flex items-center justify-center",
                                                                children: /*#__PURE__*/ _jsx(ShieldCheck, {
                                                                    className: "w-5 h-5 text-white"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsx("h3", {
                                                                className: "font-black text-lg",
                                                                children: "Parent's Insight Link"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "text-indigo-100 text-xs font-medium leading-relaxed",
                                                        children: "Share a verified academic report with your parents. It includes your predicted marks and AI feedback."
                                                    }),
                                                    /*#__PURE__*/ _jsxs("button", {
                                                        onClick: async ()=>{
                                                            if (!auth.currentUser) return;
                                                            const shareUrl = `${window.location.origin}/parent?id=${auth.currentUser.uid}`;
                                                            if (navigator.share) {
                                                                try {
                                                                    await navigator.share({
                                                                        title: "ExamHero Academic Report",
                                                                        text: `Hey! Check out my AI-predicted exam report on ExamHero.`,
                                                                        url: shareUrl
                                                                    });
                                                                } catch (err) {
                                                                    console.log("Share cancelled");
                                                                }
                                                            } else {
                                                                navigator.clipboard.writeText(shareUrl);
                                                                alert("Link copied to clipboard! Share it with your parents.");
                                                            }
                                                        },
                                                        className: "bg-white text-indigo-600 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ _jsx(Share2, {
                                                                className: "w-5 h-5"
                                                            }),
                                                            " Share Report with Parents"
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            activeTab === "Profile" && /*#__PURE__*/ _jsxs(motion.div, {
                                initial: {
                                    opacity: 0,
                                    y: 20
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                className: "space-y-6 pb-10",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "relative overflow-hidden rounded-[40px] bg-slate-950 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10",
                                        children: [
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "absolute -right-10 -top-10 h-64 w-64 rounded-full bg-gradient-to-br from-primary to-purple-600 opacity-40 blur-[80px]"
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-30 blur-[90px]"
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "absolute top-20 left-20 h-40 w-40 rounded-full bg-pink-500/20 blur-[60px]"
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "relative z-10 flex flex-col items-center py-4",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "relative mb-6",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "absolute -inset-4 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-white/30"
                                                            }),
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "absolute -inset-6 animate-[spin_12s_linear_infinite_reverse] rounded-full border border-dotted border-white/10"
                                                            }),
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: `relative h-32 w-32 rounded-full p-1 shadow-2xl ${hasGoldenFrame ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.5)]" : "bg-gradient-to-tr from-indigo-500 to-purple-500"} ${hasMythicAura ? "animate-[pulse_2s_ease-in-out_infinite] ring-4 ring-indigo-500/50 ring-offset-4 ring-offset-slate-950" : ""}`,
                                                                children: /*#__PURE__*/ _jsx("div", {
                                                                    className: "h-full w-full overflow-hidden rounded-full bg-slate-900 border-2 border-slate-900",
                                                                    children: auth.currentUser?.photoURL ? /*#__PURE__*/ _jsx("img", {
                                                                        src: auth.currentUser.photoURL,
                                                                        alt: "Profile",
                                                                        className: "h-full w-full object-cover"
                                                                    }) : /*#__PURE__*/ _jsx("div", {
                                                                        className: "flex h-full w-full items-center justify-center bg-slate-800 text-2xl font-black text-white/50",
                                                                        children: auth.currentUser?.displayName?.[0] || "S"
                                                                    })
                                                                })
                                                            }),
                                                            isSubscribed && /*#__PURE__*/ _jsx("div", {
                                                                className: "absolute bottom-0 right-0 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-2 text-slate-900 shadow-xl border-2 border-slate-900",
                                                                children: /*#__PURE__*/ _jsx(Crown, {
                                                                    className: "h-5 w-5"
                                                                })
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx("h2", {
                                                        className: "text-2xl font-black tracking-tight drop-shadow-md",
                                                        children: auth.currentUser?.displayName || "Academic Achiever"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "mt-1 text-sm font-bold text-white/60",
                                                        children: auth.currentUser?.email || "student@examhero.ai"
                                                    }),
                                                    userData?.studentId ? /*#__PURE__*/ _jsxs("div", {
                                                        className: "mt-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl px-4 py-1 flex items-center gap-1.5 shadow-sm",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[10px] font-black text-amber-400 uppercase tracking-widest",
                                                                children: "Student ID:"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[10px] font-black text-white",
                                                                children: userData.studentId
                                                            })
                                                        ]
                                                    }) : auth.currentUser?.isAnonymous ? /*#__PURE__*/ _jsx("div", {
                                                        className: "mt-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-1 flex items-center gap-1.5 shadow-sm",
                                                        children: /*#__PURE__*/ _jsx("span", {
                                                            className: "text-[10px] font-black text-slate-400 uppercase tracking-widest",
                                                            children: "Guest Account"
                                                        })
                                                    }) : null,
                                                    isSubscribed && userData?.premiumEndDate && /*#__PURE__*/ _jsxs("div", {
                                                        className: "mt-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl px-4 py-1 flex items-center gap-1.5 shadow-sm",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[10px] font-black text-indigo-300 uppercase tracking-widest",
                                                                children: "Premium Valid Till:"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[10px] font-black text-white",
                                                                children: new Date(userData.premiumEndDate).toLocaleDateString()
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-inner",
                                                        children: [
                                                            /*#__PURE__*/ _jsx(Target, {
                                                                className: "w-5 h-5 text-emerald-400"
                                                            }),
                                                            /*#__PURE__*/ _jsxs("span", {
                                                                className: "text-xs font-black uppercase tracking-widest text-emerald-50",
                                                                children: [
                                                                    userData?.board || "CBSE",
                                                                    " • ",
                                                                    userData?.cls || "Class 10"
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "mt-8 flex w-full max-w-xs gap-3",
                                                        children: [
                                                            /*#__PURE__*/ _jsxs("button", {
                                                                onClick: handleLogout,
                                                                className: "flex-1 flex justify-center items-center gap-2 rounded-2xl glass-card px-4 py-3 text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all hover:bg-red-500/20 hover:text-red-400 border border-white/10",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx(LogOut, {
                                                                        className: "h-4 w-4"
                                                                    }),
                                                                    " Exit"
                                                                ]
                                                            }),
                                                            /*#__PURE__*/ _jsxs("button", {
                                                                onClick: ()=>setShowGoalSelector(true),
                                                                className: "flex-[2] flex justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/20 border border-white/10",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx(Settings, {
                                                                        className: "h-4 w-4"
                                                                    }),
                                                                    " Edit Goal"
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    isSubscribed && userData?.planType === "standard" && /*#__PURE__*/ _jsxs(motion.div, {
                                        initial: { scale: 0.95, opacity: 0 },
                                        animate: { scale: 1, opacity: 1 },
                                        className: "relative overflow-hidden rounded-[32px] bg-gradient-to-r from-amber-500/20 via-purple-600/15 to-indigo-500/20 p-6 border-2 border-amber-500/40 shadow-[0_15px_35px_rgba(245,158,11,0.15)] flex flex-col md:flex-row items-center justify-between gap-4",
                                        children: [
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "absolute top-0 right-0 p-4 opacity-10 pointer-events-none",
                                                children: /*#__PURE__*/ _jsx(Zap, {
                                                    className: "w-24 h-24 text-amber-400 fill-amber-400"
                                                })
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex flex-col items-center md:items-start text-center md:text-left z-10",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-2 mb-1.5",
                                                        children: [
                                                            /*#__PURE__*/ _jsx(Crown, {
                                                                className: "h-4 w-4 text-amber-400 fill-amber-400"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[10px] font-black text-amber-400 uppercase tracking-widest",
                                                                children: "Standard Upgrade"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx("h3", {
                                                        className: "text-sm md:text-base font-black text-white",
                                                        children: "Unlock Fast Content Generation \u26A1"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "text-[11px] text-slate-300 font-bold mt-1",
                                                        children: "Get 10x faster AI responses, board-level PYQs, and priority processing."
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-center gap-4 z-10 shrink-0",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "text-right",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider",
                                                                children: "One-time upgrade"
                                                            }),
                                                            /*#__PURE__*/ _jsx("span", {
                                                                className: "text-xl font-black text-amber-400 tracking-tight",
                                                                children: "\u20B9499"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx("button", {
                                                        onClick: () => {
                                                            router.push("/subscription");
                                                        },
                                                        className: "bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black px-5 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-[0_8px_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95",
                                                        children: "Upgrade"
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "grid grid-cols-3 gap-3",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-5 border border-orange-500/20 shadow-sm flex flex-col justify-between h-36",
                                                children: [
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "absolute -right-4 -bottom-4 opacity-10",
                                                        children: /*#__PURE__*/ _jsx(Flame, {
                                                            className: "w-24 h-24 text-orange-500"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center backdrop-blur-md",
                                                        children: /*#__PURE__*/ _jsx(Flame, {
                                                            className: "h-4 w-4"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsxs("p", {
                                                                className: "text-2xl font-black text-slate-800 dark:text-white",
                                                                children: [
                                                                    userData?.streak || 0,
                                                                    /*#__PURE__*/ _jsx("span", {
                                                                        className: "text-sm text-slate-400",
                                                                        children: "d"
                                                                    })
                                                                ]
                                                            }),
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-[9px] font-black text-slate-500 uppercase tracking-widest",
                                                                children: "Streak"
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "relative overflow-hidden rounded-[32px] bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-5 border border-yellow-500/20 shadow-sm flex flex-col justify-between h-36",
                                                children: [
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "absolute -right-4 -bottom-4 opacity-10",
                                                        children: /*#__PURE__*/ _jsx(Zap, {
                                                            className: "w-24 h-24 text-yellow-500"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center backdrop-blur-md",
                                                        children: /*#__PURE__*/ _jsx(Zap, {
                                                            className: "h-4 w-4"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-2xl font-black text-slate-800 dark:text-white",
                                                                children: (userData?.points || 0).toLocaleString()
                                                            }),
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-[9px] font-black text-slate-500 uppercase tracking-widest",
                                                                children: "Total XP"
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 border border-emerald-500/20 shadow-sm flex flex-col justify-between h-36",
                                                children: [
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "absolute -right-4 -bottom-4 opacity-10",
                                                        children: /*#__PURE__*/ _jsx(Award, {
                                                            className: "w-24 h-24 text-emerald-500"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center backdrop-blur-md",
                                                        children: /*#__PURE__*/ _jsx(Award, {
                                                            className: "h-4 w-4"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-2xl font-black text-slate-800 dark:text-white",
                                                                children: getLevel(userData?.points || 0)
                                                            }),
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-[9px] font-black text-slate-500 uppercase tracking-widest",
                                                                children: "Level"
                                                            })
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),

                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "bg-white dark:bg-slate-900 rounded-[32px] border border-border overflow-hidden shadow-sm",
                                        children: [
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>setActiveTab("Analysis"),
                                                className: "w-full flex items-center justify-between p-5 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center",
                                                                children: /*#__PURE__*/ _jsx(Clock, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-sm font-black text-foreground",
                                                                        children: "Study History"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-400",
                                                                        children: "Track past activities"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx(ChevronRight, {
                                                        className: "w-5 h-5 text-slate-300"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>setShowSavedMCQs(true),
                                                className: "w-full flex items-center justify-between p-5 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center",
                                                                children: /*#__PURE__*/ _jsx(Bookmark, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-sm font-black text-foreground",
                                                                        children: "Saved Library"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-400",
                                                                        children: "Your bookmarked MCQs & Notes"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx(ChevronRight, {
                                                        className: "w-5 h-5 text-slate-300"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>setShowPrivacy(true),
                                                className: "w-full flex items-center justify-between p-5 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center",
                                                                children: /*#__PURE__*/ _jsx(ShieldCheck, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-sm font-black text-foreground",
                                                                        children: "Terms & Privacy"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-400",
                                                                        children: "Data usage & permissions"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx(ChevronRight, {
                                                        className: "w-5 h-5 text-slate-300"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>setShowGamification(true),
                                                className: "w-full flex items-center justify-between p-5 border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center",
                                                                children: /*#__PURE__*/ _jsx(Award, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-sm font-black text-foreground",
                                                                        children: "Achievements"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-400",
                                                                        children: "Badges & Trophies"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx(ChevronRight, {
                                                        className: "w-5 h-5 text-slate-300"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>setTheme(theme === "dark" ? "light" : "dark"),
                                                className: "w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ _jsx("div", {
                                                                className: "w-5 h-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center",
                                                                children: theme === "dark" ? /*#__PURE__*/ _jsx(Sun, {
                                                                    className: "w-5 h-5"
                                                                }) : /*#__PURE__*/ _jsx(Moon, {
                                                                    className: "w-5 h-5"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "text-left",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-sm font-black text-foreground",
                                                                        children: "Appearance"
                                                                    }),
                                                                    /*#__PURE__*/ _jsx("p", {
                                                                        className: "text-[10px] font-bold text-slate-400",
                                                                        children: "Toggle dark mode"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsx(ChevronRight, {
                                                        className: "w-5 h-5 text-slate-300"
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx(AnimatePresence, {
                        children: isAuth && /*#__PURE__*/ _jsx(StreakCelebration, {
                            currentStreak: userData?.streak || 0
                        })
                    }),
                    showSubjective && /*#__PURE__*/ _jsx("div", {
                        className: "fixed inset-0 z-[60] bg-slate-950 overflow-y-auto",
                        children: /*#__PURE__*/ _jsx(SubjectiveEngine, {
                            userData: userData,
                            onExit: ()=>setShowSubjective(false)
                        })
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("nav", {
                className: "glass-card backdrop-blur-2xl border-t border-white/5 dark:border-slate-800/80 flex justify-around items-center p-3 z-50 shrink-0 w-full pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.15)] bg-white/70 dark:bg-slate-950/70 relative",
                children: [
                    {
                        icon: BookOpen,
                        label: "Home"
                    },
                    {
                        icon: FileSpreadsheet,
                        label: "Tests"
                    },
                    {
                        icon: Trophy,
                        label: "Rank"
                    },
                    {
                        icon: Activity,
                        label: "Analysis"
                    },
                    {
                        icon: Wrench,
                        label: "Tools"
                    },
                    {
                        icon: User,
                        label: "Profile"
                    }
                ].map((item, i)=>{
                    const isActive = activeTab === item.label;
                    return /*#__PURE__*/ _jsxs(motion.div, {
                        onClick: ()=>setActiveTab(item.label),
                        whileHover: {
                            scale: 1.05,
                            y: -2
                        },
                        whileTap: {
                            scale: 0.92
                        },
                        className: "flex flex-col items-center gap-1.5 cursor-pointer relative",
                        children: [
                            /*#__PURE__*/ _jsx("div", {
                                className: `menu-icon-3d flex items-center justify-center p-1.5 rounded-[14px] ${isActive ? "active bg-gradient-to-br from-indigo-500/15 to-purple-500/15 text-indigo-500 dark:text-indigo-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"}`,
                                children: /*#__PURE__*/ _jsx(item.icon, {
                                    className: "w-5 h-5 drop-shadow-[0_1.5px_3px_rgba(99,102,241,0.15)]"
                                })
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                className: `text-[8.5px] font-black uppercase tracking-widest transition-all duration-300 leading-none ${isActive ? "text-indigo-500 dark:text-indigo-400 font-extrabold scale-105" : "text-slate-400/80 dark:text-slate-500 font-bold"}`,
                                children: item.label
                            })
                        ]
                    }, i);
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: selectionModal && /*#__PURE__*/ _jsx("div", {
                    className: "fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4",
                    children: /*#__PURE__*/ _jsxs(motion.div, {
                        initial: {
                            scale: 0.9,
                            opacity: 0
                        },
                        animate: {
                            scale: 1,
                            opacity: 1
                        },
                        exit: {
                            scale: 0.9,
                            opacity: 0
                        },
                        className: "bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-4 text-center border border-border relative shadow-2xl",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>setSelectionModal(null),
                                className: "absolute top-4 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-primary transition-all",
                                children: /*#__PURE__*/ _jsx(X, {
                                    className: "w-5 h-5"
                                })
                            }),
                            /*#__PURE__*/ _jsx("h3", {
                                className: "text-xl font-black mb-6 text-slate-800 dark:text-white",
                                children: selectionModal.name
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "grid grid-cols-1 gap-3",
                                children: [
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>{
                                            handleAICoreAction("notes", selectionModal.name, selectionModal.parentId);
                                            setSelectionModal(null);
                                        },
                                        className: "bg-indigo-600 text-white p-4 rounded-[28px] font-black uppercase tracking-tight flex items-center justify-center gap-3 active:scale-95 transition-transform",
                                        children: "Smart Notes"
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>{
                                            handleAICoreAction("quiz", selectionModal.name, selectionModal.parentId);
                                            setSelectionModal(null);
                                        },
                                        className: "bg-slate-900 text-white p-4 rounded-[28px] font-black uppercase tracking-tight flex items-center justify-center gap-3 active:scale-95 transition-transform",
                                        children: "Live Test"
                                    })
                                ]
                            })
                        ]
                    })
                })
            }),
            showDoubtSolver && /*#__PURE__*/ _jsx(AIDoubtSolver, {
                autoStartMic: autoStartMic,
                onExit: ()=>{
                    setShowDoubtSolver(false);
                    setAutoStartMic(false);
                },
                isSubscribed: isSubscribed,
                planType: userData?.planType || "free"
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showSystemFlow && /*#__PURE__*/ _jsx(SystemFlowModal, {
                    onClose: ()=>setShowSystemFlow(false)
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showGamification && /*#__PURE__*/ _jsx(GamificationHub, {
                    userData: userData,
                    onClose: ()=>setShowGamification(false)
                })
            }),
            showQuickRevision && /*#__PURE__*/ _jsx(QuickRevisionMode, {
                topic: quickRevisionTopic || "Current Topic",
                onExit: ()=>setShowQuickRevision(false)
            }),
            showWhyWrong && /*#__PURE__*/ _jsx(WhyGotWrong, {
                wrongQuestions: wrongQuestions,
                testTitle: testResult?.title || "Recent Test",
                onClose: ()=>setShowWhyWrong(false),
                isSubscribed: isSubscribed
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                mode: "wait",
                children: activeNotes && /*#__PURE__*/ _jsx(SmartNotesViewer, {
                    title: activeNotes.title,
                    chapterName: activeNotes.chapter || activeNotes.title,
                    subjectContext: activeNotes.subjectContext,
                    classContext: activeNotes.classContext,
                    mode: activeNotes.mode,
                    initialData: activeNotes.data,
                    userData: userData,
                    onExit: ()=>setActiveNotes(null),
                    onStartTest: ()=>{
                        // Trigger Live Test for this topic directly
                        const topic = activeNotes.title;
                        const subject = activeNotes.subjectContext;
                        setActiveNotes(null);
                        handleAICoreAction("quiz", topic, subject);
                        trackTopicClose(topic.toLowerCase().replace(/\s+/g, "-"));
                    },
                    onAskDoubt: ()=>{
                        handleDoubtSolverClick();
                        setAutoStartMic(false);
                    },
                    onVoiceDoubt: ()=>{
                        handleDoubtSolverClick();
                        setAutoStartMic(true);
                    },
                    isSubscribed: isSubscribed
                }, `notes-${activeNotes.title}`)
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                mode: "wait",
                children: activeTest && /*#__PURE__*/ _jsx(MockTestEngine, {
                    userData: userData,
                    testTitle: activeTest.title,
                    subTitle: activeTest.subTitle,
                    durationMinutes: 20,
                    questions: activeTest.questions,
                    onExit: ()=>setActiveTest(null),
                    onComplete: handleTestComplete,
                    isSubscribed: true,
                    onCorrectAnswer: handleCorrectAnswer
                }, `test-${activeTest.title}`)
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showNotifications && /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsx(motion.div, {
                            initial: {
                                opacity: 0
                            },
                            animate: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            onClick: ()=>setShowNotifications(false),
                            className: "fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[190]"
                        }),
                        /*#__PURE__*/ _jsx(NotificationSidebar, {
                            notifications: notificationsList,
                            onClose: ()=>setShowNotifications(false)
                        })
                    ]
                })
            }),

            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: testResult && /*#__PURE__*/ _jsx("div", {
                    className: "fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4",
                    children: /*#__PURE__*/ _jsxs(motion.div, {
                        initial: {
                            scale: 0.9
                        },
                        animate: {
                            scale: 1
                        },
                        className: "glass-card w-full max-w-md rounded-[40px] p-4 text-center border border-border shadow-2xl",
                        children: [
                            /*#__PURE__*/ _jsx(Trophy, {
                                className: "w-20 h-20 text-emerald-600 mx-auto mb-6"
                            }),
                            /*#__PURE__*/ _jsx("h2", {
                                className: "text-2xl font-black mb-2",
                                children: "Test Completed!"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "grid grid-cols-2 gap-4 mb-8",
                                children: [
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "bg-slate-50 p-5 rounded-3xl",
                                        children: /*#__PURE__*/ _jsxs("span", {
                                            className: "text-2xl font-black text-primary",
                                            children: [
                                                testResult.score,
                                                " / ",
                                                testResult.total
                                            ]
                                        })
                                    }),
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "bg-slate-50 p-5 rounded-3xl",
                                        children: /*#__PURE__*/ _jsxs("span", {
                                            className: "text-2xl font-black text-indigo-500",
                                            children: [
                                                Math.round(testResult.score / testResult.total * 100),
                                                "%"
                                            ]
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "space-y-3",
                                children: [
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>{
                                            setTestResult(null);
                                            setActiveTab("Analysis");
                                        },
                                        className: "w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest",
                                        children: "View Analysis"
                                    }),
                                    testResult.results && /*#__PURE__*/ _jsxs("button", {
                                        onClick: ()=>{
                                            const wrong = (testResult.results || []).filter((r)=>!r.correct).map((r)=>({
                                                    q: r.question || r.q || "Unknown Question",
                                                    userAnswer: r.userAnswer || "?",
                                                    correctAnswer: r.correctAnswer || "?",
                                                    topic: testResult.title || "General"
                                                }));
                                            setWrongQuestions(wrong);
                                            setShowWhyWrong(true);
                                            setTestResult(null);
                                        },
                                        className: "w-full bg-red-500/10 text-red-600 border border-red-500/20 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2",
                                        children: [
                                            /*#__PURE__*/ _jsx(Brain, {
                                                className: "w-5 h-5"
                                            }),
                                            " Why Did I Get Wrong?"
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("button", {
                                        onClick: ()=>{
                                            setQuickRevisionTopic(testResult.title || "Topic");
                                            setShowQuickRevision(true);
                                            setTestResult(null);
                                        },
                                        className: "w-full bg-amber-500/10 text-amber-600 border border-amber-500/20 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2",
                                        children: [
                                            /*#__PURE__*/ _jsx(Zap, {
                                                className: "w-5 h-5"
                                            }),
                                            " Quick Revision Mode"
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showWelcome && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "absolute inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-4",
                    children: /*#__PURE__*/ _jsxs("div", {
                        className: "text-center space-y-8",
                        children: [
                            /*#__PURE__*/ _jsx("div", {
                                className: "w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mx-auto shadow-2xl",
                                children: /*#__PURE__*/ _jsx(BookOpen, {
                                    className: "w-5 h-5 text-primary"
                                })
                            }),
                            /*#__PURE__*/ _jsx("h1", {
                                className: "text-2xl font-black text-white",
                                children: "Welcome Back"
                            }),
                            /*#__PURE__*/ _jsx("p", {
                                className: "text-slate-400 font-bold uppercase tracking-widest",
                                children: "Your AI Journey Starts Now"
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>setShowWelcome(false),
                                className: "w-full bg-white text-slate-950 font-black py-5 rounded-[28px] text-lg",
                                children: "START LEARNING"
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showGoalSelector && /*#__PURE__*/ _jsx(GoalSelector, {
                    userId: userData?.id || auth.currentUser?.uid,
                    goalChangesCount: userData?.goalChangesCount || 0,
                    initialBoard: userData?.board,
                    initialClass: userData?.cls,
                    onClose: ()=>setShowGoalSelector(false),
                    isForced: !userData?.board || !userData?.cls,
                    onRequestPending: ()=>{
                        setShowGoalSelector(false);
                        alert("Your document has been submitted! Admin will verify and update your goal soon.");
                    },
                    onSave: async (board, cls)=>{
                        setShowGoalSelector(false);
                        const newCount = (userData?.goalChangesCount || 0) + 1;
                        const updatedData = {
                            ...userData,
                            board,
                            cls,
                            goalChangesCount: newCount
                        };
                        setUserData(updatedData);
                        if (auth.currentUser) {
                            await updateDoc(doc(db, "users", auth.currentUser.uid), {
                                board,
                                cls,
                                goalChangesCount: newCount
                            });
                        }
                    }
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showGiftModal && userData?.giftMessage && /*#__PURE__*/ _jsx("div", {
                    className: "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md",
                    children: /*#__PURE__*/ _jsxs(motion.div, {
                        initial: {
                            opacity: 0,
                            scale: 0.9,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            scale: 1,
                            y: 0
                        },
                        exit: {
                            opacity: 0,
                            scale: 0.9,
                            y: 20
                        },
                        className: "bg-white dark:bg-slate-900 max-w-md w-full rounded-[48px] p-4 text-center shadow-2xl relative overflow-hidden",
                        children: [
                            /*#__PURE__*/ _jsx("div", {
                                className: "absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-indigo-500/5"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "relative z-10 space-y-8",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "relative mx-auto w-24 h-24",
                                        children: [
                                            /*#__PURE__*/ _jsx(motion.div, {
                                                animate: {
                                                    rotate: [
                                                        0,
                                                        15,
                                                        -15,
                                                        0
                                                    ],
                                                    scale: [
                                                        1,
                                                        1.1,
                                                        1
                                                    ]
                                                },
                                                transition: {
                                                    repeat: Infinity,
                                                    duration: 2
                                                },
                                                className: "w-24 h-24 bg-pink-100 dark:bg-pink-900/30 rounded-[32px] flex items-center justify-center text-pink-600",
                                                children: /*#__PURE__*/ _jsx(Gift, {
                                                    className: "w-5 h-5"
                                                })
                                            }),
                                            /*#__PURE__*/ _jsx(motion.div, {
                                                initial: {
                                                    opacity: 0
                                                },
                                                animate: {
                                                    opacity: [
                                                        0,
                                                        1,
                                                        0
                                                    ],
                                                    scale: [
                                                        0.5,
                                                        1.5,
                                                        1
                                                    ],
                                                    x: [
                                                        0,
                                                        20,
                                                        -20
                                                    ],
                                                    y: [
                                                        0,
                                                        -30,
                                                        -50
                                                    ]
                                                },
                                                transition: {
                                                    repeat: Infinity,
                                                    duration: 1.5
                                                },
                                                className: "absolute -top-4 -right-4 text-amber-500",
                                                children: /*#__PURE__*/ _jsx(PartyPopper, {
                                                    className: "w-5 h-5"
                                                })
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ _jsx("h3", {
                                                className: "text-2xl font-black tracking-tight text-slate-800 dark:text-white uppercase italic",
                                                children: "Lucky Winner!"
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "text-[10px] font-black text-pink-600 uppercase tracking-[0.3em]",
                                                children: "Special Premium Access Granted"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "p-4 bg-slate-50 dark:glass-card rounded-[32px] border border-slate-100 dark:border-white/10 relative",
                                        children: [
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "absolute -left-2 -top-2",
                                                children: /*#__PURE__*/ _jsx(Heart, {
                                                    className: "w-5 h-5 text-pink-400 fill-pink-400 opacity-20"
                                                })
                                            }),
                                            /*#__PURE__*/ _jsxs("p", {
                                                className: "text-sm font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed",
                                                children: [
                                                    '"',
                                                    userData.giftMessage,
                                                    '"'
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>{
                                            setShowGiftModal(false);
                                            localStorage.setItem(`gift_seen_${auth.currentUser?.uid}`, "true");
                                        },
                                        className: "w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] hover:shadow-indigo-500/20 active:scale-95 transition-all",
                                        children: "Start Premium Journey"
                                    })
                                ]
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showAnalysis && /*#__PURE__*/ _jsxs(motion.div, {
                    initial: {
                        opacity: 0,
                        x: "100%"
                    },
                    animate: {
                        opacity: 1,
                        x: 0
                    },
                    exit: {
                        opacity: 0,
                        x: "100%"
                    },
                    className: "fixed inset-0 z-[150] bg-white dark:bg-slate-950 overflow-y-auto",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "p-4 border-b border-border glass-card sticky top-0 z-10 flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ _jsx("button", {
                                            onClick: ()=>setShowAnalysis(false),
                                            className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors",
                                            children: /*#__PURE__*/ _jsx(X, {
                                                className: "w-5 h-5"
                                            })
                                        }),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("h3", {
                                                    className: "font-black text-xl tracking-tight italic uppercase italic",
                                                    children: "Deep Analysis"
                                                }),
                                                /*#__PURE__*/ _jsx("p", {
                                                    className: "text-[10px] font-black text-slate-400 uppercase tracking-widest",
                                                    children: "Performance Intelligence"
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: "bg-indigo-600 px-4 py-2 rounded-2xl text-white shadow-lg shadow-indigo-600/20",
                                    children: /*#__PURE__*/ _jsx("span", {
                                        className: "text-xs font-black uppercase tracking-widest italic",
                                        children: "Achivox AI"
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "p-4 md:p-4 max-w-4xl mx-auto",
                            children: /*#__PURE__*/ _jsx(AnalysisEngine, {
                                userData: userData
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showRevisionVault && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    children: /*#__PURE__*/ _jsx(RevisionVault, {
                        onExit: ()=>setShowRevisionVault(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showRoadmap && /*#__PURE__*/ _jsxs(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[150] bg-white dark:bg-slate-950 overflow-y-auto",
                    children: [
                        /*#__PURE__*/ _jsx("div", {
                            className: "p-4 border-b border-border glass-card sticky top-0 z-10 flex items-center justify-between",
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>setShowRoadmap(false),
                                        className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors",
                                        children: /*#__PURE__*/ _jsx(X, {
                                            className: "w-5 h-5"
                                        })
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("h3", {
                                                className: "font-black text-xl tracking-tight italic uppercase italic",
                                                children: "Mastery Path"
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "text-[10px] font-black text-slate-400 uppercase tracking-widest",
                                                children: "Interactive Curriculum Roadmap"
                                            })
                                        ]
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "p-4 md:p-4 max-w-4xl mx-auto",
                            children: /*#__PURE__*/ _jsx(MasteryRoadmap, {
                                topics: masterySequence,
                                masteryLevel: masteryLevel,
                                isSubscribed: isSubscribed,
                                onStartTest: (topic, subject)=>{
                                    handleAICoreAction("test", topic, subject, true);
                                    setShowRoadmap(false);
                                }
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showFlashcards && /*#__PURE__*/ _jsx(FlashcardForge, {
                    onClose: ()=>setShowFlashcards(false)
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showTopperNotes && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[280]",
                    children: /*#__PURE__*/ _jsx(TopperNotes, {
                        topic: topperNotesTopic,
                        subject: topperNotesSubject,
                        userData: userData,
                        onClose: ()=>{
                            setShowTopperNotes(false);
                            setTopperNotesTopic("");
                            setTopperNotesSubject("");
                        }
                    })
                })
            }),
            /*#__PURE__*/ _jsxs(AnimatePresence, {
                children: [
                    showReferralCenter && /*#__PURE__*/ _jsx(ReferralCenter, {
                        onClose: ()=>setShowReferralCenter(false),
                        userData: userData,
                        onSuccess: ()=>setAnalyticsUpdateTrigger((prev)=>prev + 1)
                    }),
                    showQuestLog && /*#__PURE__*/ _jsx(QuestLog, {
                        onClose: ()=>setShowQuestLog(false),
                        userData: userData,
                        onRewardClaimed: ()=>setAnalyticsUpdateTrigger((prev)=>prev + 1)
                    }),
                    showStudyPods && /*#__PURE__*/ _jsx(StudyPod, {
                        onClose: ()=>setShowStudyPods(false),
                        userData: userData,
                        onComplete: ()=>setAnalyticsUpdateTrigger((prev)=>prev + 1)
                    })
                ]
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showBattle && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[400]",
                    children: /*#__PURE__*/ _jsx(BattleQuiz, {
                        userData: userData,
                        onClose: ()=>setShowBattle(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showScanSolve && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        x: "100%"
                    },
                    animate: {
                        x: 0
                    },
                    exit: {
                        x: "100%"
                    },
                    transition: springConfig,
                    className: "fixed inset-0 z-[400]",
                    children: /*#__PURE__*/ _jsx(ScanAndSolve, {
                        userData: userData,
                        onClose: ()=>setShowScanSolve(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showQuickStudy && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0,
                        scale: 0.95
                    },
                    animate: {
                        opacity: 1,
                        scale: 1
                    },
                    exit: {
                        opacity: 0,
                        scale: 0.95
                    },
                    className: "fixed inset-0 z-[180] bg-slate-950/80 backdrop-blur-md overflow-y-auto",
                    children: /*#__PURE__*/ _jsx(QuickStudyCards, {
                        userData: userData,
                        onClose: ()=>setShowQuickStudy(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showProjectAssistant && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[180]",
                    children: /*#__PURE__*/ _jsx(SchoolProjectAssistant, {
                        userData: userData,
                        onClose: ()=>setShowProjectAssistant(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showTimetable && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0,
                        y: "100%"
                    },
                    animate: {
                        opacity: 1,
                        y: 0
                    },
                    exit: {
                        opacity: 0,
                        y: "100%"
                    },
                    className: "fixed inset-0 z-[180] bg-slate-950/80 backdrop-blur-md overflow-y-auto",
                    children: /*#__PURE__*/ _jsx(SmartTimetable, {
                        userData: userData,
                        weaknesses: getWeakAreas().map((w)=>w.topic),
                        onClose: ()=>setShowTimetable(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showFormulaVault && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[180]",
                    children: /*#__PURE__*/ _jsx(FormulaVault, {
                        userData: userData,
                        onClose: ()=>setShowFormulaVault(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showRewardShop && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[180]",
                    children: /*#__PURE__*/ _jsx(RewardShop, {
                        userId: userData?.id || auth.currentUser?.uid || "anonymous",
                        onClose: ()=>setShowRewardShop(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showReferralCenter && /*#__PURE__*/ _jsx(ReferralCenter, {
                    userData: userData,
                    onClose: ()=>setShowReferralCenter(false),
                    onSuccess: ()=>{
                        // Soft refresh user data
                        if (auth.currentUser) {
                            getDoc(doc(db, "users", auth.currentUser.uid)).then((snap)=>{
                                if (snap.exists()) setUserData({
                                    id: auth.currentUser.uid,
                                    ...snap.data()
                                });
                            });
                        }
                    }
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showSavedMCQs && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[180]",
                    children: /*#__PURE__*/ _jsx(SavedMCQs, {
                        onClose: ()=>setShowSavedMCQs(false)
                    })
                })
            }),
            /*#__PURE__*/ _jsx(AILoadingOverlay, {
                isOpen: showAILoading,
                onCancel: ()=>{
                    setShowAILoading(false);
                    activeAICoreTaskRef.current = null;
                },
                type: aiLoadingType
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showMockExam && /*#__PURE__*/ _jsx(MockExamSimulator, {
                    userData: userData,
                    onClose: ()=>setShowMockExam(false)
                })
            }),
            /*#__PURE__*/ _jsx(AnimatePresence, {
                children: showPrivacy && /*#__PURE__*/ _jsx(motion.div, {
                    initial: {
                        opacity: 0
                    },
                    animate: {
                        opacity: 1
                    },
                    exit: {
                        opacity: 0
                    },
                    className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
                    children: /*#__PURE__*/ _jsxs(motion.div, {
                        initial: {
                            scale: 0.95,
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            scale: 1,
                            opacity: 1,
                            y: 0
                        },
                        exit: {
                            scale: 0.95,
                            opacity: 0,
                            y: 20
                        },
                        className: "bg-white dark:bg-slate-900 rounded-[32px] border border-border shadow-2xl overflow-hidden w-full max-w-lg flex flex-col max-h-[85vh]",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                className: "bg-slate-950 p-6 flex items-center justify-between sticky top-0 z-10 shrink-0",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "w-5 h-5 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center",
                                                children: /*#__PURE__*/ _jsx(ShieldCheck, {
                                                    className: "w-5 h-5"
                                                })
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("h2", {
                                                        className: "text-lg font-black text-white",
                                                        children: "Terms & Privacy"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "text-[10px] text-slate-400 uppercase tracking-widest font-bold",
                                                        children: "100% Transparent Data Policy"
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>setShowPrivacy(false),
                                        className: "w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors",
                                        children: /*#__PURE__*/ _jsx(X, {
                                            className: "w-5 h-5"
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "p-6 overflow-y-auto space-y-6 flex-1 text-slate-600 dark:text-slate-300 text-sm",
                                children: [
                                    /*#__PURE__*/ _jsxs("section", {
                                        children: [
                                            /*#__PURE__*/ _jsxs("h3", {
                                                className: "font-black text-slate-800 dark:text-white text-base mb-2 flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ _jsx(Shield, {
                                                        className: "w-5 h-5 text-emerald-500"
                                                    }),
                                                    " Data Safety & Permissions"
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "mb-3",
                                                children: "Your privacy is our priority. We only collect the data necessary to provide you with the best learning experience."
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-border",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("h4", {
                                                                className: "font-bold text-xs uppercase tracking-wider text-slate-500 mb-1",
                                                                children: "Microphone Access"
                                                            }),
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-xs",
                                                                children: "Required ONLY when you use the AI Doubt Solver to ask questions via voice. We do not listen in the background."
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("h4", {
                                                                className: "font-bold text-xs uppercase tracking-wider text-slate-500 mb-1",
                                                                children: "Device Storage"
                                                            }),
                                                            /*#__PURE__*/ _jsx("p", {
                                                                className: "text-xs",
                                                                children: "Required ONLY to save downloaded PDF notes or offline study material to your device."
                                                            })
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("section", {
                                        children: [
                                            /*#__PURE__*/ _jsx("h3", {
                                                className: "font-black text-slate-800 dark:text-white text-base mb-2",
                                                children: "What Data Do We Collect?"
                                            }),
                                            /*#__PURE__*/ _jsxs("ul", {
                                                className: "list-disc pl-5 space-y-2 text-xs",
                                                children: [
                                                    /*#__PURE__*/ _jsxs("li", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: "Basic Profile Info:"
                                                            }),
                                                            " Name, Email, and chosen Avatar for your account identity."
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs("li", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: "Study Analytics:"
                                                            }),
                                                            " Test scores, time spent, and weak topics to generate your personalized AI study plan."
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ _jsxs("li", {
                                                        children: [
                                                            /*#__PURE__*/ _jsx("strong", {
                                                                children: "Subscription Status:"
                                                            }),
                                                            " To manage your access to premium features like VVIP notes and AI tools."
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("p", {
                                                className: "text-xs mt-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-xl",
                                                children: [
                                                    /*#__PURE__*/ _jsx("strong", {
                                                        className: "block mb-1",
                                                        children: "Our Promise:"
                                                    }),
                                                    " We never sell your personal data or test performance metrics to any third-party advertisers."
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("section", {
                                        children: [
                                            /*#__PURE__*/ _jsx("h3", {
                                                className: "font-black text-slate-800 dark:text-white text-base mb-2",
                                                children: "Terms of Service"
                                            }),
                                            /*#__PURE__*/ _jsxs("p", {
                                                className: "text-xs space-y-2",
                                                children: [
                                                    "By using ExamHero, you agree to use the platform for educational purposes only. Our AI-generated content is designed for practice and learning assistance, but should not completely replace your prescribed syllabus materials.",
                                                    /*#__PURE__*/ _jsx("br", {}),
                                                    /*#__PURE__*/ _jsx("br", {}),
                                                    "Premium subscriptions are auto-revoked upon expiration, and all subscription sales are final as per our standard refund policy. ExamHero operates with absolute transparency and ensures all data complies with global privacy standards."
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsx("div", {
                                className: "p-4 border-t border-border bg-slate-50 dark:bg-slate-800/50 text-center shrink-0",
                                children: /*#__PURE__*/ _jsx("button", {
                                    onClick: ()=>setShowPrivacy(false),
                                    className: "w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm hover:scale-[0.98] transition-transform",
                                    children: "I Understand & Agree"
                                })
                            })
                        ]
                    })
                })
            })
        ]
    });
}