'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Emergency = { id: string; label: string; phone: string; category: string };

export default function EmergencyPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Emergency[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Emergency[]>('/emergency-contacts'));
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
      <p className="eyebrow">Safety</p>
      <h1>Emergency contacts</h1>
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginTop: '1rem' }}>
        {rows.map((c) => (
          <article key={c.id} className="card row">
            <div>
              <h3>{c.label}</h3>
              <p className="meta">{c.category}</p>
            </div>
            <a className="btn secondary" href={`tel:${c.phone}`}>
              {c.phone}
            </a>
          </article>
        ))}
        {rows.length === 0 && !error ? <p className="muted">No contacts listed.</p> : null}
      </div>
    </main>
  );
}
