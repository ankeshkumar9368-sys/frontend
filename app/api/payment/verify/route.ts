import { NextResponse } from "next/server";
import axios from "axios";
import { db, admin } from "../../../../lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing required parameter: orderId" }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox"; // fallback to sandbox for test keys

    if (!appId || !secretKey) {
      console.error("Cashfree credentials are missing in process.env");
      return NextResponse.json({ error: "Billing setup is incomplete." }, { status: 500 });
    }

    // Set endpoints based on mode
    const baseUrl = mode === "production" 
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    // Call Cashfree GET /orders/{order_id}
    const response = await axios.get(`${baseUrl}/orders/${orderId}`, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
      }
    });

    const orderData = response.data;
    console.log(`Cashfree Verify: Order ${orderId} Status is ${orderData?.order_status}`);

    if (orderData && (orderData.order_status === "PAID" || orderData.order_status === "SUCCESS")) {
      const customerId = orderData.customer_details?.customer_id;
      let userId = customerId;
      if (!userId && orderId.startsWith("ord_")) {
        const parts = orderId.split("_");
        if (parts.length >= 2) userId = parts[1];
      }

      if (!userId) {
        return NextResponse.json({ error: "User ID not found in Cashfree order meta" }, { status: 400 });
      }

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      // Update Firestore user document if db admin is available
      if (db) {
        try {
          const userRef = db.collection("users").doc(userId);
          await userRef.set({
            isSubscribed: true,
            planType: "pro",
            plan: "Achivox Pro",
            premiumEndDate: admin ? admin.firestore.Timestamp.fromDate(oneYearFromNow) : oneYearFromNow.toISOString(),
            updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
          }, { merge: true });

          // Save transaction for bookkeeping
          await db.collection("payments").doc(orderId).set({
            userId,
            orderId,
            amount: orderData.order_amount,
            status: orderData.order_status,
            paymentGateway: "cashfree",
            gatewayResponse: orderData,
            createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
          }, { merge: true });
        } catch (dbErr: any) {
          console.warn("Firestore admin update warning:", dbErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully. Subscription activated.",
        userId
      });
    } else {
      return NextResponse.json({
        success: false,
        status: orderData?.order_status || "UNKNOWN",
        message: `Payment status is ${orderData?.order_status || "PENDING"}. If amount was debited, it will reflect within 5 minutes.`
      });
    }
  } catch (error: any) {
    console.error("Cashfree verification error:", error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || "Internal payment verification error" 
    }, { status: 500 });
  }
}
