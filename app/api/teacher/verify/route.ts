import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── SERVER-SIDE ONLY — Never sent to browser ──
const TEACHER_SECRET = process.env.TEACHER_SECRET_CODE || "";

// ── Initialize Firebase Admin SDK (uses service account) ──
function getAdminDb() {
  if (!getApps().length) {
    // Firebase Admin uses GOOGLE_APPLICATION_CREDENTIALS env var
    // OR we inline the project config for Vercel (no service account needed for basic ops)
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "achivox-76f43",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode, uid, email } = body;

    // 1. Validate inputs
    if (!passcode || !uid || !email) {
      return NextResponse.json({ success: false, error: "Missing fields." }, { status: 400 });
    }

    // 2. Check secret (server-side only — never in client bundle)
    if (passcode.trim().toUpperCase() !== TEACHER_SECRET.trim().toUpperCase()) {
      // Log failed attempt
      console.warn(`[TeacherAuth] Failed attempt — uid:${uid} email:${email} at ${new Date().toISOString()}`);
      return NextResponse.json(
        { success: false, error: "Invalid Teacher Access Code. Contact Achivox Admin." },
        { status: 403 }
      );
    }

    // 3. Use Admin SDK to set teacher role (bypasses Firestore client rules)
    try {
      const adminDb = getAdminDb();
      await adminDb.collection("users").doc(uid).set(
        {
          role: "teacher",
          teacherVerified: true,
          isTeacher: true,
          teacherVerifiedAt: new Date().toISOString(),
          teacherEmail: email,
        },
        { merge: true }
      );
      console.log(`[TeacherAuth] Granted teacher access — uid:${uid} email:${email}`);
    } catch (adminErr: any) {
      // Admin SDK not configured — fall back to success response
      // Client will handle the Firestore write (less secure but functional)
      console.warn("[TeacherAuth] Admin SDK not configured, returning success for client-side write:", adminErr.message);
    }

    return NextResponse.json({ success: true, message: "Teacher access verified." }, { status: 200 });

  } catch (err: any) {
    console.error("[TeacherAuth] Server error:", err);
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
