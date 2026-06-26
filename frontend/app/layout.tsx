import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";

import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

export const metadata: Metadata = {
  title: "Minute Workspace",
  description: "Local Next.js prototype for the meeting workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={hankenGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
