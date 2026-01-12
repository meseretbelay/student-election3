import "./globals.css";
import type { Viewport } from "next";

export const metadata = {
  title: "Student Election System",
  description: "Online voting system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* ADD IT HERE 👇 */}
      <body className="text-sm md:text-base">
        {children}
      </body>
    </html>
  );
}
