// lib/firebaseFunctions.ts
import { auth, db } from "./firebase";
import {
  Timestamp,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  increment,
  writeBatch,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// ================= TYPES =================
export type Candidate = {
  id?: string;
  name: string;
  description?: string;
  image?: string;
  votes: number;
  status: "pending" | "approved" | "rejected";
  criteria?: {
    manifesto?: string;
    vision?: string;
    experience?: string;
    submittedAt?: Timestamp;
  };
  uid?: string;
  studentId?: string;
  email?: string;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
};

export type AppUser = {
  uid: string;
  username: string;
  studentId: string;
  email: string;
  hasVoted: boolean;
  isAdmin: boolean;
  isCandidate?: boolean;
};

// ================= HELPERS =================
async function requireAdmin() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || !snap.data()?.isAdmin) throw new Error("Admin access required");
}

// ================= AUTH =================
export async function registerUser(username: string, studentId: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const q = query(collection(db, "users"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await cred.user.delete();
    throw new Error("Student ID already registered");
  }

  await setDoc(doc(db, "users", uid), {
    uid,
    username,
    studentId,
    email,
    hasVoted: false,
    isAdmin: false,
  });
}

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) throw new Error("User record not found");
  return snap.data() as AppUser;
}

export async function logoutUser() {
  await signOut(auth);
}

export function listenAuth(cb: (user: AppUser | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null);
    const snap = await getDoc(doc(db, "users", user.uid));
    cb(snap.exists() ? (snap.data() as AppUser) : null);
  });
}

// ================= CANDIDATE REGISTRATION =================
export async function registerCandidate(username: string, studentId: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const q = query(collection(db, "users"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await cred.user.delete();
    throw new Error("Student ID already registered");
  }

  await setDoc(doc(db, "users", uid), {
    uid,
    username,
    studentId,
    email,
    hasVoted: false,
    isAdmin: false,
    isCandidate: true,
  });

  await addDoc(collection(db, "candidates"), {
    uid,
    name: username,
    studentId,
    email,
    status: "pending",
    votes: 0,
    submittedAt: Timestamp.now(),
  });
}

export async function submitCandidateCriteria(candidateId: string, data: { manifesto: string; vision: string; experience: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const candRef = doc(db, "candidates", candidateId);
  const snap = await getDoc(candRef);
  if (!snap.exists() || snap.data()?.uid !== user.uid) throw new Error("Not authorized to update this candidate");

  await updateDoc(candRef, {
    criteria: { ...data, submittedAt: Timestamp.now() },
    status: "pending",
  });
}

// ================= ADMIN CANDIDATE MANAGEMENT =================
export async function addCandidateFirestore(name: string, description: string, image: string) {
  await requireAdmin();
  await addDoc(collection(db, "candidates"), {
    name,
    description,
    image,
    status: "approved", // manual adds auto-approved
    votes: 0,
    submittedAt: Timestamp.now(),
  });
}

export async function updateCandidate(id: string, name: string, description: string, image: string) {
  await requireAdmin();
  await updateDoc(doc(db, "candidates", id), { name, description, image });
}

export async function deleteCandidate(id: string) {
  await requireAdmin();
  await deleteDoc(doc(db, "candidates", id));
}

// ✅ NEW: Approve or Reject candidate
export async function updateCandidateStatus(id: string, status: "approved" | "rejected") {
  await requireAdmin();
  const candRef = doc(db, "candidates", id);
  await updateDoc(candRef, {
    status,
    approvedAt: status === "approved" ? Timestamp.now() : null,
    rejectedAt: status === "rejected" ? Timestamp.now() : null,
  });
}

// ================= VOTING =================
export async function submitVote(uid: string, candidateId: string) {
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", uid);
    const candRef = doc(db, "candidates", candidateId);
    const uSnap = await tx.get(userRef);
    const cSnap = await tx.get(candRef);

    if (uSnap.data()?.hasVoted) throw new Error("You have already voted");
    if (cSnap.data()?.status !== "approved") throw new Error("Candidate not approved");

    tx.update(userRef, { hasVoted: true, votedFor: candidateId });
    tx.update(candRef, { votes: increment(1) });
  });
}

// ================= RESET ELECTION =================
export async function resetElection() {
  await requireAdmin();
  const batch = writeBatch(db);

  const cands = await getDocs(collection(db, "candidates"));
  cands.forEach((c) => batch.update(c.ref, { votes: 0 }));

  const users = await getDocs(collection(db, "users"));
  users.forEach((u) => {
    if (!u.data()?.isAdmin) batch.update(u.ref, { hasVoted: false, votedFor: null });
  });

  await batch.commit();
}
