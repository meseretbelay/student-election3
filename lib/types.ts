export type Candidate = {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
  status: "pending" | "approved" | "rejected";
  isAdminAdded?: boolean;  // Flag to identify admin-added candidates
  addedBy?: "admin" | "candidate";
  criteria?: {
    manifesto?: string;
    vision?: string;
    experience?: string;
    department?: string;
    cgpa?: string;
    year?: string;
    submittedAt?: any;
  };
  uid?: string;
  studentId?: string;
  email?: string;
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