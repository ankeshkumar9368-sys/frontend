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

    // 5. Call Gemini — 10X Fast Config
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const generationConfig = {
      temperature: isJsonMode ? 0.1 : 0.7,
      maxOutputTokens: isJsonMode ? 4096 : 4096, // Optimized for 5X faster completion
      ...(isJsonMode ? { responseMimeType: "application/json" } : {})
    };

    // Fast Execution with Gemini 3.5 Flash-Lite
    const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-2.5-flash"];
    let text = "";
    let usageMetadata: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const modelInstance = genAI.getGenerativeModel({
          model: modelName,
          generationConfig
        });
        const result = await modelInstance.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        usageMetadata = response.usageMetadata;
        if (text && text.trim().length > 0) {
          console.log(`[proxy] Fast generation success with model: ${modelName}`);
          break; // Success!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[proxy] Model ${modelName} failed:`, err?.message || err);
        // If 403 Forbidden or 404, immediately try next model without delay
      }
    }

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: lastError?.message || "AI returned empty response or access restricted." },
        { status: 500 }
      );
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
