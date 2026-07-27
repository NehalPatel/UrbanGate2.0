'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Unit = { id: string; number: string; building?: { name: string } };
type Member = {
  id: string;
  unitId: string;
  name: string;
  relation: string;
  mobile: string | null;
};

export default function HouseholdPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [unitId, setUnitId] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('FAMILY');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [u, m] = await Promise.all([
      api<Unit[]>('/units'),
      api<Member[]>('/household-members'),
    ]);
    setUnits(u);
    setMembers(m);
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
      await api('/household-members', {
        method: 'POST',
        body: JSON.stringify({
          unitId,
          name,
          relation,
          mobile: mobile || undefined,
        }),
      });
      setName('');
      setMobile('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  return (
    <main className="shell">
      <p className="eyebrow">Home</p>
      <h1>Household</h1>
      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={(e) => void onCreate(e)} className="card" style={{ marginTop: '1rem' }}>
        <h2>Add member</h2>
        <label>
          Unit
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.building?.name ? `${u.building.name} / ` : ''}
                {u.number}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Relation
          <input value={relation} onChange={(e) => setRelation(e.target.value)} />
        </label>
        <label>
          Mobile
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </label>
        <button type="submit">Save</button>
      </form>

      {members.map((m) => {
        const unit = units.find((u) => u.id === m.unitId);
        return (
          <article key={m.id} className="card">
            <h3>{m.name}</h3>
            <p className="meta">
              {m.relation}
              {unit ? ` · ${unit.building?.name ?? ''} ${unit.number}` : ''}
              {m.mobile ? ` · ${m.mobile}` : ''}
            </p>
          </article>
        );
      })}
    </main>
  );
}
