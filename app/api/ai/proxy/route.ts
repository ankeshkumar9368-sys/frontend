import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side only — NEVER sent to browser
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || "";

// Firebase Web API Key (public, used only for token verification)
const FIREBASE_API_KEY = "AIzaSyAtAvWpl48EVyQkN6QaMcTGY6_Veg2mOeo";

export async function POST(req: NextRequest) {
  // 1. Check API key is configured
  if (!GEMINI_API_KEY) {
    console.error("[proxy] GOOGLE_AI_API_KEY not set on server");
    return NextResponse.json({ error: "Server AI key not configured." }, { status: 500 });
  }

  try {
    // 2. Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.replace("Bearer ", "").trim();

    // 3. Verify Firebase ID Token
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    const verifyData = await verifyRes.json();
    if (verifyData.error || !verifyData.users?.length) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // 4. Parse request
    const body = await req.json();
    const { prompt, isJsonMode } = body;
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // 5. Call Gemini — 10X Fast, Highly Accurate gemini-2.0-flash with fallback
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generationConfig = {
      temperature: isJsonMode ? 0.1 : 0.7,
      maxOutputTokens: isJsonMode ? 16000 : 8192,
      ...(isJsonMode ? { responseMimeType: "application/json" } : {})
    };

    // Gemini 3.6 Flash — forced, with retry loop for transient overload errors
    const fastModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",  // Gemini 3.6 Flash
      generationConfig
    });

    let result: any = null;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await fastModel.generateContent(prompt);
        break; // Success!
      } catch (err: any) {
        lastErr = err;
        console.warn(`[proxy] Attempt ${attempt} failed for gemini-2.5-flash:`, err?.message || err);
        if (attempt < 3) {
          // Wait 1.2s before retrying
          await new Promise(r => setTimeout(r, 1200 * attempt));
        }
      }
    }

    if (!result) {
      throw lastErr || new Error("Gemini model API is currently overloaded. Please try again in a few seconds.");
    }

    const response = await result.response;
    const text = response.text();
    const usageMetadata = response.usageMetadata;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    return NextResponse.json({
      text,
      usageMetadata,
    });

  } catch (err: any) {
    console.error("[proxy] Error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
