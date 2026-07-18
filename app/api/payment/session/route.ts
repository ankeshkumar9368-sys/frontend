import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, customerName, customerEmail, customerPhone, amount, planName } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing required parameter: userId" }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox"; // fallback to sandbox for test keys

    if (!appId || !secretKey) {
      console.error("Cashfree credentials are missing in process.env");
      return NextResponse.json({ error: "Billing setup is incomplete. CASHFREE_APP_ID or CASHFREE_SECRET_KEY missing in environment." }, { status: 500 });
    }

    // Set endpoints based on mode
    const baseUrl = mode === "production" 
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    const orderAmount = typeof amount === "number" && amount > 0 ? amount : 399.00;
    const sanitizedUserId = userId ? userId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 16) : "guest";
    const orderId = `ord_${sanitizedUserId}_${Date.now()}`;

    // Get origin from request headers to formulate return URL
    const origin = req.headers.get("origin") || "https://www.achivox.online";
    const returnUrl = `${origin}/subscription/verify?order_id=${orderId}`;

    const payload = {
      customer_details: {
        customer_id: sanitizedUserId,
        customer_email: customerEmail || "student@achivox.online",
        customer_phone: customerPhone || "9999999999",
        customer_name: customerName || "Academic Achiever"
      },
      order_amount: orderAmount,
      order_currency: "INR",
      order_id: orderId,
      order_note: `Achivox Subscription: ${planName || "Pro Plan"}`,
      order_meta: {
        return_url: returnUrl
      }
    };

    const response = await axios.post(`${baseUrl}/orders`, payload, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
      }
    });

    if (response.data && response.data.payment_session_id) {
      return NextResponse.json({
        success: true,
        payment_session_id: response.data.payment_session_id,
        order_id: response.data.order_id
      });
    } else {
      console.error("Unexpected response from Cashfree:", response.data);
      return NextResponse.json({ error: "Failed to fetch payment session ID from Cashfree" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Cashfree order creation error:", error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || "Internal payment setup error" 
    }, { status: 500 });
  }
}
