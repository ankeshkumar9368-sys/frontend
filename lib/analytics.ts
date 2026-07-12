import { db, auth } from "./firebase";
import { 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  arrayUnion, 
  setDoc,
  collection,
  addDoc,
  getDoc
} from "firebase/firestore";

export type FeatureStatus = "success" | "failed" | "loading";

/**
 * Helper to get local date string in YYYY-MM-DD format (timezone-safe).
 */
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Tracks feature usage, performance, and stability globally.
 */
export const logFeatureUsage = async (
  featureName: string, 
  status: FeatureStatus, 
  loadTimeMs: number = 0,
  userId?: string
) => {
  try {
    const statsRef = doc(db, "admin_stats", "feature_metrics");
    
    // Update global metrics
    await setDoc(statsRef, {
      [`${featureName}_usage`]: increment(1),
      [`${featureName}_${status}`]: increment(1),
      [`${featureName}_total_load_time`]: increment(loadTimeMs),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Log individual failure for debugging
    if (status === "failed") {
      await addDoc(collection(db, "system_logs"), {
        type: "error",
        feature: featureName,
        userId: userId || "anonymous",
        timestamp: serverTimestamp(),
        message: `Feature ${featureName} failed to load.`
      });
    }

    // Per-user tracking
    if (userId) {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        [`featureUsage.${featureName}`]: increment(1),
        lastActive: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Analytics Error:", error);
  }
};

/**
 * Logs exact time spent on a feature.
 */
export const logFeatureTime = async (userId: string, featureName: string, durationSeconds: number) => {
  if (!userId || durationSeconds <= 0) return;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [`featureTime.${featureName}`]: increment(durationSeconds)
    });
  } catch (error) {
    console.error("Error logging feature time:", error);
  }
};

/**
 * Updates the real-time active status of a user (for Live Radar).
 */
export const updateActiveStatus = async (userId: string, status: string) => {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      activeStatus: status,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating active status:", error);
  }
};

/**
 * Checks if a user has reached their daily limit for a feature.
 * Returns { allowed: boolean, remaining: number }
 */
export const checkAndIncrementUsage = async (userId: string, featureName: string, limit: number = 5, targetItem?: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { allowed: true, remaining: 99 };
    
    const userData = userSnap.data();
    
    // Premium users have no limits
    if (userData.isSubscribed) return { allowed: true, remaining: 999 };

    const today = getLocalDateString();
    const usageData = userData.dailyUsage?.[featureName] || { count: 0, lastUsed: "", lastTarget: "" };
    
    let currentCount = usageData.count;
    
    // Reset if it's a new day
    if (usageData.lastUsed !== today) {
      currentCount = 0;
    }

    // If they are accessing the SAME item they already spent quota on today, allow it for free
    if (targetItem && usageData.lastUsed === today && usageData.lastTarget === targetItem) {
      return { allowed: true, remaining: limit - currentCount };
    }

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0 };
    }

    // Increment usage
    await setDoc(userRef, {
      dailyUsage: {
        [featureName]: {
          count: currentCount + 1,
          lastUsed: today,
          lastTarget: targetItem || ""
        }
      }
    }, { merge: true });

    return { allowed: true, remaining: limit - (currentCount + 1) };
  } catch (error) {
    console.error("Usage Check Error:", error);
    return { allowed: true, remaining: 1 }; // Default allow on error to not block users
  }
};

/**
 * Sends a private notification/message to a specific user.
 */
export const sendPrivateNotification = async (
  userId: string, 
  title: string, 
  message: string, 
  type: "info" | "success" | "warning" = "info"
) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      notifications: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false
      })
    });
    return true;
  } catch (error) {
    console.error("Notification Error:", error);
    return false;
  }
};

// ─── LOCAL STORAGE METRIC HELPERS & MISSING EXPORTS ───

export interface SubjectProgress {
  subject: string;
  cls: string;
  trend: "improving" | "declining" | "stable";
  topicsStudied: number;
  avgScore: number;
  timeSpentMin: number;
}

export interface WeakArea {
  topic: string;
  subject: string;
  chapter: string;
  avgScore: number;
  suggestedAction: string;
  attempts: number;
}

export interface ExamPrediction {
  subject: string;
  status: "ready" | "needs_data";
  topicsAttempted: number;
  predictedMarks: number;
}

export interface RevisionTopic {
  topicId: string;
  topicName: string;
  subject: string;
  lastAttemptedAt: number;
  nextRevisionAt: number;
  lastScore: number;
}

export interface Mistake {
  id: string;
  topicId: string;
  topicName: string;
  subject: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  options?: string[];
  date: string;
}

