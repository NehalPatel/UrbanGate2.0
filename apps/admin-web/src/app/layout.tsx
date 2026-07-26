import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Outfit } from 'next/font/google';
import { AppShell } from '../components/app-shell';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit-family',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Society Admin | UrbanGate',
  description: 'UrbanGate 2.0 Society Admin',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-outfit`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
