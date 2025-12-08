"use client";

export type Candidate = {
  id: number;
  name: string;
  description: string;
  image: string;
  votes: number;
};

export type User = {
  username: string;
  studentId: string; // optional for admin
  password: string;
  hasVoted: boolean;
  isAdmin?: boolean;
};

// Default Candidates
const candidatesData: Candidate[] = [
  { id: 1, name: "Meseret", description: "Supports technology, coding clubs, and student innovation.", image: "/images/meseret.jpg", votes: 0 },
  { id: 2, name: "Markon", description: "Focuses on student welfare, sports and community events.", image: "/images/markon.jpg", votes: 0 },
  { id: 3, name: "Asu", description: "Aims to improve academic resources and student support.", image: "/images/asu.jpg", votes: 0 },
];

// Default Users (students + admin)
const usersData: User[] = [
  { username: "student1", studentId: "MAU1401", password: "12345", hasVoted: false },
  { username: "student2", studentId: "MAU1402", password: "12345", hasVoted: false },
  { username: "student3", studentId: "MAU1403", password: "12345", hasVoted: false },
  { username: "admin", studentId: "", password: "admin123", hasVoted: false, isAdmin: true },
];

function isBrowser() {
  return typeof window !== "undefined";
}

// --- Candidates ---
export function loadCandidates(): Candidate[] {
  if (!isBrowser()) return candidatesData;
  const stored = localStorage.getItem("candidates");
  return stored ? JSON.parse(stored) : candidatesData;
}

export function saveCandidates(candidates: Candidate[]) {
  if (!isBrowser()) return;
  localStorage.setItem("candidates", JSON.stringify(candidates));
}

// --- Users ---
export function loadUsers(): User[] {
  if (!isBrowser()) return usersData;
  const stored = localStorage.getItem("users");

  if (!stored) {
    localStorage.setItem("users", JSON.stringify(usersData));
    return usersData;
  }

  return JSON.parse(stored);
}

export function saveUsers(users: User[]) {
  if (!isBrowser()) return;
  localStorage.setItem("users", JSON.stringify(users));
}

// --- Reset election ---
export function resetElection(adminPassword?: string) {
  if (!isBrowser()) return;

  const adminUser = usersData.find(u => u.isAdmin);
  if (!adminUser) {
    alert("No admin user found!");
    return;
  }

  if (adminPassword && adminPassword !== adminUser.password) {
    alert("Incorrect admin password ❌");
    return;
  }

  saveCandidates(JSON.parse(JSON.stringify(candidatesData)));
  saveUsers(JSON.parse(JSON.stringify(usersData)));
  localStorage.removeItem("currentUser");
  localStorage.removeItem("admin");
  alert("Election has been reset!");
}

// --- Logout ---
export function logout() {
  if (!isBrowser()) return;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("admin");
}
