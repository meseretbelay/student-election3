// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../../lib/firebaseFunctions";
import Link from "next/link";

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
      <form className="card" onSubmit={handleLogin}>
        <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
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

        <button type="submit" disabled={loading} className="loginBtn">
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="back">
          <Link href="/login">← Back to Student Login</Link>
        </p>
      </form>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1c3c53;
          padding: 0px;
          margin:0px;
        }

        .card {
          width: 380px;
          max-width: 95vw;
          background: rgba(255, 255, 255, 0.12);
          padding: 45px 40px;
          border-radius: 22px;
          color: #fff;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .logo {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #36d1dc;
          margin-bottom: 10px;
        }

        h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
        }

        input {
          width: 100%;
          height: 52px;
          padding: 0 18px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
        }

        input::placeholder {
          color: #ddd;
        }

        .loginBtn {
          width: 100%;
          height: 52px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .loginBtn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(54, 209, 220, 0.4);
        }

        .loginBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error {
          color: #ff6b6b;
          text-align: center;
          font-size: 14px;
          margin: 0;
        }

        .back {
          margin-top: 10px;
          font-size: 14px;
        }

        .back a {
          color: #cdefff;
          text-decoration: none;
          font-weight: 500;
        }

        .back a:hover {
          text-decoration: underline;
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 480px) {
          .card {
            padding: 35px 20px;
            width: 95%;
            gap: 15px;
          }

          h1 {
            font-size: 22px;
          }

          .logo {
            width: 90px;
            height: 90px;
          }

          input, .loginBtn {
            height: 48px;
            font-size: 15px;
          }

          .back {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
