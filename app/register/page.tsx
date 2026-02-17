"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../../lib/firebaseFunctions";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const idUpper = studentId.trim().toUpperCase();

    if (!idUpper.startsWith("MAU")) {
      setError("Invalid Student ID. Must start with 'MAU'.");
      setLoading(false);
      return;
    }

    const numPart = idUpper.substring(3);

    if (!/^\d{4}$/.test(numPart)) {
      setError("Invalid Student ID format. Must be MAU followed by 4 digits (e.g., MAU1400).");
      setLoading(false);
      return;
    }

    const idNumber = parseInt(numPart, 10);

    if (idNumber < 1400 || idNumber > 1899) {
      setError("Student ID must be between MAU1400 and MAU1899.");
      setLoading(false);
      return;
    }

    const pass = password.trim();

    if (pass.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError("Password must include uppercase, lowercase, number and special character.");
      setLoading(false);
      return;
    }

    try {
      await registerUser(username.trim(), idUpper, email.trim(), pass);
      setShowPopup(true); // ✅ Custom popup instead of alert
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
          <h1>Student Election Register</h1>

          {error && <p className="error">{error}</p>}

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          <input
            placeholder="Student ID (e.g., MAU1425)"
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
            Already have an account? <Link href="/login">Login</Link>
          </p>

          <p className="note">
            Only MAU students from <strong>MAU1400</strong> to <strong>MAU1899</strong> can register.
          </p>
        </form>
      </motion.div>

      {/* ✅ SUCCESS POPUP */}
      {showPopup && (
        <div className="popupOverlay">
          <div className="popupCard">
            <h2>🎉 Registration Successful!</h2>
            <p>
              Your account has been created.<br />
              Please verify your email before logging in.
            </p>

            <button
              onClick={() => {
                setShowPopup(false);
                router.push("/login");
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
          background: linear-gradient(270deg, #0f2027, #203a43, #2c5364);
          background-size: 600% 600%;
          animation: gradient 15s ease infinite;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .card {
          background: rgba(255, 255, 255, 0.12);
          padding: 50px;
          border-radius: 25px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          color: #fff;
          backdrop-filter: blur(25px);
        }

        .logo {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 15px;
        }

        input,
        button {
          width: 100%;
          max-width: 500px;
          height: 55px;
          padding: 0 20px;
          border-radius: 22px;
          font-size: 1.1rem;
          border: none;
        }

        input {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        /* ✅ WHITE PLACEHOLDER */
        input::placeholder {
          color: #ffffff;
          opacity: 1;
        }

        button {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .error {
          color: #ff6b6b;
          text-align: center;
        }

        .link a {
          color: #36d1dc;
          text-decoration: none;
        }

        .note {
          color: #ccc;
          font-size: 0.9rem;
          text-align: center;
        }

        /* ===== POPUP ===== */
        .popupOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .popupCard {
          background: white;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          width: 90%;
          max-width: 400px;
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
          height: 45px;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
