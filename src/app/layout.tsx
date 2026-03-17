import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionSwitcher } from "@/components/SessionSwitcher";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Industrial Collaborative Revision",
  description: "Real-time collaborative document revision status tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} font-mono antialiased bg-zinc-950 text-zinc-100`}
      >
        <main className="min-h-screen">
          {children}
        </main>
        <SessionSwitcher />
      </body>
    </html>
  );
}
