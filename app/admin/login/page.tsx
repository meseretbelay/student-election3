// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../../lib/firebaseFunctions";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
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
      if (!user.isAdmin) {
        throw new Error("You do not have admin privileges.");
      }
      router.replace("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed.");
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
          {/* Circular Logo */}
          <img
            src="/images/mau.jpg"
            alt="MAU Logo"
            className="logo"
          />

          <h1>Admin Login</h1>

          {error && <p className="error">{error}</p>}

          <input
            type="email"
            placeholder="Admin Email"
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

          <p className="back">
            <Link href="/login">← Back to Student Login</Link>
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
          padding: 20px;
          box-sizing: border-box;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .cardWrapper {
          width: 100%;
          max-width: 600px;
          padding: 0 16px;
        }

        .card {
          background: rgba(255, 255, 255, 0.12);
          padding: 40px 30px;
          border-radius: 25px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          color: #fff;
          backdrop-filter: blur(25px);
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.5);
        }

        /* Responsive Logo */
        .logo {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #36d1dc;
          margin-bottom: 15px;
          box-shadow: 0 8px 25px rgba(54, 209, 220, 0.3);
        }

        @media (min-width: 480px) {
          .logo {
            width: 130px;
            height: 130px;
          }
        }

        h1 {
          margin: 0 0 20px 0;
          font-size: 1.9rem;
          font-weight: 700;
          text-align: center;
        }

        @media (min-width: 480px) {
          h1 {
            font-size: 2.2rem;
          }
        }

        input,
        button {
          width: 100%;
          height: 56px;
          padding: 0 20px;
          border-radius: 22px;
          font-size: 1.1rem;
          border: none;
          outline: none;
          box-sizing: border-box;
        }

        @media (max-width: 380px) {
          input,
          button {
            height: 52px;
            font-size: 1rem;
          }
        }

        input {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        input::placeholder {
          color: #f0f0f0;
          font-size: 1rem;
        }

        button {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: #fff;
          font-weight: 700;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error {
          color: #ff6b6b;
          font-size: 1rem;
          text-align: center;
          margin: 10px 0 0 0;
          padding: 12px;
          background: rgba(255, 107, 107, 0.15);
          border-radius: 12px;
          width: 100%;
        }

        .back {
          margin-top: 20px;
          font-size: 1.05rem;
          text-align: center;
        }

        .back a {
          color: #36d1dc;
          font-weight: 600;
          text-decoration: none;
        }

        .back a:hover {
          text-decoration: underline;
        }

        /* Extra small screens */
        @media (max-width: 340px) {
          .card {
            padding: 30px 20px;
          }
          h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}