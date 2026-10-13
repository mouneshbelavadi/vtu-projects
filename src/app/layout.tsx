import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTU Adda Projects",
  description: "Project store for VTU students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
