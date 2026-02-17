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
  const [showPopup, setShowPopup] = useState(false);

  const validateStudentId = (sid: string): string | null => {
    const trimmed = sid.trim().toUpperCase();
    if (!trimmed.startsWith("MAU") || trimmed.length !== 7) {
      return "Student ID must be in the format MAUXXXX (e.g., MAU1400).";
    }
    const numPart = trimmed.slice(3);
    const num = parseInt(numPart, 10);
    if (isNaN(num) || num < 1400 || num > 1899) {
      return "Only student IDs from MAU1400 to MAU1899 are allowed.";
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !studentId || !email || !password) {
      setError("All fields are required.");
      return;
    }

    const sidError = validateStudentId(studentId);
    if (sidError) {
      setError(sidError);
      return;
    }

    setLoading(true);

    try {
      await registerCandidate(
        username.trim(),
        studentId.trim().toUpperCase(),
        email.trim(),
        password.trim()
      );

      setShowPopup(true);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <motion.div
        className="cardWrapper"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form className="card" onSubmit={handleRegister}>
          <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
          <h1>Candidate Registration</h1>

          {error && <p className="error">{error}</p>}

          <input
            placeholder="Full Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          <input
            placeholder="Student ID (e.g., MAU1450)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

      {showPopup && (
        <div className="popupOverlay">
          <div className="popupCard">
            <h2>🎉 Registration Successful!</h2>
            <p>
              Your candidate account has been created.<br />
              Please login to continue.
            </p>

            <button
              onClick={() => {
                setShowPopup(false);
                router.push("/candidate/login");
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #203a43, #2c5364);
        }

        .card {
          background: rgba(255, 255, 255, 0.12);
          padding: 50px;
          border-radius: 25px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-items: center;
          color: #fff;
          backdrop-filter: blur(20px);
        }

        .logo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 10px;
        }

        input, button {
          width: 100%;
          max-width: 400px;
          height: 50px;
          border-radius: 20px;
          border: none;
          padding: 0 15px;
          font-size: 1rem;
        }

        input {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }

        /* ✅ Placeholder changed to black */
        input::placeholder {
          color: white;
          opacity: 1;
        }

        button {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        .error {
          color: #ff6b6b;
          text-align: center;
        }

        .popupOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.3s ease;
        }

        .popupCard {
          background: white;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          width: 90%;
          max-width: 400px;
          animation: scaleIn 0.3s ease;
        }

        .popupCard h2 {
          color: #203a43;
          margin-bottom: 15px;
        }

        .popupCard p {
          color: #555;
          margin-bottom: 25px;
        }

        .popupCard button {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          border-radius: 20px;
          height: 45px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
