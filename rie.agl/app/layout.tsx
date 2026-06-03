import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RIE AGL – ATS Dashboard',
  description: 'AI-powered applicant tracking & recruitment intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
