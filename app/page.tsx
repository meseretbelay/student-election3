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
      title: "Student Portal",
      description: "Cast your vote securely and view election updates in real-time.",
      icon: (
        <svg className="section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor"/>
        </svg>
      ),
      color: "#2563eb",
      lightColor: "#3b82f6",
      buttons: [
        { label: "Login", path: "/login", type: "primary" },
        { label: "Register", path: "/register", type: "secondary" }
      ],
      features: ["Secure Voting", "Real-time Results", "Voter Dashboard"]
    },
    {
      title: "Candidate Hub",
      description: "Launch your campaign, share your vision, and connect with voters.",
      icon: (
        <svg className="section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-1.8C18 6.57 15.35 4 12 4s-6 2.57-6 6.2c0 2.34 1.95 5.44 6 9.14 4.05-3.7 6-6.8 6-9.14z" fill="currentColor"/>
        </svg>
      ),
      color: "#7c3aed",
      lightColor: "#8b5cf6",
      buttons: [
        { label: "Login", path: "/candidate/login", type: "primary" },
        { label: "Register", path: "/candidate/register", type: "secondary" }
      ],
      features: ["Campaign Management", "Voter Outreach", "Real-time Analytics"]
    },
    {
      title: "Administration",
      description: "Oversee elections, verify candidates, and ensure fair voting.",
      icon: (
        <svg className="section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
        </svg>
      ),
      color: "#dc2626",
      lightColor: "#ef4444",
      buttons: [
        { label: "Login", path: "/admin/login", type: "primary" }
      ],
      features: ["Election Control", "Candidate Verification", "Result Certification"]
    }
  ];
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };
  // Simple static version for initial render
  if (!mounted) {
    return (
      <div className="landing-page">
        <div className="static-content">
          <nav className="navbar">
            <div className="nav-container">
              <div className="logo-container">
                <img src="/images/mau.jpg" alt="MAU Logo" className="nav-logo" />
              </div>
              <div className="nav-title-container">
                <span className="nav-title">MAU Student Election System</span>
              </div>
              <div className="nav-spacer"></div>
            </div>
          </nav>
          <div className="hero-section">
            <h1>Your Voice, Your Choice, Your Future</h1>
            <p>Empowering democracy through secure and transparent digital voting</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="landing-page">
      {/* Improved Background */}
      <div className="background">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <div className="gradient-orb orb3"></div>
        <div className="gradient-overlay"></div>
        <div className="pattern-overlay"></div>
      </div>
      {/* Navigation - Fixed at top */}
      <nav className="navbar">
        <div className="nav-container">
          <motion.div
            className="logo-container"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src="/images/mau.jpg" alt="MAU Logo" className="nav-logo" />
          </motion.div>
         
          <motion.div
            className="nav-title-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="nav-title">MAU Student Election System</span>
          </motion.div>
         
          <div className="nav-spacer"></div>
        </div>
      </nav>
      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="hero-title">
            Your Voice, Your Choice,
            <span className="hero-gradient"> Your Future</span>
          </h1>
          <p className="hero-subtitle">
            Empowering democracy through secure and transparent digital voting
          </p>
         
          {/* Stats Bar */}
          <div className="stats-container">
            <motion.div
              className="stat-item"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <span className="stat-value">2026</span>
              <span className="stat-label">Election Year</span>
            </motion.div>
            <div className="stat-divider"></div>
            <motion.div
              className="stat-item"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <span className="stat-value">5,000+</span>
              <span className="stat-label">Students</span>
            </motion.div>
            <div className="stat-divider"></div>
            <motion.div
              className="stat-item"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <span className="stat-value">24/7</span>
              <span className="stat-label">Support</span>
            </motion.div>
          </div>
        </motion.div>
        {/* Sections Grid */}
        <motion.div
          className="sections-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              className="section-card"
              variants={itemVariants}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="card-header" style={{ background: `linear-gradient(135deg, ${section.color}15, ${section.lightColor}10)` }}>
                <div className="icon-wrapper" style={{ color: section.color }}>
                  {section.icon}
                </div>
                <h2 style={{ color: section.color }}>{section.title}</h2>
              </div>
             
              <div className="card-body">
                <p className="card-description">{section.description}</p>
               
                <div className="features-list">
                  {section.features.map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <svg className="feature-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="card-actions">
                  {section.buttons.map((button) => (
                    <Link key={button.path} href={button.path}>
                      <motion.button
                        className={`action-btn ${button.type}`}
                        style={button.type === 'primary' ? { background: section.color } : {}}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {button.label}
                        {button.type === 'primary' && (
                          <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="currentColor"/>
                          </svg>
                        )}
                      </motion.button>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {/* Footer */}
        <motion.footer
          className="footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="footer-content">
            <div className="footer-section">
              <h3>MAU Elections 2026</h3>
              <p>Making democracy accessible for everyone</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 MAU Student Election System. All rights reserved.</p>
          </div>
        </motion.footer>
      </main>
      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          position: relative;
          background: #0a0a0f;
          color: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
        }
        /* Improved Background - Lighter for better visibility */
        .background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
        }
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
        }
        .orb1 {
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, #3b82f6, #2563eb);
          top: -200px;
          left: -200px;
          animation: float 25s ease-in-out infinite;
        }
        .orb2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #8b5cf6, #7c3aed);
          bottom: -200px;
          right: -200px;
          animation: float 30s ease-in-out infinite reverse;
        }
        .orb3 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #06b6d4, #0891b2);
          top: 30%;
          left: 40%;
          animation: float 28s ease-in-out infinite;
          opacity: 0.4;
        }
        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(30, 30, 40, 0.8) 100%);
          backdrop-filter: blur(2px);
        }
        .pattern-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
          background-size: 60px 60px;
          opacity: 0.3;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -40px) scale(1.1); }
          50% { transform: translate(80px, 50px) scale(0.9); }
          75% { transform: translate(-40px, 80px) scale(1.05); }
        }
        /* Navigation - Fixed at top */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 15px 0;
          border-bottom: 1px solid rgba(37, 99, 235, 0.2);
          background: rgba(30, 30, 40, 0.95);
          backdrop-filter: blur(10px);
          width: 100%;
        }
        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
        }
        .logo-container {
          justify-self: start;
        }
        .nav-logo {
          width: 90px;
          height: 90px;
          border-radius: 20px;
          object-fit: cover;
          border: 3px solid #2563eb;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
          transition: transform 0.3s ease;
        }
        .nav-logo:hover {
          transform: scale(1.05);
          border-color: #3b82f6;
        }
        .nav-title-container {
          justify-self: center;
          text-align: center;
        }
        .nav-title {
          font-size: 2.5rem;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #60a5fa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
          text-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
        }
        .nav-spacer {
          justify-self: end;
        }
        /* Main Content */
        .main-content {
          position: relative;
          z-index: 5;
          max-width: 1400px;
          margin: 0 auto;
          padding: 120px 40px 40px; /* Increased top padding for fixed navbar */
        }
        /* Hero Section */
        .hero-section {
          text-align: center;
          margin: 40px 0 80px;
        }
        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 25px;
          color: #ffffff;
          text-shadow: 0 0 30px rgba(37, 99, 235, 0.3);
        }
        .hero-gradient {
          background: linear-gradient(135deg, #60a5fa, #c084fc, #38bdf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: block;
          font-size: 3.5rem;
          margin-top: 10px;
          text-shadow: 0 0 40px rgba(37, 99, 235, 0.5);
        }
        .hero-subtitle {
          font-size: 1.4rem;
          color: #cbd5e1;
          max-width: 700px;
          margin: 0 auto 40px;
          line-height: 1.7;
        }
        /* Stats Container */
        .stats-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 50px;
          padding: 25px 50px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 60px;
          border: 1px solid rgba(37, 99, 235, 0.2);
          width: fit-content;
          margin: 0 auto;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #60a5fa;
        }
        .stat-label {
          font-size: 0.9rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .stat-divider {
          width: 1px;
          height: 35px;
          background: rgba(37, 99, 235, 0.3);
        }
        /* Sections Grid */
        .sections-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin: 60px 0;
        }
        .section-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(37, 99, 235, 0.2);
          border-radius: 28px;
          overflow: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .section-card:hover {
          border-color: rgba(37, 99, 235, 0.5);
          box-shadow: 0 20px 40px rgba(37, 99, 235, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }
        .card-header {
          padding: 30px 30px 20px;
          text-align: center;
          border-bottom: 1px solid rgba(37, 99, 235, 0.2);
        }
        .icon-wrapper {
          width: 70px;
          height: 70px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .section-icon {
          width: 100%;
          height: 100%;
        }
        .card-header h2 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .card-body {
          padding: 0 30px 30px;
        }
        .card-description {
          color: #cbd5e1;
          font-size: 1.1rem;
          line-height: 1.7;
          margin: 20px 0;
          text-align: center;
        }
        .features-list {
          margin-bottom: 25px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          font-size: 1.1rem;
          color: #e2e8f0;
        }
        .feature-check {
          width: 22px;
          height: 22px;
          color: #4ade80;
          flex-shrink: 0;
        }
        .card-actions {
          display: flex;
          gap: 15px;
        }
        .action-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 14px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .action-btn.primary {
          color: white;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4);
        }
        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(37, 99, 235, 0.3);
        }
        .action-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .btn-arrow {
          width: 20px;
          height: 20px;
        }
        /* Footer */
        .footer {
          margin-top: 80px;
          padding-top: 40px;
          border-top: 1px solid rgba(37, 99, 235, 0.2);
        }
        .footer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 30px;
          text-align: center;
        }
        .footer-section h3 {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #ffffff;
        }
        .footer-section p {
          color: #94a3b8;
          font-size: 1rem;
        }
        .footer-bottom {
          text-align: center;
          padding: 25px 0;
          color: #64748b;
          font-size: 0.95rem;
          border-top: 1px solid rgba(37, 99, 235, 0.2);
        }
        /* Responsive Design */
        @media (max-width: 1200px) {
          .hero-title {
            font-size: 2.5rem;
          }
         
          .hero-gradient {
            font-size: 3rem;
          }
         
          .card-header h2 {
            font-size: 1.8rem;
          }
        }
        @media (max-width: 1024px) {
          .sections-grid {
            grid-template-columns: repeat(2, 1fr);
          }
         
          .nav-title {
            font-size: 2.2rem;
          }
        }
        @media (max-width: 768px) {
          .main-content {
            padding: 100px 20px 20px;
          }
          .nav-container {
            grid-template-columns: 1fr;
            gap: 15px;
            padding: 0 20px;
          }
          .logo-container {
            justify-self: center;
          }
          .nav-title-container {
            justify-self: center;
          }
          .nav-spacer {
            display: none;
          }
          .nav-title {
            font-size: 1.8rem;
            white-space: normal;
          }
          .nav-logo {
            width: 80px;
            height: 80px;
          }
          .hero-title {
            font-size: 2rem;
          }
          .hero-gradient {
            font-size: 2.4rem;
          }
          .hero-subtitle {
            font-size: 1.2rem;
          }
          .stats-container {
            flex-direction: column;
            gap: 20px;
            padding: 25px;
            border-radius: 30px;
          }
          .stat-divider {
            display: none;
          }
          .sections-grid {
            grid-template-columns: 1fr;
            gap: 25px;
          }
          .footer-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .nav-title {
            font-size: 1.5rem;
          }
          .nav-logo {
            width: 70px;
            height: 70px;
          }
          .hero-title {
            font-size: 1.6rem;
          }
          .hero-gradient {
            font-size: 2rem;
          }
          .hero-subtitle {
            font-size: 1.1rem;
            padding: 0 20px;
          }
          .main-content {
            padding: 90px 20px 20px;
          }
          .stats-container {
            padding: 20px;
          }
          .stat-value {
            font-size: 1.5rem;
          }
          .card-header h2 {
            font-size: 1.6rem;
          }
          .card-description {
            font-size: 1rem;
          }
          .feature-item {
            font-size: 1rem;
          }
          .action-btn {
            font-size: 1rem;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}