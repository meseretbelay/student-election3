"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { 
  User, 
  LogOut, 
  Edit, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Award,
  Shield,
  Mail,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function CandidateDashboard() {
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          text: 'Approved',
          message: 'Your profile is approved and visible to voters'
        };
      case 'pending':
        return {
          icon: Clock,
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          text: 'Pending Review',
          message: 'Your application is under review by the admin'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          text: 'Rejected',
          message: 'Your application was not approved. Please update your criteria and resubmit.'
        };
      default:
        return {
          icon: AlertCircle,
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.1)',
          text: 'Unknown',
          message: 'Status unknown'
        };
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="page">
        <div className="background-pattern"></div>
        <div className="container">
          <div className="logo-wrapper">
            <div className="logo-glow"></div>
            <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
          </div>
          
          <div className="content-card">
            <div className="icon-wrapper warning">
              <AlertCircle size={48} />
            </div>
            
            <h1 className="title">No Profile Found</h1>
            <p className="subtitle">You need to complete your candidate registration to access the dashboard.</p>
            
            <div className="action-buttons">
              <Link href="/candidate/register" className="btn-primary">
                <User size={20} />
                <span>Register as Candidate</span>
              </Link>
              
              <button onClick={logout} className="btn-secondary">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
          }
          
          .container {
            max-width: 500px;
            width: 100%;
            position: relative;
            z-index: 1;
          }
          
          .logo-wrapper {
            position: relative;
            width: 180px;
            height: 180px;
            margin: 0 auto 30px;
          }
          
          .logo-glow {
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .logo {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            object-fit: cover;
            position: relative;
            z-index: 1;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          
          .content-card {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 30px;
            padding: 40px 30px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            text-align: center;
          }
          
          .icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 25px;
          }
          
          .icon-wrapper.warning {
            background: #fef3c7;
            color: #d97706;
          }
          
          .title {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
          }
          
          .subtitle {
            font-size: 1.1rem;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          
          .action-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .btn-primary, .btn-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px 24px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            text-decoration: none;
            width: 100%;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }
          
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
          }
          
          .btn-secondary {
            background: white;
            color: #4b5563;
            border: 2px solid #e5e7eb;
          }
          
          .btn-secondary:hover {
            background: #f9fafb;
            border-color: #d1d5db;
          }
          
          @media (max-width: 640px) {
            .content-card {
              padding: 30px 20px;
            }
            .title {
              font-size: 1.75rem;
            }
            .logo-wrapper {
              width: 140px;
              height: 140px;
            }
          }
        `}</style>
      </div>
    );
  }

  const statusConfig = getStatusConfig(candidate.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="page">
      <div className="background-pattern"></div>
      
      <div className="container">
        {/* Header with Logo */}
        <div className="header">
          <div className="logo-wrapper">
            <div className="logo-glow"></div>
            <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
          </div>
          <h1 className="greeting">Welcome back,</h1>
          <h2 className="user-name">{candidate.name}</h2>
        </div>

        {/* Status Card */}
        <div className="status-card" style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.color }}>
          <div className="status-icon" style={{ color: statusConfig.color }}>
            <StatusIcon size={32} />
          </div>
          <div className="status-content">
            <span className="status-label" style={{ color: statusConfig.color }}>Status</span>
            <span className="status-value" style={{ color: statusConfig.color }}>{statusConfig.text}</span>
            <p className="status-message">{statusConfig.message}</p>
          </div>
        </div>

        {/* Candidate Info Card */}
        <div className="info-card">
          <h3 className="info-title">
            <UserCheck size={20} />
            <span>Candidate Information</span>
          </h3>
          
          <div className="info-grid">
            {candidate.email && (
              <div className="info-item">
                <Mail size={18} className="info-icon" />
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-value">{candidate.email}</span>
                </div>
              </div>
            )}
            
            {candidate.department && (
              <div className="info-item">
                <Shield size={18} className="info-icon" />
                <div>
                  <span className="info-label">Department</span>
                  <span className="info-value">{candidate.department}</span>
                </div>
              </div>
            )}
            
            {candidate.position && (
              <div className="info-item">
                <Award size={18} className="info-icon" />
                <div>
                  <span className="info-label">Position</span>
                  <span className="info-value">{candidate.position}</span>
                </div>
              </div>
            )}
            
            {candidate.createdAt && (
              <div className="info-item">
                <Calendar size={18} className="info-icon" />
                <div>
                  <span className="info-label">Registered</span>
                  <span className="info-value">
                    {new Date(candidate.createdAt.toDate()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          {candidate.status !== "approved" && (
            <Link href="/candidate/criteria" className="btn-action">
              <Edit size={20} />
              <span>Edit Application</span>
            </Link>
          )}
          
          <button onClick={logout} className="btn-logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {/* Approved Message */}
        {candidate.status === "approved" && (
          <div className="approved-banner">
            <CheckCircle size={24} />
            <p>Your profile is now visible to voters! Good luck with your campaign.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 30px 20px;
        }
        
        .background-pattern {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(45deg, transparent 65%, rgba(255,255,255,0.05) 100%);
          background-size: 50px 50px, 100% 100%;
          pointer-events: none;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        
        /* Header Styles */
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .logo-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 20px;
        }
        
        .logo-glow {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .logo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          object-fit: cover;
          position: relative;
          z-index: 1;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        .greeting {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 5px;
          font-weight: 400;
        }
        
        .user-name {
          font-size: 2.5rem;
          color: white;
          margin: 0;
          font-weight: 700;
          text-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        /* Status Card */
        .status-card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 30px;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 25px;
          border-left: 6px solid;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .status-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .status-content {
          flex: 1;
        }
        
        .status-label {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
          opacity: 0.7;
        }
        
        .status-value {
          font-size: 1.8rem;
          font-weight: 700;
          display: block;
          margin-bottom: 8px;
        }
        
        .status-message {
          font-size: 1rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.5;
        }
        
        /* Info Card */
        .info-card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 30px;
          margin-bottom: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .info-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.3rem;
          color: #1f2937;
          margin-top: 0;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .info-icon {
          color: #667eea;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .info-item div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-label {
          font-size: 0.85rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 1.1rem;
          color: #1f2937;
          font-weight: 500;
        }
        
        /* Action Section */
        .action-section {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .btn-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
        }
        
        .btn-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 30px;
          background: white;
          color: #4b5563;
          border: 2px solid #e5e7eb;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-logout:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        
        /* Approved Banner */
        .approved-banner {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          color: white;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        
        .approved-banner p {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
          .user-name {
            font-size: 2rem;
          }
          
          .status-card {
            flex-direction: column;
            text-align: center;
            padding: 25px;
          }
          
          .status-value {
            font-size: 1.5rem;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .action-section {
            flex-direction: column;
          }
          
          .btn-action, .btn-logout {
            width: 100%;
          }
          
          .logo-wrapper {
            width: 100px;
            height: 100px;
          }
        }
      `}</style>
    </div>
  );
}