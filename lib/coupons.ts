import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  increment 
} from "firebase/firestore";

export interface CouponItem {
  id?: string;
  code: string;
  discountPercent: number; // e.g. 100 for 100% OFF, 50 for 50% OFF, 20 for 20% OFF
  planName?: string;
  maxUses?: number;
  usedCount: number;
  usedBy?: Array<{
    userId: string;
    userEmail?: string;
    usedAt: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

/**
 * Admin: Create a new Coupon Code.
 */
export const createCouponCode = async (
  code: string,
  discountPercent: number,
  planName?: string,
  maxUses: number = 500
) => {
  if (!code || !discountPercent) {
    throw new Error("Coupon code and discount percentage are required.");
  }

  const cleanCode = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const couponRef = doc(db, "coupons", cleanCode);
  const couponData: CouponItem = {
    code: cleanCode,
    discountPercent: Number(discountPercent),
    planName: planName || "Achivox Pro 1-Year",
    maxUses: Number(maxUses),
    usedCount: 0,
    usedBy: [],
    isActive: true,
    createdAt: new Date().toISOString()
  };

  await setDoc(couponRef, couponData, { merge: true });
  return { success: true, message: `Coupon code ${cleanCode} created successfully!` };
};

/**
 * Fetch all coupon codes for Admin Panel analytics.
 */
export const getAllCoupons = async (): Promise<CouponItem[]> => {
  try {
    const snap = await getDocs(collection(db, "coupons"));
    const coupons: CouponItem[] = [];
    snap.forEach((docSnap) => {
      coupons.push({ id: docSnap.id, ...docSnap.data() } as CouponItem);
    });
    return coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.warn("Fetch coupons notice:", e);
    return [];
  }
};

/**
 * Validate and record coupon usage when a user applies a code.
 */
export const validateAndApplyCoupon = async (code: string, userId: string, userEmail: string) => {
  if (!code) throw new Error("Please enter a coupon code.");

  const cleanCode = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // Hardcoded Secret Coupons fallback
  if (cleanCode === "ANKESH100" || cleanCode === "ANKESH" || cleanCode.includes("ANKESH")) {
    return {
      success: true,
      code: "ANKESH100",
      discountPercent: 100,
      message: "Secret 100% OFF Coupon Applied! Achivox Pro Unlocked."
    };
  }

  const couponRef = doc(db, "coupons", cleanCode);
  const couponSnap = await getDoc(couponRef);

  if (!couponSnap.exists()) {
    throw new Error(`Invalid coupon code: "${cleanCode}"`);
  }

  const couponData = couponSnap.data() as CouponItem;

  if (!couponData.isActive) {
    throw new Error("This coupon code has been deactivated.");
  }

  if (couponData.maxUses && couponData.usedCount >= couponData.maxUses) {
    throw new Error("This coupon code has reached its maximum usage limit.");
  }

  // Record usage
  if (userId) {
    await updateDoc(couponRef, {
      usedCount: increment(1),
      usedBy: arrayUnion({
        userId,
        userEmail: userEmail || "Student",
        usedAt: new Date().toISOString()
      })
    });
  }

  return {
    success: true,
    code: cleanCode,
    discountPercent: couponData.discountPercent,
    message: `${couponData.discountPercent}% OFF Coupon Applied!`
  };
};

/**
 * Delete a Coupon Code (Admin).
 */
export const deleteCouponCode = async (code: string) => {
  if (!code) return;
  await deleteDoc(doc(db, "coupons", code));
  return { success: true };
};
