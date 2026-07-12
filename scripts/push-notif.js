const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Download your service account key from Firebase Console
// 2. Place it in this directory and rename it to 'serviceAccountKey.json'
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.log('Please place your Firebase Service Account JSON file in the scripts/ directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const sendNotification = async (title, body, type = 'update') => {
  try {
    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      title,
      body,
      type,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    console.log(`✅ Success: Notification "${title}" pushed to all users!`);
  } catch (error) {
    console.error('❌ Failed to push notification:', error);
  }
};

// GET ARGUMENTS FROM TERMINAL
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/push-notif.js "Title" "Message Body" "type(alert|update)"');
  process.exit(0);
}

const [title, body, type] = args;
sendNotification(title, body, type || 'update');
