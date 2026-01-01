// lib/firebaseFunctions.ts
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User,
} from "firebase/auth";
import {
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
} from "firebase/firestore";

/* ---------- TYPES ---------- */
export type Candidate = {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
};

export type AppUser = {
  uid: string;
  username: string;
  studentId: string;
  email: string;
  hasVoted: boolean;
  isAdmin: boolean;
};

/* ---------- AUTH ---------- */
export async function registerUser(
  username: string,
  studentId: string,
  email: string,
  password: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
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
  const unsub = onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) return cb(null);
    const snap = await getDoc(doc(db, "users", user.uid));
    cb(snap.exists() ? (snap.data() as AppUser) : null);
  });
  return unsub;
}

/* ---------- CANDIDATES ---------- */
export async function loadCandidates(): Promise<Candidate[]> {
  const snap = await getDocs(collection(db, "candidates"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

// Require current user to be admin
async function requireAdmin() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || !snap.data()?.isAdmin) throw new Error("Admin only");
}

export async function addCandidate(name: string, description: string, image: string) {
  await requireAdmin();
  await addDoc(collection(db, "candidates"), { name, description, image, votes: 0 });
}

export async function updateCandidate(
  id: string,
  name: string,
  description: string,
  image: string
) {
  await requireAdmin();
  await updateDoc(doc(db, "candidates", id), { name, description, image });
}

export async function deleteCandidate(id: string) {
  await requireAdmin();
  await deleteDoc(doc(db, "candidates", id));
}

/* ---------- VOTING ---------- */
export async function submitVote(uid: string, candidateId: string) {
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", uid);
    const candRef = doc(db, "candidates", candidateId);

    const uSnap = await tx.get(userRef);
    if (uSnap.data()?.hasVoted) throw new Error("Already voted");

    tx.update(userRef, { hasVoted: true });
    tx.update(candRef, { votes: increment(1) });
  });
}

/* ---------- RESET ELECTION ---------- */
export async function resetElection() {
  await requireAdmin();
  const batch = writeBatch(db);

  const cands = await getDocs(collection(db, "candidates"));
  cands.forEach((c) => batch.update(c.ref, { votes: 0 }));

  const users = await getDocs(collection(db, "users"));
  users.forEach((u) => {
    if (!u.data()?.isAdmin) batch.update(u.ref, { hasVoted: false });
  });

  await batch.commit();
}

/* ---------- ADMIN PASSWORD REAUTH ---------- */
export async function confirmAdminPassword(password: string) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Not authenticated");
  const cred = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, cred);
}
