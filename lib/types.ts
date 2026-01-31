export type Candidate = {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
  status: "pending" | "approved" | "rejected";
  criteria?: {
    manifesto?: string;
    vision?: string;
    experience?: string;
    submittedAt?: any;
  };
  uid?: string;          // link to auth user (candidate themselves)
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
  isCandidate?: boolean;    // NEW flag
};