export interface AISuggestion {
  title: string;
  subtitle: string;
  priority: number;
}

export interface OverallStats {
  accuracy: number;
  streak: number;
  totalStudyMin: number;
  todayStudyMin: number;
  totalTopics: number;
  totalTests: number;
  totalSolved?: number;
  correctAnswers?: number;
  recentActivity: Array<{
    topic: string;
    score: number;
    subject: string;
    date: string;
    attemptedAt: number;
  }>;
  topTopics: Array<{
    name: string;
    timeMin: number;
    subject: string;
  }>;
}

export const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const setLocalData = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};

export const calculateWeightedAccuracy = (currentAccuracy: number, score: number, total: number) => {
  const newAccuracy = (score / total) * 100;
  if (!currentAccuracy) return Math.round(newAccuracy);
  return Math.round((currentAccuracy * 0.8) + (newAccuracy * 0.2));
};

export const recordTestResult = async (result: {
  topicId: string;
  topicName: string;
  subject: string;
  cls: string;
  score: number;
  totalQ: number;
  correctQ: number;
  timeTakenSec: number;
}) => {
  try {
    dispatchTaskCompletion("take_test");
    dispatchTaskCompletion("take_pyq");
    const results = getLocalData<any[]>("achivox_quiz_results", []);
    results.push({
      ...result,
      attemptedAt: Date.now()
    });
    setLocalData("achivox_quiz_results", results);

    // Sync to Firestore too
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        quizResults: results
      });
      await updateStreak();
    }
  } catch (error) {
    console.error("Error saving test result:", error);
  }
};

export const recordMistake = async (mistake: {
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  topicId: string;
  topicName: string;
  subject: string;
}) => {
  try {
    const mistakes = getLocalData<any[]>("achivox_mistakes", []);
    const isDup = mistakes.some(m => m.question === mistake.question && m.topicId === mistake.topicId);
    if (!isDup) {
      mistakes.push({
        ...mistake,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString()
      });
      setLocalData("achivox_mistakes", mistakes);
      
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          mistakes: mistakes
        });
      }
    }
  } catch (error) {
    console.error("Error saving mistake:", error);
  }
};

export const getMistakes = (): Mistake[] => {
  return getLocalData<Mistake[]>("achivox_mistakes", []);
};

export const removeMistake = (id: string): void => {
  const mistakes = getMistakes();
  const updated = mistakes.filter(m => m.id !== id);
  setLocalData("achivox_mistakes", updated);
  
  if (auth.currentUser) {
    const userRef = doc(db, "users", auth.currentUser.uid);
    updateDoc(userRef, {
      mistakes: updated
    }).catch(e => console.error("Error removing mistake from Firestore:", e));
  }
};

