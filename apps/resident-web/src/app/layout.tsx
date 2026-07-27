import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BottomNav } from '../components/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resident Portal | UrbanGate',
  description: 'UrbanGate 2.0 Resident Portal',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
