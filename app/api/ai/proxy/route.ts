import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Read API key from server-side env ONLY — never exposed to client
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || "";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAtAvWpl48EVyQkN6QaMcTGY6_Veg2mOeo";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "dummy_key");

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({
      error: "Gemini API Key is not configured on the server. Please set GOOGLE_AI_API_KEY in Vercel environment variables."
    }, { status: 500 });
  }

  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error(`[SECURITY] Missing auth header from IP: ${req.headers.get("x-forwarded-for") || "unknown"}`);
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // 2. Verify Firebase ID Token using Identity Toolkit REST API (no Admin SDK needed)
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      }
    );

    const verifyData = await verifyRes.json();

    if (verifyData.error || !verifyData.users || verifyData.users.length === 0) {
      console.error("[SECURITY] Invalid Firebase token received");
      return NextResponse.json({ error: "Unauthorized access: Invalid Token" }, { status: 401 });
    }

    // 3. Parse the request body
    const body = await req.json();
    const { prompt, isJsonMode } = body;

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // 4. Call Gemini securely from the server side
    const generationConfig: any = isJsonMode
      ? {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 12000,
          topK: 40,
          topP: 0.95
        }
      : {
          temperature: 0.7,
          maxOutputTokens: 4096
        };

    const aiModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig
    });

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "AI returned empty response." }, { status: 500 });
    }

    return NextResponse.json({
      text,
      usageMetadata: response.usageMetadata
    }, { status: 200 });

  } catch (error: any) {
    console.error("AI Proxy Route Error:", error);
    return NextResponse.json({
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}