export const getOverallStats = (): OverallStats => {
  const results = getLocalData<any[]>("achivox_quiz_results", []);
  const lastStreakDate = getLocalData<string>("achivox_last_streak_date", "");
  let streak = getLocalData<number>("achivox_streak", 0);
  
  const today = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  
  // Strict streak break check: if not opened today or yesterday, streak is completely broken (0)
  if (lastStreakDate && lastStreakDate !== today && lastStreakDate !== yesterdayStr) {
    streak = 0;
  }
  
  const studyTimes = getLocalData<Record<string, number>>("achivox_study_times", {});

  let totalStudyMs = 0;
  Object.values(studyTimes).forEach((t: any) => {
    totalStudyMs += t;
  });
  const totalStudyMin = Math.round(totalStudyMs / 60000);


  const dailyStudyTimes = getLocalData<Record<string, number>>("achivox_daily_study_times", {});
  const todayStudyMs = dailyStudyTimes[today] || 0;
  const todayStudyMin = Math.round(todayStudyMs / 60000);

  const totalTests = results.length;
  const correctSum = results.reduce((sum, r) => sum + (r.correctQ || 0), 0);
  const totalQSum = results.reduce((sum, r) => sum + (r.totalQ || 0), 0);
  const accuracy = totalQSum > 0 ? Math.round((correctSum / totalQSum) * 100) : 0;

  const uniqueTopics = new Set(results.map(r => r.topicId));
  const totalTopics = uniqueTopics.size;

  const recentActivity = results.slice(-10).map(r => ({
    topic: r.topicName,
    score: r.score,
    subject: r.subject,
    date: new Date(r.attemptedAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" }),
    attemptedAt: r.attemptedAt || Date.now()
  })).reverse();

  const topTopics = Object.entries(studyTimes).map(([topicId, ms]) => {
    const found = results.find(r => r.topicId === topicId);
    return {
      name: found ? found.topicName : topicId.replace(/-/g, ' '),
      timeMin: Math.round(ms / 60000),
      subject: found ? found.subject : "General"
    };
  }).sort((a, b) => b.timeMin - a.timeMin).slice(0, 3);

  return {
    accuracy: accuracy || 0,
    streak,
    totalStudyMin: totalStudyMin || 0,
    todayStudyMin: todayStudyMin || 0,
    totalTopics: totalTopics || 0,
    totalTests,
    totalSolved: totalQSum,
    correctAnswers: correctSum,
    recentActivity,
    topTopics
  };
};

export const getSubjectProgress = (): SubjectProgress[] => {
  const results = getLocalData<any[]>("achivox_quiz_results", []);
  const studyTimes = getLocalData<Record<string, number>>("achivox_study_times", {});

  const subjectsMap: Record<string, { subject: string; cls: string; scores: number[]; topics: Set<string>; timeSpentMs: number }> = {};

  results.forEach(r => {
    const sub = r.subject || "General";
    if (!subjectsMap[sub]) {
      subjectsMap[sub] = { subject: sub, cls: r.cls || "12th", scores: [], topics: new Set(), timeSpentMs: 0 };
    }
    subjectsMap[sub].scores.push(r.score);
    subjectsMap[sub].topics.add(r.topicId);
  });

  results.forEach(r => {
    const sub = r.subject || "General";
    const ms = studyTimes[r.topicId] || 0;
    if (subjectsMap[sub]) {
      subjectsMap[sub].timeSpentMs += ms;
    }
  });

  return Object.values(subjectsMap).map(s => {
    const avgScore = s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
    const trend = s.scores.length < 2 ? "stable" : s.scores[s.scores.length - 1] >= avgScore ? "improving" : "declining";
    return {
      subject: s.subject,
      cls: s.cls,
      trend: trend as any,
      topicsStudied: s.topics.size,
      avgScore,
      timeSpentMin: Math.round(s.timeSpentMs / 60000)
    };
  });
};

export const getWeakAreas = (): WeakArea[] => {
  const results = getLocalData<any[]>("achivox_quiz_results", []);
  const topicMap: Record<string, { topicName: string; subject: string; scores: number[]; attempts: number }> = {};

  results.forEach(r => {
    const tid = r.topicId;
    if (!topicMap[tid]) {
      topicMap[tid] = { topicName: r.topicName, subject: r.subject, scores: [], attempts: 0 };
    }
    topicMap[tid].scores.push(r.score);
    topicMap[tid].attempts++;
  });

  const weak: WeakArea[] = [];
  Object.entries(topicMap).forEach(([tid, val]) => {
    const avg = Math.round(val.scores.reduce((a, b) => a + b, 0) / val.scores.length);
    if (avg < 70) {
      weak.push({
        topic: val.topicName,
        subject: val.subject,
        chapter: "Concept Mastery",
        avgScore: avg,
        suggestedAction: avg < 40 ? "Re-watch Concept Lectures 📚" : "Review Spaced Revision Cards 🔁",
        attempts: val.attempts
      });
    }
  });

  return weak.sort((a, b) => a.avgScore - b.avgScore);
};

export const getExamPrediction = (subjects: string[]): { predictions: ExamPrediction[]; total: number; totalStatus: "ready" | "needs_data" } => {
  const results = getLocalData<any[]>("achivox_quiz_results", []);
  const subjectsToQuery = subjects.length > 0 ? subjects : ["Science", "Mathematics", "Physics", "Chemistry", "Biology"];

  const subjectTopicsAttempted: Record<string, Set<string>> = {};
  const subjectScores: Record<string, number[]> = {};

  results.forEach(r => {
    const sub = r.subject || "General";
    if (!subjectTopicsAttempted[sub]) subjectTopicsAttempted[sub] = new Set();
    if (!subjectScores[sub]) subjectScores[sub] = [];

    subjectTopicsAttempted[sub].add(r.topicId);
    subjectScores[sub].push(r.score);
  });

  const predictions: ExamPrediction[] = subjectsToQuery.map(sub => {
    const topicsCount = subjectTopicsAttempted[sub]?.size || 0;
    const status = topicsCount >= 2 ? "ready" : "needs_data";
    const scores = subjectScores[sub] || [];
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      subject: sub,
      status,
      topicsAttempted: topicsCount,
      predictedMarks: status === "ready" ? avg : 0
    };
  });

  const readyPredictions = predictions.filter(p => p.status === "ready");
  const totalStatus = readyPredictions.length >= 2 ? "ready" : "needs_data";
  const total = readyPredictions.length > 0 ? Math.round(readyPredictions.reduce((sum, p) => sum + p.predictedMarks, 0) / readyPredictions.length) : 0;

  return {
    predictions,
    total,
    totalStatus
  };
};

