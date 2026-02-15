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
  DocumentData,
  QueryDocumentSnapshot,
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
  isAdminAdded?: boolean;
  addedBy?: "admin" | "candidate";
  criteria?: {
    manifesto?: string;
    vision?: string;
    experience?: string;
    department?: string;
    cgpa?: string;
    year?: string;
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
  votedFor?: string | null;
};

// ================= TYPE CONVERTERS =================
const convertUserDoc = (doc: QueryDocumentSnapshot<DocumentData>): AppUser => {
  const data = doc.data();
  return {
    uid: doc.id,
    username: data.username || "",
    studentId: data.studentId || "",
    email: data.email || "",
    hasVoted: data.hasVoted || false,
    isAdmin: data.isAdmin || false,
    isCandidate: data.isCandidate || false,
    votedFor: data.votedFor || null,
  };
};

const convertCandidateDoc = (doc: QueryDocumentSnapshot<DocumentData>): Candidate => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    description: data.description || "",
    image: data.image || "",
    votes: data.votes || 0,
    status: data.status || "pending",
    isAdminAdded: data.isAdminAdded || false,
    addedBy: data.addedBy || "candidate",
    uid: data.uid || "",
    studentId: data.studentId || "",
    email: data.email || "",
    approvedAt: data.approvedAt || null,
    rejectedAt: data.rejectedAt || null,
    criteria: data.criteria ? {
      manifesto: data.criteria.manifesto || "",
      vision: data.criteria.vision || "",
      experience: data.criteria.experience || "",
      department: data.criteria.department || "",
      cgpa: data.criteria.cgpa || "",
      year: data.criteria.year || "",
      submittedAt: data.criteria.submittedAt || null,
    } : undefined,
  };
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

  const userData: Omit<AppUser, 'uid'> = {
    username,
    studentId,
    email,
    hasVoted: false,
    isAdmin: false,
    isCandidate: false,
  };

  await setDoc(doc(db, "users", uid), userData);
}

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) throw new Error("User record not found");
  return convertUserDoc(snap as QueryDocumentSnapshot<DocumentData>);
}

export async function logoutUser() {
  await signOut(auth);
}

export function listenAuth(cb: (user: AppUser | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null);
    const snap = await getDoc(doc(db, "users", user.uid));
    cb(snap.exists() ? convertUserDoc(snap as QueryDocumentSnapshot<DocumentData>) : null);
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

  const userData: Omit<AppUser, 'uid'> = {
    username,
    studentId,
    email,
    hasVoted: false,
    isAdmin: false,
    isCandidate: true,
  };

  await setDoc(doc(db, "users", uid), userData);

  const candidateData: Omit<Candidate, 'id'> = {
    uid,
    name: username,
    studentId,
    email,
    status: "pending",
    votes: 0,
    isAdminAdded: false,
    addedBy: "candidate",
    description: "",
    image: "",
  };

  await addDoc(collection(db, "candidates"), candidateData);
}

export async function submitCandidateCriteria(
  candidateId: string, 
  data: { 
    manifesto: string; 
    vision: string; 
    experience: string;
    department: string;
    cgpa: string;
    year: string;
  },
  imageBase64: string
) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const candRef = doc(db, "candidates", candidateId);
  const snap = await getDoc(candRef);
  if (!snap.exists() || snap.data()?.uid !== user.uid) throw new Error("Not authorized to update this candidate");

  await updateDoc(candRef, {
    image: imageBase64,
    description: data.vision,
    criteria: { 
      ...data, 
      submittedAt: Timestamp.now() 
    },
    status: "pending",
  });
}

// ================= ADMIN CANDIDATE MANAGEMENT =================
export async function addCandidateFirestore(
  name: string, 
  description: string, 
  image: string,
  criteria?: {
    department?: string;
    year?: string;
    cgpa?: string;
    experience?: string;
    manifesto?: string;
    vision?: string;
  }
) {
  await requireAdmin();
  
  const candidateData: Omit<Candidate, 'id'> = {
    name,
    description,
    image,
    status: "approved", // Admin added candidates are auto-approved
    votes: 0,
    isAdminAdded: true,
    addedBy: "admin",
  };

  // Add criteria if provided (for full candidates)
  if (criteria) {
    candidateData.criteria = {
      ...criteria,
      submittedAt: Timestamp.now()
    };
  }

  await addDoc(collection(db, "candidates"), candidateData);
}

