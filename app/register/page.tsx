"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [animate, setAnimate] = useState(false);
  const [hover, setHover] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("users");
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      else setUsers([]);
    }
  }, []);

  // Validate MAU ID
  function validMAU(id: string) {
    if (!id.toUpperCase().startsWith("MAU")) return false;
    const number = parseInt(id.toUpperCase().replace("MAU", ""));
    return number >= 1400 && number <= 1500;
  }

  function handleRegister() {
    const trimmedUsername = username.trim();
    const trimmedStudentId = studentId.trim().toUpperCase();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedStudentId || !trimmedPassword)
      return alert("Please fill all fields");

    if (users.find((u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()))
      return alert("Username already exists!");

    if (!validMAU(trimmedStudentId)) {
      return alert("You are not MAU student ❌");
    }

    const newUser = {
      username: trimmedUsername,
      studentId: trimmedStudentId,
      password: trimmedPassword,
      hasVoted: false,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    alert("Registration successful!");
    router.push("/");
  }

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(135deg, #1F1C2C, #928DAB)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "20px 50px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          color: "white",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Student Election</h2>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              minWidth: "250px",
              padding: "10px 20px",
              fontSize: "1rem",
              background: "transparent",
              border: "1px solid white",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              color: "white",
              textAlign: "center",
            }}
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            style={{
              minWidth: "250px",
              padding: "10px 20px",
              fontSize: "1rem",
              background: "#0d47a1",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              color: "white",
              textAlign: "center",
            }}
          >
            Register
          </button>
        </div>
      </div>

      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "650px",
          maxWidth: "90%",
          margin: "100px auto",
          background: "rgba(255,255,255,0.92)",
          borderRadius: "20px",
          padding: "50px 70px",
          boxShadow: hover
            ? "0 25px 50px rgba(0,0,0,0.35)"
            : "0 12px 25px rgba(0,0,0,0.2)",
          opacity: animate ? 1 : 0,
          transform: animate
            ? hover
              ? "translateY(-8px) scale(1.02)"
              : "translateY(0)"
            : "translateY(40px)",
          transition: "all 0.4s ease",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "25px",
            fontSize: "2.8rem",
            fontWeight: 800,
            color: "#0d47a1",
          }}
        >
          Register
        </h1>

        <input
          placeholder="Create Username"
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "18px",
            marginBottom: "20px",
            border: "1px solid #aaa",
            borderRadius: "12px",
            fontSize: "1.2rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <input
          placeholder="Student ID (MAU1400 - MAU1500)"
          onChange={(e) => setStudentId(e.target.value)}
          style={{
            width: "100%",
            padding: "18px",
            marginBottom: "20px",
            border: "1px solid #aaa",
            borderRadius: "12px",
            fontSize: "1.2rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <input
          placeholder="Create Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "18px",
            marginBottom: "30px",
            border: "1px solid #aaa",
            borderRadius: "12px",
            fontSize: "1.2rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleRegister}
          style={{
            width: "100%",
            padding: "18px",
            background: "#0d47a1",
            color: "white",
            fontWeight: 700,
            fontSize: "1.4rem",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxSizing: "border-box",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#093171")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#0d47a1")}
        >
          Register
        </button>
      </div>
    </div>
  );
}
