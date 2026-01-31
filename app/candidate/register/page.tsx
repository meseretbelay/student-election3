"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCandidate } from "../../../lib/firebaseFunctions";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CandidateRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateStudentId = (sid: string): string | null => {
    const trimmed = sid.trim().toUpperCase();
    if (!trimmed.startsWith("MAU") || trimmed.length !== 7) {
      return "Student ID must be in the format MAUXXXX (e.g., MAU1400).";
    }
    const numPart = trimmed.slice(3);
    const num = parseInt(numPart, 10);
    if (isNaN(num) || num < 1400 || num > 1500) {
      return "Only student IDs from MAU1400 to MAU1500 are allowed for registration.";
    }
    return null;
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain at least one special character (e.g., !@#$%).";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic required fields
    if (!username.trim() || !studentId.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }

    // Student ID validation (only MAU1400–MAU1500 allowed)
    const sidError = validateStudentId(studentId);
    if (sidError) {
      setError(sidError);
      return;
    }

    // Strong password validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);
    try {
      // Pass the original (non-upper-cased) studentId, trimmed
      await registerCandidate(username.trim(), studentId.trim(), email.trim(), password.trim());
      alert("Candidate registered successfully! Please login to continue.");
      router.push("/candidate/login");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <motion.div
        className="cardWrapper"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <form className="card" onSubmit={handleRegister}>
          <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
          <h1>Candidate Registration</h1>

          {error && <p className="error">{error}</p>}

          <input
            placeholder="Full Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
          <input
            placeholder="Student ID (e.g., MAU1400)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password (strong: 8+ chars, upper, lower, number, special)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="link">
            Already registered? <Link href="/candidate/login">Login here</Link>
          </p>
        </form>
      </motion.div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(270deg, #0f2027, #203a43, #2c5364);
          background-size: 600% 600%;
          animation: gradient 15s ease infinite;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .cardWrapper {
          width: 100%;
          max-width: 500px;
        }

        .card {
          width: 100%;
          background: rgba(255, 255, 255, 0.12);
          padding: 50px;
          border-radius: 25px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          color: #fff;
          backdrop-filter: blur(25px);
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.5);
        }

        .logo {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #36d1dc;
          margin-bottom: 15px;
        }

        h1 {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        input,
        button {
          width: 100%;
          max-width: 400px;
          height: 55px;
          padding: 0 20px;
          border-radius: 22px;
          font-size: 1.1rem;
          border: none;
          outline: none;
        }

        input {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        input::placeholder {
          color: #f0f0f0;
        }

        button {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error {
          color: #ff6b6b;
          text-align: center;
          margin: 0;
          font-size: 1rem;
          line-height: 1.4;
        }

        .link {
          margin-top: 15px;
          text-align: center;
        }

        .link a {
          color: #36d1dc;
          font-weight: 600;
          text-decoration: none;
        }

        .link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .card {
            padding: 35px 20px;
            border-radius: 20px;
            gap: 15px;
          }
          .logo {
            width: 100px;
            height: 100px;
          }
          h1 {
            font-size: 1.8rem;
          }
          input,
          button {
            height: 50px;
            font-size: 1rem;
            border-radius: 18px;
          }
        }
      `}</style>
    </div>
  );
}