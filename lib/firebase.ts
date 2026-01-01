// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcO0h0171palg87-1jt8-tNyEgIga5Nnw", // <- Replace with a valid key from Firebase console
  authDomain: "student-election-f.firebaseapp.com",
  projectId: "student-election-f",
  storageBucket: "student-election-f.appspot.com",
  messagingSenderId: "248131229064",
  appId: "1:248131229064:web:935b6bc1525ccb42f3563d",
  measurementId: "G-RPX221TLPQ", // optional
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Auth and Firestore exports
export const auth = getAuth(app);
export const db = getFirestore(app);