import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UrbanGate Security',
  description: 'Gate desk and visitor management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
