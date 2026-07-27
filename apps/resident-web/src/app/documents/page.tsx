'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type FileRow = { id: string; originalName: string; sizeBytes: number };
type Doc = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  files: FileRow[];
};

export default function DocumentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Doc[]>('/documents'));
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
      <p className="eyebrow">Library</p>
      <h1>Documents</h1>
      <p className="muted">Society circulars, bylaws, and shared files</p>
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginTop: '1rem' }}>
        {rows.map((d) => (
          <article key={d.id} className="card">
            <div className="row">
              <div>
                <h3>{d.title}</h3>
                <p className="meta">{d.category}</p>
                {d.description ? <p style={{ margin: '0.4rem 0 0' }}>{d.description}</p> : null}
              </div>
              <span className="badge">{d.files.length} file(s)</span>
            </div>
            {d.files.length > 0 ? (
              <ul className="stack" style={{ marginTop: '0.75rem' }}>
                {d.files.map((f) => (
                  <li key={f.id}>
                    <a
                      className="btn secondary"
                      href={`${API_BASE}/attachments/${f.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
        {rows.length === 0 && !error ? <p className="muted">No documents yet.</p> : null}
      </div>
    </main>
  );
}
