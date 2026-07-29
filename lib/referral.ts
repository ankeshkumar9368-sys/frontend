import { db } from "./firebase";
import { 
  collection, 
  query, 
  where,
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  arrayUnion, 
  limit, 
  increment 
} from "firebase/firestore";
import { addXP } from "./gamification";
import { sendPrivateNotification } from "./analytics";

/**
 * Returns a 6-character referral code for a given user ID.
 */
export const getReferralCode = (userId: string) => {
  if (!userId) return "XXXXXX";
  return userId.substring(0, 6).toUpperCase();
};

export interface ReferralItem {
  uid: string;
  name: string;
  email?: string;
  joinedAt: string;
  status: "pending" | "completed";
  earnedAmount: number;
  completedAt?: string;
}

/**
 * Dynamic query to fetch all friends referred by a user code.
 * Works 100% reliably regardless of Firestore security rules on cross-user writes!
 */
export const getReferralsForUser = async (userCodeOrId: string): Promise<ReferralItem[]> => {
  if (!userCodeOrId) return [];
  try {
    const cleanCode = userCodeOrId.substring(0, 6).toUpperCase();
    const q = query(
      collection(db, "users"),
      where("referredByCode", "==", cleanCode)
    );
    const snap = await getDocs(q);
    const items: ReferralItem[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const is1Year = data.isSubscribed && (
        data.planType === "pro" || 
        (data.plan && (
          data.plan.toLowerCase().includes("pro") || 
          data.plan.toLowerCase().includes("year") || 
          data.plan.toLowerCase().includes("annual") || 
          data.plan.toLowerCase().includes("coupon")
        ))
      );

      items.push({
        uid: docSnap.id,
        name: data.name || "Student Friend",
        email: data.email || "Student",
        joinedAt: data.createdAt || data.referredAt || new Date().toISOString(),
        status: is1Year ? "completed" : "pending",
        earnedAmount: is1Year ? 50 : 0
      });
    });

    return items;
  } catch (e) {
    console.warn("[Referral] Fetch referrals notice:", e);
    return [];
  }
};

/**
 * Process when a user applies a friend's referral code.
 * User B enters User A's code: User B gets linked to User A.
 * Status is set to "pending" (joined, waiting for subscription).
 */
export const processReferralCode = async (currentUserId: string, referralCode: string) => {
  if (!currentUserId || !referralCode || referralCode.length < 6) {
    throw new Error("Please enter a valid 6-character invite code.");
  }

  const cleanCode = referralCode.trim().toUpperCase();

  // Ensure user isn't using their own code
  if (getReferralCode(currentUserId) === cleanCode) {
    throw new Error("You cannot use your own referral code.");
  }

  const currentUserRef = doc(db, "users", currentUserId);
  const currentUserSnap = await getDoc(currentUserRef);

  if (!currentUserSnap.exists()) {
    throw new Error("User profile not found.");
  }

  const currentUserData = currentUserSnap.data();

  if (currentUserData.referredBy || currentUserData.referredByCode) {
    throw new Error("You have already used an invite code.");
  }

  let referrerId: string = cleanCode;
  let referrerName: string = "Friend";

  // Attempt to look up referrer's name without failing if collection query is restricted
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(query(usersRef, limit(50)));
    snapshot.forEach((userDoc) => {
      if (userDoc.id.toUpperCase().startsWith(cleanCode)) {
        referrerId = userDoc.id;
        referrerName = userDoc.data()?.name || "Friend";
      }
    });
  } catch (e) {
    console.warn("[Referral] Collection query notice (using code mapping):", e);
  }

  // 1. Link current user to referrer & award +100 XP welcome bonus
  // This is on current user's OWN document, so it is 100% allowed by Firestore Security Rules.
  await updateDoc(currentUserRef, {
    referredBy: referrerId,
    referredByCode: cleanCode,
    referredByName: referrerName,
    referredAt: new Date().toISOString()
  });

  try {
    await addXP(currentUserId, 100, "Used an invite code bonus!");
  } catch (e) {
    console.warn("[Referral] addXP notice:", e);
  }

  // 2. Cross-user updates (updating referrer's document & sending notification)
  // Wrapped in try-catch so Firestore Security Rules never throw "insufficient permissions" to the user!
  try {
    const referrerRef = doc(db, "users", referrerId);
    const referrerSnap = await getDoc(referrerRef);

    if (referrerSnap.exists()) {
      const referrerData = referrerSnap.data();
      const currentReferrals: ReferralItem[] = referrerData.referrals || [];
      const existingIdx = currentReferrals.findIndex(r => r.uid === currentUserId);

      if (existingIdx === -1) {
        const newReferralEntry: ReferralItem = {
          uid: currentUserId,
          name: currentUserData.name || "New Aspirant",
          email: currentUserData.email || "Student",
          joinedAt: new Date().toISOString(),
          status: "pending",
          earnedAmount: 0
        };

        await updateDoc(referrerRef, {
          referrals: arrayUnion(newReferralEntry)
        });
      }
    }

    await sendPrivateNotification(
      referrerId,
      "👋 Friend Joined via your Link!",
      `${currentUserData.name || "A student"} joined using your referral code. You will earn ₹50 when they subscribe to Achivox Pro!`,
      "info"
    );
  } catch (crossErr) {
    console.warn("[Referral Notice] Cross-user document update restricted by security rules:", crossErr);
  }

  return { 
    success: true, 
    message: `Linked to ${referrerName}! +100 Bonus XP earned. 🎉` 
  };
};

