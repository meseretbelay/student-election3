"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "student" | "candidate" | "admin";
}

export default function ForgotPasswordModal({ isOpen, onClose, userType }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if user exists with this email and correct type
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No account found with this email address.");
      }

      const userData = querySnapshot.docs[0].data();
      
      // Verify user type matches
      if (userType === "admin" && !userData.isAdmin) {
        throw new Error("This email is not registered as an admin.");
      }
      if (userType === "candidate" && !userData.isCandidate) {
        throw new Error("This email is not registered as a candidate.");
      }
      if (userType === "student" && (userData.isAdmin || userData.isCandidate)) {
        throw new Error("This email is registered as an admin or candidate. Please use the correct login page.");
      }

      // Send Firebase password reset email
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login?resetSuccess=true`,
      });
      
      setSuccess(`Password reset email sent to ${email}. Please check your inbox (including spam folder).`);
      
      // Clear email field after success
      setEmail("");
      
      // Auto close after 5 seconds
      setTimeout(() => {
        onClose();
      }, 5000);
      
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      // Handle specific Firebase errors
      let message = "Failed to send reset email. Please try again.";
      if (err.code === "auth/user-not-found") {
        message = "No user found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        message = "Invalid email address format.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many reset attempts. Please try again later.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      }
      
      setError(err.message || message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <motion.div
        className="modal"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
      >
        <h2>Reset Password</h2>
        
        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="success">
            <p>{success}</p>
            <p className="success-note">Redirecting to login page...</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleResetPassword}>
            <p className="info">
              Enter your email address. We'll send you a link to reset your password.
            </p>
            
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
            />
            
            <div className="requirements">
              <small>
                <span>🔒</span> A secure reset link will be sent to your email
              </small>
            </div>
            
            <div className="buttons">
              <button 
                type="submit" 
                disabled={loading} 
                className="primary"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
              
              <button 
                type="button" 
                onClick={handleClose} 
                className="secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="buttons">
            <button 
              type="button" 
              onClick={handleClose} 
              className="primary"
            >
              Close
            </button>
          </div>
        )}

        <style jsx>{`
          .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
          }

          .modal {
            background: linear-gradient(135deg, #1e3a5f, #0f2b3f);
            padding: 40px;
            border-radius: 25px;
            width: 90%;
            max-width: 450px;
            color: #fff;
            border: 2px solid #36d1dc;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            animation: glow 2s ease-in-out infinite alternate;
          }

          @keyframes glow {
            from { box-shadow: 0 25px 50px rgba(54, 209, 220, 0.3); }
            to { box-shadow: 0 25px 60px rgba(54, 209, 220, 0.6); }
          }

          h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #36d1dc;
            font-size: 2rem;
            font-weight: 700;
            text-shadow: 0 2px 10px rgba(54, 209, 220, 0.3);
          }

          .info {
            text-align: center;
            margin-bottom: 25px;
            color: #e0e0e0;
            font-size: 1rem;
            line-height: 1.6;
          }

          input {
            width: 100%;
            padding: 16px;
            margin-bottom: 15px;
            border-radius: 12px;
            border: 2px solid rgba(54, 209, 220, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
          }

          input:focus {
            border-color: #36d1dc;
            box-shadow: 0 0 20px rgba(54, 209, 220, 0.4);
            background: rgba(255, 255, 255, 0.15);
          }

          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .requirements {
            margin-bottom: 25px;
            text-align: center;
          }

          .requirements small {
            color: #ffd700;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .buttons {
            display: flex;
            gap: 15px;
            margin-top: 10px;
          }

          button {
            flex: 1;
            padding: 14px;
            border-radius: 12px;
            border: none;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          button.primary {
            background: linear-gradient(135deg, #36d1dc, #5b86e5);
            color: white;
            box-shadow: 0 4px 15px rgba(54, 209, 220, 0.3);
          }

          button.secondary {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(54, 209, 220, 0.5);
          }

          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .error {
            color: #ff6b6b;
            text-align: center;
            margin-bottom: 20px;
            padding: 12px;
            background: rgba(255, 107, 107, 0.15);
            border-radius: 10px;
            border: 1px solid rgba(255, 107, 107, 0.3);
            font-size: 0.95rem;
          }

          .success {
            color: #4caf50;
            text-align: center;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(76, 175, 80, 0.15);
            border-radius: 10px;
            border: 1px solid rgba(76, 175, 80, 0.3);
          }

          .success-note {
            color: #ffd700;
            margin-top: 10px;
            font-size: 0.9rem;
          }

          @media (max-width: 480px) {
            .modal {
              padding: 25px;
            }
            h2 {
              font-size: 1.6rem;
            }
            input {
              padding: 14px;
            }
            button {
              padding: 12px;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
}