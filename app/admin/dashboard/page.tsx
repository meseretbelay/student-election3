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
    type: "add" | "edit" | "delete" | "reset" | "settings";
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
      setCandidates(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Candidate, "id">) })));
    });
  }, []);

  // ================= ELECTION SETTINGS =================
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "election"), (snap) => {
      setSettings(snap.data() as ElectionSettings | null);
    });
  }, []);

  // ================= ADD =================
  const openAdd = () => {
    if (submitting) return;
    const trimmedName = newName.trim();
    const trimmedDesc = newDesc.trim();
    if (!trimmedName || !trimmedDesc || !newImage) {
      alert("All fields are required!");
      return;
    }
    setSubmitting(true);
    setPendingAction({
      type: "add",
      data: { name: trimmedName, description: trimmedDesc, image: newImage },
    });
    setShowPasswordModal(true);
  };

  // ================= EDIT =================
  const openEdit = (c: Candidate) => {
    setEditingCandidate(c);
    setEditName(c.name);
    setEditDesc(c.description);
    setEditImage(c.image);
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (editName === editingCandidate?.name && editDesc === editingCandidate?.description && editImage === editingCandidate?.image) {
      setShowEditModal(false);
      return;
    }
    setPendingAction({
      type: "edit",
      data: { id: editingCandidate!.id!, name: editName.trim(), description: editDesc.trim(), image: editImage },
    });
    setShowEditModal(false);
    setShowPasswordModal(true);
  };

  // ================= DELETE =================
  const openDelete = (id: string) => {
    if (!confirm("⚠️ Delete this candidate permanently?")) return;
    setPendingAction({ type: "delete", data: { id } });
    setShowPasswordModal(true);
  };

  // ================= RESET =================
  const openReset = () => {
    if (!confirm("⚠️ RESET ENTIRE ELECTION?\nAll votes will be lost forever!")) return;
    setPendingAction({ type: "reset" });
    setShowPasswordModal(true);
  };

  // ================= UPDATE SETTINGS =================
  const handleUpdateSettings = () => {
    if (!newStartDate || !newEndDate) {
      alert("Both start and end dates are required!");
      return;
    }
    if (new Date(newStartDate) >= new Date(newEndDate)) {
      alert("Start date must be before end date!");
      return;
    }
    setPendingAction({ type: "settings", data: { startDate: newStartDate, endDate: newEndDate } });
    setShowPasswordModal(true);
  };

  // ================= CONFIRM PASSWORD =================
  const handlePasswordConfirm = async () => {
    if (!pendingAction) return;
    try {
      // ================= ADD =================
      if (pendingAction.type === "add") {
        const file = pendingAction.data.image as File;
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await addCandidateFirestore(pendingAction.data.name, pendingAction.data.description, base64);
        alert("Candidate added successfully 🎉");
        setNewName("");
        setNewDesc("");
        setNewImage(null);
      }

      // ================= EDIT =================
      if (pendingAction.type === "edit") {
        const img = pendingAction.data.image instanceof File
          ? await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(pendingAction.data.image);
            })
          : pendingAction.data.image;
        await updateCandidate(pendingAction.data.id, pendingAction.data.name, pendingAction.data.description, img);
        alert("Candidate updated successfully!");
      }

      // ================= DELETE =================
      if (pendingAction.type === "delete") {
        await deleteCandidate(pendingAction.data.id);
        alert("Candidate deleted successfully.");
      }

      // ================= RESET =================
      if (pendingAction.type === "reset") {
        const idToken = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/reset-election", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        alert("Election reset successfully!");
      }

      // ================= SETTINGS =================
      if (pendingAction.type === "settings") {
        const idToken = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/update-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...pendingAction.data, idToken }),
        });
        alert("Election dates updated successfully!");
        setNewStartDate("");
        setNewEndDate("");
      }

    } catch (err: any) {
      alert(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      setShowPasswordModal(false);
      setShowEditModal(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/admin/login");
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
            <button className="viewStudentsBtn" onClick={() => setShowStudentsModal(true)}>👥 View All Students</button>
          </div>
          {/* ================= ELECTION SETTINGS SECTION ================= */}
          <div className="settingsSection statusBox">
            <h2 className="sectionTitle">Election Dates</h2>
            <p>Current Start: {settings?.startDate?.toDate().toLocaleString() || "Not set"}</p>
            <p>Current End: {settings?.endDate?.toDate().toLocaleString() || "Not set"}</p>
            <div className="form">
              <input className="shortInput" type="datetime-local" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
              <input className="shortInput" type="datetime-local" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              <button className="addBtn shortBtn" onClick={handleUpdateSettings}>Update Dates</button>
            </div>
          </div>
          {/* ================= ADD NEW CANDIDATE ================= */}
          <div className="addSection">
            <h2 className="sectionTitle">Add New Candidate</h2>
            <div className="form">
              <input placeholder="Candidate Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files?.[0] || null)} />
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
                  scale: 1.05, // lift the card
                  rotateX: -3, // subtle tilt
                  rotateY: 3, // subtle tilt
                  boxShadow: "0 25px 50px rgba(54, 209, 220, 0.6)", // glowing shadow
                }}
                whileTap={{ scale: 0.97 }} // press feedback
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="card">
                  <img src={c.image} alt={c.name} className="candidateImg" />
                  <h2 className="blue">{c.name}</h2>
                  <p className="desc">{c.description}</p>
                  <p className="votes">
                    <strong>{c.votes ?? 0}</strong> vote{(c.votes ?? 0) !== 1 ? "s" : ""}
                  </p>
                  <div className="actions">
                    <button className="editBtn" onClick={() => openEdit(c)}>✏️ Edit</button>
                    <button className="deleteBtn" onClick={() => openDelete(c.id!)}>🗑 Delete</button>
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
          {showPasswordModal && (
            <AdminPasswordModel onConfirm={handlePasswordConfirm} onClose={() => {setShowPasswordModal(false); setPendingAction(null); setSubmitting(false);}} />
          )}
          {/* ================= EDIT MODAL (NEW) ================= */}
          {showEditModal && editingCandidate && (
            <div className="overlay">
              <div className="modal">
                <h3>Edit Candidate</h3>
                <div className="form">
                  <input
                    placeholder="Candidate Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    placeholder="Description"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                  {typeof editImage === "string" && <img src={editImage} alt="Current" style={{ width: "100px", marginBottom: "10px" }} />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditImage(e.target.files?.[0] ?? editImage)}
                  />
                </div>
                <div className="buttons">
                  <button onClick={handleEditSubmit}>Save Changes</button>
                  <button onClick={() => setShowEditModal(false)} className="cancel">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ================= VIEW STUDENTS MODAL ================= */}
          {showStudentsModal && (
            <div className="overlay">
              <div className="modal">
                <h3>All Students</h3>
                {students.length === 0 ? (
                  <p>No students yet.</p>
                ) : (
                  <div className="tableContainer">
                    <table className="studentsTable">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Email</th>
                          <th>Status</th>
                        </tr>
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
                )}
                <div className="buttons">
                  <button onClick={() => setShowStudentsModal(false)} className="cancel">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* ================= STYLES ================= */}
      <style jsx>{`
        /* ================= ORIGINAL DESKTOP STYLES ================= */
        .page { position: relative; min-height: 100dvh; padding: 230px 20px 40px; background: linear-gradient(270deg,#0f2027,#203a43,#2c5364); color:#fff; }
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
        .voteStatus{font-size:2rem;font-weight:700;color:#36d1dc; margin-bottom: 20px;}
        .viewStudentsBtn{padding:12px 24px;border-radius:14px;border:none;font-weight:700;cursor:pointer;transition:all 0.3s ease;font-size:1rem;background:linear-gradient(135deg,#4caf50,#2e7d32);color:white;}
        .viewStudentsBtn:hover{transform:translateY(-3px);box-shadow:0 10px 25px rgba(76,175,80,0.5);}
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
        /* ================= EDIT MODAL STYLES (NEW) ================= */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .modal {
          background: #1e3a52;
          padding: 40px;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          text-align: center;
          color: white;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          border: 2px solid #36d1dc;
        }
        h3 {
          margin: 0 0 20px 0;
          font-size: 1.8rem;
          color: #36d1dc;
        }
        .buttons {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }
        button {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        button:first-child {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
        }
        button:first-child:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(54, 209, 220, 0.5);
        }
        .cancel {
          background: #555;
          color: white;
        }
        .cancel:hover {
          background: #777;
        }
        /* ================= TABLE STYLES ================= */
        .tableContainer {
          max-height: 300px;
          overflow-y: auto;
          margin: 20px 0;
        }
        .studentsTable {
          width: 100%;
          border-collapse: collapse;
        }
        .studentsTable th,
        .studentsTable td {
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px;
          text-align: left;
        }
        .studentsTable th {
          background: rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 0;
          z-index: 1;
        }
        /* ================= LOADING STYLES ================= */
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          color: #36d1dc;
        }
      
       /* ================= MOBILE FRIENDLY ================= */
@media (max-width: 768px) {
  /* ===== PAGE FIX ===== */
  .page {
    padding: 30px 12px 40px;
    min-height: 100vh;
  }
  /* ===== TOP BAR FIX ===== */
  .topBar {
    position: relative; /* IMPORTANT */
    flex-direction: column;
    gap: 10px;
    padding: 15px 10px;
  }
  .logoImg {
    width: 80px;
    height: 80px;
    border-width: 3px;
  }
  .mainTitle {
    font-size: 1.6rem;
    padding-left: 0;
    text-align: center;
  }
  .topButtons {
    width: 100%;
    justify-content: center;
    gap: 10px;
  }
  .topButtons button {
    padding: 10px 18px;
    font-size: 0.95rem;
  }
  /* ===== REMOVE DIVIDER ===== */
  .dividerLine {
    display: none;
  }
  /* ===== STATUS BOX ===== */
  .statusBox {
    margin-top: 20px;
    padding: 25px 15px;
  }
  .welcomeText {
    font-size: 1.5rem;
    display: block;
  }
  .voteStatus {
    font-size: 1.3rem;
  }
  /* ===== SEARCH (VOTE PAGE) ===== */
  .searchWrapper {
    width: 100%;
  }
  .searchInput {
    font-size: 1rem;
    padding: 12px 18px 12px 40px;
  }
  /* ===== GRID & CARDS ===== */
  .grid {
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin: 40px 0;
  }
  .cardWrap {
    width: 100%;
    max-width: 360px;
  }
  .card {
    width: 100%;
    padding: 20px;
  }
  .candidateImg {
    width: 120px;
    height: 120px;
  }
  .desc {
    font-size: 1rem;
  }
  .votes {
    font-size: 1.4rem;
  }
  .voteBtn,
  .editBtn,
  .deleteBtn {
    font-size: 1rem;
    padding: 12px;
  }
  /* ===== RESULTS ===== */
  .resultsSection {
    padding: 25px 15px;
    margin-top: 60px;
  }
  .chartTitle {
    font-size: 1.7rem;
  }
  .chartContainer {
    height: 320px;
  }
  .winnerBox {
    font-size: 1.8rem;
    padding: 30px;
  }
  .winnerName {
    font-size: 2rem;
  }
  .waitingMessage {
    font-size: 1.2rem;
    margin: 50px 0;
  }
  /* ===== LOADING MOBILE ===== */
  .loading {
    font-size: 1.2rem;
  }
}
      `}</style>
    </div>
  );
}