// lib/types.ts
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