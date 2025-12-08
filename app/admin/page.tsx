"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  function login() {
    if(password !== "admin123") return alert("Wrong admin password ❌");
    localStorage.setItem("admin", "true");
    router.push("/admin/dashboard");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Login</h1>
      <input
        type="password"
        placeholder="Admin Password"
        onChange={e => setPassword(e.target.value)}
        style={{ padding: "10px", marginRight: "10px" }}
      />
      <button onClick={login} style={{ padding: "10px 20px" }}>Login</button>
    </div>
  );
}
