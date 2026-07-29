import { db } from "./firebase";
import { 
  collection, 
  query, 
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

  if (currentUserData.referredBy) {
    throw new Error("You have already used an invite code.");
  }

  // Find the referrer by matching referralCode to doc ID prefix
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(query(usersRef, limit(50)));
  let referrerId: string | null = null;
  let referrerName: string = "Friend";

  snapshot.forEach((userDoc) => {
    if (userDoc.id.toUpperCase().startsWith(cleanCode)) {
      referrerId = userDoc.id;
      referrerName = userDoc.data()?.name || "Friend";
    }
  });

  if (!referrerId) {
    throw new Error("Invalid invite code. Friend profile not found.");
  }

  const referrerRef = doc(db, "users", referrerId);
  const referrerSnap = await getDoc(referrerRef);
  const referrerData = referrerSnap.exists() ? referrerSnap.data() : {};
  const currentReferrals: ReferralItem[] = referrerData.referrals || [];

  // Check if current user is already in referrer's list
  const existingIdx = currentReferrals.findIndex(r => r.uid === currentUserId);
  if (existingIdx === -1) {
    const newReferralEntry: ReferralItem = {
      uid: currentUserId,
      name: currentUserData.name || "New Aspirant",
      email: currentUserData.email || "Student",
      joinedAt: new Date().toISOString(),
      status: "pending", // Pending until subscription purchase
      earnedAmount: 0
    };

    await updateDoc(referrerRef, {
      referrals: arrayUnion(newReferralEntry)
    });
  }

  // Link current user to referrer & award +100 XP welcome bonus
  await updateDoc(currentUserRef, {
    referredBy: referrerId,
    referredByName: referrerName
  });

  await addXP(currentUserId, 100, "Used an invite code bonus!");

  // Notify referrer that a friend joined using their link
  await sendPrivateNotification(
    referrerId,
    "👋 Friend Joined via your Link!",
    `${currentUserData.name || "A student"} joined using your referral code. You will earn ₹50 when they subscribe to Achivox Pro!`,
    "info"
  );

  return { 
    success: true, 
    message: `Linked to ${referrerName}! +100 Bonus XP earned.` 
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
    const referrerId = userData.referredBy;

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

    const referrerRef = doc(db, "users", referrerId);
    const referrerSnap = await getDoc(referrerRef);

    if (!referrerSnap.exists()) return;

    const referrerData = referrerSnap.data();
    const currentEarnings = Number(referrerData.referralEarnings || 0);
    const MAX_PAYOUT = 1000;

    // If max payout limit ₹1,000 is already reached
    const potentialReward = 50;
    const actualReward = Math.max(0, Math.min(potentialReward, MAX_PAYOUT - currentEarnings));

    const currentReferrals: ReferralItem[] = referrerData.referrals || [];
    let updatedReferrals = [...currentReferrals];

    const targetIdx = updatedReferrals.findIndex(r => r.uid === subscribedUserId);

    if (targetIdx !== -1) {
      // Don't re-reward if already completed
      if (updatedReferrals[targetIdx].status === "completed") return;

      updatedReferrals[targetIdx] = {
        ...updatedReferrals[targetIdx],
        status: "completed",
        earnedAmount: actualReward,
        completedAt: new Date().toISOString()
      };
    } else {
      // If for some reason user wasn't in list yet, add as completed
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

    // Mark current user as processed
    await updateDoc(userRef, {
      referralRewardProcessed: true
    });

    // Award Referrer +500 XP bonus as well!
    await addXP(referrerId, 500, "Friend subscribed to Achivox Pro! (₹50 Credited)");

    // Send high-priority notification to Referrer
    await sendPrivateNotification(
      referrerId,
      "🎉 ₹50 Credited to your Profile Wallet!",
      `Your friend ${userData.name || "A referred student"} subscribed to Achivox Pro! ₹50 has been added to your profile wallet. (Total Earned: ₹${currentEarnings + actualReward}/₹1,000)`,
      "success"
    );

    console.log(`[Referral] Credited ₹${actualReward} to referrer ${referrerId} for user ${subscribedUserId}`);
  } catch (error) {
    console.error("Error processing referral reward on subscription:", error);
  }
};
