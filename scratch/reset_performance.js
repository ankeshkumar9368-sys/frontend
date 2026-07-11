const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../../config/firebaseServiceAccount.json'); // Adjust path as needed, or use default app if GOOGLE_APPLICATION_CREDENTIALS is set

// Initialize Firebase Admin (assuming default credentials or similar if local dev, we'll just try to use default if we can, or skip admin and use the web sdk if we write it in the app)
