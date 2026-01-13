"use client";
import { useState } from "react";

export default function AdminPasswordModel({
  onConfirm,
  onClose,
}: {
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    if (!password.trim()) return alert("Password required");

    setLoading(true);
    await onConfirm(password);
    setLoading(false);
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={title}>Admin Confirmation</h3>

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          style={input}
        />

        <div style={buttonRow}>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              ...confirmBtn,
              ...(loading ? disabledBtn : {}),
            }}
          >
            {loading ? "Processing..." : "Confirm"}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              ...cancelBtn,
              ...(loading ? disabledBtn : {}),
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== STYLES ONLY ===================== */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal: React.CSSProperties = {
  background: "linear-gradient(180deg, #1e3a52, #162b3c)",
  padding: "28px",
  borderRadius: "18px",
  width: "100%",
  maxWidth: "380px",
  textAlign: "center",
  boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
  border: "2px solid #36d1dc",
};

const title: React.CSSProperties = {
  marginBottom: "18px",
  color: "#e0f7ff",
  fontWeight: 700,
  fontSize: "20px",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #36d1dc",
  outline: "none",
  fontSize: "15px",
  marginBottom: "18px",
  background: "#0f2533",
  color: "#ffffff",
};

const buttonRow: React.CSSProperties = {
  display: "flex",
  gap: "12px",
};

const confirmBtn: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
  color: "#000",
};

const cancelBtn: React.CSSProperties = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  background: "#3a4b59",
  color: "#fff",
};

const disabledBtn: React.CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};
