'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Unit = { id: string; number: string; building?: { name: string } };
type Vehicle = {
  id: string;
  registrationNumber: string;
  type: string;
  makeModel: string | null;
  ownerName: string | null;
};

export default function VehiclesPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [type, setType] = useState('CAR');
  const [makeModel, setMakeModel] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [u, v] = await Promise.all([api<Unit[]>('/units'), api<Vehicle[]>('/vehicles')]);
    setUnits(u);
    setVehicles(v);
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
      await api('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          registrationNumber,
          type,
          makeModel: makeModel || undefined,
          unitId: unitId || undefined,
        }),
      });
      setRegistrationNumber('');
      setMakeModel('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  return (
    <main className="shell">
      <p className="eyebrow">Parking</p>
      <h1>Vehicles</h1>
      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={(e) => void onCreate(e)} className="card" style={{ marginTop: '1rem' }}>
        <h2>Register vehicle</h2>
        <label>
          Registration
          <input
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
          />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {['CAR', 'BIKE', 'SCOOTER', 'OTHER'].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Make / model
          <input value={makeModel} onChange={(e) => setMakeModel(e.target.value)} />
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
        <button type="submit">Save</button>
      </form>

      {vehicles.map((v) => (
        <article key={v.id} className="card">
          <h3>{v.registrationNumber}</h3>
          <p className="meta">
            {v.type} · {v.makeModel || '—'}
          </p>
        </article>
      ))}
    </main>
  );
}
