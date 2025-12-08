"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadCandidates,
  loadUsers,
  resetElection,
  logout,
  Candidate,
  User,
} from "../../../lib/storage";
import ResultsChart from "../../../components/ResultsChart";

export default function AdminDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("admin") === "true";
    if (!adminLoggedIn) {
      router.push("/admin");
    } else {
      setIsAdmin(true);
      setCandidates(loadCandidates());
      setUsers(loadUsers());
    }
  }, []);

  function handleResetElection() {
    if (!confirm("Are you sure you want to reset the election?")) return;
    resetElection("admin123");
    setCandidates(loadCandidates());
    setUsers(loadUsers());
  }

  function handleLogout() {
    logout();
    router.push("/admin");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>

      {/* RESET BUTTON ONLY FOR ADMIN */}
      {isAdmin && (
        <button
          onClick={handleResetElection}
          style={{
            background: "red",
            color: "white",
            padding: "10px 20px",
            marginRight: 10,
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Reset Election
        </button>
      )}

      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <ResultsChart data={candidates} />
    </div>
  );
}
