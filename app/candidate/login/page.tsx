"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../../lib/firebaseFunctions";
import Link from "next/link";
import { motion } from "framer-motion";
// Uncomment the next two lines if you want to sign out non-candidates
// import { auth } from "../../../lib/firebase"; // Adjust path to your firebase config
// import { signOut } from "firebase/auth";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(email.trim(), password.trim());

      // Strict check for candidate login page
      if (user.isAdmin) {
        setError("This is the candidate login page. Admins should log in at /admin/login.");
        // Optionally sign out: await signOut(auth);
        return;
      }

      if (!user.isCandidate) {
        setError("You are not registered as a candidate. Please register first.");
        // Optionally sign out the user to clear auth state:
        // await signOut(auth);
        return;
      }

      // Only candidates reach here
      router.push("/candidate/dashboard");
    } catch (err: any) {
      // Handle Firebase Auth errors with friendly messages
      let message = "Login failed. Please try again.";
      if (err.code === "auth/user-not-found") {
        message = "No account found with this email. Please register.";
      } else if (err.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email format.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many attempts. Try again later.";
      }
      setError(message || err.message);
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
          <h1>Candidate Login Page</h1>

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
            New candidate? <Link href="/candidate/register">Register</Link>
          </p>
          <p className="link">
            <Link href="/admin/login">→ Admin Login</Link>
          </p>
        </form>
      </motion.div>

      {/* The <style jsx> block remains unchanged from your original login page */}
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
        .cardWrapper { width: 100%; max-width: 500px; }
        .card {
          width: 100%;
          background: rgba(255,255,255,0.12);
          padding: 50px;
          border-radius: 25px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          color: #fff;
          backdrop-filter: blur(25px);
          box-shadow: 0 35px 70px rgba(0,0,0,0.5);
        }
        .logo { width: 130px; height: 130px; border-radius: 50%; object-fit: cover; border: 4px solid #36d1dc; margin-bottom: 15px; }
        h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 20px; }
        input, button { width: 100%; max-width: 400px; height: 55px; padding: 0 20px; border-radius: 22px; font-size: 1.1rem; border: none; outline: none; }
        input { background: rgba(255,255,255,0.25); color: #fff; }
        input::placeholder { color: #f0f0f0; }
        button { background: linear-gradient(135deg,#36d1dc,#5b86e5); color: #fff; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.45); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: #ff6b6b; text-align: center; margin: 10px 0; }
        .link { margin-top: 15px; text-align: center; }
        .link a { color: #36d1dc; font-weight: 600; text-decoration: none; }
        .link a:hover { text-decoration: underline; }
        @media (max-width: 480px) { .card { padding: 35px 20px; border-radius: 20px; gap: 15px; } .logo { width: 100px; height: 100px; } h1 { font-size: 1.8rem; } input, button { height: 50px; font-size: 1rem; border-radius: 18px; } }
      `}</style>
    </div>
  );
}