import type { Metadata, Viewport } from 'next';
import { RegisterSw } from '../components/RegisterSw';
import './globals.css';

export const metadata: Metadata = {
  title: 'UrbanGate Security',
  description: 'Gate desk and visitor management',
  applicationName: 'UrbanGate Security',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gate Desk',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#3d9a6a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterSw />
        {children}
      </body>
    </html>
  );
}
