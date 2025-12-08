// app/layout.tsx
import './globals.css';
import React from "react";

export const metadata = {
  title: "Student Election",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">     
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
