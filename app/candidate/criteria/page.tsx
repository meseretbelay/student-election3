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
  const [photo, setPhoto] = useState<File | null>(null);
  const [manifesto, setManifesto] = useState("");
  const [vision, setVision] = useState("");
  const [experience, setExperience] = useState("");
  const [department, setDepartment] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [year, setYear] = useState("");

  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const departments = [
    "Freshman",
    "Remedial",
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

  const years = ["0 Year", "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"];

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
        setDepartment(c.department || "");
        setCgpa(c.cgpa || "");
        setYear(c.year || "");

        if (c.manifesto || c.vision || c.experience || c.department || c.cgpa || c.year) {
          setAlreadySubmitted(true);
        }

        setLoading(false);
      });

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, [router]);

  // Check if candidate meets eligibility criteria
  const checkEligibility = (): { eligible: boolean; message: string } => {
    if (!department || !cgpa || !year) {
      return { eligible: true, message: "" };
    }

    const cgpaValue = parseFloat(cgpa);
    const ineligibleYears = ["0 Year", "Freshman", "Remedial", "Graduate"];
    
    if (ineligibleYears.includes(year)) {
      return { 
        eligible: false, 
        message: `${year} students are not eligible to apply.` 
      };
    }

    if (cgpaValue < 3.0) {
      return { 
        eligible: false, 
        message: `Students with CGPA below 3.0 are not eligible. Your CGPA: ${cgpa}` 
      };
    }

    return { eligible: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || alreadySubmitted) return;

    // Validation
    if (!photo) {
      alert("Please upload a photo");
      return;
    }
    if (!manifesto.trim() || !vision.trim() || !experience.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    if (!department) {
      alert("Please select your department");
      return;
    }
    if (!cgpa || parseFloat(cgpa) < 0 || parseFloat(cgpa) > 4.0) {
      alert("Please enter a valid CGPA between 0 and 4.0");
      return;
    }
    if (!year) {
      alert("Please select your year");
      return;
    }

    // Check eligibility
    const eligibility = checkEligibility();
    if (!eligibility.eligible) {
      alert(eligibility.message);
      return;
    }

    setSubmitting(true);

    try {
      const imageBase64 = await toBase64(photo);

      await updateDoc(doc(db, "candidates", candidateId), {
        image: imageBase64,
        description: vision,
        criteria: {
          manifesto: manifesto.trim(),
          vision: vision.trim(),
          experience: experience.trim(),
          department: department,
          cgpa: parseFloat(cgpa).toFixed(2),
          year: year,
          submittedAt: Timestamp.now(),
        },
        status: "pending",
      });

      alert("Submitted successfully! Waiting for admin approval.");
      setAlreadySubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/candidate/login");
  };

  const eligibility = checkEligibility();
  const showEligibilityWarning = !eligibility.eligible && department && cgpa && year;

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
        <h1>Candidate Application Form</h1>

        <p className={`status ${status}`}>
          Status: <strong>{status.toUpperCase()}</strong>
        </p>

        {status === "approved" ? (
          <div className="approved-message">
            <p className="approved">✅ Your application has been APPROVED!</p>
            <p>You are now visible on the voting page.</p>
          </div>
        ) : alreadySubmitted ? (
          <div className="pending-message">
            <p className="pending">⏳ Your application is under review</p>
            <p>Please wait for admin approval. You will be notified once reviewed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Profile Photo *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                required
                className="file-input"
              />
              <small>Upload a clear passport photograph</small>
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="select-input"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>CGPA *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  placeholder="e.g., 3.75"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  required
                />
                <small>Minimum required: 3.0</small>
              </div>

              <div className="form-group half">
                <label>Year of Study *</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className="select-input"
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Years of Experience *</label>
              <input
                type="number"
                placeholder="e.g., 2"
                value={experience}
                min="0"
                onChange={(e) => setExperience(e.target.value.replace(/\D/g, ""))}
                required
              />
              <small>Number of years in leadership/related roles</small>
            </div>

            <div className="form-group">
              <label>Manifesto *</label>
              <textarea
                placeholder="Write your manifesto here..."
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                required
                rows={5}
              />
              <small>Outline your goals and plans for the position</small>
            </div>

            <div className="form-group">
              <label>Vision *</label>
              <textarea
                placeholder="Describe your vision..."
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                required
                rows={4}
              />
              <small>What is your long-term vision for the students?</small>
            </div>

            {showEligibilityWarning && (
              <div className="warning-message">
                <p>⚠️ {eligibility.message}</p>
                <p className="small-text">You are not eligible to apply.</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting || !eligibility.eligible} 
              className="submit-btn"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </motion.div>

      <div className="logoutWrapper">
        <button className="logoutBtn" onClick={logout}>
          Logout
        </button>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 30px 20px;
          background: linear-gradient(135deg, #203a43, #2c5364);
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #fff;
          font-family: "Poppins", sans-serif;
        }

        .logo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid #36d1dc;
          box-shadow: 0 10px 30px rgba(54, 209, 220, 0.6);
          object-fit: cover;
          margin-bottom: 25px;
        }

        .card {
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 25px;
          width: 100%;
          max-width: 700px;
          color: white;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(54, 209, 220, 0.3);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        h1 {
          font-size: 2.2rem;
          color: #36d1dc;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 700;
        }

        .status {
          text-align: center;
          margin-bottom: 30px;
          font-size: 1.2rem;
          padding: 10px;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.2);
        }

        .status.pending { color: #ff9800; }
        .status.approved { color: #4caf50; }
        .status.rejected { color: #f44336; }

        .approved-message, .pending-message {
          text-align: center;
          padding: 30px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          margin: 20px 0;
        }

        .approved {
          color: #4caf50;
          font-size: 1.4rem;
          font-weight: bold;
        }

        .pending {
          color: #ffd700;
          font-size: 1.4rem;
          font-weight: bold;
        }

        .warning-message {
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid #ffc107;
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
          text-align: center;
        }

        .warning-message p {
          color: #ffc107;
          font-weight: 600;
          margin: 5px 0;
        }

        .warning-message .small-text {
          font-size: 0.9rem;
          color: rgba(255, 193, 7, 0.8);
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .half {
          flex: 1;
        }

        label {
          font-weight: 600;
          color: #36d1dc;
          font-size: 1rem;
        }

        input, textarea, select {
          width: 100%;
          padding: 12px 15px;
          border-radius: 12px;
          border: 1px solid rgba(54, 209, 220, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }

        select {
          cursor: pointer;
          appearance: none;
          background: rgba(255, 255, 255, 0.1) url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") no-repeat right 15px center;
          background-size: 20px;
        }

        select option {
          background: #203a43;
          color: white;
        }

        input:focus, textarea:focus, select:focus {
          border-color: #36d1dc;
          box-shadow: 0 0 10px rgba(54, 209, 220, 0.3);
          background: rgba(255, 255, 255, 0.15);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .file-input {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed #36d1dc;
        }

        .file-input::-webkit-file-upload-button {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          padding: 8px 15px;
          border: none;
          border-radius: 8px;
          margin-right: 15px;
          cursor: pointer;
          font-weight: 600;
        }

        small {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          margin-top: 4px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          border-radius: 15px;
          border: none;
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(54, 209, 220, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .logoutWrapper {
          margin-top: 30px;
        }

        .logoutBtn {
          padding: 12px 30px;
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

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.3);
          border-top: 6px solid #36d1dc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .card {
            padding: 25px;
          }
          h1 {
            font-size: 1.8rem;
          }
          .form-row {
            flex-direction: column;
            gap: 20px;
          }
          .logo {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
    </div>
  );
}