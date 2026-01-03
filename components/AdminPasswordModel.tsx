// components/AdminPasswordModal.tsx
"use client";

import { useState } from "react";

export default function AdminPasswordModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (password: string) => void;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Confirm Admin Action</h3>
        <p style={{ margin: "10px 0 20px", fontSize: "1rem", color: "#ccc" }}>
          Enter your admin password to proceed
        </p>
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <div className="buttons">
          <button onClick={() => onConfirm(password)}>Confirm</button>
          <button onClick={onClose} className="cancel">
            Cancel
          </button>
        </div>
      </div>

      <style jsx>{`
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
          max-width: 420px;
          text-align: center;
          color: white;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          border: 2px solid #36d1dc;
        }
        h3 {
          margin: 0 0 10px 0;
          font-size: 1.8rem;
          color: #36d1dc;
        }
        input {
          width: 100%;
          padding: 14px;
          margin: 20px 0;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 1.1rem;
        }
        input::placeholder {
          color: #ccc;
        }
        .buttons {
          display: flex;
          gap: 15px;
          margin-top: 10px;
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
      `}</style>
    </div>
  );
}