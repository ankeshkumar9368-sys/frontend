import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAtAvWpl48EVyQkN6QaMcTGY6_Veg2mOeo",
  authDomain: "achivox-76f43.firebaseapp.com",
  projectId: "achivox-76f43",
  storageBucket: "achivox-76f43.firebasestorage.app",
  messagingSenderId: "993951956139",
  appId: "1:993951956139:web:5a5c41afae36aa8bce4bee"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetAllUsers() {
  try {
    console.log("Fetching all users...");
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Found ${usersSnap.size} users. Resetting...`);

    let count = 0;
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      
      // Reset User
      await updateDoc(doc(db, "users", uid), {
        points: 0,
        testsCompleted: 0,
        totalSolved: 0,
        correctAnswers: 0,
        streak: 0,
        masteryLevel: 0,
        attempts: [],
        overallAccuracy: 0
      });

      // Reset User Stats
      await setDoc(doc(db, "user_stats", uid), {
        xp: 0,
        level: 1,
        coins: 0,
        points: 0,
        streak: 0,
        lastActive: new Date(),
        badges: [],
        history: [],
        redemptions: []
      }, { merge: true });

      console.log(`Reset user: ${uid}`);
      count++;
    }

    console.log(`Successfully reset ${count} users!`);
    process.exit(0);
  } catch (err) {
    console.error("Error resetting users:", err.message);
    process.exit(1);
  }
}

resetAllUsers();
