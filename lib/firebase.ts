import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAtAvWpl48EVyQkN6QaMcTGY6_Veg2mOeo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "achivox-76f43.firebaseapp.com",
  projectId: "achivox-76f43",
  storageBucket: "achivox-76f43.firebasestorage.app",
  messagingSenderId: "993951956139",
  appId: "1:993951956139:web:5a5c41afae36aa8bce4bee",
  measurementId: "G-R4EL7PVJVB"
};

let app;
let db;
let storage;

const isBrowser = typeof window !== "undefined";

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (isBrowser) {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } else {
    db = getFirestore(app);
  }
  storage = getStorage(app);
} else {
  app = getApp();
  db = getFirestore(app);
  storage = getStorage(app);
}

const auth = getAuth(app);

export { app, auth, db, storage };
