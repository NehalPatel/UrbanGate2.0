'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Unit = { id: string; number: string; building?: { name: string } };
type Complaint = {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  description: string;
};

export default function ComplaintsPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [rows, setRows] = useState<Complaint[]>([]);
  const [unitId, setUnitId] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [u, c] = await Promise.all([api<Unit[]>('/units'), api<Complaint[]>('/complaints')]);
    setUnits(u);
    setRows(c);
    if (!unitId && u[0]) setUnitId(u[0].id);
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category,
          subject,
          description,
          unitId: unitId || undefined,
          priority: 'MEDIUM',
        }),
      });
      setSubject('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  return (
    <main className="shell">
      <p className="eyebrow">Community</p>
      <h1>Complaints</h1>
      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={(e) => void onCreate(e)} className="card" style={{ marginTop: '1rem' }}>
        <h2>New complaint</h2>
        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} required />
        </label>
        <label>
          Subject
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <label>
          Unit
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.building?.name ? `${u.building.name} / ` : ''}
                {u.number}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Submit</button>
      </form>

      {rows.map((c) => (
        <article key={c.id} className="card">
          <div className="row">
            <div>
              <h3>{c.subject}</h3>
              <p className="meta">
                {c.category} · {c.priority}
              </p>
            </div>
            <span className="badge">{c.status}</span>
          </div>
          <p style={{ margin: '0.5rem 0 0' }}>{c.description}</p>
        </article>
      ))}
    </main>
  );
}
