// app/vote/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import {
  submitVote,
  listenAuth,
  logoutUser,
} from "../../lib/firebaseFunctions";
import { Candidate, AppUser } from "../../lib/types";
import ResultsChart from "../../components/ResultsChart";
import { collection, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function VotePage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);

  const [unsubUsers, setUnsubUsers] = useState<Unsubscribe | null>(null);
  const [unsubCandidates, setUnsubCandidates] = useState<Unsubscribe | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = listenAuth((currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      if (currentUser.isAdmin) {
        router.push("/admin/dashboard");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Real-time voter count
  useEffect(() => {
    if (loading || !user) return;

    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        let total = 0;
        let voted = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.isAdmin) {
            total++;
            if (data.hasVoted) voted++;
          }
        });
        setTotalVoters(total);
        setVotedCount(voted);
      },
      (error) => {
        if (error.code !== "permission-denied") console.error("Users snapshot error:", error);
      }
    );
    setUnsubUsers(() => unsub);
    return () => unsub();
  }, [loading, user]);

  // Real-time candidates
  useEffect(() => {
    if (loading || !user) return;

    const unsub = onSnapshot(
      collection(db, "candidates"),
      (snapshot) => {
        const cands: Candidate[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Candidate));
        setCandidates(cands);
      },
      (error) => {
        if (error.code !== "permission-denied") console.error("Candidates snapshot error:", error);
      }
    );
    setUnsubCandidates(() => unsub);
    return () => unsub();
  }, [loading, user]);

  // Cleanup
  useEffect(() => {
    return () => {
      unsubUsers?.();
      unsubCandidates?.();
    };
  }, [unsubUsers, unsubCandidates]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      unsubUsers?.();
      unsubCandidates?.();
      await logoutUser();
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  const handleVote = async (candidateId: string) => {
    if (!user || user.hasVoted) return;

    try {
      await submitVote(user.uid, candidateId);
      setUser((prev) => (prev ? { ...prev, hasVoted: true } : null));
      setMessage({ type: "success", text: "Thank you for voting! 🎉 Your vote has been recorded." });
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Voting failed. Please try again." });
      setTimeout(() => setMessage(null), 6000);
    }
  };

  if (loading) {
    return (
      <div className="loadingPage">
        <p>Loading voting page...</p>
        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(270deg, #0f2027, #203a43, #2c5364);
            color: #36d1dc;
            font-size: 1.6rem;
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  const isElectionComplete = votedCount === totalVoters && totalVoters > 0;
  const maxVotes = Math.max(...candidates.map((c) => c.votes || 0), 0);
  const winners = candidates.filter((c) => (c.votes || 0) === maxVotes && maxVotes > 0);

  return (
    <div className="page">
      {/* Fixed Top Bar - Clean: Logo + Title + Logout */}
      <div className="topBar">
        <div className="topLeftLogo">
          <img src="/images/mau.jpg" alt="MAU Logo" className="logoImg" />
        </div>
        <h1 className="mainTitle">Vote Your Candidate</h1>
        <div className="topButtons">
          <button className="logoutBtn" onClick={handleLogout} disabled={loggingOut}>
            🚪 {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

      {/* Glowing Horizontal Divider */}
      <div className="dividerLine"></div>

      {/* Welcome + Vote Status Box (non-static, like admin dashboard) */}
      <div className="statusBox">
        <div className="welcomeText">
          Welcome, <strong className="blue">{user.username}</strong>
        </div>
        <div className="voteStatus">
          {votedCount} / {totalVoters} students have voted
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Candidates Grid */}
      <div className="grid">
        {candidates.map((c) => (
          <motion.div
            key={c.id}
            className="cardWrap"
            whileHover={{ scale: user.hasVoted ? 1 : 1.05 }}
          >
            <div className="card">
              <img src={c.image} alt={c.name} className="candidateImg" />
              <h2 className="blue">{c.name}</h2>
              <p className="desc">{c.description}</p>
              <p className="votes">
                <strong>{c.votes || 0}</strong> vote{c.votes !== 1 ? "s" : ""}
              </p>

              {!user.hasVoted ? (
                <button className="voteBtn" onClick={() => handleVote(c.id!)}>
                  Vote
                </button>
              ) : (
                <button className="voteBtn voted" disabled>
                  Already Voted ✓
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Results */}
      {candidates.length > 0 && (
        <div className="resultsSection">
          <h2 className="chartTitle">Live Results</h2>
          <div className="chartContainer">
            <ResultsChart candidates={candidates} />
          </div>

          {isElectionComplete && (
            <div className="winnerBox">
              🏆 <strong>ELECTION COMPLETE!</strong> 🏆<br /><br />
              Winner{winners.length > 1 ? "s (Tie)" : ""}:<br />
              <strong className="winnerName">
                {winners.map((w, i) => (
                  <span key={w.id}>
                    {w.name}{i < winners.length - 1 ? " & " : ""}
                  </span>
                ))}
              </strong>
              <br /><br />
              with {maxVotes} vote{maxVotes !== 1 ? "s" : ""}!
            </div>
          )}
        </div>
      )}

      {/* Waiting message */}
      {!isElectionComplete && totalVoters > 0 && (
        <div className="waitingMessage">
          Waiting for all {totalVoters} students to vote...<br />
          ({votedCount} have voted so far)
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 230px 20px 40px 20px;          background: linear-gradient(270deg, #0f2027, #203a43, #2c5364);
          color: #fff;
        }

        /* Fixed Top Bar */
        .topBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .topLeftLogo {
          flex-shrink: 0;
        }

        .logoImg {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          object-fit: cover;
          border: 5px solid #36d1dc;
          box-shadow: 0 12px 40px rgba(54, 209, 220, 0.6);
          transition: all 0.4s ease;
        }

        .logoImg:hover {
          transform: scale(1.1);
          box-shadow: 0 20px 50px rgba(54, 209, 220, 0.8);
        }

        .mainTitle {
          font-size: 2.8rem;
          font-weight: 900;
          color: #36d1dc;
          margin: 0;
          text-align: center;
          flex: 1;
          text-shadow: 0 4px 15px rgba(54,209,220,0.4);
        }

        .topButtons {
          display: flex;
          gap: 15px;
        }

        .logoutBtn {
          padding: 14px 28px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logoutBtn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        .logoutBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Glowing Divider Line */
        .dividerLine {
          position: fixed;
          top: 195px;          /* exactly below topBar */
          left: 40px;
          right: 40px;
          height: 5px;
          background: linear-gradient(90deg, transparent, #36d1dc, transparent);
          border-radius: 3px;
          box-shadow: 0 0 20px rgba(54, 209, 220, 0.8);
          z-index: 999;
        }
        

        /* Welcome + Vote Status Box (same as admin dashboard) */
        .statusBox {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 80px auto;
          padding: 40px;
          background: rgba(255,255,255,0.08);
          border-radius: 24px;
          backdrop-filter: blur(12px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }

        .welcomeText {
          font-size: 2.2rem;
          margin-bottom: 15px;
          font-weight: 600;
        }

        .welcomeText .blue {
          color: #36d1dc;
          font-weight: 800;
        }

        .voteStatus {
          font-size: 2rem;
          font-weight: 700;
          color: #36d1dc;
        }

        /* Message */
        .message {
          text-align: center;
          padding: 16px 32px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.3rem;
          max-width: 700px;
          margin: 0 auto 60px auto;
        }

        .message.success {
          background: rgba(56, 161, 105, 0.3);
          border: 2px solid #38a169;
          color: #9ae6b4;
        }

        .message.error {
          background: rgba(229, 62, 62, 0.3);
          border: 2px solid #e53e3e;
          color: #feb2b2;
        }

        /* Candidates Grid */
        .grid {
          display: flex;
          flex-wrap: wrap;
          gap: 40px;
          justify-content: center;
          margin: 60px 0;
        }

        .cardWrap {
          padding: 10px;
          border-radius: 24px;
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
        }

        .card {
          width: 340px;
          min-height: 540px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          backdrop-filter: blur(12px);
        }

        .candidateImg {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 25px;
          border: 4px solid #36d1dc;
          box-shadow: 0 10px 30px rgba(54,209,220,0.4);
        }

        .desc {
          flex-grow: 1;
          margin: 20px 0;
          line-height: 1.6;
          font-size: 1.1rem;
        }

        .votes {
          font-size: 1.8rem;
          color: #ffd700;
          font-weight: 800;
          margin: 25px 0;
        }

        .voteBtn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1.3rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #1e90ff, #36d1dc);
          color: white;
        }

        .voteBtn:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(54,209,220,0.6);
        }

        .voteBtn.voted {
          background: linear-gradient(135deg, #27ae60, #38a169);
          cursor: not-allowed;
        }

        /* Results Section */
        .resultsSection {
          max-width: 1100px;
          margin: 100px auto 60px;
          padding: 50px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          border-radius: 28px;
          backdrop-filter: blur(15px);
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
          text-align: center;
        }

        .chartTitle {
          font-size: 2.6rem;
          margin-bottom: 40px;
          color: #36d1dc;
          font-weight: 700;
        }

        .chartContainer {
          max-width: 900px;
          margin: 0 auto;
          height: 450px;
        }

        .winnerBox {
          margin-top: 70px;
          padding: 60px;
          background: rgba(255,215,0,0.25);
          border-radius: 30px;
          font-size: 3rem;
          font-weight: 900;
          color: #ffd700;
          line-height: 1.8;
          border: 4px dashed #ffd700;
          box-shadow: 0 20px 50px rgba(255,215,0,0.3);
        }

        .winnerName {
          color: #36d1dc;
          font-size: 3.4rem;
        }

        .waitingMessage {
          text-align: center;
          font-size: 1.8rem;
          margin: 100px 0;
          color: #ccc;
          line-height: 1.8;
        }
        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 480px) {
          .page {
            padding: 280px 10px 20px 10px;
          }

          .topBar {
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 15px;
          }

          .logoImg {
            width: 90px;
            height: 90px;
          }

          .mainTitle {
            font-size: 1.8rem;
          }

          .logoutBtn {
            padding: 10px 20px;
            font-size: 0.95rem;
          }

          .grid {
            gap: 20px;
            flex-direction: column;
            margin: 40px 0;
          }

          .card {
            width: 90%;
            min-height: auto;
            padding: 20px;
          }

          .candidateImg {
            width: 120px;
            height: 120px;
            margin-bottom: 20px;
          }

          .desc {
            font-size: 1rem;
            margin: 15px 0;
          }

          .votes {
            font-size: 1.4rem;
          }

          .voteBtn {
            font-size: 1.1rem;
            padding: 12px;
          }

          .statusBox {
            padding: 25px;
          }

          .welcomeText {
            font-size: 1.6rem;
          }

          .voteStatus {
            font-size: 1.4rem;
          }

          .message {
            font-size: 1.1rem;
            padding: 12px 20px;
          }

          .resultsSection {
            padding: 30px 15px;
          }

          .chartTitle {
            font-size: 1.8rem;
          }

          .winnerBox {
            font-size: 1.8rem;
            padding: 30px;
          }

          .winnerName {
            font-size: 2rem;
          }

          .waitingMessage {
            font-size: 1.3rem;
            margin: 60px 0;
          }
        }

        @media (max-width: 768px) {
          .topBar {
            padding: 15px 20px;
          }

          .logoImg {
            width: 110px;
            height: 110px;
          }

          .mainTitle {
            font-size: 2rem;
          }

          .logoutBtn {
            font-size: 1rem;
            padding: 12px 22px;
          }

          .grid {
            gap: 25px;
          }

          .card {
            width: 80%;
          }

          .candidateImg {
            width: 130px;
            height: 130px;
          }

          .desc {
            font-size: 1.05rem;
          }

          .votes {
            font-size: 1.6rem;
          }
        
      `}</style>
    </div>
  );
}
