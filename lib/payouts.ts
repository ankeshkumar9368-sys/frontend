import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";
import { sendPrivateNotification } from "./analytics";

export interface PayoutRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  upiId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: any;
  approvedAt?: any;
  rejectionReason?: string;
}

/**
 * Submit a new payout request for referral earnings.
 */
export const requestPayout = async (
  userId: string,
  userName: string,
  userEmail: string,
  upiId: string,
  amount: number
) => {
  if (!userId || !upiId || !amount) {
    throw new Error("Missing required parameters: UPI ID and Amount are required.");
  }

  const cleanUpi = upiId.trim();
  if (cleanUpi.length < 3 || !cleanUpi.includes("@")) {
    throw new Error("Please enter a valid UPI ID (e.g., name@upi or phone@paytm).");
  }

  // Get User doc to verify balance
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User profile not found.");
  }

  const userData = userSnap.data();
  const currentEarnings = Number(userData.referralEarnings || 0);

  if (amount < 50) {
    throw new Error("Minimum payout request amount is ₹50.");
  }

  if (amount > currentEarnings) {
    throw new Error(`Insufficient wallet balance. Available balance: ₹${currentEarnings}`);
  }

  // Save payout request to Firestore 'payouts' collection
  const payoutData: Omit<PayoutRequest, "id"> = {
    userId,
    userName: userName || userData.name || "Student",
    userEmail: userEmail || userData.email || "Student",
    upiId: cleanUpi,
    amount,
    status: "pending",
    requestedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, "payouts"), payoutData);

  // ✅ Immediately deduct from wallet when user submits (not on admin approval)
  await updateDoc(userRef, {
    referralEarnings: increment(-amount)
  });

  // Send confirmation notification to User
  await sendPrivateNotification(
    userId,
    "⌛ Payout Request Submitted",
    `Your request for ₹${amount} to UPI ID ${cleanUpi} has been submitted! ₹${amount} has been deducted from your wallet. Payment will be processed within 72 hours.`,
    "info"
  );

  return {
    success: true,
    id: docRef.id,
    message: `Payout request of ₹${amount} submitted! ₹${amount} deducted from wallet. Processing to ${cleanUpi} within 72 hours.`
  };

};

/**
 * Get payout history for a specific user.
 */
export const getUserPayoutHistory = async (userId: string): Promise<PayoutRequest[]> => {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, "payouts"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const history: PayoutRequest[] = [];
    snap.forEach((docSnap) => {
      history.push({ id: docSnap.id, ...docSnap.data() } as PayoutRequest);
    });
    // Sort client-side by requestedAt descending
    return history.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch (e) {
    console.warn("Fetch payout history notice:", e);
    return [];
  }
};

/**
 * Approve Payout Request (Called by Admin).
 * Sets status to 'approved', deducts amount from user's referralEarnings in Firestore,
 * and sends confirmation push notification.
 */
export const approvePayoutRequest = async (
  payoutId: string,
  userId: string,
  amount: number,
  upiId: string
) => {
  if (!payoutId || !userId) {
    throw new Error("Missing payout ID or user ID.");
  }

  // 1. Update payout document status to approved
  const payoutRef = doc(db, "payouts", payoutId);
  await updateDoc(payoutRef, {
    status: "approved",
    approvedAt: new Date().toISOString()
  });

  // NOTE: Wallet was already deducted when user submitted the payout request.
  // Do NOT deduct again here to avoid double-deduction.

  // 2. Send high-priority notification to student
  await sendPrivateNotification(
    userId,
    "🎉 Payout Processed Successfully!",
    `₹${amount} has been transferred to your UPI ID (${upiId})! Your referral wallet balance has been updated.`,
    "success"
  );

  return { success: true, message: `Approved payout ₹${amount} for user ${userId}.` };
};


/**
 * Reject Payout Request (Called by Admin).
 */
export const rejectPayoutRequest = async (
  payoutId: string,
  userId: string,
  reason?: string
) => {
  if (!payoutId || !userId) return;

  const payoutRef = doc(db, "payouts", payoutId);
  await updateDoc(payoutRef, {
    status: "rejected",
    rejectionReason: reason || "Invalid UPI ID or verification check failed."
  });

  await sendPrivateNotification(
    userId,
    "❌ Payout Request Rejected",
    `Your payout request was rejected. Reason: ${reason || "Invalid details"}. Please check your UPI ID and try again.`,
    "warning"
  );

  return { success: true };
};
