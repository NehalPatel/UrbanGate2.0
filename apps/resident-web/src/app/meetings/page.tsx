'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Meeting = {
  id: string;
  title: string;
  agenda: string;
  scheduledAt: string;
  location: string | null;
  status: string;
};

export default function MeetingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Meeting[]>('/meetings'));
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
      <h1>Meetings</h1>
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginTop: '1rem' }}>
        {rows.map((m) => (
          <article key={m.id} className="card">
            <div className="row">
              <div>
                <h3>{m.title}</h3>
                <p className="meta">{new Date(m.scheduledAt).toLocaleString()}</p>
                {m.location ? <p className="meta">{m.location}</p> : null}
              </div>
              <span className="badge">{m.status}</span>
            </div>
            <p style={{ margin: '0.5rem 0 0' }}>{m.agenda}</p>
          </article>
        ))}
        {rows.length === 0 && !error ? <p className="muted">No meetings scheduled.</p> : null}
      </div>
    </main>
  );
}
