const admin = require('firebase-admin');
const serviceAccount = require('c:/Users/Admin/S2Dent/examhero-backend/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function getLogs() {
  const snap = await db.collection('system_logs').orderBy('timestamp', 'desc').limit(50).get();
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`[${data.timestamp?.toDate().toISOString()}] [${data.type?.toUpperCase()}] ${data.message}`);
  });
}

getLogs().catch(console.error);
