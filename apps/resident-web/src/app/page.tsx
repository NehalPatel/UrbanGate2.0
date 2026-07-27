'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../lib/api';
import type { MeResponse } from '../lib/auth';

type Invoice = { id: string; outstandingAmount: string; status: string };
type Notice = { id: string; title: string; publishedAt: string | null };
type Visitor = { id: string; name: string; status: string };
type Notification = { id: string; title: string; readAt: string | null };

export default function ResidentHomePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [due, setDue] = useState('0');
  const [noticeTitle, setNoticeTitle] = useState<string | null>(null);
  const [pendingVisitors, setPendingVisitors] = useState(0);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const me = await api<MeResponse>('/auth/me');
        setName(me.user.name);
        const [invoices, notices, visitors, notifications] = await Promise.all([
          api<Invoice[]>('/invoices'),
          api<Notice[]>('/notices'),
          api<Visitor[]>('/visitors'),
          api<Notification[]>('/notifications'),
        ]);
        const outstanding = invoices
          .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
          .reduce((sum, i) => sum + Number(i.outstandingAmount || 0), 0);
        setDue(outstanding.toFixed(2));
        setNoticeTitle(notices[0]?.title ?? null);
        setPendingVisitors(visitors.filter((v) => v.status === 'REQUESTED').length);
        setUnread(notifications.filter((n) => !n.readAt).length);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [router]);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <main className="shell">
      <div className="top">
        <div>
          <p className="eyebrow">UrbanGate</p>
          <h1>Hi{name ? `, ${name.split(' ')[0]}` : ''}</h1>
          <p className="muted">Your society at a glance</p>
        </div>
        <button type="button" className="ghost" onClick={() => void logout()}>
          Log out
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        <Link href="/invoices" className="tile">
          <span>Outstanding</span>
          <strong>₹{due}</strong>
        </Link>
        <Link href="/visitors" className="tile">
          <span>Visitor requests</span>
          <strong>{pendingVisitors}</strong>
        </Link>
        <Link href="/notifications" className="tile">
          <span>Unread alerts</span>
          <strong>{unread}</strong>
        </Link>
        <Link href="/notices" className="tile">
          <span>Latest notice</span>
          <strong>{noticeTitle ? noticeTitle.slice(0, 28) : 'None'}</strong>
        </Link>
      </div>

      <h2 style={{ marginTop: '1.25rem' }}>Quick actions</h2>
      <div className="stack">
        <Link href="/visitors" className="card row">
          <div>
            <h3>Invite a visitor</h3>
            <p className="meta">Pre-approve guests for the gate</p>
          </div>
          <span className="badge">Go</span>
        </Link>
        <Link href="/complaints" className="card row">
          <div>
            <h3>Raise a complaint</h3>
            <p className="meta">Track society issues</p>
          </div>
          <span className="badge">Go</span>
        </Link>
        <Link href="/amenities" className="card row">
          <div>
            <h3>Book an amenity</h3>
            <p className="meta">Clubhouse, courts, and more</p>
          </div>
          <span className="badge">Go</span>
        </Link>
      </div>
    </main>
  );
}
