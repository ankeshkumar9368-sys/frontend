import { NextRequest, NextResponse } from "next/server";

// ── SECURE: This runs server-side only — never exposed to browser ──
const TEACHER_SECRET = process.env.TEACHER_SECRET_CODE || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode, uid, email } = body;

    // 1. Validate inputs
    if (!passcode || !uid || !email) {
      return NextResponse.json({ success: false, error: "Missing fields." }, { status: 400 });
    }

    // 2. Check passcode matches server-side secret (never exposed to client)
    if (passcode.trim().toUpperCase() !== TEACHER_SECRET.trim().toUpperCase()) {
      return NextResponse.json({ success: false, error: "Invalid Teacher Access Code." }, { status: 403 });
    }

    // 3. Return success — client will update Firestore role
    return NextResponse.json({ success: true, message: "Verified." }, { status: 200 });

  } catch (err: any) {
    console.error("Teacher verify error:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
