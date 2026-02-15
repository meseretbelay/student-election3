"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../../lib/firebaseFunctions";
import Link from "next/link";
import { motion } from "framer-motion";
import { db } from "../../lib/firebase";
 
export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 
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
      setError("You are not a valid MAU student. Student ID must be between MAU1400 and MAU1899.");
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
      setError("Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.");
      setLoading(false);
      return;
    }
 
    try {
      await registerUser(username.trim(), idUpper, email.trim(), pass);
      alert("Registration successful! A verification email has been sent to your email. Please click the link in the email to verify your account before logging in.");
      router.push("/login");
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
            required
            disabled={loading}
          />
 
          <input
            placeholder="Student ID (e.g., MAU1425)"
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
 
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
 
          <p className="link">
            Already have an account? <Link href="/login">Login</Link>
          </p>
 
          <p className="note">
            Only MAU students with ID from <strong>MAU1400</strong> to <strong>MAU1899</strong> can register.
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
          padding: 0px;
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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
          outline: none;
          box-sizing: border-box;
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
          font-size: 1rem;
          text-align: center;
          margin: 0;
        }

        .link {
          margin-top: 15px;
          font-size: 1rem;
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

        .link a:visited {
          color: #36d1dc;
        }

        .note {
          font-size: 0.95rem;
          text-align: center;
          color: #ccc;
          margin-top: 10px;
          line-height: 1.4;
        }

        .note strong {
          color: #36d1dc;
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

          .link, .note {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 768px) {
          .card {
            padding: 40px 25px;
          }

          h1 {
            font-size: 2rem;
          }

          input,
          button {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </div>
  );
}