export async function updateCandidate(id: string, name: string, description: string, image: string) {
  await requireAdmin();
  
  // Check if candidate was added by admin
  const candidateRef = doc(db, "candidates", id);
  const candidateSnap = await getDoc(candidateRef);
  
  if (!candidateSnap.exists()) {
    throw new Error("Candidate not found");
  }
  
  const candidateData = candidateSnap.data();
  
  // Only allow editing if candidate was added by admin
  if (!candidateData.isAdminAdded) {
    throw new Error("Cannot edit candidate submitted through criteria form");
  }
  
  await updateDoc(candidateRef, { 
    name, 
    description, 
    image 
  });
}

export async function deleteCandidate(id: string) {
  await requireAdmin();
  await deleteDoc(doc(db, "candidates", id));
}

// Approve or Reject candidate (only for candidate-submitted profiles)
export async function updateCandidateStatus(id: string, status: "approved" | "rejected") {
  await requireAdmin();
  const candRef = doc(db, "candidates", id);
  
  // Check if candidate was added by admin
  const candidateSnap = await getDoc(candRef);
  if (candidateSnap.exists() && candidateSnap.data().isAdminAdded) {
    throw new Error("Admin-added candidates are auto-approved and cannot be rejected");
  }
  
  const updateData: any = {
    status,
  };
  
  if (status === "approved") {
    updateData.approvedAt = Timestamp.now();
  } else {
    updateData.rejectedAt = Timestamp.now();
  }
  
  await updateDoc(candRef, updateData);
}

// ================= VOTING =================
export async function submitVote(uid: string, candidateId: string) {
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", uid);
    const candRef = doc(db, "candidates", candidateId);
    const uSnap = await tx.get(userRef);
    const cSnap = await tx.get(candRef);

    if (!uSnap.exists()) throw new Error("User not found");
    if (!cSnap.exists()) throw new Error("Candidate not found");
    
    const userData = uSnap.data();
    const candidateData = cSnap.data();

    if (userData.hasVoted) throw new Error("You have already voted");
    
    // Only allow voting for approved candidates
    if (candidateData.status !== "approved") throw new Error("Candidate not approved");

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
    const data = u.data();
    if (!data.isAdmin) batch.update(u.ref, { hasVoted: false, votedFor: null });
  });

  await batch.commit();
}

// ================= GET CANDIDATES BY STATUS =================
export async function getPendingCandidates(): Promise<Candidate[]> {
  await requireAdmin();
  const q = query(collection(db, "candidates"), where("status", "==", "pending"));
  const snap = await getDocs(q);
  return snap.docs.map(convertCandidateDoc);
}

export async function getApprovedCandidates(): Promise<Candidate[]> {
  const q = query(collection(db, "candidates"), where("status", "==", "approved"));
  const snap = await getDocs(q);
  return snap.docs.map(convertCandidateDoc);
}

// ================= CHECK ELIGIBILITY =================
export function checkCandidateEligibility(criteria: {
  year?: string;
  cgpa?: string;
}): { eligible: boolean; reason?: string } {
  if (!criteria.year || !criteria.cgpa) {
    return { eligible: false, reason: "Missing criteria information" };
  }

  const ineligibleYears = ["0 Year", "Freshman", "Remedial", "1st Year", "Graduate"];
  const cgpaValue = parseFloat(criteria.cgpa);

  if (ineligibleYears.includes(criteria.year)) {
    return { 
      eligible: false, 
      reason: `${criteria.year} students are not eligible to apply` 
    };
  }

  if (cgpaValue < 3.0) {
    return { 
      eligible: false, 
      reason: `CGPA ${criteria.cgpa} is below 3.0 requirement` 
    };
  }

  return { eligible: true };
}

