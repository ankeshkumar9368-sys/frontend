import { db } from "./firebase";
import { 
  collection, doc, addDoc, updateDoc, onSnapshot, 
  query, where, limit, getDocs, serverTimestamp,
  increment, arrayUnion
} from "firebase/firestore";

export interface BattleRoom {
  id?: string;
  p1: { uid: string; name: string; avatar: string; score: number; currentQ: number };
  p2: { uid: string; name: string; avatar: string; score: number; currentQ: number } | null;
  status: "waiting" | "active" | "finished";
  questions: any[];
  subject: string;
  createdAt: any;
  winner: string | null;
}

export const createBattle = async (user: any, subject: string, questions: any[]) => {
  const battleRef = collection(db, "quiz_battles");
  const docRef = await addDoc(battleRef, {
    p1: {
      uid: user.uid,
      name: user.name || "Player 1",
      avatar: user.avatar || "",
      score: 0,
      currentQ: 0
    },
    p2: null,
    status: "waiting",
    subject,
    questions,
    createdAt: serverTimestamp(),
    winner: null
  });
  return docRef.id;
};

export const findOpenBattle = async (subject: string) => {
  const q = query(
    collection(db, "quiz_battles"),
    where("status", "==", "waiting"),
    where("subject", "==", subject),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as BattleRoom;
};

export const joinBattle = async (battleId: string, user: any) => {
  const battleRef = doc(db, "quiz_battles", battleId);
  await updateDoc(battleRef, {
    p2: {
      uid: user.uid,
      name: user.name || "Player 2",
      avatar: user.avatar || "",
      score: 0,
      currentQ: 0
    },
    status: "active"
  });
};

export const updateBattleScore = async (battleId: string, playerNum: 1 | 2, score: number, currentQ: number) => {
  const battleRef = doc(db, "quiz_battles", battleId);
  const field = playerNum === 1 ? "p1" : "p2";
  await updateDoc(battleRef, {
    [`${field}.score`]: increment(score),
    [`${field}.currentQ`]: currentQ
  });
};

export const finishBattle = async (battleId: string, winnerId: string) => {
  const battleRef = doc(db, "quiz_battles", battleId);
  await updateDoc(battleRef, {
    status: "finished",
    winner: winnerId
  });
};
