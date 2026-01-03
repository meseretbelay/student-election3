// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Check .env.local has FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY"
    );
  }

  // Critical fix: Clean and normalize private key
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  // Remove any surrounding quotes if present
  privateKey = privateKey.trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  // Optional: Log first/last few chars to debug (remove later)
  console.log("Private key starts with:", privateKey.slice(0, 30));
  console.log("Private key ends with:", privateKey.slice(-30));

  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully!");
  } catch (error: any) {
    console.error("Firebase Admin init failed:", error.message);
    throw error; // Re-throw to crash route and show clear error
  }
}

export const getAdminDb = () => getFirestore();
export const getAdminAuth = () => getAuth();