// ================= GET CANDIDATE BY UID =================
export async function getCandidateByUid(uid: string): Promise<Candidate | null> {
  const q = query(collection(db, "candidates"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return convertCandidateDoc(snap.docs[0]);
}

// ================= GET USER BY UID =================
export async function getUserByUid(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return convertUserDoc(snap as QueryDocumentSnapshot<DocumentData>);
}

// ================= UPDATE USER =================
export async function updateUser(uid: string, data: Partial<AppUser>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (user.uid !== uid) throw new Error("Not authorized to update this user");
  
  await updateDoc(doc(db, "users", uid), data);
}

// ================= GET ALL STUDENTS (ADMIN ONLY) =================
export async function getAllStudents(): Promise<AppUser[]> {
  await requireAdmin();
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map(convertUserDoc)
    .filter(u => !u.isAdmin);
}

// ================= GET VOTING STATS =================
export async function getVotingStats(): Promise<{ total: number; voted: number }> {
  const snap = await getDocs(collection(db, "users"));
  let total = 0;
  let voted = 0;
  
  snap.forEach((doc) => {
    const data = doc.data();
    if (!data.isAdmin) {
      total++;
      if (data.hasVoted) voted++;
    }
  });
  
  return { total, voted };
}

// ================= REAL-TIME SUBSCRIPTIONS =================
export function subscribeToCandidates(callback: (candidates: Candidate[]) => void) {
  return onSnapshot(collection(db, "candidates"), (snap) => {
    const candidates = snap.docs.map(convertCandidateDoc);
    callback(candidates);
  });
}

export function subscribeToApprovedCandidates(callback: (candidates: Candidate[]) => void) {
  const q = query(collection(db, "candidates"), where("status", "==", "approved"));
  return onSnapshot(q, (snap) => {
    const candidates = snap.docs.map(convertCandidateDoc);
    callback(candidates);
  });
}

export function subscribeToUsers(callback: (users: AppUser[]) => void) {
  return onSnapshot(collection(db, "users"), (snap) => {
    const users = snap.docs.map(convertUserDoc);
    callback(users);
  });
}

export function subscribeToElectionSettings(callback: (settings: any) => void) {
  return onSnapshot(doc(db, "settings", "election"), (snap) => {
    callback(snap.data());
  });
}

// ================= ELECTION SETTINGS =================
export async function updateElectionSettings(startDate: Date, endDate: Date) {
  await requireAdmin();
  
  if (startDate >= endDate) {
    throw new Error("End date must be after start date");
  }
  
  await setDoc(doc(db, "settings", "election"), {
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    updatedAt: Timestamp.now(),
  }, { merge: true });
}

export async function getElectionSettings() {
  const snap = await getDoc(doc(db, "settings", "election"));
  return snap.exists() ? snap.data() : null;
}

// ================= BULK OPERATIONS =================
export async function bulkApproveCandidates(candidateIds: string[]) {
  await requireAdmin();
  const batch = writeBatch(db);
  
  candidateIds.forEach((id) => {
    const ref = doc(db, "candidates", id);
    batch.update(ref, { 
      status: "approved",
      approvedAt: Timestamp.now() 
    });
  });
  
  await batch.commit();
}

export async function bulkRejectCandidates(candidateIds: string[]) {
  await requireAdmin();
  const batch = writeBatch(db);
  
  candidateIds.forEach((id) => {
    const ref = doc(db, "candidates", id);
    batch.update(ref, { 
      status: "rejected",
      rejectedAt: Timestamp.now() 
    });
  });
  
  await batch.commit();
}

// ================= CLEANUP FUNCTIONS =================
export async function cleanupRejectedCandidates(daysOld: number = 30) {
  await requireAdmin();
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const q = query(
    collection(db, "candidates"), 
    where("status", "==", "rejected"),
    where("rejectedAt", "<=", Timestamp.fromDate(cutoffDate))
  );
  
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  
  snap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  return snap.size;
}

// ================= EXPORT DATA =================
export async function exportElectionData() {
  await requireAdmin();
  
  const candidates = await getDocs(collection(db, "candidates"));
  const users = await getDocs(collection(db, "users"));
  const settings = await getDoc(doc(db, "settings", "election"));
  
  return {
    candidates: candidates.docs.map(convertCandidateDoc),
    users: users.docs.map(convertUserDoc),
    settings: settings.exists() ? settings.data() : null,
    exportedAt: new Date().toISOString()
  };
}