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

    // 5. Call Gemini — fast, accurate, cost-effective gemini-1.5-flash
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const aiModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: isJsonMode ? 0.1 : 0.7,
        maxOutputTokens: isJsonMode ? 16000 : 8192,
      },
    });

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
    }

    return NextResponse.json({
      text,
      usageMetadata: response.usageMetadata,
    });

  } catch (err: any) {
    console.error("[proxy] Error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
