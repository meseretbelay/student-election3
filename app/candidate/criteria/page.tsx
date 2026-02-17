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
import { 
  Upload,
  FileText,
  Award,
  BookOpen,
  Calendar,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Target,
  Briefcase,
  GraduationCap,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Send,
  Eye,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Share2,
  Star,
  TrendingUp,
  Users,
  Globe,
  Heart,
  Shield,
  Zap,
  Bell,
  Settings
  
} from 'lucide-react';

export default function CandidateCriteria() {
  const router = useRouter();

  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [manifesto, setManifesto] = useState("");
  const [vision, setVision] = useState("");
  const [experience, setExperience] = useState("");
  const [department, setDepartment] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [year, setYear] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [achievements, setAchievements] = useState("");
  const [skills, setSkills] = useState("");

  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [eligibilityScore, setEligibilityScore] = useState(0);

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
    "Social Sciences"
  ];

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

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

      setEmail(user.email || "");

      const q = query(collection(db, "candidates"), where("uid", "==", user.uid));

      const unsubSnap = onSnapshot(q, (snap) => {
        if (!snap.docs[0]) return;

        const d = snap.docs[0];
        const data = d.data();

        setCandidateId(d.id);
        setStatus(data.status || "pending");
        setFullName(data.name || "");
        setEmail(data.email || user.email || "");

        const c = data.criteria || {};
        setManifesto(c.manifesto || "");
        setVision(c.vision || "");
        setExperience(c.experience || "");
        setDepartment(c.department || "");
        setCgpa(c.cgpa || "");
        setYear(c.year || "");
        setPhone(c.phone || "");
        setAddress(c.address || "");
        setAchievements(c.achievements || "");
        setSkills(c.skills || "");

        if (data.image) {
          setPhotoPreview(data.image);
        }

        if (c.manifesto || c.vision || c.experience || c.department || c.cgpa || c.year) {
          setAlreadySubmitted(true);
        }

        // Calculate eligibility score
        let score = 0;
        if (c.cgpa && parseFloat(c.cgpa) >= 3.0) score += 30;
        if (c.cgpa && parseFloat(c.cgpa) >= 3.5) score += 20;
        if (c.experience && parseInt(c.experience) >= 1) score += 25;
        if (c.experience && parseInt(c.experience) >= 3) score += 25;
        if (c.department) score += 10;
        if (c.year && !["0 Year", "Freshman", "Remedial", "Graduate"].includes(c.year)) score += 10;
        setEligibilityScore(Math.min(score, 100));

        setLoading(false);
      });

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (photo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(photo);
    }
  }, [photo]);

  const checkEligibility = (): { eligible: boolean; message: string; score: number } => {
    if (!department || !cgpa || !year) {
      return { eligible: false, message: "Please complete all required fields", score: 0 };
    }

    const cgpaValue = parseFloat(cgpa);
    const ineligibleYears = ["0 Year", "Freshman", "Remedial", "Graduate"];
    
    if (ineligibleYears.includes(year)) {
      return { 
        eligible: false, 
        message: `${year} students are not eligible to apply.`,
        score: 0
      };
    }

    if (cgpaValue < 2.5) {
      return { 
        eligible: false, 
        message: `Minimum CGPA requirement is 2.5. Your CGPA: ${cgpa}`,
        score: 0
      };
    }

    // Calculate score
    let score = 0;
    if (cgpaValue >= 3.5) score += 50;
    else if (cgpaValue >= 3.0) score += 40;
    else if (cgpaValue >= 2.5) score += 30;

    if (parseInt(experience) >= 3) score += 30;
    else if (parseInt(experience) >= 1) score += 20;

    if (department) score += 10;
    if (year && !ineligibleYears.includes(year)) score += 10;

    return { 
      eligible: true, 
      message: "You meet the minimum eligibility requirements.",
      score: Math.min(score, 100)
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || alreadySubmitted) return;

    if (!photo && !photoPreview) {
      alert("Please upload a profile photo");
      return;
    }

    setSubmitting(true);

    try {
      let imageBase64 = photoPreview;
      if (photo) {
        imageBase64 = await toBase64(photo);
      }

      await updateDoc(doc(db, "candidates", candidateId), {
        image: imageBase64,
        description: vision,
        criteria: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          manifesto: manifesto.trim(),
          vision: vision.trim(),
          experience: experience.trim(),
          department: department,
          cgpa: parseFloat(cgpa).toFixed(2),
          year: year,
          achievements: achievements.trim(),
          skills: skills.trim(),
          submittedAt: Timestamp.now(),
          eligibilityScore: eligibilityScore,
        },
        status: "pending",
      });

      alert("Application submitted successfully!");
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

  const getStatusIcon = () => {
    switch(status) {
      case 'approved': return <CheckCircle className="status-icon-approved" />;
      case 'pending': return <Clock className="status-icon-pending" />;
      case 'rejected': return <XCircle className="status-icon-rejected" />;
      default: return <AlertCircle className="status-icon-default" />;
    }
  };

  const getStatusMessage = () => {
    switch(status) {
      case 'approved':
        return {
          title: "Application Approved!",
          message: "Congratulations! Your candidacy has been approved.",
          submessage: "You are now visible on the voting page."
        };
      case 'pending':
        return {
          title: "Application Under Review",
          message: "Your application has been submitted successfully.",
          submessage: "We'll notify you once the admin reviews your application."
        };
      case 'rejected':
        return {
          title: "Application Not Approved",
          message: "Your application requires updates.",
          submessage: "Please review and update your information below."
        };
      default:
        return {
          title: "Complete Your Application",
          message: "Please fill in all required information.",
          submessage: "Make sure to provide accurate details."
        };
    }
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Academic Details", icon: GraduationCap },
    { number: 3, title: "Campaign Platform", icon: Target },
    { number: 4, title: "Review & Submit", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            color: white;
            font-family: 'Inter', sans-serif;
          }
          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255,255,255,0.1);
            border-left-color: #818cf8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const statusMessage = getStatusMessage();

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/images/mau.jpg" alt="MAU Logo" className="sidebar-logo" />
          </div>
          <h2>Candidate Portal</h2>
          <p className="candidate-name">{fullName || "Candidate"}</p>
        </div>

        <div className="sidebar-nav">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.number}
                className={`nav-item ${currentStep === step.number ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.number)}
              >
                <Icon size={20} />
                <span>{step.title}</span>
                {currentStep > step.number && <CheckCircle size={16} className="completed-icon" />}
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-button">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="content-header">
          <div>
            <h1>Candidate Application</h1>
            <p>Complete your profile to run for student elections</p>
          </div>
          <div className="header-actions">
            <button className="icon-button">
              <Bell size={20} />
            </button>
            <button className="icon-button">
              <Settings size={20} />
            </button>
            <div className="user-avatar">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" />
              ) : (
                <User size={24} />
              )}
            </div>
          </div>
        </div>

        {/* Status Card */}
        {status !== "approved" && (
          <div className={`status-card status-${status}`}>
            <div className="status-icon-wrapper">
              {getStatusIcon()}
            </div>
            <div className="status-content">
              <h3>{statusMessage.title}</h3>
              <p>{statusMessage.message}</p>
              <span>{statusMessage.submessage}</span>
            </div>
          </div>
        )}

        {status === "approved" ? (
          <div className="approved-container">
            <div className="approved-card">
              <div className="approved-icon">
                <CheckCircle size={80} />
              </div>
              <h2>Application Approved!</h2>
              <p>Congratulations! Your candidacy has been approved by the admin.</p>
              <p className="approved-note">You are now visible on the voting page. Good luck with your campaign!</p>
              
              <div className="approved-stats">
                <div className="stat-item">
                  <Users size={24} />
                  <div>
                    <span className="stat-label">Visibility</span>
                    <span className="stat-value">Public</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Award size={24} />
                  <div>
                    <span className="stat-label">Eligibility Score</span>
                    <span className="stat-value">{eligibilityScore}%</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Calendar size={24} />
                  <div>
                    <span className="stat-label">Submitted</span>
                    <span className="stat-value">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="approved-actions">
                <button className="primary-button">
                  <Eye size={20} />
                  View Public Profile
                </button>
                <button className="secondary-button" onClick={logout}>
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : alreadySubmitted ? (
          <div className="pending-container">
            <div className="pending-card">
              <div className="pending-icon">
                <Clock size={80} />
              </div>
              <h2>Application Under Review</h2>
              <p>Your application has been submitted and is being reviewed by the admin.</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
              <p className="pending-estimate">Estimated review time: 24-48 hours</p>
              
              <div className="pending-details">
                <h3>Application Summary</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span>Department</span>
                    <strong>{department || 'Not specified'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Year</span>
                    <strong>{year || 'Not specified'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>CGPA</span>
                    <strong>{cgpa || 'Not specified'}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Experience</span>
                    <strong>{experience || '0'} years</strong>
                  </div>
                </div>
              </div>

              <button className="secondary-button" onClick={logout}>
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="application-form">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <div className="step-header">
                  <h2>Personal Information</h2>
                  <p>Tell us about yourself</p>
                </div>

                <div className="form-grid">
                  <div className="photo-upload-section">
                    <div className="photo-preview">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" />
                      ) : (
                        <div className="photo-placeholder">
                          <Camera size={40} />
                        </div>
                      )}
                    </div>
                    <div className="upload-controls">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        id="photo-upload"
                        className="file-input"
                      />
                      <label htmlFor="photo-upload" className="upload-button">
                        <Upload size={18} />
                        Upload Photo
                      </label>
                      <p className="upload-hint">JPG, PNG or GIF (Max 5MB)</p>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Full Name *</label>
                    <div className="input-wrapper">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Email Address *</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Phone Number</label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="form-field full-width">
                    <label>Address</label>
                    <div className="input-wrapper">
                      <MapPin size={18} className="input-icon" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>

                <div className="step-navigation">
                  <div></div>
                  <button
                    type="button"
                    className="next-button"
                    onClick={() => setCurrentStep(2)}
                  >
                    Next Step
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Academic Details */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <div className="step-header">
                  <h2>Academic Information</h2>
                  <p>Provide your academic details</p>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>Department *</label>
                    <div className="select-wrapper">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Year of Study *</label>
                    <div className="select-wrapper">
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      >
                        <option value="">Select Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>CGPA *</label>
                    <div className="input-wrapper">
                      <Award size={18} className="input-icon" />
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
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Years of Experience *</label>
                    <div className="input-wrapper">
                      <Briefcase size={18} className="input-icon" />
                      <input
                        type="number"
                        placeholder="e.g., 2"
                        value={experience}
                        min="0"
                        onChange={(e) => setExperience(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field full-width">
                    <label>Achievements</label>
                    <textarea
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      placeholder="List your academic achievements, awards, or recognitions"
                      rows={3}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Skills & Competencies</label>
                    <textarea
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="List your relevant skills (e.g., leadership, public speaking, etc.)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Eligibility Score */}
                {department && cgpa && year && (
                  <div className="eligibility-card">
                    <div className="eligibility-header">
                      <Shield size={24} />
                      <div>
                        <h3>Eligibility Score</h3>
                        <p>{eligibility.message}</p>
                      </div>
                    </div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${eligibility.score}%` }}></div>
                      <span className="score-text">{eligibility.score}%</span>
                    </div>
                    {!eligibility.eligible && (
                      <div className="eligibility-warning">
                        <AlertCircle size={18} />
                        <span>{eligibility.message}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="step-navigation">
                  <button
                    type="button"
                    className="prev-button"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <button
                    type="button"
                    className="next-button"
                    onClick={() => setCurrentStep(3)}
                  >
                    Next Step
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Campaign Platform */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <div className="step-header">
                  <h2>Campaign Platform</h2>
                  <p>Share your vision with the voters</p>
                </div>

                <div className="form-grid">
                  <div className="form-field full-width">
                    <label>Manifesto *</label>
                    <div className="textarea-toolbar">
                      <button type="button"><Edit3 size={16} /></button>
                      <button type="button"><Save size={16} /></button>
                      <button type="button"><Download size={16} /></button>
                    </div>
                    <textarea
                      value={manifesto}
                      onChange={(e) => setManifesto(e.target.value)}
                      placeholder="Outline your goals, promises, and plans for the position..."
                      rows={6}
                      required
                    />
                    <div className="textarea-footer">
                      <span>{manifesto.length} characters</span>
                      <span>Minimum 100 characters</span>
                    </div>
                  </div>

                  <div className="form-field full-width">
                    <label>Vision Statement *</label>
                    <textarea
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      placeholder="Describe your long-term vision for the students..."
                      rows={5}
                      required
                    />
                  </div>
                </div>

                <div className="step-navigation">
                  <button
                    type="button"
                    className="prev-button"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <button
                    type="button"
                    className="next-button"
                    onClick={() => setCurrentStep(4)}
                  >
                    Review Application
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="form-step"
              >
                <div className="step-header">
                  <h2>Review Your Application</h2>
                  <p>Please review all information before submitting</p>
                </div>

                <div className="review-grid">
                  <div className="review-section">
                    <h3>
                      <User size={18} />
                      Personal Information
                    </h3>
                    <div className="review-content">
                      {photoPreview && (
                        <div className="review-photo">
                          <img src={photoPreview} alt="Profile" />
                        </div>
                      )}
                      <div className="review-details">
                        <p><strong>Full Name:</strong> {fullName || 'Not provided'}</p>
                        <p><strong>Email:</strong> {email || 'Not provided'}</p>
                        <p><strong>Phone:</strong> {phone || 'Not provided'}</p>
                        <p><strong>Address:</strong> {address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="review-section">
                    <h3>
                      <GraduationCap size={18} />
                      Academic Details
                    </h3>
                    <div className="review-details">
                      <p><strong>Department:</strong> {department || 'Not provided'}</p>
                      <p><strong>Year:</strong> {year || 'Not provided'}</p>
                      <p><strong>CGPA:</strong> {cgpa || 'Not provided'}</p>
                      <p><strong>Experience:</strong> {experience || '0'} years</p>
                      <p><strong>Achievements:</strong> {achievements || 'Not provided'}</p>
                      <p><strong>Skills:</strong> {skills || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="review-section">
                    <h3>
                      <Target size={18} />
                      Campaign Platform
                    </h3>
                    <div className="review-details">
                      <div className="review-text">
                        <strong>Manifesto:</strong>
                        <p>{manifesto || 'Not provided'}</p>
                      </div>
                      <div className="review-text">
                        <strong>Vision:</strong>
                        <p>{vision || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="review-section eligibility-summary">
                    <h3>
                      <Shield size={18} />
                      Eligibility Summary
                    </h3>
                    <div className="eligibility-meter">
                      <div className="meter-fill" style={{ width: `${eligibility.score}%` }}></div>
                      <span>Eligibility Score: {eligibility.score}%</span>
                    </div>
                    {eligibility.eligible ? (
                      <div className="eligible-badge">
                        <CheckCircle size={16} />
                        <span>You are eligible to apply</span>
                      </div>
                    ) : (
                      <div className="ineligible-badge">
                        <AlertCircle size={16} />
                        <span>{eligibility.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="terms-section">
                  <label className="checkbox-label">
                    <input type="checkbox" required />
                    <span>I confirm that all information provided is accurate and complete</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" required />
                    <span>I agree to abide by the election rules and regulations</span>
                  </label>
                </div>

                <div className="step-navigation">
                  <button
                    type="button"
                    className="prev-button"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={submitting || !eligibility.eligible}
                  >
                    {submitting ? (
                      <>
                        <div className="button-spinner"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background: #f3f4f6;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
        }

        .sidebar-header {
          padding: 30px 20px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .logo-container {
          width: 80px;
          height: 80px;
          margin: 0 auto 15px;
        }

        .sidebar-logo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #818cf8;
        }

        .sidebar-header h2 {
          font-size: 1.25rem;
          color: #1f2937;
          margin: 0 0 5px;
        }

        .candidate-name {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 20px;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          border: none;
          background: none;
          border-radius: 12px;
          color: #6b7280;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 5px;
          position: relative;
        }

        .nav-item:hover {
          background: #f3f4f6;
          color: #4b5563;
        }

        .nav-item.active {
          background: #818cf8;
          color: white;
        }

        .completed-icon {
          position: absolute;
          right: 15px;
          color: #10b981;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .logout-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 12px;
          color: #4b5563;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover {
          background: #e5e7eb;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 30px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .content-header h1 {
          font-size: 2rem;
          color: #1f2937;
          margin: 0 0 5px;
        }

        .content-header p {
          color: #6b7280;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .icon-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: white;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .icon-button:hover {
          background: #f3f4f6;
          color: #4b5563;
        }

        .user-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #818cf8;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Status Card */
        .status-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 30px;
          background: white;
          border-left: 4px solid;
        }

        .status-pending {
          border-color: #f59e0b;
        }

        .status-rejected {
          border-color: #ef4444;
        }

        .status-default {
          border-color: #6b7280;
        }

        .status-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-icon-pending { color: #f59e0b; }
        .status-icon-rejected { color: #ef4444; }
        .status-icon-default { color: #6b7280; }
        .status-icon-approved { color: #10b981; }

        .status-content h3 {
          font-size: 1.1rem;
          color: #1f2937;
          margin: 0 0 5px;
        }

        .status-content p {
          color: #4b5563;
          margin: 0 0 5px;
        }

        .status-content span {
          font-size: 0.9rem;
          color: #6b7280;
        }

        /* Approved Container */
        .approved-container,
        .pending-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 500px;
        }

        .approved-card,
        .pending-card {
          background: white;
          border-radius: 24px;
          padding: 50px;
          text-align: center;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .approved-icon,
        .pending-icon {
          color: #10b981;
          margin-bottom: 25px;
        }

        .pending-icon {
          color: #f59e0b;
        }

        .approved-card h2,
        .pending-card h2 {
          font-size: 2rem;
          color: #1f2937;
          margin: 0 0 15px;
        }

        .approved-card p,
        .pending-card p {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0 0 10px;
        }

        .approved-note {
          color: #9ca3af;
          font-style: italic;
        }

        .approved-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 40px 0;
          padding: 20px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-item svg {
          color: #818cf8;
        }

        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .stat-value {
          display: block;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          margin: 30px 0 15px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #818cf8, #6366f1);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .pending-estimate {
          color: #9ca3af;
          font-size: 0.95rem;
        }

        .pending-details {
          text-align: left;
          margin: 40px 0;
          padding: 20px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .pending-details h3 {
          color: #1f2937;
          margin: 0 0 20px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-item span {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .detail-item strong {
          font-size: 1rem;
          color: #1f2937;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 25px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .primary-button {
          background: #818cf8;
          color: white;
        }

        .primary-button:hover {
          background: #6366f1;
        }

        .secondary-button {
          background: #f3f4f6;
          color: #4b5563;
        }

        .secondary-button:hover {
          background: #e5e7eb;
        }

        .approved-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        /* Form Styles */
        .application-form {
          max-width: 900px;
        }

        .form-step {
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .step-header {
          margin-bottom: 30px;
        }

        .step-header h2 {
          font-size: 1.8rem;
          color: #1f2937;
          margin: 0 0 5px;
        }

        .step-header p {
          color: #6b7280;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
        }

        .full-width {
          grid-column: span 2;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #4b5563;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .form-field input,
        .form-field textarea,
        .form-field select {
          width: 100%;
          padding: 12px 15px 12px 40px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          background: white;
        }

        .form-field textarea {
          padding-left: 15px;
          resize: vertical;
        }

        .form-field input:focus,
        .form-field textarea:focus,
        .form-field select:focus {
          outline: none;
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
        }

        .select-wrapper select {
          padding-left: 15px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 15px center;
        }

        /* Photo Upload */
        .photo-upload-section {
          grid-column: span 2;
          display: flex;
          align-items: center;
          gap: 30px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .photo-preview {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid white;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .photo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }

        .file-input {
          display: none;
        }

        .upload-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 25px;
          background: #818cf8;
          color: white;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-button:hover {
          background: #6366f1;
        }

        .upload-hint {
          margin: 10px 0 0;
          font-size: 0.85rem;
          color: #9ca3af;
        }

        /* Textarea Toolbar */
        .textarea-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .textarea-toolbar button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .textarea-toolbar button:hover {
          background: #e5e7eb;
          color: #4b5563;
        }

        .textarea-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 0.85rem;
          color: #9ca3af;
        }

        /* Eligibility Card */
        .eligibility-card {
          margin-top: 30px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .eligibility-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .eligibility-header svg {
          color: #818cf8;
        }

        .eligibility-header h3 {
          font-size: 1rem;
          color: #1f2937;
          margin: 0 0 5px;
        }

        .eligibility-header p {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
        }

        .score-bar {
          position: relative;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #818cf8, #6366f1);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .score-text {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #818cf8;
        }

        .eligibility-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 10px;
          color: #92400e;
          font-size: 0.9rem;
        }

        /* Step Navigation */
        .step-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .prev-button,
        .next-button,
        .submit-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 25px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .prev-button {
          background: #f3f4f6;
          color: #4b5563;
        }

        .prev-button:hover {
          background: #e5e7eb;
        }

        .next-button {
          background: #818cf8;
          color: white;
        }

        .next-button:hover {
          background: #6366f1;
        }

        .submit-button {
          background: #10b981;
          color: white;
        }

        .submit-button:hover:not(:disabled) {
          background: #059669;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Review Section */
        .review-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
          margin-bottom: 30px;
        }

        .review-section {
          background: #f9fafb;
          border-radius: 16px;
          padding: 20px;
        }

        .review-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          color: #4b5563;
          margin: 0 0 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .review-content {
          display: flex;
          gap: 20px;
        }

        .review-photo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid white;
          box-shadow: 0 5px 10px rgba(0,0,0,0.1);
        }

        .review-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-details {
          flex: 1;
        }

        .review-details p {
          margin: 8px 0;
          color: #4b5563;
          font-size: 0.95rem;
        }

        .review-details strong {
          color: #1f2937;
          min-width: 100px;
          display: inline-block;
        }

        .review-text {
          margin-bottom: 15px;
        }

        .review-text strong {
          display: block;
          margin-bottom: 5px;
          color: #1f2937;
        }

        .review-text p {
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .eligibility-summary {
          grid-column: span 2;
        }

        .eligibility-meter {
          position: relative;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          margin: 15px 0;
        }

        .meter-fill {
          height: 100%;
          background: linear-gradient(90deg, #818cf8, #6366f1);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .eligibility-meter span {
          position: absolute;
          right: 0;
          top: -20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #818cf8;
        }

        .eligible-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 15px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .ineligible-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 15px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        /* Terms Section */
        .terms-section {
          margin: 30px 0;
          padding: 20px;
          background: #f9fafb;
          border-radius: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          color: #4b5563;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid #d1d5db;
          cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .sidebar {
            width: 240px;
          }
          .main-content {
            margin-left: 240px;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            height: auto;
            position: static;
          }
          .main-content {
            margin-left: 0;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
          }
          .photo-upload-section {
            flex-direction: column;
            text-align: center;
          }
          .review-grid {
            grid-template-columns: 1fr;
          }
          .eligibility-summary {
            grid-column: span 1;
          }
          .approved-stats {
            grid-template-columns: 1fr;
          }
          .details-grid {
            grid-template-columns: 1fr;
          }
          .approved-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}