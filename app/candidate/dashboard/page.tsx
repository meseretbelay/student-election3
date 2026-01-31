"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function CandidateDashboard() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/candidate/login");
        return;
      }

      const q = query(collection(db, "candidates"), where("uid", "==", user.uid));

      const unsubSnap = onSnapshot(q, (snap) => {
        if (snap.empty) {
          setCandidate(null);
        } else {
          setCandidate({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
        setLoading(false);
      });

      return () => unsubSnap();
    });

    return () => unsub();
  }, [router]);

  const logout = async () => {
    await signOut(auth);
    router.push("/candidate/login");
  };

  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  if (!candidate) {
    return (
      <div className="page">
        <div className="logoContainer">
          <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
        </div>
        <h1 className="welcome">No Candidate Profile Found</h1>
        <p className="status">You need to register as a candidate first.</p>

        <Link href="/candidate/register">
          <button className="actionBtn">Register as Candidate</button>
        </Link>

        <button className="logoutBtn" onClick={logout}>
          Logout
        </button>

        <style jsx>{`
          .page {
            min-height: 100vh;
            padding: 50px 20px;
            background: linear-gradient(135deg, #203a43, #2c5364);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-family: 'Poppins', sans-serif;
            text-align: center;
          }
          .logoContainer { margin-bottom: 30px; }
          .logo {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 5px solid #36d1dc;
            box-shadow: 0 10px 30px rgba(54, 209, 220, 0.6);
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          .logo:hover { transform: rotate(-5deg) scale(1.05); }
          .welcome {
            font-size: 2.8rem;
            margin-bottom: 20px;
            color: #36d1dc;
            text-shadow: 0 4px 15px rgba(54, 209, 220, 0.5);
          }
          .status {
            font-size: 1.6rem;
            margin-bottom: 30px;
            color: #ff9800;
          }
          .actionBtn, .logoutBtn {
            padding: 15px 35px;
            font-size: 1.3rem;
            font-weight: 700;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 15px 0;
          }
          .actionBtn {
            background: linear-gradient(135deg, #36d1dc, #5b86e5);
            color: #fff;
            box-shadow: 0 5px 20px rgba(54, 209, 220, 0.5);
          }
          .actionBtn:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(54, 209, 220, 0.7);
          }
          .logoutBtn {
            background: linear-gradient(135deg, #ff416c, #ff4b2b);
            color: #fff;
            box-shadow: 0 5px 20px rgba(255, 65, 108, 0.5);
          }
          .logoutBtn:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(255, 65, 108, 0.7);
          }
          .loading {
            font-size: 2rem;
            color: #36d1dc;
            text-shadow: 0 2px 10px rgba(54, 209, 220, 0.5);
          }
          @media (max-width: 768px) {
            .welcome { font-size: 2.2rem; }
            .status { font-size: 1.4rem; }
            .actionBtn, .logoutBtn { font-size: 1.1rem; padding: 12px 30px; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ===== MAU Logo ===== */}
      <div className="logoContainer">
        <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
      </div>

      <h1 className="welcome">Welcome, {candidate.name}</h1>

      <p className={`status ${candidate.status}`}>
        Status: <strong>{candidate.status.toUpperCase()}</strong>
      </p>

      {candidate.status === "pending" && (
        <p className="infoMsg">
          Your registration is pending approval. Please wait for admin review.
        </p>
      )}

      {candidate.status === "rejected" && (
        <p className="infoMsg rejected">
          Your application was rejected. Please update your criteria and resubmit.
        </p>
      )}

      {candidate.status !== "approved" && (
        <Link href="/candidate/criteria">
          <button className="actionBtn">Submit / Edit Criteria</button>
        </Link>
      )}

      {candidate.status === "approved" && (
        <p className="approvedMsg">🎉 Approved! You are visible on the voting page.</p>
      )}

      <button className="logoutBtn" onClick={logout}>
        Logout
      </button>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 50px 20px;
          background: linear-gradient(135deg, #203a43, #2c5364);
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          text-align: center;
        }

        .logoContainer {
          margin-bottom: 30px;
        }

        .logo {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 5px solid #36d1dc;
          box-shadow: 0 10px 30px rgba(54, 209, 220, 0.6);
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .logo:hover {
          transform: rotate(-5deg) scale(1.05);
        }

        .welcome {
          font-size: 2.8rem;
          margin-bottom: 20px;
          color: #36d1dc;
          text-shadow: 0 4px 15px rgba(54, 209, 220, 0.5);
        }

        .status {
          font-size: 1.8rem;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .status.pending { color: #ff9800; }
        .status.approved { color: #4caf50; }
        .status.rejected { color: #f44336; }

        .infoMsg {
          font-size: 1.4rem;
          margin: 20px 0 30px;
          max-width: 600px;
        }

        .infoMsg.rejected {
          color: #ff6b6b;
        }

        .actionBtn,
        .logoutBtn {
          padding: 15px 35px;
          font-size: 1.3rem;
          font-weight: 700;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 15px 0;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
        }

        .actionBtn {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: #fff;
        }

        .actionBtn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(54, 209, 220, 0.7);
        }

        .logoutBtn {
          background: linear-gradient(135deg, #ff416c, #ff4b2b);
          color: #fff;
        }

        .logoutBtn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(255, 65, 108, 0.7);
        }

        .approvedMsg {
          margin: 30px 0;
          font-size: 1.8rem;
          color: #ffd700;
          text-shadow: 0 4px 10px rgba(255, 215, 0, 0.6);
        }

        .loading {
          font-size: 2rem;
          color: #36d1dc;
          text-shadow: 0 2px 10px rgba(54, 209, 220, 0.5);
        }

        @media (max-width: 768px) {
          .welcome { font-size: 2.2rem; }
          .status { font-size: 1.5rem; }
          .actionBtn, .logoutBtn { font-size: 1.1rem; padding: 12px 30px; }
          .logo { width: 120px; height: 120px; }
        }
      `}</style>
    </div>
  );
}