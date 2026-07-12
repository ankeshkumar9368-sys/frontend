import { db } from "./firebase";
import { doc, getDoc, updateDoc, increment, arrayUnion, setDoc } from "firebase/firestore";

export interface UserStats {
  xp: number;
  level: number;
  coins: number;       // Achivox Coins — spendable currency (separate from XP)
  points: number;      // Legacy field kept for compatibility
  streak: number;
  lastActive: any;
  badges: string[];
}

export const LEVEL_XP_THRESHOLD = 500; // XP needed per level

export const getLevel = (xp: number) => Math.floor(xp / LEVEL_XP_THRESHOLD) + 1;

// ─── COIN EARNING RULES ───────────────────────────────────────────────
// Coins are earned by study activities and are spent in the Reward Shop.
// XP is a permanent score that NEVER decreases (it only goes up).
export const COIN_REWARDS = {
  TEST_COMPLETE: 15,         // Complete any test
  TEST_PERFECT: 30,          // Score 100% in a test
  TEST_ABOVE_80: 20,         // Score ≥80% in a test
  POMODORO_25MIN: 20,        // Complete a full 25-min Pomodoro session
  POMODORO_50MIN: 45,        // Complete a 50-min session
  DAILY_STREAK: 10,          // Daily login streak bonus
  NOTES_READ: 5,             // Read a chapter's notes
  DOUBT_SOLVED: 5,           // Solve a doubt via AI
  DAILY_CHALLENGE: 25,       // Complete a daily challenge
  FIRST_TEST_TODAY: 10,      // First test of the day bonus
};

// ─── ADD XP (permanent, never decreases) ──────────────────────────────
export const addXP = async (userId: string, amount: number, reason: string) => {
  const statsRef = doc(db, "user_stats", userId);

  try {
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      const initialXP = Math.max(0, amount);
      await setDoc(statsRef, {
        xp: initialXP,
        level: getLevel(initialXP),
        coins: 0,
        points: 0,
        streak: 1,
        lastActive: new Date(),
        badges: [],
        history: [{ reason, amount, timestamp: new Date() }]
      });
      // Sync points to users document
      try {
        await updateDoc(doc(db, "users", userId), { points: initialXP });
      } catch (e) {
        console.warn("Sync points to users failed:", e);
      }
      return { leveledUp: false, newLevel: getLevel(initialXP) };
    }

    const currentData = statsSnap.data();
    // XP is a permanent score that NEVER decreases (ensure newXP is at least the current XP)
    const newXP = Math.max(currentData.xp || 0, (currentData.xp || 0) + amount);
    const newLevel = getLevel(newXP);
    const leveledUp = newLevel > (currentData.level || 1);

    await updateDoc(statsRef, {
      xp: newXP,
      level: newLevel,              // Level is always derived from XP, never decreases
      lastActive: new Date(),
      history: arrayUnion({ reason, amount, timestamp: new Date() })
    });

    // Sync points to users document
    try {
      await updateDoc(doc(db, "users", userId), { points: newXP });
    } catch (e) {
      console.warn("Sync points to users failed:", e);
    }

    return { leveledUp, newLevel };
  } catch (error) {
    console.error("XP Add Error:", error);
  }
};

// ─── ADD ACHIVOX COINS ─────────────────────────────────────────────────
export const addCoins = async (userId: string, amount: number, reason: string) => {
  if (!userId || !db) return;
  const statsRef = doc(db, "user_stats", userId);

  try {
    const statsSnap = await getDoc(statsRef);

    if (!statsSnap.exists()) {
      await setDoc(statsRef, {
        xp: 0,
        level: 1,
        coins: amount,
        points: 0,
        streak: 1,
        lastActive: new Date(),
        badges: [],
      });
      return amount;
    }

    await updateDoc(statsRef, {
      coins: increment(amount),
      lastActive: new Date(),
    });

    return (statsSnap.data().coins || 0) + amount;
  } catch (error) {
    console.error("Coin Add Error:", error);
  }
};

// ─── REDEEM WITH COINS (XP is never touched) ──────────────────────────
export const redeemWithCoins = async (userId: string, coinCost: number, itemName: string) => {
  if (!userId || !db) return false;
  const statsRef = doc(db, "user_stats", userId);

  try {
    const snap = await getDoc(statsRef);
    if (!snap.exists()) return false;

    const currentCoins = snap.data().coins || 0;
    if (currentCoins < coinCost) return false;

    await updateDoc(statsRef, {
      coins: increment(-coinCost),   // Only coins go down, XP/level NEVER touched
      redemptions: arrayUnion({
        itemName,
        coinCost,
        timestamp: new Date()
      })
    });
    return true;
  } catch (error) {
    console.error("Coin Redemption Error:", error);
    return false;
  }
};

