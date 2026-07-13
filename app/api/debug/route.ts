import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || "";
  
  const diagnostics = {
    hasKey: GEMINI_API_KEY !== "",
    keyLength: GEMINI_API_KEY.length,
    keyPrefix: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 5) : "none",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || "unknown",
  };

  if (!GEMINI_API_KEY) {
    return NextResponse.json({
      status: "ERROR",
      message: "GOOGLE_AI_API_KEY is missing in this Vercel environment.",
      diagnostics
    }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say 'Debug OK' in one word.");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      status: "SUCCESS",
      message: "Gemini API successfully generated content on Vercel!",
      aiResponse: text.trim(),
      diagnostics
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "FAILED",
      message: "Failed to generate content using Gemini API.",
      error: error.message || error,
      diagnostics
    }, { status: 500 });
  }
}
