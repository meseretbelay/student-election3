"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUsers, User } from "../lib/storage";

export default function LoginPage() {
  const [username, setUsername] = useState<string>(""); 
  const [studentId, setStudentId] = useState<string>(""); 
  const [password, setPassword] = useState<string>(""); 
  const [animate, setAnimate] = useState(false);
  const [hover, setHover] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
    const loadedUsers = loadUsers();

    const fixedUsers = loadedUsers.map(u => ({
      username: u.username || "",
      studentId: u.studentId || "",
      password: u.password || "",
      hasVoted: u.hasVoted || false,
      isAdmin: u.isAdmin || false,
    }));

    setUsers(fixedUsers);
  }, []);

  function validMAU(id: string) {
    if (!id.toUpperCase().startsWith("MAU")) return false;
    const num = parseInt(id.toUpperCase().replace("MAU", ""));
    return num >= 1400 && num <= 1500;
  }

  function handleLogin() {
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedStudentId = studentId.trim().toUpperCase();
    const trimmedPassword = password.trim();

    // Admin bypass MAU check
    if (trimmedUsername !== "admin" && !validMAU(trimmedStudentId)) {
      alert("You are not a valid MAU student ❌");
      return;
    }

    const user = users.find(
      (u) =>
        u.username.trim().toLowerCase() === trimmedUsername &&
        (u.studentId?.trim().toUpperCase() === trimmedStudentId || u.isAdmin) &&
        u.password.trim() === trimmedPassword
    );

    if (!user) {
      alert("Invalid login ❌");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));
    if (user.isAdmin) localStorage.setItem("admin", "true");
    router.push("/vote");
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d)",
      }}
    >
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: "rgba(255,255,255,0.95)",
          padding: "60px 100px",
          borderRadius: "18px",
          boxShadow: hover
            ? "0 25px 60px rgba(0,0,0,0.45)"
            : "0 12px 35px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: "500px",
          maxWidth: "90%",
          opacity: animate ? 1 : 0,
          transform: animate
            ? hover
              ? "translateY(-10px) scale(1.05)"
              : "translateY(0) scale(1)"
            : "translateY(-30px) scale(0.95)",
          transition: "all 0.4s ease",
        }}
      >
        <img
          src="/images/mau.png"
          alt="MAU Logo"
          width={180}
          height={180}
          style={{ marginBottom: "25px", borderRadius: "50%", transition: "transform 0.3s" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
        <h1 style={{ marginBottom: "15px", color: "#0d47a1", fontSize: "3rem", fontWeight: 800, textAlign: "center" }}>
          Student Election
        </h1>
        <h2 style={{ marginBottom: "40px", color: "#444", fontWeight: 500, fontSize: "1.6rem", textAlign: "center" }}>
          Login to Vote
        </h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "18px", width: "100%", marginBottom: "20px", borderRadius: "10px", border: "1px solid #bbb", fontSize: "1.2rem", boxSizing: "border-box" }}
        />
        <input
          placeholder="Student ID (MAU1400 - MAU1500)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          style={{ padding: "18px", width: "100%", marginBottom: "20px", borderRadius: "10px", border: "1px solid #bbb", fontSize: "1.2rem", boxSizing: "border-box" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "18px", width: "100%", marginBottom: "30px", borderRadius: "10px", border: "1px solid #bbb", fontSize: "1.2rem", boxSizing: "border-box" }}
        />
        <button
          onClick={handleLogin}
          style={{ width: "100%", padding: "18px", boxSizing: "border-box", background: "#0d47a1", color: "white", fontWeight: 700, fontSize: "1.3rem", border: "none", borderRadius: "10px", cursor: "pointer", transition: "all 0.3s ease" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#093171")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#0d47a1")}
        >
          Login
        </button>
        <p style={{ marginTop: "25px", fontSize: "1.2rem" }}>
          Don’t have an account? <a href="/register" style={{ color: "#0d47a1", fontWeight: 600 }}>Register here</a>
        </p>
      </div>
    </div>
  );
}