// ─── LEGACY: redeemPoints kept for compatibility (now redirects to coins) ──
export const redeemPoints = async (userId: string, amount: number, itemName: string) => {
  return await redeemWithCoins(userId, amount, itemName);
};

// ─── TEST COMPLETION REWARD ─────────────────────────────────────────────
export const rewardTestCompletion = async (userId: string, correct: number, total: number) => {
  if (!userId) return;

  // Enforce a minimum of 0 on XP earned so poor test performance does not subtract XP
  const xpEarned = Math.max(0, (correct * 5) - ((total - correct) * 2));
  const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const reason = `Completed Test: ${correct}/${total} Correct`;

  let coinsEarned = COIN_REWARDS.TEST_COMPLETE;
  if (scorePct === 100) {
    coinsEarned += COIN_REWARDS.TEST_PERFECT;
  } else if (scorePct >= 80) {
    coinsEarned += COIN_REWARDS.TEST_ABOVE_80;
  }

  await Promise.all([
    addXP(userId, xpEarned, reason),
    addCoins(userId, coinsEarned, reason),
    updateDoc(doc(db, "users", userId), {
      testsCompleted: increment(1)
    }).catch(e => console.warn("Failed to increment testsCompleted:", e))
  ]);

  return { coinsEarned, xpEarned };
};

// ─── POMODORO COMPLETION REWARD ─────────────────────────────────────────
export const rewardPomodoroSession = async (userId: string, durationMinutes: number) => {
  if (!userId) return;

  const coins = durationMinutes >= 50
    ? COIN_REWARDS.POMODORO_50MIN
    : COIN_REWARDS.POMODORO_25MIN;

  const xp = durationMinutes >= 50 ? 40 : 20;
  const reason = `${durationMinutes}-min Focus Session Complete`;

  await Promise.all([
    addXP(userId, xp, reason),
    addCoins(userId, coins, reason),
    updateDoc(doc(db, "users", userId), {
      focusSessions: increment(1)
    }).catch(e => console.warn("Failed to increment focusSessions:", e))
  ]);

  return { coinsEarned: coins, xpEarned: xp };
};

// ─── BADGES ────────────────────────────────────────────────────────────
export const awardBadge = async (userId: string, badgeId: string) => {
  const statsRef = doc(db, "user_stats", userId);
  await updateDoc(statsRef, { badges: arrayUnion(badgeId) });
};

export const checkMasteryBadges = async (userId: string, subject: string, score: number) => {
  if (score < 90) return;

  const badgeId = `master_${subject.toLowerCase().replace(/\s+/g, '_')}`;
  const badgeName = `${subject} Master`;

  const statsRef = doc(db, "user_stats", userId);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    const badges = statsSnap.data().badges || [];
    if (!badges.includes(badgeId)) {
      await awardBadge(userId, badgeId);
      return { badgeId, badgeName };
    }
  }
  return null;
};

export const checkAndUnlockBadges = async (userId: string, userData: any, stats: any) => {
  if (!userId) return [];

  const unlockedBadges: string[] = stats?.badges || [];
  const newBadges: string[] = [];

  const addIfNew = (id: string) => {
    if (!unlockedBadges.includes(id) && !newBadges.includes(id)) {
      newBadges.push(id);
    }
  };

  const userXP = Math.max(userData?.points || 0, stats?.xp || 0);

  if (userData?.attempts?.length >= 1) addIfNew("first_quiz");
  if (userData?.streak >= 3) addIfNew("streak_3");
  if (userData?.streak >= 7) addIfNew("consistent");
  if (userData?.attempts?.some((a: any) => a.score === 100)) addIfNew("perfect_score");
  if (userData?.totalSolved >= 50) addIfNew("notes_5");
  if (userData?.totalSolved >= 200) addIfNew("ai_chat");
  
  // New Premium Achievements
  if (userXP >= 5000) addIfNew("xp_5000");
  if (userData?.masteryLevel >= 5) addIfNew("mastery_5");
  if (userData?.totalSolved >= 100) addIfNew("solver_100");
  if (userData?.streak >= 15) addIfNew("streak_15");

  // Premium Milestone Additions
  if (userData?.focusSessions >= 10) addIfNew("focus_10");
  if (userData?.doubtsSolved >= 25) addIfNew("doubts_25");
  if (userData?.testsCompleted >= 15) addIfNew("test_15");
  if (userXP >= 10000) addIfNew("xp_10000");

  if (newBadges.length > 0) {
    const statsRef = doc(db, "user_stats", userId);
    await updateDoc(statsRef, { badges: arrayUnion(...newBadges) });
    return newBadges;
  }

  return [];
};
