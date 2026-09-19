import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AegisSOC | Autonomous AI Cybersecurity & Incident Investigation",
  description: "Enterprise-grade real-time anomaly detection, MITRE ATT&CK kill-chain reconstruction, autonomous defense mitigation, and continuous learning security platform.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-slate-950 text-slate-100">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}