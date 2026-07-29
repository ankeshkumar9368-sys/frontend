import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/referral/credit
 * Server-side referral credit using Firebase Admin SDK.
 * Bypasses Firestore security rules — can write to any user's document.
 * Called automatically after a successful subscription.
 */
export async function POST(req: Request) {
  try {
    const { subscribedUserId } = await req.json();

    if (!subscribedUserId) {
      return NextResponse.json({ error: "Missing subscribedUserId" }, { status: 400 });
    }

    // Fetch subscriber document
    const subscriberRef = db.collection("users").doc(subscribedUserId);
    const subscriberSnap = await subscriberRef.get();

    if (!subscriberSnap.exists) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const subscriberData = subscriberSnap.data() || {};

    // Must be subscribed
    if (!subscriberData.isSubscribed) {
      return NextResponse.json({ error: "User is not subscribed" }, { status: 400 });
    }

    // Must have a referral code
    const rawCode = subscriberData.referredByCode || subscriberData.referredBy;
    if (!rawCode) {
      return NextResponse.json({ message: "No referrer code found — no action needed" });
    }

    // Already processed and referrer was credited — skip
    if (subscriberData.referralRewardProcessed && subscriberData.referralRewardAmount > 0) {
      // Double-check referrer balance to detect missed credits
      const refCode = rawCode.substring(0, 6).toUpperCase();
      const referrerQuery = await db.collection("users")
        .where("__name__", ">=", refCode.toLowerCase())
        .limit(100)
        .get();

      // Try prefix-based approach — get all users, find matching
      const allUsersSnap = await db.collection("users").get();
      let referrerDoc: FirebaseFirestore.DocumentSnapshot | null = null;
      allUsersSnap.forEach((d) => {
        if (d.id.toUpperCase().startsWith(refCode)) {
          referrerDoc = d;
        }
      });

      if (referrerDoc) {
        const referrerData = (referrerDoc as FirebaseFirestore.DocumentSnapshot).data() || {};
        const referrerEarnings = Number(referrerData.referralEarnings || 0);
        if (referrerEarnings > 0) {
          return NextResponse.json({ 
            message: `Already credited ₹${subscriberData.referralRewardAmount} — referrer has ₹${referrerEarnings}` 
          });
        }
        // Referrer has ₹0 despite being marked — fall through to re-credit
      }
    }

    // Find referrer by UID prefix
    const refCode = rawCode.substring(0, 6).toUpperCase();
    const allUsersSnap = await db.collection("users").get();
    let referrerId: string | null = null;

    allUsersSnap.forEach((d) => {
      if (d.id.toUpperCase().startsWith(refCode)) {
        referrerId = d.id;
      }
    });

    if (!referrerId) {
      return NextResponse.json({ 
        error: `Referrer not found for code: ${refCode}` 
      }, { status: 404 });
    }

    // Get referrer's current balance
    const referrerRef = db.collection("users").doc(referrerId);
    const referrerSnap = await referrerRef.get();
    const referrerData = referrerSnap.data() || {};
    const currentEarnings = Number(referrerData.referralEarnings || 0);
    const MAX_PAYOUT = 1000;
    const reward = Math.max(0, Math.min(50, MAX_PAYOUT - currentEarnings));

    if (reward <= 0) {
      return NextResponse.json({ message: `Referrer has reached ₹1000 max payout` });
    }

    // ✅ Credit referrer using Firebase Admin (bypasses Firestore rules!)
    await referrerRef.update({
      referralEarnings: FieldValue.increment(reward),
      referralCount: FieldValue.increment(1),
    });

    // ✅ Mark subscriber as processed on their own document
    await subscriberRef.update({
      referralRewardProcessed: true,
      referralRewardAmount: reward,
      referralRewardAt: new Date().toISOString(),
    });

    console.log(`[Referral API] ✅ Credited ₹${reward} to ${referrerId} for subscriber ${subscribedUserId}`);

    return NextResponse.json({ 
      success: true, 
      credited: reward, 
      referrerId,
      message: `₹${reward} credited to referrer ${referrerId}` 
    });

  } catch (err: any) {
    console.error("[Referral API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
