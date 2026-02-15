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

// Custom Modal Types
type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  type: "warning" | "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
};

// Custom Confirm Modal Component
const ConfirmModal = ({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch(type) {
      case "danger":
        return {
          icon: "⚠️",
          gradient: "linear-gradient(135deg, #ff4444, #cc0000)",
          bgColor: "rgba(255, 68, 68, 0.1)"
        };
      case "warning":
        return {
          icon: "⚠️",
          gradient: "linear-gradient(135deg, #ffd700, #ffa500)",
          bgColor: "rgba(255, 215, 0, 0.1)"
        };
      default:
        return {
          icon: "ℹ️",
          gradient: "linear-gradient(135deg, #36d1dc, #5b86e5)",
          bgColor: "rgba(54, 209, 220, 0.1)"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="modal-overlay">
      <motion.div 
        className="confirm-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="modal-icon" style={{ background: styles.bgColor }}>
          <span>{styles.icon}</span>
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button 
            className="modal-btn cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className="modal-btn confirm"
            style={{ background: styles.gradient }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>

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

        .confirm-modal {
          background: linear-gradient(135deg, #1e3a52, #162b3c);
          padding: 40px;
          border-radius: 24px;
          width: 90%;
          max-width: 450px;
          text-align: center;
          border: 2px solid #36d1dc;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .modal-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 2.5rem;
        }

        .modal-title {
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 15px;
        }

        .modal-message {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
        }

        .modal-btn {
          flex: 1;
          padding: 14px;
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
        }

        .modal-btn.confirm {
          color: white;
        }

        .modal-btn.confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 480px) {
          .confirm-modal {
            padding: 30px 20px;
          }

          .modal-title {
            font-size: 1.5rem;
          }

          .modal-message {
            font-size: 1rem;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

// Alert Modal Component
const AlertModal = ({
  isOpen,
  title,
  message,
  type = "info",
  onClose
}: {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch(type) {
      case "success":
        return {
          icon: "✅",
          gradient: "linear-gradient(135deg, #4caf50, #45a049)",
          bgColor: "rgba(76, 175, 80, 0.1)"
        };
      case "error":
        return {
          icon: "❌",
          gradient: "linear-gradient(135deg, #ff4444, #cc0000)",
          bgColor: "rgba(255, 68, 68, 0.1)"
        };
      case "warning":
        return {
          icon: "⚠️",
          gradient: "linear-gradient(135deg, #ffd700, #ffa500)",
          bgColor: "rgba(255, 215, 0, 0.1)"
        };
      default:
        return {
          icon: "ℹ️",
          gradient: "linear-gradient(135deg, #36d1dc, #5b86e5)",
          bgColor: "rgba(54, 209, 220, 0.1)"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="modal-overlay">
      <motion.div 
        className="alert-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="modal-icon" style={{ background: styles.bgColor }}>
          <span>{styles.icon}</span>
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <button 
          className="modal-btn close"
          style={{ background: styles.gradient }}
          onClick={onClose}
        >
          OK
        </button>
      </motion.div>

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

        .alert-modal {
          background: linear-gradient(135deg, #1e3a52, #162b3c);
          padding: 40px;
          border-radius: 24px;
          width: 90%;
          max-width: 400px;
          text-align: center;
          border: 2px solid #36d1dc;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .modal-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 2.5rem;
        }

        .modal-title {
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 15px;
        }

        .modal-message {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .modal-btn.close {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          color: white;
          transition: all 0.3s ease;
        }

        .modal-btn.close:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 480px) {
          .alert-modal {
            padding: 30px 20px;
          }

          .modal-title {
            font-size: 1.5rem;
          }

          .modal-message {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [students, setStudents] = useState<ExtendedAppUser[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  
  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    title: "",
    message: "",
    type: "warning" as "warning" | "danger" | "info",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel"
  });

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalProps, setAlertModalProps] = useState({
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info" | "warning"
  });

  // Add Candidate Form States
  const [candidateType, setCandidateType] = useState<"simple" | "full">("simple");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newDepartment, setNewDepartment] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newCgpa, setNewCgpa] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newManifesto, setNewManifesto] = useState("");
  const [newVision, setNewVision] = useState("");
  
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
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRejectLog, setAutoRejectLog] = useState<string[]>([]);

  const departments = [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Business Administration",
    "Accounting",
    "Economics",
    "Engineering",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Medicine",
    "Law",
    "Education",
    "Arts and Humanities",
    "Social Sciences",
    "Other"
  ];

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

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

  // ================= AUTO-REJECT INELIGIBLE CANDIDATES =================
  useEffect(() => {
    if (candidates.length > 0) {
      autoRejectIneligibleCandidates();
    }
  }, [candidates]);

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

  // ================= CUSTOM ALERT FUNCTIONS =================
  const showAlert = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setAlertModalProps({ title, message, type });
    setShowAlertModal(true);
  };

  const showConfirm = (
    title: string, 
    message: string, 
    type: "warning" | "danger" | "info",
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    setConfirmModalProps({
      title,
      message,
      type,
      onConfirm: () => {
        setShowConfirmModal(false);
        onConfirm();
      },
      confirmText,
      cancelText
    });
    setShowConfirmModal(true);
  };

  // ================= AUTO-REJECTION FUNCTIONS =================
  const checkAutoRejectConditions = (candidate: Candidate): { shouldReject: boolean; reason: string } => {
    if (!candidate.criteria || candidate.isAdminAdded) return { shouldReject: false, reason: "" };
    
    const { cgpa, year } = candidate.criteria;
    const cgpaValue = cgpa ? parseFloat(cgpa) : 0;
    
    // Years that are automatically rejected
    const ineligibleYears = ["0 Year", "Freshman", "Remedial", "1st Year", "Graduate"];
    
    // Auto-reject conditions
    if (ineligibleYears.includes(year || "")) {
      return { 
        shouldReject: true, 
        reason: `AUTO-REJECTED: ${year} students are not eligible to apply` 
      };
    }

    if (cgpaValue < 3.0) {
      return { 
        shouldReject: true, 
        reason: `AUTO-REJECTED: CGPA ${cgpa} is below 3.0 requirement` 
      };
    }
    
    return { shouldReject: false, reason: "" };
  };

  const autoRejectIneligibleCandidates = async () => {
    const ineligibleYears = ["0 Year", "Freshman", "Remedial", "1st Year", "Graduate"];
    const logs: string[] = [];
    
    const pendingIneligible = candidates.filter(c => 
      c.status === "pending" && 
      !c.isAdminAdded &&
      c.criteria && 
      (ineligibleYears.includes(c.criteria.year || "") || 
       parseFloat(c.criteria.cgpa || "0") < 3.0)
    );

    if (pendingIneligible.length > 0) {
      console.log(`🔄 Auto-rejecting ${pendingIneligible.length} ineligible candidates...`);
      logs.push(`🔄 Found ${pendingIneligible.length} ineligible candidates`);
      
      for (const candidate of pendingIneligible) {
        try {
          await updateCandidateStatus(candidate.id!, "rejected");
          const reason = ineligibleYears.includes(candidate.criteria?.year || "") 
            ? `${candidate.criteria?.year} students not eligible`
            : `CGPA ${candidate.criteria?.cgpa} below 3.0`;
          const logMessage = `❌ ${candidate.name} - ${reason}`;
          console.log(`Auto-rejected: ${logMessage}`);
          logs.push(logMessage);
        } catch (error) {
          console.error(`Failed to auto-reject ${candidate.name}:`, error);
          logs.push(`⚠️ Failed to reject ${candidate.name}`);
        }
      }
      
      setAutoRejectLog(logs);
      setTimeout(() => setAutoRejectLog([]), 5000);
    }
  };

  // ================= ACTIONS =================
  const openAdd = () => {
    if (submitting) return;
    
    if (candidateType === "simple") {
      if (!newName.trim() || !newDesc.trim() || !newImage) {
        showAlert("Missing Information", "All fields are required to add a candidate.", "warning");
        return;
      }
      setPendingAction({ 
        type: "add", 
        data: { 
          type: "simple",
          name: newName.trim(), 
          description: newDesc.trim(), 
          image: newImage 
        } 
      });
    } else {
      if (!newName.trim() || !newDesc.trim() || !newImage || !newDepartment || !newYear || !newCgpa || !newExperience || !newManifesto || !newVision) {
        showAlert("Missing Information", "All fields are required to add a full candidate.", "warning");
        return;
      }
      
      // Validate CGPA
      const cgpaNum = parseFloat(newCgpa);
      if (cgpaNum < 0 || cgpaNum > 4.0) {
        showAlert("Invalid CGPA", "CGPA must be between 0 and 4.0.", "error");
        return;
      }

      setPendingAction({ 
        type: "add", 
        data: { 
          type: "full",
          name: newName.trim(), 
          description: newDesc.trim(), 
          image: newImage,
          department: newDepartment,
          year: newYear,
          cgpa: cgpaNum.toFixed(2),
          experience: newExperience,
          manifesto: newManifesto.trim(),
          vision: newVision.trim()
        } 
      });
    }
    
    setSubmitting(true);
    setShowPasswordModal(true);
  };

  const openEdit = (c: Candidate) => {
    // Check if candidate was added by admin
    if (!c.isAdminAdded) {
      showAlert(
        "Cannot Edit", 
        "This candidate was submitted through the criteria form and cannot be edited directly. Only candidates added by admin can be edited.",
        "warning"
      );
      return;
    }
    
    setEditingCandidate(c);
    setEditName(c.name);
    setEditDesc(c.description ?? "");
    setEditImage(c.image ?? "");
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!editName.trim()) { 
      showAlert("Name Required", "Candidate name cannot be empty.", "warning");
      return; 
    }
    setPendingAction({
      type: "edit",
      data: { id: editingCandidate!.id!, name: editName.trim(), description: editDesc.trim(), image: editImage },
    });
    setShowEditModal(false);
    setShowPasswordModal(true);
  };

  const openDelete = (id: string, name: string) => {
    showConfirm(
      "Delete Candidate",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      "danger",
      () => {
        setPendingAction({ type: "delete", data: { id } });
        setShowPasswordModal(true);
      },
      "Delete",
      "Cancel"
    );
  };

  const openReset = () => {
    showConfirm(
      "Reset Entire Election",
      "This will reset all votes to 0 and clear all students' voting status. This action cannot be undone!",
      "danger",
      () => {
        setPendingAction({ type: "reset" });
        setShowPasswordModal(true);
      },
      "Reset Election",
      "Cancel"
    );
  };

  const handleUpdateSettings = () => {
    if (!newStartDate || !newEndDate) { 
      showAlert("Dates Required", "Please select both start and end dates.", "warning");
      return; 
    }
    setPendingAction({ type: "settings", data: { startDate: newStartDate, endDate: newEndDate } });
    setShowPasswordModal(true);
  };

  const handleCandidateStatus = async (c: Candidate, status: "approved" | "rejected") => {
    // Check auto-reject conditions when trying to approve
    if (status === "approved") {
      const autoReject = checkAutoRejectConditions(c);
      if (autoReject.shouldReject) {
        showAlert("Cannot Approve", autoReject.reason, "error");
        return;
      }
    }
    
    const action = status === "approved" ? "approve" : "reject";
    showConfirm(
      `${status === "approved" ? "Approve" : "Reject"} Candidate`,
      `Are you sure you want to ${action} "${c.name}"?`,
      status === "approved" ? "info" : "warning",
      () => {
        setPendingAction({ type: "status", data: { id: c.id, status } });
        setShowPasswordModal(true);
      },
      status === "approved" ? "Approve" : "Reject",
      "Cancel"
    );
  };

  const openViewInfo = (c: Candidate) => {
    setSelectedCandidate(c);
    setShowCriteriaModal(true);
  };

  const handlePasswordConfirm = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === "add") {
        const base64 = await toBase64(pendingAction.data.image);
        
        if (pendingAction.data.type === "simple") {
          // Simple candidate - only basic info
          await addCandidateFirestore(
            pendingAction.data.name, 
            pendingAction.data.description, 
            base64
          );
        } else {
          // Full candidate with all criteria
          await addCandidateFirestore(
            pendingAction.data.name,
            pendingAction.data.description,
            base64,
            {
              department: pendingAction.data.department,
              year: pendingAction.data.year,
              cgpa: pendingAction.data.cgpa,
              experience: pendingAction.data.experience,
              manifesto: pendingAction.data.manifesto,
              vision: pendingAction.data.vision
            }
          );
        }
        
        // Reset all form fields
        setNewName(""); 
        setNewDesc(""); 
        setNewImage(null);
        setNewDepartment("");
        setNewYear("");
        setNewCgpa("");
        setNewExperience("");
        setNewManifesto("");
        setNewVision("");
        
        showAlert("Success!", "Candidate added successfully!", "success");
      }
      if (pendingAction.type === "edit") {
        const img = pendingAction.data.image instanceof File ? await toBase64(pendingAction.data.image) : pendingAction.data.image;
        await updateCandidate(pendingAction.data.id, pendingAction.data.name, pendingAction.data.description, img);
        showAlert("Success!", "Candidate updated successfully!", "success");
      }
      if (pendingAction.type === "delete") {
        await deleteCandidate(pendingAction.data.id);
        showAlert("Success!", "Candidate deleted successfully!", "success");
      }
      if (pendingAction.type === "reset") {
        const idToken = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/reset-election", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
        showAlert("Success!", "Election reset successfully!", "success");
      }
      if (pendingAction.type === "settings") {
        const idToken = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/update-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pendingAction.data, idToken }) });
        setNewStartDate(""); setNewEndDate("");
        showAlert("Success!", "Election dates updated successfully!", "success");
      }
      if (pendingAction.type === "status") {
        await updateCandidateStatus(pendingAction.data.id, pendingAction.data.status);
        showAlert("Success!", `Candidate ${pendingAction.data.status} successfully!`, "success");
      }
    } catch (err: any) {
      showAlert("Error", err.message || "Operation failed", "error");
    } finally {
      setSubmitting(false); setPendingAction(null); setShowPasswordModal(false);
    }
  };

  const now = Date.now();
  const isElectionEnded = settings && now >= settings.endDate.toMillis();

  // Winner calculation
  const maxVotes = Math.max(...candidates.map((c) => c.votes || 0), 0);
  let primaryWinner = null;
  let winnerDisplay = "No winner yet (no votes cast)";
  let experienceNumber = "Not provided";
  let tiedOthers = "";
  
  if (maxVotes > 0) {
    let tiedCandidates = candidates.filter(
      (c) => (c.votes || 0) === maxVotes && c.status === "approved"
    );
    if (tiedCandidates.length === 1) {
      primaryWinner = tiedCandidates[0];
      winnerDisplay = primaryWinner.name;
    } else if (tiedCandidates.length >= 2) {
      tiedCandidates.sort((a, b) => {
        const getExpNumber = (exp: string = "") => {
          const cleaned = exp.replace(/[^0-9]/g, "");
          const num = parseInt(cleaned, 10);
          return isNaN(num) ? 0 : num;
        };
        const aNum = getExpNumber(a.criteria?.experience);
        const bNum = getExpNumber(b.criteria?.experience);
        if (aNum !== bNum) return bNum - aNum;
        return a.name.localeCompare(b.name);
      });
      primaryWinner = tiedCandidates[0];
      winnerDisplay = `${primaryWinner.name} (Tie-breaker: higher experience)`;
      tiedOthers = tiedCandidates.slice(1).map((c) => c.name).join(", ");
    }
    if (primaryWinner && primaryWinner.criteria?.experience) {
      const cleaned = primaryWinner.criteria.experience.replace(/[^0-9]/g, "");
      const num = parseInt(cleaned, 10);
      experienceNumber = isNaN(num) ? "Not provided" : num.toString();
    }
  }

  // Check if candidate is ineligible
  const isIneligible = (c: Candidate): boolean => {
    if (!c.criteria || c.isAdminAdded) return false;
    const ineligibleYears = ["0 Year", "Freshman", "Remedial", "1st Year", "Graduate"];
    return ineligibleYears.includes(c.criteria.year || "") || 
           parseFloat(c.criteria.cgpa || "0") < 3.0;
  };

  // Search filter
  const filteredCandidates = candidates.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      {/* Custom Modals */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        type={confirmModalProps.type}
        onConfirm={confirmModalProps.onConfirm}
        onCancel={() => setShowConfirmModal(false)}
        confirmText={confirmModalProps.confirmText}
        cancelText={confirmModalProps.cancelText}
      />

      <AlertModal
        isOpen={showAlertModal}
        title={alertModalProps.title}
        message={alertModalProps.message}
        type={alertModalProps.type}
        onClose={() => setShowAlertModal(false)}
      />

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

          <div className="dividerLine"></div>

          {/* ================= AUTO-REJECT NOTIFICATION ================= */}
          {autoRejectLog.length > 0 && (
            <div className="autoRejectNotification">
              <h4>🔄 Auto-Rejection Complete</h4>
              {autoRejectLog.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
          )}

          {/* ================= WELCOME + HORIZONTAL STATS ================= */}
          <div className="statsSection">
            <div className="welcomeText">
              Welcome, <strong className="blue">{user.username}</strong>
            </div>

            <div className="horizontalStats">
              <div className="statCard">
                <h3>Total Students</h3>
                <p className="statNumber">{totalVoters}</p>
              </div>
              <div className="statCard">
                <h3>Voted Students</h3>
                <p className="statNumber">{votedCount}</p>
              </div>
              <div className="statCard clickable" onClick={() => setShowStudentsModal(true)}>
                <h3>View All Students</h3>
                <p className="statNumber">👥</p>
              </div>
            </div>
          </div>

          {/* ================= SEARCH BAR ================= */}
          <div className="searchSection">
            <div className="searchWrapper">
              <span className="searchIcon">🔍</span>
              <input
                type="text"
                placeholder="Search candidates by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="searchInput"
              />
            </div>
          </div>

          {/* ================= ELECTION SETTINGS ================= */}
          <div className="statusBox">
            <h2 className="sectionTitle">Election Dates</h2>
            <p>Current Start: {settings?.startDate?.toDate().toLocaleString() || "Not set"}</p>
            <p>Current End: {settings?.endDate?.toDate().toLocaleString() || "Not set"}</p>
            <div className="form">
              <input type="datetime-local" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
              <input type="datetime-local" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
              <button className="addBtn shortBtn" onClick={handleUpdateSettings}>Update Dates</button>
            </div>
          </div>

          {/* ================= ADD CANDIDATE SECTION ================= */}
          <div className="statusBox">
            <h2 className="sectionTitle">Add New Candidate</h2>
            
            {/* Candidate Type Toggle */}
            <div className="toggle-container">
              <button 
                className={`toggle-btn ${candidateType === "simple" ? "active" : ""}`}
                onClick={() => setCandidateType("simple")}
              >
                📝 Simple Candidate
              </button>
              <button 
                className={`toggle-btn ${candidateType === "full" ? "active" : ""}`}
                onClick={() => setCandidateType("full")}
              >
                📋 Full Candidate with Criteria
              </button>
            </div>

            <div className="form">
              {/* Common Fields */}
              <input 
                placeholder="Candidate Name" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
              />
              <input 
                placeholder="Campaign Slogan/Description" 
                value={newDesc} 
                onChange={(e) => setNewDesc(e.target.value)} 
              />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setNewImage(e.target.files?.[0] || null)} 
              />

              {/* Full Candidate Fields - Only shown when "full" is selected */}
              {candidateType === "full" && (
                <>
                  <div className="form-row">
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>

                    <select
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Year</option>
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      placeholder="CGPA (e.g., 3.75)"
                      value={newCgpa}
                      onChange={(e) => setNewCgpa(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Years of Experience"
                      value={newExperience}
                      onChange={(e) => setNewExperience(e.target.value)}
                      min="0"
                    />
                  </div>

                  <textarea
                    placeholder="Manifesto"
                    value={newManifesto}
                    onChange={(e) => setNewManifesto(e.target.value)}
                    rows={4}
                  />

                  <textarea
                    placeholder="Vision"
                    value={newVision}
                    onChange={(e) => setNewVision(e.target.value)}
                    rows={3}
                  />
                </>
              )}

              <button onClick={openAdd} className="addBtn" disabled={submitting}>
                {submitting ? "Adding..." : `➕ Add ${candidateType === "simple" ? "Simple" : "Full"} Candidate`}
              </button>
            </div>
          </div>

          {/* ================= CANDIDATE GRID ================= */}
          <div className="grid">
            {filteredCandidates.map((c) => {
              const ineligible = isIneligible(c);
              return (
                <motion.div
                  key={c.id}
                  className={`cardWrap ${ineligible && c.status === "pending" ? 'ineligible' : ''}`}
                  whileHover={{ scale: 1.05, rotateX: -3, rotateY: 3, boxShadow: "0 25px 50px rgba(54, 209, 220, 0.6)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="card">
                    <img src={c.image || "/images/default.jpg"} alt={c.name} className="candidateImg" />
                    <h2 className="blue">{c.name}</h2>
                    <p className="desc">{c.description}</p>
                    
                    {c.isAdminAdded && (
                      <div className="admin-badge">👑 Admin Added</div>
                    )}
                    
                    <p className="votes"><strong>{c.votes ?? 0}</strong> vote{(c.votes ?? 0) !== 1 ? "s" : ""}</p>
                    
                    {/* Status Badge */}
                    {c.status && (
                      <p className={`statusLabel ${c.status}`}>
                        Status: {c.status.toUpperCase()}
                      </p>
                    )}

                    {/* HORIZONTAL BUTTONS */}
                    <div className="horizontal-actions">
                      <button 
                        className="editBtn" 
                        onClick={() => openEdit(c)} 
                        title={c.isAdminAdded ? "Edit Candidate" : "Cannot edit - Candidate submitted"}
                        style={{ opacity: c.isAdminAdded ? 1 : 0.5 }}
                        disabled={!c.isAdminAdded}
                      >
                        ✏️
                      </button>
                      <button className="deleteBtn" onClick={() => openDelete(c.id!, c.name)} title="Delete Candidate">
                        🗑️
                      </button>
                      <button className="viewBtn" onClick={() => openViewInfo(c)} title="View Details">
                        👁️
                      </button>
                    </div>

                    {/* Approve/Reject Buttons - Only show for pending candidates that are not admin added */}
                    {c.status === "pending" && !c.isAdminAdded && (
                      <div className="action-buttons">
                        {!ineligible && (
                          <button className="approveBtn" onClick={() => handleCandidateStatus(c, "approved")}>
                            ✅ Approve
                          </button>
                        )}
                        <button className="rejectBtn" onClick={() => handleCandidateStatus(c, "rejected")}>
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
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

                {primaryWinner ? (
                  <>
                    <div className="winnerPhotoContainer">
                      <img
                        src={primaryWinner.image || "/images/default.jpg"}
                        alt={`${primaryWinner.name} - Winner`}
                        className="winnerPhoto"
                      />
                    </div>
                    <strong className="winnerName">{winnerDisplay}</strong><br /><br />
                    with <strong>{maxVotes}</strong> vote{maxVotes !== 1 ? "s" : ""}!<br /><br />
                    
                    {/* Winner Details */}
                    <div className="winnerDetails">
                      <h3>Winner Information:</h3>
                      <p><strong>Department:</strong> {primaryWinner.criteria?.department || "Not provided"}</p>
                      <p><strong>CGPA:</strong> {primaryWinner.criteria?.cgpa || "Not provided"}</p>
                      <p><strong>Year:</strong> {primaryWinner.criteria?.year || "Not provided"}</p>
                      <p><strong>Experience:</strong> {experienceNumber} years</p>
                      {primaryWinner.isAdminAdded && (
                        <p><strong>Added by:</strong> 👑 Admin</p>
                      )}
                    </div>

                    {tiedOthers && (
                      <>
                        <br />
                        <strong>Other tied candidates:</strong> {tiedOthers}
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
              <div className="modal large">
                <h3>Edit Candidate {!editingCandidate.isAdminAdded && "(Read Only - Candidate Submitted)"}</h3>
                <div className="form">
                  <input 
                    placeholder="Candidate Name" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!editingCandidate.isAdminAdded}
                  />
                  <input 
                    placeholder="Description" 
                    value={editDesc} 
                    onChange={(e) => setEditDesc(e.target.value)}
                    disabled={!editingCandidate.isAdminAdded}
                  />
                  
                  {typeof editImage === "string" && editImage.trim() !== "" && (
                    <img src={editImage} alt="Current" style={{ width: "100px", marginBottom: "10px", borderRadius: "50%" }} />
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setEditImage(e.target.files?.[0] ?? editImage)}
                    disabled={!editingCandidate.isAdminAdded}
                  />

                  {/* Show criteria fields if they exist */}
                  {editingCandidate.criteria && (
                    <>
                      <h4 className="criteria-title">Candidate Criteria {!editingCandidate.isAdminAdded && "(Read Only)"}</h4>
                      <div className="criteria-view">
                        <p><strong>Department:</strong> {editingCandidate.criteria.department}</p>
                        <p><strong>Year:</strong> {editingCandidate.criteria.year}</p>
                        <p><strong>CGPA:</strong> {editingCandidate.criteria.cgpa}</p>
                        <p><strong>Experience:</strong> {editingCandidate.criteria.experience} years</p>
                        <p><strong>Manifesto:</strong> {editingCandidate.criteria.manifesto}</p>
                        <p><strong>Vision:</strong> {editingCandidate.criteria.vision}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="buttons" style={{ marginTop: "20px" }}>
                  {editingCandidate.isAdminAdded ? (
                    <button onClick={handleEditSubmit}>Save Changes</button>
                  ) : (
                    <button disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                      Cannot Edit - Candidate Submitted
                    </button>
                  )}
                  <button onClick={() => setShowEditModal(false)} className="cancel">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW INFO MODAL ================= */}
          {showCriteriaModal && selectedCandidate && (
            <div className="overlay">
              <div className="modal large">
                <h3>Candidate Details - {selectedCandidate.name}</h3>
                <div className="modalContent">
                  {selectedCandidate.image && (
                    <img
                      src={selectedCandidate.image}
                      alt={selectedCandidate.name}
                      className="modalCandidateImg"
                    />
                  )}
                  
                  <div className="basic-info">
                    <p><strong>Campaign Slogan:</strong> {selectedCandidate.description || "Not provided"}</p>
                    <p><strong>Votes:</strong> {selectedCandidate.votes || 0}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${selectedCandidate.status}`}>
                        {selectedCandidate.status?.toUpperCase() || "Unknown"}
                      </span>
                      {selectedCandidate.isAdminAdded && (
                        <span className="admin-badge"> 👑 Admin Added</span>
                      )}
                      {selectedCandidate.status === "rejected" && isIneligible(selectedCandidate) && (
                        <span className="rejection-badge">
                          {selectedCandidate.criteria?.year && ["0 Year", "Freshman", "Remedial", "1st Year", "Graduate"].includes(selectedCandidate.criteria.year) 
                            ? ` (${selectedCandidate.criteria.year} not eligible)`
                            : selectedCandidate.criteria?.cgpa && parseFloat(selectedCandidate.criteria.cgpa) < 3.0
                            ? ` (CGPA ${selectedCandidate.criteria.cgpa} < 3.0)`
                            : ' (Ineligible)'}
                        </span>
                      )}
                    </p>
                  </div>

                  {selectedCandidate.criteria && (
                    <>
                      <h4 className="section-subtitle">📋 Academic & Personal Information</h4>
                      <div className="criteria-grid">
                        <div className="criteria-item">
                          <strong>Department:</strong>
                          <p>{selectedCandidate.criteria.department || "Not provided"}</p>
                        </div>
                        
                        <div className="criteria-item">
                          <strong>CGPA:</strong>
                          <p>{selectedCandidate.criteria.cgpa || "Not provided"} / 4.0</p>
                        </div>
                        
                        <div className="criteria-item">
                          <strong>Year of Study:</strong>
                          <p>{selectedCandidate.criteria.year || "Not provided"}</p>
                        </div>
                        
                        <div className="criteria-item">
                          <strong>Experience:</strong>
                          <p>{selectedCandidate.criteria.experience || "0"} years</p>
                        </div>
                        
                        <div className="criteria-item full-width">
                          <strong>🎯 Manifesto:</strong>
                          <div className="criteria-text-box">
                            {selectedCandidate.criteria.manifesto || "Not provided"}
                          </div>
                        </div>
                        
                        <div className="criteria-item full-width">
                          <strong>👁️ Vision:</strong>
                          <div className="criteria-text-box">
                            {selectedCandidate.criteria.vision || "Not provided"}
                          </div>
                        </div>
                        
                        {selectedCandidate.criteria.submittedAt && (
                          <div className="criteria-item full-width">
                            <strong>📅 Submitted At:</strong>
                            <p>{selectedCandidate.criteria.submittedAt.toDate().toLocaleString()}</p>
                          </div>
                        )}
                      </div>

                      {/* Eligibility Warning for non-admin candidates */}
                      {!selectedCandidate.isAdminAdded && isIneligible(selectedCandidate) && selectedCandidate.status !== "rejected" && (
                        <div className="eligibility-warning">
                          ⚠️ This candidate is INELIGIBLE!
                          {selectedCandidate.criteria?.year && ["0 Year", "Freshman", "Remedial", "1st Year", "Graduate"].includes(selectedCandidate.criteria.year) 
                            ? ` ${selectedCandidate.criteria.year} students are not eligible to apply.`
                            : selectedCandidate.criteria?.cgpa && parseFloat(selectedCandidate.criteria.cgpa) < 3.0
                            ? ` CGPA ${selectedCandidate.criteria.cgpa} is below 3.0 requirement.`
                            : ' Does not meet eligibility criteria.'}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="buttons">
                  <button className="cancel" onClick={() => setShowCriteriaModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STUDENTS MODAL ================= */}
          {showStudentsModal && (
            <div className="overlay">
              <div className="modal large">
                <h3>All Students</h3>
                <div className="tableContainer">
                  <table className="studentsTable">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td>{s.studentId}</td>
                          <td>{s.username}</td>
                          <td>{s.email}</td>
                          <td>
                            <span className={`vote-status ${s.hasVoted ? 'voted' : 'not-voted'}`}>
                              {s.hasVoted ? '✓ Voted' : '○ Not Voted'}
                            </span>
                          </td>
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

      {/* ================= STYLES ================= */}
      <style jsx>{`
        .page { 
          position: relative; 
          min-height: 100dvh; 
          padding: 230px 20px 40px; 
          background: linear-gradient(270deg,#0f2027,#203a43,#2c5364); 
          color:#fff; 
        }

        .topBar { 
          display:flex; 
          align-items:center; 
          justify-content:space-between; 
          padding:5px 30px; 
          background: rgba(255,255,255,0.05); 
          backdrop-filter:blur(10px); 
          position:fixed; 
          top:0; 
          left:0; 
          right:0; 
          z-index:1000; 
          box-shadow:0 4px 20px rgba(0,0,0,0.3); 
        }

        .logoImg { 
          width:140px;
          height:140px;
          border-radius:50%;
          object-fit:cover;
          border:5px solid #36d1dc;
          box-shadow:0 12px 40px rgba(54,209,220,0.6);
          transition: all 0.4s ease; 
        }

        .mainTitle { 
          font-size:2.8rem;
          font-weight:900;
          color:#36d1dc;
          margin:0;
          text-align:center;
          flex:1;
          padding-left:130px;
          text-shadow:0 4px 15px rgba(54,209,220,0.4); 
        }

        .topButtons { 
          display:flex; 
          gap:15px; 
        }

        .topButtons button { 
          padding:12px 24px; 
          border-radius:14px; 
          border:none; 
          font-weight:700; 
          cursor:pointer; 
          transition:all 0.3s ease; 
          font-size:1rem; 
        }

        .resetBtn { 
          background:linear-gradient(135deg,#ff4444,#cc0000); 
          color:white; 
        }

        .logoutBtn { 
          background:linear-gradient(135deg,#36d1dc,#5b86e5); 
          color:white; 
        }

        .dividerLine { 
          position:fixed; 
          top:150px; 
          left:40px; 
          right:40px; 
          height:5px; 
          background:linear-gradient(90deg,transparent,#36d1dc,transparent); 
          border-radius:3px; 
          box-shadow:0 0 20px rgba(54,209,220,0.8); 
          z-index:999; 
        }

        .autoRejectNotification {
          position: fixed;
          top: 180px;
          right: 30px;
          background: rgba(255, 69, 0, 0.9);
          color: white;
          padding: 15px 25px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 1001;
          backdrop-filter: blur(5px);
          border-left: 5px solid #ffd700;
          max-width: 350px;
          animation: slideIn 0.3s ease;
        }

        .autoRejectNotification h4 {
          margin: 0 0 10px 0;
          color: #ffd700;
          font-size: 1.1rem;
        }

        .autoRejectNotification p {
          margin: 5px 0;
          font-size: 0.9rem;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .statsSection { 
          max-width: 1200px; 
          margin: 0 auto 80px auto; 
          text-align: center; 
        }

        .welcomeText { 
          font-size: 2.6rem; 
          margin-bottom: 40px; 
          font-weight: 700; 
        }

        .welcomeText .blue { 
          color: #36d1dc; 
          font-weight: 900; 
          text-shadow: 0 0 10px rgba(54, 209, 220, 0.7); 
        }

        .horizontalStats { 
          display: flex; 
          justify-content: center; 
          gap: 30px; 
          flex-wrap: wrap; 
        }

        .statCard { 
          background: rgba(255,255,255,0.08); 
          backdrop-filter: blur(12px); 
          border-radius: 20px; 
          padding: 30px 40px; 
          min-width: 220px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.4); 
          border: 1px solid rgba(54,209,220,0.3); 
          transition: all 0.3s ease; 
        }

        .statCard:hover { 
          transform: translateY(-8px); 
          box-shadow: 0 20px 50px rgba(54,209,220,0.4); 
        }

        .statCard h3 { 
          font-size: 1.4rem; 
          color: #36d1dc; 
          margin-bottom: 12px; 
          font-weight: 600; 
        }

        .statCard .statNumber { 
          font-size: 3.2rem; 
          font-weight: 900; 
          color: #ffd700; 
          text-shadow: 0 4px 10px rgba(255,215,0,0.5); 
        }

        .statCard.clickable { 
          cursor: pointer; 
        }

        .statCard.clickable:hover { 
          background: rgba(255,255,255,0.15); 
        }

        .searchSection { 
          max-width: 1200px; 
          margin: 0 auto 40px auto; 
          text-align: center; 
        }

        .searchWrapper { 
          position: relative; 
          width: 80%; 
          max-width: 500px; 
          margin: 0 auto; 
        }

        .searchIcon { 
          position: absolute; 
          top: 50%; 
          left: 15px; 
          transform: translateY(-50%); 
          font-size: 1.3rem; 
          color: #ccc; 
          pointer-events: none; 
        }

        .searchInput { 
          width: 100%; 
          padding: 16px 16px 16px 50px; 
          border-radius: 16px; 
          border: none; 
          font-size: 1.2rem; 
          background: rgba(255,255,255,0.2); 
          color: #fff; 
          transition: all 0.3s ease; 
        }

        .searchInput::placeholder { 
          color: #ccc; 
        }

        .searchInput:focus { 
          outline: none; 
          background: rgba(255,255,255,0.3); 
          box-shadow: 0 5px 20px rgba(54,209,220,0.5); 
        }

        .statusBox { 
          text-align:center; 
          max-width:600px; 
          margin:0 auto 80px auto; 
          padding:40px; 
          background:rgba(255,255,255,0.08); 
          border-radius:24px; 
          backdrop-filter:blur(12px); 
          box-shadow:0 15px 40px rgba(0,0,0,0.4); 
        }

        .sectionTitle { 
          font-size:2.4rem; 
          color:#36d1dc; 
          margin-bottom:30px; 
          font-weight:700; 
        }

        .form { 
          display:flex; 
          flex-direction:column; 
          gap:20px; 
        }

        .form input, .form select, .form textarea { 
          padding:18px; 
          border-radius:16px; 
          border:none; 
          background:rgba(255,255,255,0.2); 
          color:#fff; 
          font-size:1.2rem; 
        }

        .form input::placeholder, .form textarea::placeholder {
          color: rgba(255,255,255,0.7);
        }

        /* Toggle Buttons */
        .toggle-container {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          justify-content: center;
        }

        .toggle-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: 12px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          border-color: #ffd700;
          transform: scale(1.02);
        }

        .toggle-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        /* Form Row */
        .form-row {
          display: flex;
          gap: 15px;
          width: 100%;
        }

        .form-row > * {
          flex: 1;
        }

        /* Select inputs */
        .form-select {
          padding: 18px;
          border-radius: 16px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 1.2rem;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 18px center;
          background-size: 20px;
        }

        .form-select option {
          background: #203a43;
          color: white;
        }

        .addBtn { 
          padding:18px; 
          border:none; 
          border-radius:16px; 
          background:linear-gradient(135deg,#36d1dc,#5b86e5); 
          color:white; 
          font-weight:700; 
          font-size:1.3rem; 
          cursor:pointer; 
          transition:all 0.3s ease; 
        }

        .shortBtn { 
          padding:14px 28px; 
          font-size:1.1rem; 
          align-self: center; 
        }

        .grid { 
          display:flex; 
          flex-wrap:wrap; 
          gap:40px; 
          justify-content:center; 
          margin:60px 0; 
        }

        .cardWrap { 
          padding:10px; 
          border-radius:24px; 
          background:linear-gradient(135deg,#36d1dc,#5b86e5); 
          position: relative;
          transition: all 0.3s ease;
        }

        .cardWrap.ineligible {
          background: linear-gradient(135deg, #ff6b6b, #c44545);
        }

        .card { 
          width:340px; 
          background:rgba(255,255,255,0.15); 
          border-radius:20px; 
          padding:20px 16px; 
          display:flex; 
          flex-direction:column; 
          align-items:center; 
          text-align:center; 
          backdrop-filter:blur(12px); 
        }

        .candidateImg { 
          width:150px; 
          height:150px; 
          border-radius:50%; 
          object-fit:cover; 
          margin-bottom:20px; 
          border:4px solid #36d1dc; 
          box-shadow:0 10px 30px rgba(54,209,220,0.4); 
        }

        .desc { 
          margin-bottom: 15px; 
          font-size: 1rem; 
          line-height: 1.5; 
          min-height: 60px;
        }

        .admin-badge {
          background: linear-gradient(135deg, #ffd700, #ffa500);
          color: #000;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .votes { 
          font-size:1.8rem; 
          color:#ffd700; 
          font-weight:800; 
          margin:10px 0; 
        }

        /* Status Labels */
        .statusLabel { 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-weight: bold; 
          margin-bottom: 15px; 
          width: fit-content;
          font-size: 0.9rem;
        }

        .statusLabel.approved { 
          background: rgba(76, 175, 80, 0.2); 
          color: #4caf50; 
          border: 1px solid #4caf50;
        }

        .statusLabel.rejected { 
          background: rgba(244, 67, 54, 0.2); 
          color: #f44336; 
          border: 1px solid #f44336;
        }

        /* HORIZONTAL BUTTONS */
        .horizontal-actions {
          display: flex;
          gap: 10px;
          width: 100%;
          margin: 15px 0;
          justify-content: center;
        }

        .horizontal-actions button {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          border: none;
          font-size: 1.3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(5px);
        }

        .horizontal-actions button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .horizontal-actions .editBtn:hover:not(:disabled) {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
        }

        .horizontal-actions .deleteBtn:hover {
          background: linear-gradient(135deg, #ff4444, #cc0000);
        }

        .horizontal-actions .viewBtn:hover {
          background: linear-gradient(135deg, #2196f3, #1976d2);
        }

        /* Approve/Reject Buttons */
        .action-buttons {
          display: flex;
          gap: 10px;
          width: 100%;
          margin-top: 10px;
        }

        .approveBtn, .rejectBtn {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
        }

        .approveBtn {
          background: #4caf50;
        }

        .rejectBtn {
          background: #f44336;
        }

        .approveBtn:hover, .rejectBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.3);
        }

        .criteria-title {
          color: #36d1dc;
          margin: 15px 0 10px;
          font-size: 1.2rem;
        }

        .criteria-view {
          background: rgba(0,0,0,0.2);
          padding: 15px;
          border-radius: 12px;
          text-align: left;
        }

        .criteria-view p {
          margin: 8px 0;
          word-break: break-word;
        }

        .criteria-view strong {
          color: #ffd700;
        }

        .resultsSection { 
          max-width:1100px; 
          margin:100px auto 60px; 
          padding:50px; 
          background:rgba(255,255,255,0.1); 
          border-radius:28px; 
          backdrop-filter:blur(15px); 
          text-align:center; 
        }

        .chartTitle { 
          font-size:2.6rem; 
          color:#36d1dc; 
          margin-bottom:40px; 
        }

        .chartContainer { 
          max-width:900px; 
          margin:0 auto; 
          height:450px; 
        }

        .winnerBox { 
          margin-top:70px; 
          padding:60px; 
          background:rgba(255,215,0,0.25); 
          border-radius:30px; 
          font-size:2rem; 
          color:#ffd700; 
          border:4px dashed #ffd700; 
          box-shadow:0 20px 50px rgba(255,215,0,0.3); 
          text-align: center; 
          line-height: 1.8; 
          font-weight: 900; 
        }

        .winnerPhotoContainer { 
          margin: 0 auto 30px; 
          width: 220px; 
          height: 220px; 
        }

        .winnerPhoto { 
          width: 100%; 
          height: 100%; 
          border-radius: 50%; 
          object-fit: cover; 
          border: 6px solid #ffd700; 
          box-shadow: 0 15px 40px rgba(255, 215, 0, 0.5); 
          background: rgba(255, 255, 255, 0.1); 
        }

        .winnerName { 
          color:#36d1dc; 
          font-size:3rem; 
          display: block; 
          margin: 10px 0; 
        }

        .winnerDetails { 
          margin-top: 30px; 
          padding: 20px; 
          background: rgba(0,0,0,0.3); 
          border-radius: 15px; 
          font-size: 1.2rem; 
          text-align: left; 
        }

        .winnerDetails h3 { 
          color: #36d1dc; 
          margin-bottom: 15px; 
          font-size: 1.5rem; 
        }

        .winnerDetails p { 
          margin: 10px 0; 
          color: #fff; 
        }

        .winnerDetails strong { 
          color: #ffd700; 
        }

        .overlay { 
          position: fixed; 
          inset: 0; 
          background: rgba(0, 0, 0, 0.85); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 2000; 
          padding: 20px; 
        }

        .modal { 
          background: linear-gradient(135deg, #1e3a52, #162b3c); 
          padding: 40px; 
          border-radius: 20px; 
          width: 90%; 
          max-width: 600px; 
          max-height: 90vh; 
          overflow-y: auto; 
          text-align: center; 
          color: white; 
          border: 2px solid #36d1dc; 
          box-shadow: 0 20px 60px rgba(54,209,220,0.3); 
        }

        .modal.large { 
          max-width: 800px; 
        }

        .modal h3 { 
          color: #36d1dc; 
          font-size: 2rem; 
          margin-bottom: 30px; 
          border-bottom: 2px solid rgba(54,209,220,0.3); 
          padding-bottom: 15px; 
        }

        .modalContent { 
          text-align: left; 
        }

        .basic-info { 
          background: rgba(0,0,0,0.2); 
          padding: 20px; 
          border-radius: 15px; 
          margin-bottom: 25px; 
        }

        .basic-info p { 
          margin: 10px 0; 
          font-size: 1.1rem; 
        }

        .status-badge { 
          display: inline-block; 
          padding: 5px 15px; 
          border-radius: 20px; 
          margin-left: 10px; 
          font-size: 0.9rem; 
        }

        .status-badge.pending { 
          background: #ff9800; 
          color: #000; 
        }

        .status-badge.approved { 
          background: #4caf50; 
          color: #fff; 
        }

        .status-badge.rejected { 
          background: #f44336; 
          color: #fff; 
        }

        .rejection-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          margin-left: 10px;
          font-size: 0.9rem;
          background: rgba(244, 67, 54, 0.3);
          color: #ff9999;
        }

        .section-subtitle { 
          color: #36d1dc; 
          font-size: 1.5rem; 
          margin: 25px 0 20px; 
          border-left: 4px solid #36d1dc; 
          padding-left: 15px; 
        }

        .criteria-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 20px; 
          margin: 20px 0; 
        }

        .criteria-item { 
          background: rgba(255,255,255,0.05); 
          padding: 15px; 
          border-radius: 12px; 
          border-left: 4px solid #36d1dc; 
          transition: all 0.3s ease; 
        }

        .criteria-item:hover { 
          background: rgba(255,255,255,0.1); 
          transform: translateX(5px); 
        }

        .criteria-item.full-width { 
          grid-column: 1 / -1; 
        }

        .criteria-item strong { 
          display: block; 
          color: #ffd700; 
          margin-bottom: 8px; 
          font-size: 1rem; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
        }

        .criteria-item p { 
          margin: 0; 
          color: #fff; 
          font-size: 1.1rem; 
          line-height: 1.5; 
        }

        .criteria-text-box { 
          background: rgba(0,0,0,0.3); 
          padding: 15px; 
          border-radius: 8px; 
          max-height: 200px; 
          overflow-y: auto; 
          font-size: 1rem; 
          line-height: 1.6; 
          border: 1px solid rgba(54,209,220,0.2); 
        }

        .eligibility-warning {
          background: rgba(255, 69, 0, 0.2);
          border: 2px solid #ff4500;
          border-radius: 12px;
          padding: 15px;
          margin-top: 20px;
          text-align: center;
          color: #ff4500;
          font-weight: 600;
        }

        .modalCandidateImg { 
          width: 150px; 
          height: 150px; 
          border-radius: 50%; 
          object-fit: cover; 
          border: 4px solid #36d1dc; 
          margin: 0 auto 25px; 
          display: block; 
          box-shadow: 0 10px 30px rgba(54,209,220,0.4); 
        }

        .tableContainer { 
          max-height: 400px; 
          overflow-y: auto; 
          margin: 20px 0; 
          border-radius: 12px; 
          background: rgba(0,0,0,0.2); 
        }

        .studentsTable { 
          width: 100%; 
          border-collapse: collapse; 
        }

        .studentsTable th { 
          background: #36d1dc; 
          color: #000; 
          padding: 15px; 
          font-weight: 700; 
          position: sticky; 
          top: 0; 
        }

        .studentsTable td { 
          padding: 12px 15px; 
          border-bottom: 1px solid rgba(255,255,255,0.1); 
        }

        .studentsTable tr:hover { 
          background: rgba(255,255,255,0.05); 
        }

        .vote-status { 
          padding: 5px 10px; 
          border-radius: 15px; 
          font-weight: 600; 
        }

        .vote-status.voted { 
          background: rgba(76, 175, 80, 0.2); 
          color: #4caf50; 
        }

        .vote-status.not-voted { 
          background: rgba(255, 152, 0, 0.2); 
          color: #ff9800; 
        }

        .buttons { 
          display: flex; 
          gap: 15px; 
          justify-content: center; 
          margin-top: 30px; 
        }

        .buttons button { 
          padding: 12px 30px; 
          border-radius: 12px; 
          border: none; 
          font-weight: 700; 
          cursor: pointer; 
          transition: all 0.3s ease; 
        }

        .buttons button.cancel { 
          background: #f44336; 
          color: white; 
        }

        .buttons button:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 10px 20px rgba(0,0,0,0.3); 
        }

        .loading { 
          text-align: center; 
          font-size: 2rem; 
          color: #36d1dc; 
          padding: 50px; 
        }

        @media (max-width: 768px) {
          .page { 
            padding: 30px 12px 40px; 
          }

          .topBar { 
            position: relative; 
            flex-direction: column; 
            gap: 10px; 
            padding: 15px 10px; 
          }

          .logoImg { 
            width: 80px; 
            height: 80px; 
          }

          .mainTitle { 
            font-size: 1.6rem; 
            padding-left: 0; 
          }

          .dividerLine { 
            display: none; 
          }

          .autoRejectNotification {
            top: auto;
            bottom: 20px;
            right: 20px;
            left: 20px;
            max-width: none;
          }

          .statsSection { 
            margin-bottom: 60px; 
          }

          .welcomeText { 
            font-size: 2rem; 
            margin-bottom: 30px; 
          }

          .horizontalStats { 
            flex-direction: column; 
            gap: 20px; 
          }

          .statCard { 
            min-width: auto; 
            padding: 25px 20px; 
          }

          .statCard .statNumber { 
            font-size: 2.6rem; 
          }

          .statusBox { 
            margin: 0 auto 60px auto; 
            padding: 25px 15px; 
          }

          .sectionTitle { 
            font-size: 2rem; 
            margin-bottom: 25px; 
          }

          .form input, .form select, .form textarea { 
            font-size: 1rem; 
            padding: 14px; 
          }

          .addBtn { 
            font-size: 1.1rem; 
            padding: 14px; 
          }

          .grid { 
            flex-direction: column; 
            align-items: center; 
          }

          .cardWrap { 
            width: 100%; 
            max-width: 360px; 
          }

          .form-row {
            flex-direction: column;
            gap: 20px;
          }
          
          .toggle-container {
            flex-direction: column;
            gap: 10px;
          }
          
          .toggle-btn {
            width: 100%;
          }

          .criteria-grid { 
            grid-template-columns: 1fr; 
            gap: 15px; 
          }

          .modal { 
            padding: 25px; 
          }

          .modal h3 { 
            font-size: 1.6rem; 
          }

          .winnerPhotoContainer { 
            width: 160px; 
            height: 160px; 
            margin-bottom: 20px; 
          }

          .winnerPhoto { 
            border-width: 4px; 
          }

          .winnerName { 
            font-size: 2.4rem; 
          }

          .winnerBox { 
            font-size: 1.5rem; 
            padding: 40px 20px; 
          }

          .searchSection { 
            margin: 0 auto 30px auto; 
          }

          .searchWrapper { 
            width: 100%; 
            max-width: none; 
          }

          .searchInput { 
            font-size: 1rem; 
            padding: 14px 14px 14px 45px; 
          }

          .studentsTable th, 
          .studentsTable td { 
            padding: 10px; 
            font-size: 0.9rem; 
          }

          .horizontal-actions button {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .modal.large { 
            padding: 20px; 
          }

          .criteria-item { 
            padding: 12px; 
          }

          .criteria-text-box { 
            max-height: 150px; 
            font-size: 0.95rem; 
          }

          .buttons { 
            flex-direction: column; 
          }

          .buttons button { 
            width: 100%; 
          }

          .horizontal-actions {
            gap: 8px;
          }

          .horizontal-actions button {
            width: 35px;
            height: 35px;
            font-size: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}