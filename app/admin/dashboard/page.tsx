"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, db } from "../../../lib/firebase";
import {
  listenAuth,
  logoutUser,
  addCandidateFirestore,
  updateCandidate,
  deleteCandidate,
  updateCandidateStatus,
} from "../../../lib/firebaseFunctions";
import { Candidate, AppUser } from "../../../lib/types";
import ResultsChart from "../../../components/ResultsChart";
import { collection, doc, onSnapshot, Timestamp } from "firebase/firestore";
import AdminPasswordModel from "../../../components/AdminPasswordModel";

type ExtendedAppUser = AppUser & { id: string; hasVoted?: boolean; votedFor?: string; email?: string };
type ElectionSettings = { startDate: Timestamp; endDate: Timestamp };

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [students, setStudents] = useState<ExtendedAppUser[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [votedCount, setVotedCount] = useState(0);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pendingAction, setPendingAction] = useState<{
    type: "add" | "edit" | "delete" | "reset" | "settings" | "status";
    data?: any;
  } | null>(null);

  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState<string | File>("");

  const [showStudentsModal, setShowStudentsModal] = useState(false);

  // ================= AUTH =================
  useEffect(() => {
    const unsub = listenAuth((u) => {
      if (!u) return router.push("/admin/login");
      if (!u.isAdmin) return router.push("/vote");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  // ================= USERS =================
  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snap) => {
      const studentList: ExtendedAppUser[] = [];
      let total = 0;
      let voted = 0;
      snap.forEach((d) => {
        const u = d.data();
        if (!u.isAdmin) {
          total++;
          if (u.hasVoted) voted++;
          studentList.push({ id: d.id, ...(u as AppUser) });
        }
      });
      setStudents(studentList);
      setTotalVoters(total);
      setVotedCount(voted);
    });
  }, []);

  // ================= CANDIDATES =================
  useEffect(() => {
    return onSnapshot(collection(db, "candidates"), (snap) => {
      setCandidates(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Candidate, "id">) }))
      );
    });
  }, []);

  // ================= ELECTION SETTINGS =================
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "election"), (snap) => {
      setSettings(snap.data() as ElectionSettings | null);
    });
  }, []);

  // ================= HELPERS =================
  const toBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  // ================= ACTIONS =================
  const openAdd = () => {
    if (submitting) return;
    if (!newName.trim() || !newDesc.trim() || !newImage) {
      alert("All fields required!");
      return;
    }
    setSubmitting(true);
    setPendingAction({ type: "add", data: { name: newName.trim(), description: newDesc.trim(), image: newImage } });
    setShowPasswordModal(true);
  };

  const openEdit = (c: Candidate) => {
    setEditingCandidate(c);
    setEditName(c.name);
    setEditDesc(c.description ?? "");
    setEditImage(c.image ?? "");
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!editName.trim()) { alert("Name required!"); return; }
    setPendingAction({
      type: "edit",
      data: { id: editingCandidate!.id!, name: editName.trim(), description: editDesc.trim(), image: editImage },
    });
    setShowEditModal(false);
    setShowPasswordModal(true);
  };

  const openDelete = (id: string) => {
    if (!confirm("⚠️ Delete this candidate permanently?")) return;
    setPendingAction({ type: "delete", data: { id } });
    setShowPasswordModal(true);
  };

  const openReset = () => {
    if (!confirm("⚠️ RESET ENTIRE ELECTION?")) return;
    setPendingAction({ type: "reset" });
    setShowPasswordModal(true);
  };

  const handleUpdateSettings = () => {
    if (!newStartDate || !newEndDate) { alert("Dates required!"); return; }
    setPendingAction({ type: "settings", data: { startDate: newStartDate, endDate: newEndDate } });
    setShowPasswordModal(true);
  };

  const handleCandidateStatus = (c: Candidate, status: "approved" | "rejected") => {
    setPendingAction({ type: "status", data: { id: c.id, status } });
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === "add") {
        const base64 = await toBase64(pendingAction.data.image);
        await addCandidateFirestore(pendingAction.data.name, pendingAction.data.description, base64);
        setNewName(""); setNewDesc(""); setNewImage(null);
      }
      if (pendingAction.type === "edit") {
        const img = pendingAction.data.image instanceof File ? await toBase64(pendingAction.data.image) : pendingAction.data.image;
        await updateCandidate(pendingAction.data.id, pendingAction.data.name, pendingAction.data.description, img);
      }
      if (pendingAction.type === "delete") await deleteCandidate(pendingAction.data.id);
      if (pendingAction.type === "reset") {
        const idToken = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/reset-election", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      }
      if (pendingAction.type === "settings") {
        const idToken = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/update-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pendingAction.data, idToken }) });
        setNewStartDate(""); setNewEndDate("");
      }
      if (pendingAction.type === "status") await updateCandidateStatus(pendingAction.data.id, pendingAction.data.status);
      alert("Success!");
    } catch (err: any) {
      alert(err.message || "Failed");
    } finally {
      setSubmitting(false); setPendingAction(null); setShowPasswordModal(false);
    }
  };

  const now = Date.now();
  const isElectionEnded = settings && now >= settings.endDate.toMillis();
  const maxVotes = Math.max(...candidates.map((c) => c.votes || 0), 0);
  const winners = candidates.filter((c) => (c.votes || 0) === maxVotes && maxVotes > 0);

  return (
    <div className="page">
      {!user ? (
        <p className="loading">Loading dashboard...</p>
      ) : (
        <>
          {/* ================= TOP BAR ================= */}
          <div className="topBar">
            <div className="topLeftLogo">
              <img src="/images/mau.jpg" alt="MAU Logo" className="logoImg" />
            </div>
            <h1 className="mainTitle">Admin Dashboard</h1>
            <div className="topButtons">
              <button className="resetBtn" onClick={openReset}>🔄 Reset Election</button>
              <button className="logoutBtn" onClick={async () => { await logoutUser(); router.push("/admin/login"); }}>🚪 Logout</button>
            </div>
          </div>

          {/* ================= DIVIDER ================= */}
          <div className="dividerLine"></div>

          {/* ================= STATUS ================= */}
          <div className="statusBox">
            <div className="welcomeText">
              Welcome, <strong className="blue">{user.username}</strong>
            </div>
            <div className="voteStatus">{votedCount} / {totalVoters} students voted</div>
            <button className="viewStudentsBtn" onClick={() => setShowStudentsModal(true)}>👥 View All Students</button>
          </div>

          {/* ================= ELECTION SETTINGS ================= */}
          <div className="settingsSection statusBox">
            <h2 className="sectionTitle">Election Dates</h2>
            <p>Current Start: {settings?.startDate?.toDate().toLocaleString() || "Not set"}</p>
            <p>Current End: {settings?.endDate?.toDate().toLocaleString() || "Not set"}</p>
            <div className="form">
              <input type="datetime-local" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
              <input type="datetime-local" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              <button className="addBtn shortBtn" onClick={handleUpdateSettings}>Update Dates</button>
            </div>
          </div>

          {/* ================= ADD CANDIDATE ================= */}
          <div className="addSection">
            <h2 className="sectionTitle">Add New Candidate</h2>
            <div className="form">
              <input placeholder="Candidate Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files?.[0] || null)} />
              <button onClick={openAdd} className="addBtn" disabled={submitting}>➕ Add Candidate</button>
            </div>
          </div>

          {/* ================= CANDIDATE GRID ================= */}
          <div className="grid">
            {candidates.map((c) => (
              <motion.div
                key={c.id}
                className="cardWrap"
                whileHover={{ scale: 1.05, rotateX: -3, rotateY: 3, boxShadow: "0 25px 50px rgba(54, 209, 220, 0.6)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="card">
                  <img src={c.image || "/images/default.jpg"} alt={c.name} className="candidateImg" />
                  <h2 className="blue">{c.name}</h2>
                  <p className="desc">{c.description}</p>

                  {/* Show full criteria details only for pending candidates */}
                  {c.status === "pending" && c.criteria && (
                    <div className="criteriaSection">
                      <h3 className="criteriaTitle">Submitted Criteria</h3>
                      <div className="criteriaItem">
                        <strong>Manifesto:</strong>
                        <p className="criteriaText">{c.criteria.manifesto || "Not provided"}</p>
                      </div>
                      <div className="criteriaItem">
                        <strong>Vision:</strong>
                        <p className="criteriaText">{c.criteria.vision || "Not provided"}</p>
                      </div>
                      <div className="criteriaItem">
                        <strong>Experience:</strong>
                        <p className="criteriaText">{c.criteria.experience || "Not provided"}</p>
                      </div>
                    </div>
                  )}

                  <p className="votes"><strong>{c.votes ?? 0}</strong> vote{(c.votes ?? 0) !== 1 ? "s" : ""}</p>

                  {c.status && c.status !== "pending" && (
                    <p className={`statusLabel ${c.status}`}>Status: {c.status.toUpperCase()}</p>
                  )}

                  {c.status === "pending" && (
                    <div className="pendingActions">
                      <button className="approveBtn" onClick={() => handleCandidateStatus(c, "approved")}>✅ Approve</button>
                      <button className="rejectBtn" onClick={() => handleCandidateStatus(c, "rejected")}>❌ Reject</button>
                    </div>
                  )}

                  <div className="actions">
                    <button className="editBtn" onClick={() => openEdit(c)}>✏️ Edit</button>
                    <button className="deleteBtn" onClick={() => openDelete(c.id!)}>🗑 Delete</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ================= RESULTS ================= */}
          <div className="resultsSection">
            <h2 className="chartTitle">Live Election Results</h2>
            <div className="chartContainer">
              <ResultsChart candidates={candidates} />
            </div>
            {isElectionEnded && (
              <div className="winnerBox">
                🏆 <strong>ELECTION COMPLETE!</strong> 🏆<br /><br />
                Winner{winners.length > 1 ? "s (Tie)" : ""}:<br />
                <strong className="winnerName">{winners.map((w, i) => <span key={w.id}>{w.name}{i < winners.length - 1 ? " & " : ""}</span>)}</strong>
                <br /><br />
                with {maxVotes} vote{maxVotes !== 1 ? "s" : ""}!
              </div>
            )}
          </div>

          {/* ================= PASSWORD MODAL ================= */}
          {showPasswordModal && (
            <AdminPasswordModel
              onConfirm={handlePasswordConfirm}
              onClose={() => { setShowPasswordModal(false); setPendingAction(null); setSubmitting(false); }}
            />
          )}

          {/* ================= EDIT CANDIDATE MODAL ================= */}
          {showEditModal && editingCandidate && (
            <div className="overlay">
              <div className="modal">
                <h3>Edit Candidate</h3>
                <div className="form">
                  <input placeholder="Candidate Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <input placeholder="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  {typeof editImage === "string" && editImage.trim() !== "" && (
                    <img src={editImage} alt="Current" style={{ width: "100px", marginBottom: "10px", borderRadius: "50%" }} />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files?.[0] ?? editImage)} />
                </div>
                <div className="buttons" style={{ marginTop: "20px" }}>
                  <button onClick={handleEditSubmit}>Save Changes</button>
                  <button onClick={() => setShowEditModal(false)} className="cancel">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STUDENTS MODAL ================= */}
          {showStudentsModal && (
            <div className="overlay">
              <div className="modal">
                <h3>All Students</h3>
                <div className="tableContainer">
                  <table className="studentsTable">
                    <thead>
                      <tr><th>Student ID</th><th>Email</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td>{s.username}</td>
                          <td>{s.email}</td>
                          <td>{s.hasVoted ? 'Voted' : 'Not Voted'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="buttons">
                  <button onClick={() => setShowStudentsModal(false)} className="cancel">Close</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= STYLES (updated for criteria display) ================= */}
      <style jsx>{`
        .page { position: relative; min-height: 100dvh; padding: 230px 20px 40px; background: linear-gradient(270deg,#0f2027,#203a43,#2c5364); color:#fff; }
        .topBar { display:flex; align-items:center; justify-content:space-between; padding:5px 30px; background: rgba(255,255,255,0.05); backdrop-filter:blur(10px); position:fixed; top:0; left:0; right:0; z-index:1000; box-shadow:0 4px 20px rgba(0,0,0,0.3); }
        .logoImg { width:140px;height:140px;border-radius:50%;object-fit:cover;border:5px solid #36d1dc;box-shadow:0 12px 40px rgba(54,209,220,0.6);transition: all 0.4s ease; }
        .mainTitle { font-size:2.8rem;font-weight:900;color:#36d1dc;margin:0;text-align:center;flex:1;padding-left:130px;text-shadow:0 4px 15px rgba(54,209,220,0.4); }
        .topButtons { display:flex; gap:15px; }
        .topButtons button { padding:12px 24px; border-radius:14px; border:none; font-weight:700; cursor:pointer; transition:all 0.3s ease; font-size:1rem; }
        .resetBtn { background:linear-gradient(135deg,#ff4444,#cc0000); color:white; }
        .logoutBtn { background:linear-gradient(135deg,#36d1dc,#5b86e5); color:white; }
        .dividerLine { position:fixed; top:150px; left:40px; right:40px; height:5px; background:linear-gradient(90deg,transparent,#36d1dc,transparent); border-radius:3px; box-shadow:0 0 20px rgba(54,209,220,0.8); z-index:999; }
        .statusBox { text-align:center; max-width:600px; margin:0 auto 80px auto; padding:40px; background:rgba(255,255,255,0.08); border-radius:24px; backdrop-filter:blur(12px); box-shadow:0 15px 40px rgba(0,0,0,0.4); }
        .welcomeText { font-size:2.2rem; margin-bottom:15px; font-weight:600; }
        .welcomeText .blue { color:#36d1dc; font-weight:800; }
        .voteStatus { font-size:2rem; font-weight:700; color:#36d1dc; margin-bottom: 20px; }
        .viewStudentsBtn { padding:12px 24px; border-radius:14px; border:none; font-weight:700; cursor:pointer; transition:all 0.3s ease; font-size:1rem; background:linear-gradient(135deg,#4caf50,#2e7d32); color:white; }
        .addSection { max-width:600px; margin:0 auto 100px auto; text-align:center; }
        .sectionTitle { font-size:2.4rem; color:#36d1dc; margin-bottom:40px; font-weight:700; }
        .form { display:flex; flex-direction:column; gap:20px; }
        .form input { padding:18px; border-radius:16px; border:none; background:rgba(255,255,255,0.2); color:#fff; font-size:1.2rem; }
        .addBtn { padding:18px; border:none; border-radius:16px; background:linear-gradient(135deg,#36d1dc,#5b86e5); color:white; font-weight:700; font-size:1.3rem; cursor:pointer; transition:all 0.3s ease; }
        .grid { display:flex; flex-wrap:wrap; gap:40px; justify-content:center; margin:60px 0; }
        .cardWrap { padding:10px; border-radius:24px; background:linear-gradient(135deg,#36d1dc,#5b86e5); }
        .card { width:340px; background:rgba(255,255,255,0.15); border-radius:20px; padding:16px; display:flex; flex-direction:column; align-items:center; text-align:center; backdrop-filter:blur(12px); }
        .candidateImg { width:150px; height:150px; border-radius:50%; object-fit:cover; margin-bottom:25px; border:4px solid #36d1dc; box-shadow:0 10px 30px rgba(54,209,220,0.4); }
        .desc { margin-bottom: 15px; font-size: 1rem; line-height: 1.5; }
        .votes { font-size:1.8rem; color:#ffd700; font-weight:800; margin:25px 0; }
        .actions { display:flex; gap:16px; width:100%; margin-top:25px; }
        .editBtn, .deleteBtn { flex:1; padding:14px; border-radius:16px; font-weight:700; cursor:pointer; }
        .editBtn { background:linear-gradient(135deg,#36d1dc,#5b86e5); color:white; }
        .deleteBtn { background:linear-gradient(135deg,#ff4444,#cc0000); color:white; }
        .resultsSection { max-width:1100px; margin:100px auto 60px; padding:50px; background:rgba(255,255,255,0.1); border-radius:28px; backdrop-filter:blur(15px); text-align:center; }
        .chartTitle { font-size:2.6rem; color:#36d1dc; margin-bottom:40px; }
        .chartContainer { max-width:900px; margin:0 auto; height:450px; }
        .winnerBox { margin-top:70px; padding:60px; background:rgba(255,215,0,0.25); border-radius:30px; font-size:3rem; color:#ffd700; border:4px dashed #ffd700; }
        .winnerName { color:#36d1dc; font-size:3.4rem; }
        .overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal { background: #1e3a52; padding: 40px; border-radius: 20px; width: 90%; max-width: 600px; text-align: center; color: white; border: 2px solid #36d1dc; }
        .tableContainer { max-height: 300px; overflow-y: auto; margin: 20px 0; }
        .studentsTable { width: 100%; border-collapse: collapse; }
        .studentsTable th, .studentsTable td { border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px; text-align: left; }
        .pendingActions { display: flex; gap: 10px; margin-bottom: 10px; }
        .approveBtn, .rejectBtn { flex: 1; padding: 10px; border-radius: 10px; border: none; cursor: pointer; color: white; font-weight: bold; }
        .approveBtn { background: #4caf50; }
        .rejectBtn { background: #f44336; }

        /* New styles for criteria display (only visible for pending) */
        .criteriaSection {
          width: 100%;
          margin: 20px 0;
          padding: 15px;
          background: rgba(0,0,0,0.25);
          border-radius: 12px;
          border: 1px solid rgba(54, 209, 220, 0.3);
        }
        .criteriaTitle {
          font-size: 1.3rem;
          color: #36d1dc;
          margin-bottom: 15px;
          text-align: left;
        }
        .criteriaItem {
          margin-bottom: 15px;
          text-align: left;
        }
        .criteriaItem strong {
          display: block;
          color: #ffd700;
          margin-bottom: 5px;
          font-size: 1.1rem;
        }
        .criteriaText {
          white-space: pre-line;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #fff;
          max-height: 120px;
          overflow-y: auto;
          padding: 8px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .page { padding: 30px 12px 40px; }
          .topBar { position: relative; flex-direction: column; gap: 10px; padding: 15px 10px; }
          .logoImg { width: 80px; height: 80px; }
          .mainTitle { font-size: 1.6rem; padding-left: 0; }
          .dividerLine { display: none; }
          .statusBox { margin-top: 20px; padding: 25px 15px; }
          .welcomeText { font-size: 1.5rem; }
          .grid { flex-direction: column; align-items: center; }
          .cardWrap { width: 100%; max-width: 360px; }
          .criteriaSection { padding: 12px; }
        }
      `}</style>
    </div>
  );
}