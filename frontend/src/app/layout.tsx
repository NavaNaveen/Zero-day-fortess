import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🛡️ Zero Day Fortress",
  description: "Autonomous Red Team vs Blue Team AI Cyber Defense",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="scanline min-h-screen bg-[#0a0a0f] antialiased">{children}</body>
    </html>
  );
}
