"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, db } from "../../../lib/firebase";
import { listenAuth, logoutUser } from "../../../lib/firebaseFunctions";
import { Candidate, AppUser } from "../../../lib/types";
import ResultsChart from "../../../components/ResultsChart";
import { collection, onSnapshot } from "firebase/firestore";
import AdminPasswordModel from "../../../components/AdminPasswordModel";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [votedCount, setVotedCount] = useState(0);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pendingAction, setPendingAction] = useState<
    | { type: "add"; data: { name: string; description: string; image: string } }
    | { type: "edit"; data: { id: string; name: string; description: string; image: string } }
    | { type: "delete"; data: { id: string } }
    | { type: "reset" }
    | null
  >(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = listenAuth((u) => {
      if (!u) return router.push("/admin/login");
      if (!u.isAdmin) return router.push("/vote");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  /* ================= USERS ================= */
  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      let total = 0;
      let voted = 0;
      snap.forEach((d) => {
        const u = d.data();
        if (!u.isAdmin) {
          total++;
          if (u.hasVoted) voted++;
        }
      });
      setTotalVoters(total);
      setVotedCount(voted);
    });
  }, []);

  /* ================= CANDIDATES ================= */
  useEffect(() => {
    return onSnapshot(collection(db, "candidates"), (snap) => {
      setCandidates(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Candidate, "id">),
        }))
      );
    });
  }, []);

  /* ================= ADD ================= */
  const openAdd = () => {
    if (submitting) return;
    setSubmitting(true);

    if (!newName.trim() || !newDesc.trim() || !newImage.trim()) {
      alert("All fields are required!");
      setSubmitting(false);
      return;
    }

    setPendingAction({
      type: "add",
      data: {
        name: newName.trim(),
        description: newDesc.trim(),
        image: newImage.trim(),
      },
    });
    setShowPasswordModal(true);
  };

  /* ================= EDIT ================= */
  const openEdit = (c: Candidate) => {
    const name = prompt("Edit Name:", c.name)?.trim() || c.name;
    const description = prompt("Edit Description:", c.description)?.trim() || c.description;
    const image = prompt("Edit Image URL:", c.image)?.trim() || c.image;

    if (name === c.name && description === c.description && image === c.image) return;

    setPendingAction({
      type: "edit",
      data: { id: c.id!, name, description, image },
    });
    setShowPasswordModal(true);
  };

  /* ================= DELETE ================= */
  const openDelete = (id: string) => {
    if (!confirm("⚠️ Delete this candidate permanently?")) return;
    setPendingAction({ type: "delete", data: { id } });
    setShowPasswordModal(true);
  };

  /* ================= RESET ================= */
  const openReset = () => {
    if (!confirm("⚠️ RESET ENTIRE ELECTION?\nAll votes will be lost forever!")) return;
    setPendingAction({ type: "reset" });
    setShowPasswordModal(true);
  };

  /* ================= CONFIRM ================= */
  const handlePasswordConfirm = async (password?: string) => {
    if (!pendingAction || !auth.currentUser) return;

    try {
      const idToken = await auth.currentUser.getIdToken();
      let res: Response | undefined;

      if (pendingAction.type === "add") {
        res = await fetch("/api/admin/add-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingAction.data, idToken }),
        });
      } else if (pendingAction.type === "edit") {
        res = await fetch("/api/admin/update-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingAction.data, idToken }),
        });
      } else if (pendingAction.type === "delete") {
        res = await fetch("/api/admin/delete-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingAction.data, idToken }),
        });
      } else if (pendingAction.type === "reset") {
        res = await fetch("/api/admin/reset-election", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      }

      if (!res || !res.ok) throw new Error("Action failed");

      if (pendingAction.type === "add") {
        setNewName("");
        setNewDesc("");
        setNewImage("");
        alert("Candidate added successfully 🎉");
      } else if (pendingAction.type === "edit") {
        alert("Candidate updated successfully!");
      } else if (pendingAction.type === "delete") {
        alert("Candidate deleted successfully.");
      } else if (pendingAction.type === "reset") {
        alert("Election reset successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Operation failed");
    } finally {
      setShowPasswordModal(false);
      setPendingAction(null);
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/admin/login");
  };

  if (!user) return <p className="loading">Loading dashboard...</p>;

  const electionDone = votedCount === totalVoters && totalVoters > 0;
  const maxVotes = Math.max(...candidates.map((c) => c.votes || 0), 0);
  const winners = candidates.filter((c) => (c.votes || 0) === maxVotes && maxVotes > 0);

  return (
    <div className="page">
      {/* ================= TOP BAR ================= */}
      <div className="topBar">
        <div className="topLeftLogo">
          <img src="/images/mau.jpg" alt="MAU Logo" className="logoImg" />
        </div>
        <h1 className="mainTitle">Admin Dashboard</h1>
        <div className="topButtons">
          <button className="resetBtn" onClick={openReset}>🔄 Reset Election</button>
          <button className="logoutBtn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className="dividerLine"></div>

      {/* ================= STATUS BOX ================= */}
      <div className="statusBox">
        <div className="welcomeText">
          Welcome, <strong className="blue">{user.username}</strong>
        </div>
        <div className="voteStatus">{votedCount} / {totalVoters} students voted</div>
      </div>

      {/* ================= ADD NEW CANDIDATE ================= */}
      <div className="addSection">
        <h2 className="sectionTitle">Add New Candidate</h2>
        <div className="form">
          <input placeholder="Candidate Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <input placeholder="Image URL" value={newImage} onChange={(e) => setNewImage(e.target.value)} />
          <button onClick={openAdd} className="addBtn" disabled={submitting}>➕ Add Candidate</button>
        </div>
      </div>

      {/* ================= CANDIDATES GRID ================= */}
      <div className="grid">
        {candidates.map((c) => (
          <motion.div
  key={c.id}
  className="cardWrap"
  whileHover={{
    scale: 1.05,                       // lift the card
    rotateX: -3,                        // subtle tilt
    rotateY: 3,                         // subtle tilt
    boxShadow: "0 25px 50px rgba(54, 209, 220, 0.6)", // glowing shadow
  }}
  whileTap={{ scale: 0.97 }}           // press feedback
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
>
  <div className="card">
    <img src={c.image} alt={c.name} className="candidateImg" />
    <h2 className="blue">{c.name}</h2>
    <p className="desc">{c.description}</p>
    <p className="votes">
      <strong>{c.votes || 0}</strong> vote{c.votes !== 1 ? "s" : ""}
    </p>
    <div className="actions">
      <button className="editBtn" onClick={() => openEdit(c)}>✏️ Edit</button>
      <button className="deleteBtn" onClick={() => openDelete(c.id!)}>🗑️ Delete</button>
    </div>
  </div>
</motion.div>

        ))}
      </div>

      {/* ================= LIVE RESULTS ================= */}
      <div className="resultsSection">
        <h2 className="chartTitle">Live Election Results</h2>
        <div className="chartContainer">
          <ResultsChart candidates={candidates} />
        </div>
        {electionDone && (
          <div className="winnerBox">
            🏆 <strong>ELECTION COMPLETE!</strong> 🏆<br /><br />
            Winner{winners.length > 1 ? "s (Tie)" : ""}:<br />
            <strong className="winnerName">{winners.map((w, i) => <span key={w.id}>{w.name}{i < winners.length - 1 ? " & " : ""}</span>)}</strong>
            <br /><br />
            with {maxVotes} vote{maxVotes !== 1 ? "s" : ""}!
          </div>
        )}
      </div>

      {showPasswordModal && (
        <AdminPasswordModel onConfirm={handlePasswordConfirm} onClose={() => {setShowPasswordModal(false); setPendingAction(null); setSubmitting(false);}} />
      )}

      {/* ================= STYLES ================= */}
      <style jsx>{`
        /* ================= ORIGINAL DESKTOP STYLES ================= */
        .page { min-height: 100vh; padding: 230px 20px 40px; background: linear-gradient(270deg,#0f2027,#203a43,#2c5364); color:#fff; }
        .topBar { display:flex; align-items:center; justify-content:space-between; padding:5px 30px; background: rgba(255,255,255,0.05); backdrop-filter:blur(10px); position:fixed; top:0; left:0; right:0; z-index:1000; box-shadow:0 4px 20px rgba(0,0,0,0.3); }
        .topLeftLogo{flex-shrink:0;}
        .logoImg{width:140px;height:140px;border-radius:50%;object-fit:cover;border:5px solid #36d1dc;box-shadow:0 12px 40px rgba(54,209,220,0.6);transition: all 0.4s ease;}
        .logoImg:hover{transform:scale(1.1);box-shadow:0 20px 50px rgba(54,209,220,0.8);}
        .mainTitle{font-size:2.8rem;font-weight:900;color:#36d1dc;margin:0;text-align:center;flex:1;padding-left:130px;text-shadow:0 4px 15px rgba(54,209,220,0.4);}
        .topButtons{display:flex;gap:15px;}
        .topButtons button{padding:12px 24px;border-radius:14px;border:none;font-weight:700;cursor:pointer;transition:all 0.3s ease;font-size:1rem;}
        .resetBtn{background:linear-gradient(135deg,#ff4444,#cc0000);color:white;}
        .logoutBtn{background:linear-gradient(135deg,#36d1dc,#5b86e5);color:white;}
        .topButtons button:hover{transform:translateY(-3px);box-shadow:0 10px 25px rgba(0,0,0,0.5);}
        .dividerLine{position:fixed;top:150px;left:40px;right:40px;height:5px;background:linear-gradient(90deg,transparent,#36d1dc,transparent);border-radius:3px;box-shadow:0 0 20px rgba(54,209,220,0.8);z-index:999;}
        .statusBox{text-align:center;max-width:600px;margin:0 auto 80px auto;padding:40px;background:rgba(255,255,255,0.08);border-radius:24px;backdrop-filter:blur(12px);box-shadow:0 15px 40px rgba(0,0,0,0.4);}
        .welcomeText{font-size:2.2rem;margin-bottom:15px;font-weight:600;}
        .welcomeText .blue{color:#36d1dc;font-weight:800;}
        .voteStatus{font-size:2rem;font-weight:700;color:#36d1dc;}
        .addSection{max-width:600px;margin:0 auto 100px auto;text-align:center;}
        .sectionTitle{font-size:2.4rem;color:#36d1dc;margin-bottom:40px;font-weight:700;}
        .form{display:flex;flex-direction:column;gap:20px;}
        .form input{padding:18px;border-radius:16px;border:none;background:rgba(255,255,255,0.2);color:#fff;font-size:1.2rem;}
        .form input::placeholder{color:#ccc;}
        .addBtn{padding:18px;border:none;border-radius:16px;background:linear-gradient(135deg,#36d1dc,#5b86e5);color:white;font-weight:700;font-size:1.3rem;cursor:pointer;transition:all 0.3s ease;}
        .addBtn:hover{transform:translateY(-4px);box-shadow:0 15px 30px rgba(54,209,220,0.6);}
        .grid{display:flex;flex-wrap:wrap;gap:40px;justify-content:center;margin:60px 0;}
        .cardWrap{padding:10px;border-radius:24px;background:linear-gradient(135deg,#36d1dc,#5b86e5);}
        .card{
          width:340px;
          background:rgba(255,255,255,0.15);
          border-radius:20px;
          padding:16px;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          backdrop-filter:blur(12px);
        }
                .candidateImg{width:150px;height:150px;border-radius:50%;object-fit:cover;margin-bottom:25px;border:4px solid #36d1dc;box-shadow:0 10px 30px rgba(54,209,220,0.4);}
        .desc{flex-grow:1;margin:20px 0;line-height:1.6;font-size:1.1rem;}
        .votes{font-size:1.8rem;color:#ffd700;font-weight:800;margin:25px 0;}
        .actions{display:flex;gap:16px;width:100%;margin-top:25px;}
        .editBtn,.deleteBtn{flex:1;padding:14px;border:none;border-radius:16px;font-weight:700;font-size:1.1rem;cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:10px;}
        .editBtn{background:linear-gradient(135deg,#36d1dc,#5b86e5);color:white;}
        .editBtn:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(54,209,220,0.6);}
        .deleteBtn{background:linear-gradient(135deg,#ff4444,#cc0000);color:white;}
        .deleteBtn:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(255,68,68,0.6);}
        .resultsSection{max-width:1100px;margin:100px auto 60px;padding:50px;background:linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05));border-radius:28px;backdrop-filter:blur(15px);box-shadow:0 25px 60px rgba(0,0,0,0.5);text-align:center;}
        .chartTitle{font-size:2.6rem;margin-bottom:40px;color:#36d1dc;font-weight:700;}
        .chartContainer{max-width:900px;margin:0 auto;height:450px;}
        .winnerBox{margin-top:70px;padding:60px;background:rgba(255,215,0,0.25);border-radius:30px;font-size:3rem;font-weight:900;color:#ffd700;line-height:1.8;border:4px dashed #ffd700;box-shadow:0 20px 50px rgba(255,215,0,0.3);}
        .winnerName{color:#36d1dc;font-size:3.4rem;}

        /* ================= MOBILE RESPONSIVE ================= */
        @media(max-width:768px){
          .page{padding:180px 15px 40px;}
          .mainTitle{font-size:2rem;padding-left:80px;}
          .topBar{flex-direction:column;gap:10px;}
          .grid{flex-direction:column;align-items:center;}
          .card{width:90%;min-height:auto;padding:20px;}
          .resultsSection{padding:30px;}
          .chartContainer{height:350px;}
          .winnerBox{font-size:2rem;padding:30px;}
          .winnerName{font-size:2.4rem;}
        }
      `}</style>
    </div>
  );
}