export const getSpacedRevisionTopics = (): RevisionTopic[] => {
  const results = getLocalData<any[]>("achivox_quiz_results", []);
  const topicMap: Record<string, { topicName: string; subject: string; lastAttemptedAt: number; scores: number[] }> = {};

  results.forEach(r => {
    const tid = r.topicId;
    if (!topicMap[tid]) {
      topicMap[tid] = { topicName: r.topicName, subject: r.subject, lastAttemptedAt: 0, scores: [] };
    }
    topicMap[tid].scores.push(r.score);
    if (!topicMap[tid].lastAttemptedAt || r.attemptedAt > topicMap[tid].lastAttemptedAt) {
      topicMap[tid].lastAttemptedAt = r.attemptedAt || Date.now();
    }
  });

  return Object.entries(topicMap).map(([tid, val]) => {
    const lastScore = val.scores[val.scores.length - 1];
    const intervalDays = lastScore >= 80 ? 5 : lastScore >= 60 ? 3 : 1;
    const nextRevisionAt = val.lastAttemptedAt + intervalDays * 24 * 60 * 60 * 1000;

    return {
      topicId: tid,
      topicName: val.topicName,
      subject: val.subject,
      lastAttemptedAt: val.lastAttemptedAt,
      nextRevisionAt,
      lastScore
    };
  });
};

export const trackTopicOpen = (info: {
  topicId: string;
  topicName: string;
  subject: string;
  chapter: string;
  cls: string;
  board: string;
}) => {
  if (typeof window === "undefined") return;
  try {
    dispatchTaskCompletion("read_notes");
    sessionStorage.setItem(`achivox_study_start_${info.topicId}`, Date.now().toString());
  } catch {}
};

export const trackTopicClose = (topicId: string) => {
  if (typeof window === "undefined") return;
  try {
    const startStr = sessionStorage.getItem(`achivox_study_start_${topicId}`);
    if (startStr) {
      const elapsed = Date.now() - parseInt(startStr);
      const studyTimes = getLocalData<Record<string, number>>("achivox_study_times", {});
      studyTimes[topicId] = (studyTimes[topicId] || 0) + elapsed;
      setLocalData("achivox_study_times", studyTimes);
      sessionStorage.removeItem(`achivox_study_start_${topicId}`);
      
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userRef, {
          studyTimes: studyTimes
        }).catch(e => console.error("Error updating studyTimes in Firestore:", e));
      }
    }
  } catch {}
};

export const incrementStudyTime = async (topicId: string, seconds: number) => {
  if (typeof window === "undefined" || seconds <= 0) return;
  try {
    const ms = seconds * 1000;
    
    // 1. Update topic lifetime study time
    const studyTimes = getLocalData<Record<string, number>>("achivox_study_times", {});
    studyTimes[topicId] = (studyTimes[topicId] || 0) + ms;
    setLocalData("achivox_study_times", studyTimes);

    // 2. Update daily/everyday study time
    const today = getLocalDateString();
    const dailyStudyTimes = getLocalData<Record<string, number>>("achivox_daily_study_times", {});
    dailyStudyTimes[today] = (dailyStudyTimes[today] || 0) + ms;
    setLocalData("achivox_daily_study_times", dailyStudyTimes);

    // 3. Sync to Firestore
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        studyTimes: studyTimes,
        dailyStudyTimes: dailyStudyTimes,
        lastActive: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error incrementing study time:", error);
  }
};

import { useEffect } from "react";

