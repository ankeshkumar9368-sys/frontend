import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

if (!admin.apps.length) {
  let credential;
  
  // Try finding serviceAccountKey.json in the project
  const serviceAccountPath = path.join(process.cwd(), 'scripts', 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_PROJECT_ID) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    });
  }

  try {
    admin.initializeApp({
      ...(credential ? { credential } : {}),
    });
  } catch (error: any) {
    console.warn("Firebase Admin initialization warning:", error?.message);
    try {
      admin.initializeApp();
    } catch (e) {}
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
