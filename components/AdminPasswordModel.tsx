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
        <h3>Admin Password</h3>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="buttons">
          <button onClick={() => onConfirm(password)}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal {
          background: #1c3c53;
          padding: 30px;
          border-radius: 16px;
          text-align: center;
          color: white;
        }
        input {
          width: 100%;
          padding: 10px;
          margin: 15px 0;
          border-radius: 8px;
          border: none;
        }
        .buttons {
          display: flex;
          gap: 10px;
        }
        button {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
