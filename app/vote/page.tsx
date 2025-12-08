"use client";

import { useEffect, useState } from "react";
import {
  loadCandidates,
  loadUsers,
  saveCandidates,
  saveUsers,
  logout,
  resetElection,
} from "../../lib/storage";
import { useRouter } from "next/navigation";
import ResultsChart from "../../components/ResultsChart";

export default function VotePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
      router.push("/");
      return;
    }

    const userObj = JSON.parse(storedUser);
    setCurrentUser(userObj);

    setCandidates(loadCandidates());
    setUsers(loadUsers());
  }, []);

  if (!currentUser) return null;

  const studentUsers = users.filter((u) => !u.isAdmin);
  const totalVoters = studentUsers.length;
  const votedCount = studentUsers.filter((u) => u.hasVoted).length;

  const winner =
    votedCount === totalVoters && totalVoters > 0
      ? candidates.reduce((max, c) => (c.votes > max.votes ? c : max), candidates[0]).name
      : "Waiting for all voters...";

  function vote(id: number) {
    if (!currentUser || currentUser.isAdmin) return;

    const updatedUsers = users.map((u) =>
      u.username === currentUser.username ? { ...u, hasVoted: true } : u
    );
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    const updatedCandidates = candidates.map((c) =>
      c.id === id ? { ...c, votes: c.votes + 1 } : c
    );
    saveCandidates(updatedCandidates);
    setCandidates(updatedCandidates);

    alert("✅ Vote submitted!");
  }

  function handleReset() {
    if (!currentUser.isAdmin) return;

    const adminPassword = "admin123";
    const input = prompt("Enter admin password to reset:");

    if (input === null) return;
    if (input !== adminPassword) {
      alert("❌ Incorrect Password!");
      return;
    }

    if (!confirm("Are you sure?")) return;

    resetElection();
    setCandidates(loadCandidates());
    setUsers(loadUsers());
    alert("✅ Election has been reset!");
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const filteredCandidates = candidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(to right, #ffffff, #e0e7ff)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: "40px",
          gap: "30px",
        }}
      >
        <img
          src="/images/mau.png"
          alt="MAU Logo"
          width={200}
          height={200}
          style={{
            borderRadius: "50%",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
            transition: "transform 0.3s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />

        <div style={{ textAlign: "left" }}>
          <h1
            style={{
              fontSize: "3rem",
              color: "#1e3a8a",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Student Election
          </h1>

          <p style={{ fontSize: "1.5rem", color: "#374151", marginBottom: "5px" }}>
            Welcome, <strong>{currentUser.username}</strong>
            {currentUser.isAdmin && " (Admin)"}
          </p>

          <h2
            style={{
              fontSize: "2rem",
              color: "#059669",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            Winner: {winner}
          </h2>

          <p style={{ fontSize: "1.2rem", color: "#6b7280" }}>
            {votedCount} / {totalVoters} voted
          </p>
        </div>

        {/* BUTTONS */}
        <div
          style={{
            position: "absolute",
            right: "40px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {currentUser.isAdmin && (
            <button
              onClick={handleReset}
              style={{
                background: "#ef5350",
                color: "white",
                padding: "16px 32px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1.2rem",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Reset Election
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{
              background: "#757575",
              color: "white",
              padding: "16px 32px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1.2rem",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Logout
          </button>
        </div>
      </div>

      {/* SEARCH INPUT */}
      {!currentUser.isAdmin && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "30px",
            position: "relative",
          }}
        >
          {/* Icon slightly left inside input */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "41%", // slightly left inside the input
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "20px",
              height: "20px",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "300px",
              padding: "10px 20px 10px 50px", // enough padding for icon
              fontSize: "1rem",
              borderRadius: "25px",
              border: "2px solid #4f46e5",
              outline: "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "2px solid #1e3a8a";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(30,58,138,0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "2px solid #4f46e5";
              e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
            }}
          />
        </div>
      )}

      {/* CANDIDATES */}
      {!currentUser.isAdmin && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            rowGap: "60px",
            columnGap: "80px",
            marginTop: "20px",
          }}
        >
          {filteredCandidates.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#fff",
                padding: "25px",
                borderRadius: "20px",
                border: "3px solid",
                borderImageSlice: 1,
                borderWidth: "3px",
                borderImageSource: "linear-gradient(45deg, #ff6ec4, #7873f5, #42e695)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                width: "260px",
                textAlign: "center",
                transition: "all 0.4s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.08) translateY(-5px)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1) translateY(0)")}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "10px",
                  color: "#1a73e8",
                  fontWeight: "bold",
                }}
              >
                {c.name}
              </h3>

              <img
                src={c.image}
                width="150"
                height="150"
                style={{
                  borderRadius: "50%",
                  marginBottom: "10px",
                  transition: "transform 0.3s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                alt={c.name}
              />

              <p style={{ fontSize: "0.95rem", marginBottom: "15px", color: "#555" }}>
                {c.description}
              </p>

              <button
                onClick={() => vote(c.id)}
                disabled={users.find((u) => u.username === currentUser.username)?.hasVoted}
                style={{
                  background: "linear-gradient(45deg, #1a73e8, #4caf50)",
                  color: "white",
                  padding: "14px 28px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1.05rem",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Vote
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RESULTS CHART */}
      <div style={{ marginTop: "50px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "90%" }}>
          <ResultsChart data={candidates} />
        </div>
      </div>
    </div>
  );
}
