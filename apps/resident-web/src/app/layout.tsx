import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BottomNav } from '../components/BottomNav';
import { RegisterSw } from '../components/RegisterSw';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resident Portal | UrbanGate',
  description: 'UrbanGate 2.0 Resident Portal',
  applicationName: 'UrbanGate Resident',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UrbanGate',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1f7a4d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterSw />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