export const useStudyTimer = (topicId: string | null | undefined) => {
  useEffect(() => {
    if (!topicId) return;

    let lastActivity = Date.now();
    const handleActivity = () => {
      lastActivity = Date.now();
    };

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach(event => window.addEventListener(event, handleActivity));

    const interval = setInterval(() => {
      // User is active if document has focus and they interacted in the last 30s
      if (document.hasFocus() && (Date.now() - lastActivity < 30000)) {
        incrementStudyTime(topicId, 10);
      }
    }, 10000); // Ticks every 10s

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [topicId]);
};

export const updateStreak = async () => {
  try {
    const today = getLocalDateString();
    
    // Sync from Firestore first to avoid overriding correct streak on new devices or cache clears
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const dbData = userSnap.data();
        if (dbData.streak !== undefined) {
          setLocalData("achivox_streak", dbData.streak);
        }
        if (dbData.lastStreakDate) {
          setLocalData("achivox_last_streak_date", dbData.lastStreakDate);
        }
      }
    }

    const lastStreakDate = getLocalData<string>("achivox_last_streak_date", "");
    let streak = getLocalData<number>("achivox_streak", 0);

    if (lastStreakDate !== today) {
      if (lastStreakDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        if (lastStreakDate === yesterdayStr) {
          streak += 1;
          setLocalData("achivox_show_streak_celebration", true); // Flag to show celebration UI
        } else {
          streak = 0;
        }
      } else {
        streak = 0;
      }
      setLocalData("achivox_streak", streak);
      setLocalData("achivox_last_streak_date", today);
      
      // Update firestore too if auth exists
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          streak: streak,
          lastStreakDate: today,
          lastActive: serverTimestamp()
        });
        
        // --- STREAK WAGER RESOLUTION LOGIC ---
        const statsRef = doc(db, "user_stats", auth.currentUser.uid);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          const data = statsSnap.data();
          if (data.activeWager) {
            const wager = data.activeWager;
            if (streak >= wager.targetStreak) {
              // Won the wager
              const winAmount = wager.amount * 3;
              await updateDoc(statsRef, {
                coins: increment(winAmount),
                activeWager: null,
              });
              // Send notification
              await sendPrivateNotification(
                auth.currentUser.uid,
                "🎉 Wager Won!",
                `You maintained your streak and won ${winAmount} Coins!`,
                "success"
              );
            } else if (streak === 1 && !lastStreakDate) {
               // First day, do nothing to wager.
            } else if (streak === 0) {
              // Streak broke, lost the wager
              await updateDoc(statsRef, {
                activeWager: null,
              });
              await sendPrivateNotification(
                auth.currentUser.uid,
                "❌ Wager Lost",
                `Your streak broke, and your wagered coins were lost. Try again!`,
                "warning"
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Streak Update Error:", error);
  }
};

export const getAISuggestion = (): AISuggestion => {
  const weak = getWeakAreas();
  if (weak.length > 0) {
    return {
      title: `Focus on ${weak[0].topic}`,
      subtitle: `Your average score is ${weak[0].avgScore}%. Let's review the concepts or retake the mistake questions.`,
      priority: 1
    };
  }
  return {
    title: "Ready for a new Challenge!",
    subtitle: "You are doing great! Try a Mock Test to push your limits and predict your board exam marks.",
    priority: 0
  };
};

export const clearLocalAnalytics = () => {
  if (typeof window === 'undefined') return;
  // Clear ONLY navigation/content cache keys - NOT performance data
  // Performance keys (quiz_results, streak, mistakes, mastered_qs) are preserved across logins
  const PRESERVE_KEYS = [
    'achivox_quiz_results',
    'achivox_streak',
    'achivox_last_streak_date',
    'achivox_study_times',
    'achivox_daily_study_times',
    'achivox_mistakes',
    'achivox_mastered_qs',
    'achivox_onboarded',
  ];
  const keysToRemove = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('achivox_') && !PRESERVE_KEYS.includes(key)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => window.localStorage.removeItem(k));
};


export const dispatchTaskCompletion = (type: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("achivox_task_completed", { detail: { type } }));
  }
};


export const recordMasteredQuestion = async (questionText: string) => {
  try {
    const mastered = getLocalData<string[]>("achivox_mastered_qs", []);
    if (!mastered.includes(questionText)) {
      mastered.push(questionText);
      setLocalData("achivox_mastered_qs", mastered);
      
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          masteredQuestions: mastered
        });
      }
    }
  } catch (e) {
    console.error("Error saving mastered question:", e);
  }
};

export const getMasteredQuestions = () => {
  return getLocalData<string[]>("achivox_mastered_qs", []);
};

export const logGenerationMetric = async (board: string, subject: string, contentType: string, count: number = 1) => {
  try {
    const safeBoard = board || "Unknown Board";
    const safeSubject = subject || "Mixed";
    
    const docId = `${safeBoard}_${safeSubject}`.replace(/[^a-zA-Z0-9]/g, '_');
    
    const metricRef = doc(db, "generation_metrics", docId);
    
    await setDoc(metricRef, {
      board: safeBoard,
      subject: safeSubject,
      [contentType]: increment(count),
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    const globalRef = doc(db, "generation_metrics", "global_totals");
    await setDoc(globalRef, {
      [contentType]: increment(count),
      lastUpdated: serverTimestamp()
    }, { merge: true });

  } catch (e) {
    console.error("Failed to log generation metric", e);
  }
};
