"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../lib/firebase";
import {
  submitVote,
  listenAuth,
  logoutUser,
} from "../../lib/firebaseFunctions";
import { Candidate, AppUser } from "../../lib/types";
import ResultsChart from "../../components/ResultsChart";
import { collection, doc, onSnapshot, Unsubscribe, Timestamp } from "firebase/firestore";

type ElectionSettings = {
  startDate: Timestamp;
  endDate: Timestamp;
};

// Vote Confirmation Modal Component
const VoteConfirmModal = ({
  isOpen,
  candidate,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  candidate: Candidate | null;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!isOpen || !candidate) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div 
          className="vote-confirm-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="modal-icon">🗳️</div>
          <h3 className="modal-title">Confirm Your Vote</h3>
          
          <div className="candidate-preview">
            <img 
              src={candidate.image || "/images/default-user.png"} 
              alt={candidate.name}
              className="preview-image"
            />
            <div className="preview-details">
              <h4>{candidate.name}</h4>
              <p>{candidate.description || "No description provided"}</p>
            </div>
          </div>

          <p className="modal-message">
            Are you sure you want to cast your vote for this candidate?<br />
            <strong>This action cannot be undone.</strong>
          </p>

          <div className="modal-actions">
            <button 
              className="modal-btn cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className="modal-btn confirm"
              onClick={onConfirm}
            >
              Yes, Vote Now
            </button>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .vote-confirm-modal {
          background: linear-gradient(135deg, #1e3a52, #162b3c);
          padding: 40px;
          border-radius: 24px;
          width: 90%;
          max-width: 500px;
          text-align: center;
          border: 2px solid #36d1dc;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .modal-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .modal-title {
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 25px;
          background: linear-gradient(135deg, #fff, #36d1dc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .candidate-preview {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 25px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .preview-image {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #36d1dc;
        }

        .preview-details {
          flex: 1;
          text-align: left;
        }

        .preview-details h4 {
          color: #36d1dc;
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .preview-details p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .modal-message {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .modal-message strong {
          color: #ffd700;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
        }

        .modal-btn {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn.cancel {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .modal-btn.cancel:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .modal-btn.confirm {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
        }

        .modal-btn.confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(54, 209, 220, 0.3);
        }

        @media (max-width: 480px) {
          .vote-confirm-modal {
            padding: 30px 20px;
          }

          .modal-title {
            font-size: 1.6rem;
          }

          .candidate-preview {
            flex-direction: column;
            text-align: center;
          }

          .preview-details {
            text-align: center;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-message {
            font-size: 1rem;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default function VotePage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [unsubUsers, setUnsubUsers] = useState<Unsubscribe | null>(null);
  const [unsubCandidates, setUnsubCandidates] = useState<Unsubscribe | null>(null);
  const [unsubSettings, setUnsubSettings] = useState<Unsubscribe | null>(null);
  
  // Vote confirmation modal state
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // ------------------ AUTH ------------------
  useEffect(() => {
    const unsub = listenAuth((currentUser) => {
      if (!currentUser) {
        router.push("/candidate/login");
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

  // ------------------ REAL-TIME VOTER COUNT ------------------
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

  // ------------------ REAL-TIME CANDIDATES (ONLY APPROVED) ------------------
  useEffect(() => {
    if (loading || !user) return;
    const unsub = onSnapshot(
      collection(db, "candidates"),
      (snapshot) => {
        const cands: Candidate[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: "",
            votes: 0,
            status: "pending",
            image: "",
            description: "",
            ...doc.data(),
          } as Candidate))
          .filter((c) => c.status === "approved");
        setCandidates(cands);
      },
      (error) => {
        if (error.code !== "permission-denied") console.error("Candidates snapshot error:", error);
      }
    );
    setUnsubCandidates(() => unsub);
    return () => unsub();
  }, [loading, user]);

  // ------------------ REAL-TIME ELECTION SETTINGS ------------------
  useEffect(() => {
    if (loading || !user) return;
    const unsub = onSnapshot(
      doc(db, "settings", "election"),
      (snapshot) => {
        setSettings(snapshot.data() as ElectionSettings | null);
      },
      (error) => {
        console.error("Settings snapshot error:", error);
      }
    );
    setUnsubSettings(() => unsub);
    return () => unsub();
  }, [loading, user]);

  // ------------------ CLEANUP ------------------
  useEffect(() => {
    return () => {
      unsubUsers?.();
      unsubCandidates?.();
      unsubSettings?.();
    };
  }, [unsubUsers, unsubCandidates, unsubSettings]);

  // ------------------ LOGOUT ------------------
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      unsubUsers?.();
      unsubCandidates?.();
      unsubSettings?.();
      await logoutUser();
      router.push("/candidate/login");
    } catch (err) {
      router.push("/candidate/login");
    }
  };

  // ------------------ VOTE CONFIRMATION ------------------
  const handleVoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowVoteConfirm(true);
  };

  const handleVoteConfirm = async () => {
    if (!selectedCandidate || !user || user.hasVoted || !isVotingOpen) {
      setShowVoteConfirm(false);
      return;
    }

    setShowVoteConfirm(false);
    
    try {
      await submitVote(user.uid, selectedCandidate.id!);
      setUser((prev) => (prev ? { ...prev, hasVoted: true } : null));
      setMessage({ type: "success", text: "Thank you for voting! 🎉 Your vote has been recorded." });
      setTimeout(() => setMessage(null), 6000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Voting failed. Please try again." });
      setTimeout(() => setMessage(null), 6000);
    }
  };

  const handleVoteCancel = () => {
    setShowVoteConfirm(false);
    setSelectedCandidate(null);
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

  const now = Date.now();
  const isVotingStarted = settings && now >= settings.startDate.toMillis();
  const isVotingOpen = isVotingStarted && settings && now < settings.endDate.toMillis();
  const isElectionEnded = settings && now >= settings.endDate.toMillis();

  const maxVotes = Math.max(...candidates.map((c) => c.votes || 0), 0);

  // Winner calculation with numeric experience tie-breaker
  let primaryWinner = null;
  let winnerDisplay = "No winner yet (no votes cast)";
  let experienceNumber = "Not provided";
  let tiedOthers = "";
  if (maxVotes > 0) {
    let tiedCandidates = candidates.filter((c) => (c.votes || 0) === maxVotes);
    if (tiedCandidates.length === 1) {
      primaryWinner = tiedCandidates[0];
      winnerDisplay = primaryWinner.name;
    } else if (tiedCandidates.length >= 2) {
      // Parse experience as number (extract digits only, fallback to 0)
      tiedCandidates.sort((a, b) => {
        const getExpNumber = (exp: string = "") => {
          const cleaned = exp.replace(/[^0-9]/g, "");
          const num = parseInt(cleaned, 10);
          return isNaN(num) ? 0 : num;
        };
        const aNum = getExpNumber(a.criteria?.experience);
        const bNum = getExpNumber(b.criteria?.experience);
        if (aNum !== bNum) return bNum - aNum; // Higher number first
        return a.name.localeCompare(b.name); // Alphabetical fallback
      });
      primaryWinner = tiedCandidates[0];
      winnerDisplay = `${primaryWinner.name} (Tie-breaker: higher experience in criteria)`;
      tiedOthers = tiedCandidates.slice(1).map((c) => c.name).join(", ");
    }
    // Extract numeric experience for display
    if (primaryWinner && primaryWinner.criteria?.experience) {
      const cleaned = primaryWinner.criteria.experience.replace(/[^0-9]/g, "");
      const num = parseInt(cleaned, 10);
      experienceNumber = isNaN(num) ? "Not provided" : num.toString();
    }
  }

  const filteredCandidates = candidates.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      {/* Vote Confirmation Modal */}
      <VoteConfirmModal
        isOpen={showVoteConfirm}
        candidate={selectedCandidate}
        onConfirm={handleVoteConfirm}
        onCancel={handleVoteCancel}
      />

      {/* Top Bar */}
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
      <div className="dividerLine"></div>

      {/* Status Box */}
      <div className="statusBox">
        <div className="welcomeText">
          Welcome, <strong className="blue">{user.username}</strong>
        </div>
        <div className="voteStatus">
          {votedCount} / {totalVoters} students have voted
        </div>
        <div className="searchWrapper">
          <span className="searchIcon">🔍</span>
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="searchInput"
          />
        </div>
      </div>

      {/* Message */}
      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {!settings ? (
        <div className="waitingMessage">Election settings not configured yet.</div>
      ) : !isVotingStarted ? (
        <div className="waitingMessage">
          Voting has not started yet. Starts on {settings.startDate.toDate().toLocaleString()}.
        </div>
      ) : !isVotingOpen ? (
        <div className="waitingMessage">Voting has ended. See results below.</div>
      ) : user.hasVoted ? (
        <div className="waitingMessage">You have already voted. Wait for results.</div>
      ) : null}

      {/* Candidates Grid */}
      {(isVotingOpen || isElectionEnded) && (
        <div className="grid">
          {filteredCandidates.map((c) => (
            <motion.div
              key={c.id}
              className="cardWrap"
              whileHover={{
                scale: 1.05,
                rotateX: -3,
                rotateY: 3,
                boxShadow: "0 25px 50px rgba(54, 209, 220, 0.6)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="card">
                <img src={c.image || "/images/default-user.png"} alt={c.name} className="candidateImg" />
                <h2 className="blue">{c.name || "Unnamed Candidate"}</h2>
                <p className="desc">{c.description || "No description provided."}</p>
                <p className="votes">
                  <strong>{c.votes || 0}</strong> vote{c.votes !== 1 ? "s" : ""}
                </p>
                {!user.hasVoted && isVotingOpen ? (
                  <button 
                    className="voteBtn" 
                    onClick={() => handleVoteClick(c)}
                  >
                    Vote
                  </button>
                ) : (
                  <button className="voteBtn voted" disabled>
                    {user.hasVoted ? "Already Voted ✓" : "Voting Closed"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Results Section */}
      {candidates.length > 0 && (
        <div className="resultsSection">
          <h2 className="chartTitle">Live Election Results</h2>
          <div className="chartContainer">
            <ResultsChart candidates={candidates} />
          </div>

          {isElectionEnded && (
            <div className="winnerBox">
              🏆 <strong>ELECTION COMPLETE!</strong> 🏆<br /><br />

              {primaryWinner ? (
                <>
                  <div className="winnerPhotoContainer">
                    <img
                      src={primaryWinner.image || "/images/default-user.png"}
                      alt={`${primaryWinner.name} - Winner`}
                      className="winnerPhoto"
                    />
                  </div>
                  <strong className="winnerName">{winnerDisplay}</strong><br /><br />
                  with <strong>{maxVotes}</strong> vote{maxVotes !== 1 ? "s" : ""}!<br /><br />
                  <strong>Experience in criteria:</strong> {experienceNumber}
                  {tiedOthers && (
                    <>
                      <br /><br />
                      Other tied candidates: {tiedOthers}
                    </>
                  )}
                </>
              ) : (
                <>
                  Winner: <strong className="winnerName">No winner determined</strong><br /><br />
                  (No votes were cast)
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!isElectionEnded && totalVoters > 0 && (
        <div className="waitingMessage">
          Waiting for election to end on {settings?.endDate.toDate().toLocaleString()}...<br />
          ({votedCount} have voted so far)
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        .page { min-height: 100dvh; padding: 230px 20px 40px; background: linear-gradient(270deg, #0f2027, #203a43, #2c5364); color: #fff; }
        .topBar { display: flex; align-items: center; justify-content: space-between; padding: 5px 30px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); position: fixed; top: 0; left: 0; right: 0; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .logoImg { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 5px solid #36d1dc; box-shadow: 0 12px 40px rgba(54,209,220,0.6); transition: all 0.4s ease; }
        .mainTitle { font-size: 2.8rem; font-weight: 900; color: #36d1dc; margin: 0; text-align: center; flex: 1; text-shadow: 0 4px 15px rgba(54,209,220,0.4); }
        .logoutBtn { padding: 14px 28px; border-radius: 14px; border: none; background: linear-gradient(135deg, #36d1dc, #5b86e5); color: white; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s ease; }
        .dividerLine { position: fixed; top: 150px; left: 40px; right: 40px; height: 5px; background: linear-gradient(90deg, transparent, #36d1dc, transparent); border-radius: 3px; box-shadow: 0 0 20px rgba(54,209,220,0.8); z-index: 999; }
        .statusBox { text-align: center; max-width: 600px; margin: 0 auto 80px auto; padding: 40px; background: rgba(255,255,255,0.08); border-radius: 24px; backdrop-filter: blur(12px); box-shadow: 0 15px 40px rgba(0,0,0,0.4); }
        .welcomeText { font-size: 2.2rem; margin-bottom: 15px; font-weight: 600; }
        .welcomeText .blue { color: #36d1dc; font-weight: 800; }
        .voteStatus { font-size: 2rem; font-weight: 700; color: #36d1dc; }
        .searchWrapper { position: relative; margin-top: 25px; width: 80%; max-width: 400px; margin-left: auto; margin-right: auto; }
        .searchIcon { position: absolute; top: 50%; left: 14px; transform: translateY(-50%); font-size: 1.2rem; color: #ccc; pointer-events: none; }
        .searchInput { width: 100%; padding: 14px 20px 14px 40px; border-radius: 14px; border: none; font-size: 1.2rem; background: rgba(255,255,255,0.2); color: #fff; transition: all 0.3s ease; }
        .searchInput::placeholder { color: #ccc; }
        .searchInput:focus { outline: none; background: rgba(255,255,255,0.3); box-shadow: 0 5px 20px rgba(54,209,220,0.5); }
        .grid { display: flex; flex-wrap: wrap; gap: 40px; justify-content: center; margin: 60px 0; }
        .cardWrap { padding: 10px; border-radius: 24px; background: linear-gradient(135deg, #36d1dc, #5b86e5); }
        .card { width: 340px; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; backdrop-filter: blur(12px); }
        .candidateImg { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 25px; border: 4px solid #36d1dc; box-shadow: 0 10px 30px rgba(54,209,220,0.4); }
        .desc { flex-grow: 1; margin: 20px 0; line-height: 1.6; font-size: 1.1rem; }
        .votes { font-size: 1.8rem; color: #ffd700; font-weight: 800; margin: 25px 0; }
        .voteBtn { width: 100%; padding: 16px; border: none; border-radius: 16px; font-weight: 700; font-size: 1.3rem; cursor: pointer; transition: all 0.3s ease; background: linear-gradient(135deg, #1e90ff, #36d1dc); color: white; }
        .voteBtn:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(54,209,220,0.6); }
        .voteBtn.voted { background: linear-gradient(135deg, #27ae60, #38a169); cursor: not-allowed; }
        .message { text-align: center; padding: 16px 32px; border-radius: 16px; font-weight: 700; font-size: 1.3rem; max-width: 700px; margin: 0 auto 60px auto; }
        .message.success { background: rgba(56, 161, 105, 0.3); border: 2px solid #38a169; color: #9ae6b4; }
        .message.error { background: rgba(229, 62, 62, 0.3); border: 2px solid #e53e3e; color: #feb2b2; }
        .resultsSection { max-width: 1100px; margin: 100px auto 60px; padding: 50px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 28px; backdrop-filter: blur(15px); box-shadow: 0 25px 60px rgba(0,0,0,0.5); text-align: center; }
        .chartTitle { font-size: 2.6rem; margin-bottom: 40px; color: #36d1dc; font-weight: 700; }
        .chartContainer { max-width: 900px; margin: 0 auto; height: 450px; }
        .winnerBox { margin-top: 70px; padding: 60px; background: rgba(255,215,0,0.25); border-radius: 30px; font-size: 3rem; font-weight: 900; color: #ffd700; line-height: 1.8; border: 4px dashed #ffd700; box-shadow: 0 20px 50px rgba(255,215,0,0.3); }
        .winnerPhotoContainer { margin: 0 auto 30px; width: 220px; height: 220px; }
        .winnerPhoto { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 6px solid #ffd700; box-shadow: 0 15px 40px rgba(255, 215, 0, 0.5); background: rgba(255, 255, 255, 0.1); }
        .winnerName { color: #36d1dc; font-size: 3.6rem; display: block; margin: 10px 0; }
        .waitingMessage { text-align: center; font-size: 1.8rem; margin: 100px 0; color: #ccc; line-height: 1.8; }
        @media (max-width: 768px) {
          .page { padding: 30px 12px 40px; min-height: 100vh; }
          .topBar { position: relative; flex-direction: column; gap: 10px; padding: 15px 10px; }
          .logoImg { width: 80px; height: 80px; border-width: 3px; }
          .mainTitle { font-size: 1.6rem; padding-left: 0; text-align: center; }
          .dividerLine { display: none; }
          .statusBox { margin-top: 20px; padding: 25px 15px; }
          .welcomeText { font-size: 1.5rem; display: block; }
          .voteStatus { font-size: 1.3rem; }
          .searchWrapper { width: 100%; }
          .searchInput { font-size: 1rem; padding: 12px 18px 12px 40px; }
          .grid { flex-direction: column; align-items: center; gap: 20px; margin: 40px 0; }
          .cardWrap { width: 100%; max-width: 360px; }
          .card { width: 100%; padding: 20px; }
          .candidateImg { width: 120px; height: 120px; }
          .desc { font-size: 1rem; }
          .votes { font-size: 1.4rem; }
          .voteBtn { font-size: 1rem; padding: 12px; }
          .resultsSection { padding: 25px 15px; margin-top: 60px; }
          .chartTitle { font-size: 1.7rem; }
          .chartContainer { height: 320px; }
          .winnerPhotoContainer { width: 160px; height: 160px; margin-bottom: 20px; }
          .winnerPhoto { border-width: 4px; }
          .winnerName { font-size: 2.4rem; }
          .winnerBox { font-size: 1.8rem; padding: 40px 20px; }
          .waitingMessage { font-size: 1.2rem; margin: 50px 0; }
        }
      `}</style>
    </div>
  );
}