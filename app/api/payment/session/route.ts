import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { userId, customerName, customerEmail, customerPhone } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing required parameter: userId" }, { status: 400 });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox"; // fallback to sandbox

    if (!appId || !secretKey) {
      console.error("Cashfree credentials are missing in process.env");
      return NextResponse.json({ error: "Billing setup is incomplete. Contact support." }, { status: 500 });
    }

    // Set endpoints based on mode
    const baseUrl = mode === "production" 
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    // Generate unique order ID (order_sub_<userId>_<timestamp>)
    const orderId = `order_sub_${userId.substring(0, 10)}_${Date.now()}`;

    // Get origin from request headers to formulate return URL
    const origin = req.headers.get("origin") || "https://www.achivox.online";
    const returnUrl = `${origin}/subscription/verify?order_id=${orderId}`;

    const payload = {
      customer_details: {
        customer_id: userId,
        customer_email: customerEmail || "student@examhero.ai",
        customer_phone: customerPhone || "9999999999",
        customer_name: customerName || "Student"
      },
      order_amount: 499.00,
      order_currency: "INR",
      order_id: orderId,
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
