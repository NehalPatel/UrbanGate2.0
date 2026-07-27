'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Notice = {
  id: string;
  title: string;
  body: string;
  status: string;
  publishedAt: string | null;
};

export default function NoticesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Notice[]>('/notices'));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [router]);

  return (
    <main className="shell">
      <p className="eyebrow">Community</p>
      <h1>Notices</h1>
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginTop: '1rem' }}>
        {rows.map((n) => (
          <article key={n.id} className="card">
            <h3>{n.title}</h3>
            <p className="meta">
              {n.publishedAt ? new Date(n.publishedAt).toLocaleString() : n.status}
            </p>
            <p style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>{n.body}</p>
          </article>
        ))}
        {rows.length === 0 && !error ? <p className="muted">No published notices.</p> : null}
      </div>
    </main>
  );
}
