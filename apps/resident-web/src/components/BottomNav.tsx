'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/invoices', label: 'Bills' },
  { href: '/visitors', label: 'Visitors' },
  { href: '/notices', label: 'Notices' },
  { href: '/more', label: 'More' },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return (
    <nav className="nav" aria-label="Primary">
      {LINKS.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? 'active' : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
