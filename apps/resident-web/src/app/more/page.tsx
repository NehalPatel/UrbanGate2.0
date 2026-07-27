'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import type { MeResponse } from '../../lib/auth';

const LINKS = [
  { href: '/complaints', label: 'Complaints', hint: 'Raise and track issues' },
  { href: '/amenities', label: 'Amenities', hint: 'Book facilities' },
  { href: '/meetings', label: 'Meetings', hint: 'Society calendar' },
  { href: '/household', label: 'Household', hint: 'Family members' },
  { href: '/vehicles', label: 'Vehicles', hint: 'Parking registry' },
  { href: '/emergency', label: 'Emergency', hint: 'Important contacts' },
  { href: '/notifications', label: 'Notifications', hint: 'Alerts inbox' },
];

export default function MorePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const me = await api<MeResponse>('/auth/me');
        setProfile({ name: me.user.name, email: me.user.email });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
        }
      }
    })();
  }, [router]);

  return (
    <main className="shell">
      <p className="eyebrow">More</p>
      <h1>Services</h1>
      {profile ? (
        <div className="card">
          <h3>{profile.name}</h3>
          <p className="meta">{profile.email}</p>
        </div>
      ) : null}
      <div className="stack">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="card row">
            <div>
              <h3>{l.label}</h3>
              <p className="meta">{l.hint}</p>
            </div>
            <span className="badge">Open</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
