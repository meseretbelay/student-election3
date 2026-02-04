"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";

export default function CandidateCriteria() {
  const router = useRouter();

  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [manifesto, setManifesto] = useState("");
  const [vision, setVision] = useState("");
  const [experience, setExperience] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/candidate/login");
        return;
      }

      const q = query(collection(db, "candidates"), where("uid", "==", user.uid));

      const unsubSnap = onSnapshot(q, (snap) => {
        if (!snap.docs[0]) return;

        const d = snap.docs[0];
        const data = d.data();

        setCandidateId(d.id);
        setStatus(data.status || "pending");

        const c = data.criteria || {};
        setManifesto(c.manifesto || "");
        setVision(c.vision || "");
        setExperience(c.experience || "");

        if (c.manifesto || c.vision || c.experience) {
          setAlreadySubmitted(true);
        }

        setLoading(false);
      });

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || alreadySubmitted) return;

    setSubmitting(true);

    const imageBase64 = photo ? await toBase64(photo) : "";

    await updateDoc(doc(db, "candidates", candidateId), {
      image: imageBase64,
      description: vision,
      criteria: {
        manifesto,
        vision,
        experience,
        submittedAt: Timestamp.now(),
      },
      status: "pending",
    });

    alert("Submitted! Waiting for admin approval.");
    setAlreadySubmitted(true);
    setSubmitting(false);
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/candidate/login");
  };

  if (loading) {
    return (
      <div className="page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page">
      <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Candidate Criteria</h1>

        <p className={`status ${status}`}>
          Status: <strong>{status.toUpperCase()}</strong>
        </p>

        {status === "approved" ? (
          <p className="approved">✅ Approved</p>
        ) : alreadySubmitted ? (
          <p className="pending">⏳ Waiting for admin approval</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />

            <textarea
              placeholder="Manifesto"
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              required
            />

            <textarea
              placeholder="Vision"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Experience (Years)"
              value={experience}
              min="0"
              inputMode="numeric"
              pattern="[0-9]*"
              onKeyDown={(e) =>
                ["e", "E", "+", "-", "."].includes(e.key) &&
                e.preventDefault()
              }
              onChange={(e) =>
                setExperience(e.target.value.replace(/\D/g, ""))
              }
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}
      </motion.div>

      {/* ✅ LOGOUT WRAPPER FOR SPACING */}
      <div className="logoutWrapper">
        <button className="logoutBtn" onClick={logout}>
          Logout
        </button>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #203a43, #2c5364);
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #fff;
          font-family: "Poppins", sans-serif;
        }

        .logo {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 5px solid #36d1dc;
          box-shadow: 0 10px 30px rgba(54, 209, 220, 0.6);
          object-fit: cover;
          margin-bottom: 25px;
        }

        .card {
          background: rgba(255, 255, 255, 0.15);
          padding: 40px;
          border-radius: 25px;
          width: 100%;
          max-width: 550px;
          color: white;
          text-align: center;
        }

        textarea,
        input {
          width: 100%;
          padding: 14px;
          margin-bottom: 15px;
          border-radius: 15px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 1rem;
          outline: none;
        }

        textarea::placeholder,
        input::placeholder {
          color: #ffffff;
          opacity: 1;
        }

        button[type="submit"] {
          width: 100%;
          padding: 15px;
          border-radius: 20px;
          border: none;
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        .logoutWrapper {
          margin-top: 40px;
        }

        .logoutBtn {
          padding: 12px 25px;
          border-radius: 20px;
          border: none;
          background: linear-gradient(135deg, #ff416c, #ff4b2b);
          color: #fff;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 5px 20px rgba(255, 65, 108, 0.5);
          transition: all 0.3s ease;
        }

        .logoutBtn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 65, 108, 0.7);
        }

        .status {
          text-align: center;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }

        .approved {
          color: #4caf50;
          font-weight: bold;
        }

        .pending {
          color: #ffd700;
          font-weight: bold;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.3);
          border-top: 6px solid #36d1dc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .logo {
            width: 100px;
            height: 100px;
          }
          .card {
            padding: 25px;
          }
        }
      `}</style>
    </div>
  );
}
