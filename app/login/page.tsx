"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../lib/firebaseFunctions";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email.trim(), password.trim());
      if (user.isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/vote");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
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
        <form className="card" onSubmit={handleLogin}>
          <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />

          <h1>Student Election Login</h1>

          {error && <p className="error">{error}</p>}

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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="link">
            Don't have an account? <Link href="/register">Register</Link>
          </p>

          <p className="link" style={{ marginTop: "20px" }}>
            <Link href="/admin/login">→ Admin Login</Link>
          </p>
        </form>
      </motion.div>

      <style jsx>{`
        /* ================= ROOT FIX ================= */
        .page {
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(270deg, #0f2027, #203a43, #2c5364);
          background-size: 600% 600%;
          animation: gradient 15s ease infinite;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .cardWrapper {
          width: 100%;
          max-width: 600px;
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
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.5);
        }

        .logo {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #36d1dc;
          margin-bottom: 15px;
          box-shadow: 0 8px 25px rgba(54, 209, 220, 0.3);
        }

        h1 {
          margin: 0 0 20px 0;
          font-size: 2.2rem;
          font-weight: 700;
          text-align: center;
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
          outline: none;
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
          font-size: 1rem;
          margin: 0;
        }

        .link {
          font-size: 1rem;
          text-align: center;
          margin: 0;
        }

        .link a {
          color: #36d1dc;
          font-weight: 600;
          text-decoration: none;
        }

        .link a:hover {
          text-decoration: underline;
        }

        .link a:visited {
          color: #36d1dc;
        }

        /* ========== MOBILE FIX (IMPORTANT) ========== */
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

          .link {
            font-size: 0.9rem;
          }
        }

        /* ===== SAFARI / IOS FIX ===== */
        @supports (-webkit-touch-callout: none) {
          .page {
            min-height: -webkit-fill-available;
          }
        }
      `}</style>
    </div>
  );
}