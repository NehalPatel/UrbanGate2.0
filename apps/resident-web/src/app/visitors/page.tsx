'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Unit = { id: string; number: string; building?: { name: string } };
type Visitor = {
  id: string;
  name: string;
  mobile: string;
  status: string;
  category: string;
  purpose: string | null;
};

export default function VisitorsPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [purpose, setPurpose] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [u, v] = await Promise.all([api<Unit[]>('/units'), api<Visitor[]>('/visitors')]);
    setUnits(u);
    setVisitors(v);
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
      await api('/visitors', {
        method: 'POST',
        body: JSON.stringify({
          name,
          mobile,
          purpose: purpose || undefined,
          unitId: unitId || undefined,
          preApproved: true,
          category: 'GUEST',
        }),
      });
      setName('');
      setMobile('');
      setPurpose('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function approve(id: string) {
    await api(`/visitors/${id}/approve`, { method: 'POST' });
    await load();
  }

  async function reject(id: string) {
    await api(`/visitors/${id}/reject`, { method: 'POST' });
    await load();
  }

  return (
    <main className="shell">
      <p className="eyebrow">Gate</p>
      <h1>Visitors</h1>
      <p className="muted">Pre-approve guests or respond to requests</p>
      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={(e) => void onCreate(e)} className="card" style={{ marginTop: '1rem' }}>
        <h2>Invite visitor</h2>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Mobile
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
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
        <label>
          Purpose
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </label>
        <button type="submit">Pre-approve</button>
      </form>

      <h2>Recent</h2>
      {visitors.map((v) => (
        <article key={v.id} className="card">
          <div className="row">
            <div>
              <h3>{v.name}</h3>
              <p className="meta">
                {v.status} · {v.category} · {v.mobile}
              </p>
              {v.purpose ? <p className="meta">{v.purpose}</p> : null}
            </div>
            <span className="badge">{v.status}</span>
          </div>
          {v.status === 'REQUESTED' ? (
            <div className="row" style={{ marginTop: '0.75rem' }}>
              <button type="button" onClick={() => void approve(v.id)}>
                Approve
              </button>
              <button type="button" className="secondary" onClick={() => void reject(v.id)}>
                Reject
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </main>
  );
}
