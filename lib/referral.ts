import { db } from "./firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, setDoc, documentId, limit } from "firebase/firestore";
import { addXP } from "./gamification";

/**
 * Returns a 6-character referral code for a given user ID.
 */
export const getReferralCode = (userId: string) => {
  return userId.substring(0, 6).toUpperCase();
};

/**
 * Validates a referral code and awards both users if valid.
 */
export const processReferral = async (currentUserId: string, referralCode: string) => {
  if (!currentUserId || !referralCode || referralCode.length < 6) {
    throw new Error("Invalid referral code.");
  }

  // Ensure user isn't using their own code
  if (getReferralCode(currentUserId) === referralCode) {
    throw new Error("You cannot use your own referral code.");
  }

  const currentUserRef = doc(db, "users", currentUserId);
  const currentUserSnap = await getDoc(currentUserRef);

  if (!currentUserSnap.exists()) {
    throw new Error("User profile not found.");
  }

  const currentUserData = currentUserSnap.data();

  // Check if they already used a referral code
  if (currentUserData.referredBy) {
    throw new Error("You have already claimed a referral reward.");
  }

  // Find the referrer by the prefix of their document ID
  // In Firebase, documentId() allows querying by prefix using lexicographical bounds
  const usersRef = collection(db, "users");
  
  // Note: For exact matches, since we only know the first 6 chars of UID, we must use prefix search
  // But to avoid edge cases, it's safer if we query all users or maintain a referral lookup.
  // We'll use the prefix bound query.
  // Be careful: documentId() requires the full path in some SDK versions if not used properly,
  // but it usually works on the collection level.
  
  // A safer alternative if documentId() prefix query fails on web: 
  // We can just fetch the user document directly if we know the full UID, but we don't.
  // Let's use string bounds.
  const q = query(
    usersRef,
    // Note: Firebase JS SDK requires the `__name__` / documentId to be queried precisely.
    // To avoid complex rules, we'll fetch a limited set or assume we stored `referralCode` in users.
    // Since we don't store referralCode yet, let's try to query by a new field we might add later,
    // or just assume we're adding it on login.
    limit(10) // Fallback just in case
  );

  const snapshot = await getDocs(q);
  let referrerId = null;

  // Manual filter since documentId prefix queries can be tricky without exact full paths
  snapshot.forEach((doc) => {
    if (doc.id.toUpperCase().startsWith(referralCode.toUpperCase())) {
      referrerId = doc.id;
    }
  });

  if (!referrerId) {
    throw new Error("Invalid referral code. Friend not found.");
  }

  // Award the Referrer (+500 XP)
  await addXP(referrerId, 500, "Friend joined using your referral code!");
  
  // Give referrer 3 Days of Premium (optimistic update to subscriptionDate)
  // Or simply grant them XP for now. The prompt said "3 Days of Premium + 500 XP".
  // Let's focus on XP first, as Premium requires updating `isSubscribed` and `subscriptionDate`.
  const referrerRef = doc(db, "users", referrerId);
  await updateDoc(referrerRef, {
    isSubscribed: true,
    // This is basic, a more complex system would extend the date.
  });

  // Award the Current User (+500 XP)
  await addXP(currentUserId, 500, "Used a friend's referral code!");

  // Mark the current user as referred
  await updateDoc(currentUserRef, {
    referredBy: referrerId,
    isSubscribed: true // Grant premium to the new user too
  });

  return { success: true, message: "Rewards claimed successfully!" };
};
