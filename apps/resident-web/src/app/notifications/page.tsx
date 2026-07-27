'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setRows(await api<Notification[]>('/notifications'));
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [router]);

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: 'POST' });
    await load();
  }

  return (
    <main className="shell">
      <p className="eyebrow">Alerts</p>
      <h1>Notifications</h1>
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginTop: '1rem' }}>
        {rows.map((n) => (
          <article key={n.id} className="card">
            <div className="row">
              <div>
                <h3>{n.title}</h3>
                <p className="meta">{new Date(n.createdAt).toLocaleString()}</p>
                {n.body ? <p style={{ margin: '0.4rem 0 0' }}>{n.body}</p> : null}
              </div>
              {!n.readAt ? (
                <button type="button" className="secondary" onClick={() => void markRead(n.id)}>
                  Mark read
                </button>
              ) : (
                <span className="badge">Read</span>
              )}
            </div>
          </article>
        ))}
        {rows.length === 0 && !error ? <p className="muted">No notifications.</p> : null}
      </div>
    </main>
  );
}