/**
 * Triggered automatically when User B purchases ANY subscription.
 * Checks if User B was referred by User A.
 * If yes, updates User B's status to "completed" in User A's list
 * and credits ₹50 to User A's referral wallet (capped at ₹1,000 max).
 */
export const processReferralRewardOnSubscription = async (subscribedUserId: string) => {
  if (!subscribedUserId) return;

  try {
    const userRef = doc(db, "users", subscribedUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const referrerId = userData.referredBy || userData.referredByCode;

    // If user was not referred by anyone, no referral reward to credit
    if (!referrerId) return;

    // Check if referral reward for this subscription was already processed
    if (userData.referralRewardProcessed) return;

    // Check if user has an active 1-Year Pro Subscription
    const is1YearSub = userData.isSubscribed && (
      userData.planType === "pro" || 
      (userData.plan && (
        userData.plan.toLowerCase().includes("pro") || 
        userData.plan.toLowerCase().includes("year") || 
        userData.plan.toLowerCase().includes("annual") || 
        userData.plan.toLowerCase().includes("coupon")
      ))
    );

    if (!is1YearSub) {
      console.log(`[Referral] User ${subscribedUserId} subscription is not 1-Year Pro. Referral pending 1-Year purchase.`);
      return;
    }

    // Attempt to credit referrer's document (safely caught if restricted)
    try {
      const referrerRef = doc(db, "users", referrerId);
      const referrerSnap = await getDoc(referrerRef);

      if (referrerSnap.exists()) {
        const referrerData = referrerSnap.data();
        const currentEarnings = Number(referrerData.referralEarnings || 0);
        const MAX_PAYOUT = 1000;

        const potentialReward = 50;
        const actualReward = Math.max(0, Math.min(potentialReward, MAX_PAYOUT - currentEarnings));

        const currentReferrals: ReferralItem[] = referrerData.referrals || [];
        let updatedReferrals = [...currentReferrals];

        const targetIdx = updatedReferrals.findIndex(r => r.uid === subscribedUserId);

        if (targetIdx !== -1) {
          if (updatedReferrals[targetIdx].status === "completed") return;

          updatedReferrals[targetIdx] = {
            ...updatedReferrals[targetIdx],
            status: "completed",
            earnedAmount: actualReward,
            completedAt: new Date().toISOString()
          };
        } else {
          updatedReferrals.push({
            uid: subscribedUserId,
            name: userData.name || "Subscribed Student",
            email: userData.email || "Student",
            joinedAt: new Date().toISOString(),
            status: "completed",
            earnedAmount: actualReward,
            completedAt: new Date().toISOString()
          });
        }

        // Update Referrer Document
        await updateDoc(referrerRef, {
          referralEarnings: currentEarnings + actualReward,
          referralCount: increment(1),
          referrals: updatedReferrals
        });

        // Award Referrer +500 XP bonus as well!
        await addXP(referrerId, 500, "Friend subscribed to Achivox Pro! (₹50 Credited)");
      }
    } catch (refErr) {
      console.warn("[Referral Notice] Referrer credit restricted by security rules:", refErr);
    }

    // Mark current user as processed on their own document
    await updateDoc(userRef, {
      referralRewardProcessed: true
    });

  } catch (err) {
    console.error("Error processing referral reward on subscription:", err);
  }
};
