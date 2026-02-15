// app/page.tsx (Welcome/Landing Page)

"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sections = [
    {
      title: "Student Section",
      description: "Vote for your favorite candidates or register to participate.",
      icon: "👨‍🎓",
      color: "#36d1dc",
      gradient: "linear-gradient(135deg, #36d1dc, #5b86e5)",
      buttons: [
        { label: "Login", path: "/login", type: "login" },
        { label: "Register", path: "/register", type: "register" }
      ],
      stats: ["Active Voting"] // Removed "1,200+ Students"
    },
    {
      title: "Candidate Section",
      description: "Run for office, submit your criteria, and manage your campaign.",
      icon: "🗳️",
      color: "#ffd700",
      gradient: "linear-gradient(135deg, #ffd700, #ffa500)",
      buttons: [
        { label: "Login", path: "/candidate/login", type: "login" },
        { label: "Register", path: "/candidate/register", type: "register" }
      ],
      stats: ["Apply Now"] // Removed "50+ Candidates"
    },
    {
      title: "Admin Section",
      description: "Manage elections, approve candidates, and monitor results.",
      icon: "👑",
      color: "#ff4444",
      gradient: "linear-gradient(135deg, #ff4444, #cc0000)",
      buttons: [
        { label: "Login", path: "/admin/login", type: "login" }
      ],
      stats: ["Full Control"] // Removed "Secure Access"
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { 
      y: 30, 
      opacity: 0 
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Simple static version for initial render
  if (!mounted) {
    return (
      <div className="welcome-page">
        <div className="content">
          {/* Header with divider line */}
          <div className="header">
            <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
            <h1>MAU Student Election System</h1>
            <div className="header-divider"></div>
            <p className="subtitle">Your Voice, Your Choice, Your Future</p>
          </div>

          {/* Stats Bar - Horizontal */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">2026</span>
              <span className="stat-label">Election Year</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">Active</span>
              <span className="stat-label">Status</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">Vote</span>
              <span className="stat-label">Your Right</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      {/* New Background - Dark gradient with subtle pattern */}
      <div className="background">
        <div className="gradient-overlay"></div>
        <div className="pattern-dots"></div>
        <div className="pattern-lines"></div>
      </div>

      {/* Main Content */}
      <div className="content">
        {/* Header Section - Static */}
        <div className="header">
          <img src="/images/mau.jpg" alt="MAU Logo" className="logo" />
          <h1>MAU Student Election System</h1>
          <div className="header-divider"></div>
          <p className="subtitle">Your Voice, Your Choice, Your Future</p>
        </div>

        {/* Stats Bar - Horizontal */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">2026</span>
            <span className="stat-label">Election Year</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">Active</span>
            <span className="stat-label">Status</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">Vote</span>
            <span className="stat-label">Your Right</span>
          </div>
        </div>

        {/* Sections Grid - Horizontal, Far Apart */}
        <motion.div 
          className="sections"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              className="section-wrapper"
              variants={itemVariants}
              whileHover={{ 
                y: -5,
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <div 
                className="section-card"
                style={{ 
                  borderTop: `3px solid ${section.color}`
                }}
              >
                {/* Icon */}
                <div className="card-icon">
                  <span className="icon">{section.icon}</span>
                </div>

                {/* Content */}
                <h2 style={{ color: section.color }}>{section.title}</h2>
                <p className="description">{section.description}</p>
                
                {/* Stats - Single stat per card now */}
                <div className="card-stats">
                  {section.stats.map((stat, idx) => (
                    <div key={idx} className="card-stat">
                      <span className="stat-dot" style={{ background: section.color }}></span>
                      <span>{stat}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="card-buttons">
                  {section.buttons.map((button) => (
                    <Link key={button.path} href={button.path}>
                      <motion.button
                        className={`card-btn ${button.type}`}
                        style={button.type === 'login' ? { background: section.gradient } : {}}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {button.label}
                      </motion.button>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="footer">
          <p>© 2026 MAU Student Election System. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .welcome-page {
          min-height: 100vh;
          position: relative;
          color: #fff;
        }

        /* New Background - Dark with subtle patterns */
        .background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          background: #0a0f1a;
        }

        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 30%, rgba(54, 209, 220, 0.05) 0%, transparent 40%),
                      radial-gradient(circle at 80% 70%, rgba(255, 215, 0, 0.05) 0%, transparent 40%),
                      radial-gradient(circle at 40% 80%, rgba(255, 68, 68, 0.05) 0%, transparent 40%);
        }

        .pattern-dots {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .pattern-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0px, rgba(255, 255, 255, 0.02) 1px, transparent 1px, transparent 20px);
        }

        .content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        /* Header - Static */
        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid #36d1dc;
          box-shadow: 0 10px 30px rgba(54, 209, 220, 0.3);
          object-fit: cover;
          margin-bottom: 15px;
        }

        h1 {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #fff;
          letter-spacing: 1px;
        }

        .header-divider {
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, #36d1dc, #5b86e5);
          margin: 15px auto;
          border-radius: 3px;
        }

        .subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* Stats Bar - Horizontal */
        .stats-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          margin: 30px auto 50px;
          padding: 15px 30px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: fit-content;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 600;
          color: #36d1dc;
        }

        .stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Sections - Horizontal, Far Apart */
        .sections {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin: 40px 0 60px;
          flex-wrap: wrap;
        }

        .section-wrapper {
          flex: 0 0 300px;
        }

        .section-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 30px 20px;
          text-align: center;
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .section-card:hover {
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .section-card h2 {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 20px;
          min-height: 60px;
        }

        .card-stats {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .card-stat {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.03);
          padding: 5px 15px;
          border-radius: 20px;
        }

        .stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .card-buttons {
          display: flex;
          gap: 10px;
          margin-top: auto;
        }

        .card-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .card-btn.login {
          background: linear-gradient(135deg, #36d1dc, #5b86e5);
        }

        .card-btn.register {
          background: linear-gradient(135deg, #ffd700, #ffa500);
        }

        .footer {
          text-align: center;
          padding: 20px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
        }

        /* Mobile Responsive */
        @media (max-width: 1024px) {
          .sections {
            gap: 30px;
          }
          
          .section-wrapper {
            flex: 0 0 280px;
          }
        }

        @media (max-width: 900px) {
          .sections {
            gap: 20px;
          }
        }

        @media (max-width: 768px) {
          .content {
            padding: 20px 15px;
          }

          .logo {
            width: 100px;
            height: 100px;
          }

          h1 {
            font-size: 1.8rem;
          }

          .stats-bar {
            gap: 20px;
            padding: 12px 20px;
            flex-wrap: wrap;
          }

          .stat-item {
            min-width: 60px;
          }

          .sections {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }

          .section-wrapper {
            flex: 0 0 auto;
            width: 100%;
            max-width: 350px;
          }

          .section-card {
            padding: 25px 15px;
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 1.5rem;
          }

          .logo {
            width: 90px;
            height: 90px;
          }

          .stats-bar {
            flex-direction: row;
            gap: 10px;
          }

          .stat-divider {
            display: none;
          }

          .card-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}