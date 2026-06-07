import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RIE AGL — Resume Intelligent Evaluator | Africa Global Logistics",
  description:
    "AI-powered recruitment platform for Africa Global Logistics. Automates CV screening, ATS scoring, and candidate ranking across 51 countries.",
  keywords: ["recruitment", "AGL", "Africa Global Logistics", "AI screening", "ATS"],
  openGraph: {
    title: "RIE AGL — Resume Intelligent Evaluator",
    description: "AI-powered recruitment platform for Africa Global Logistics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
