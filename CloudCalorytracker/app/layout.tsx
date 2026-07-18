import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CloudCaloryTracker',
  description: 'A simple daily calorie and macro tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
