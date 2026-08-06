/**
 * ACHIVOX — Teacher Role Cleanup Script (v2 - uses admin email auth)
 * Uses Firebase REST API with admin credentials to revoke all teacher roles.
 * Run: node scripts/revoke-all-teachers.mjs
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAtAvWpl48EVyQkN6QaMcTGY6_Veg2mOeo",
  authDomain: "achivox-76f43.firebaseapp.com",
  projectId: "achivox-76f43",
  storageBucket: "achivox-76f43.firebasestorage.app",
  messagingSenderId: "993951956139",
  appId: "1:993951956139:web:5a5c41afae36aa8bce4bee",
};

// ── Admin credentials (from firestore.rules allowlist) ──
const ADMIN_EMAIL = "ankeshkumar9368@gmail.com";

// Pass password via env: ADMIN_PASS=yourpassword node scripts/revoke-all-teachers.mjs
const ADMIN_PASS = process.env.ADMIN_PASS;

if (!ADMIN_PASS) {
  console.error("\n❌ ERROR: Please provide admin password via env variable.");
  console.error("   Usage: $env:ADMIN_PASS='your_password'; node scripts/revoke-all-teachers.mjs");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function revokeAllTeachers() {
  console.log("\n🔐 ACHIVOX — Revoking ALL teacher access from Firestore...");
  console.log(`   Logging in as admin: ${ADMIN_EMAIL}\n`);

  // Sign in as admin
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASS);
  console.log("   ✅ Admin login successful!\n");

  const usersSnap = await getDocs(collection(db, "users"));
  let revokedCount = 0;
  let skippedCount = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;
    const email = data.email || "unknown";
    const name = data.displayName || data.name || "Unknown";

    const hasTeacherRole =
      data.role === "teacher" ||
      data.isTeacher === true ||
      data.teacherVerified === true;

    if (hasTeacherRole) {
      await updateDoc(doc(db, "users", uid), {
        role: "student",
        isTeacher: false,
        teacherVerified: false,
        teacherRevokedAt: new Date().toISOString(),
      });
      console.log(`  ✅ REVOKED: ${name} (${email})`);
      revokedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("\n──────────────────────────────────────────────────");
  console.log(`  Total users scanned    : ${usersSnap.docs.length}`);
  console.log(`  Teacher access REVOKED : ${revokedCount}`);
  console.log(`  Already students       : ${skippedCount}`);
  console.log("──────────────────────────────────────────────────");
  console.log("\n✅ DONE! All teacher access has been removed from Firestore.");
  console.log("   To become a teacher again, the new server-side code must be entered.\n");

  process.exit(0);
}

revokeAllTeachers().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
