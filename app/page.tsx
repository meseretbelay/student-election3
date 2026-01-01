// app/page.tsx

import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MAU Student Election",
};

export default function HomePage() {
  redirect("/login");

  // Fallback UI (never shown due to instant redirect)
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f2027",
      color: "#36d1dc",
      fontSize: "1.5rem"
    }}>
      Redirecting to login...
    </div>
  );
}