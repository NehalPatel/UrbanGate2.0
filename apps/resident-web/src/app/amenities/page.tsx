'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Amenity = { id: string; name: string; fee: string; slotMinutes: number; active: boolean };
type Booking = {
  id: string;
  amenityId: string;
  startAt: string;
  endAt: string;
  status: string;
  fee: string;
};
type Unit = { id: string; number: string; building?: { name: string } };

export default function AmenitiesPage() {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [amenityId, setAmenityId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [a, b, u] = await Promise.all([
      api<Amenity[]>('/amenities'),
      api<Booking[]>('/bookings'),
      api<Unit[]>('/units'),
    ]);
    const active = a.filter((x) => x.active);
    setAmenities(active);
    setBookings(b);
    setUnits(u);
    if (!amenityId && active[0]) setAmenityId(active[0].id);
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

  async function onBook(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          amenityId,
          unitId: unitId || undefined,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        }),
      });
      setStartAt('');
      setEndAt('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking failed');
    }
  }

  async function cancel(id: string) {
    await api(`/bookings/${id}/cancel`, { method: 'POST' });
    await load();
  }

  return (
    <main className="shell">
      <p className="eyebrow">Facilities</p>
      <h1>Amenities</h1>
      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={(e) => void onBook(e)} className="card" style={{ marginTop: '1rem' }}>
        <h2>New booking</h2>
        <label>
          Amenity
          <select value={amenityId} onChange={(e) => setAmenityId(e.target.value)} required>
            {amenities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · ₹{a.fee}
              </option>
            ))}
          </select>
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
          Start
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
          />
        </label>
        <button type="submit">Book</button>
      </form>

      <h2>My bookings</h2>
      {bookings.map((b) => {
        const amenity = amenities.find((a) => a.id === b.amenityId);
        return (
          <article key={b.id} className="card">
            <div className="row">
              <div>
                <h3>{amenity?.name ?? 'Amenity'}</h3>
                <p className="meta">
                  {new Date(b.startAt).toLocaleString()} → {new Date(b.endAt).toLocaleString()}
                </p>
                <p className="meta">₹{b.fee}</p>
              </div>
              <span className="badge">{b.status}</span>
            </div>
            {b.status === 'CONFIRMED' || b.status === 'REQUESTED' ? (
              <button
                type="button"
                className="secondary"
                style={{ marginTop: '0.75rem' }}
                onClick={() => void cancel(b.id)}
              >
                Cancel
              </button>
            ) : null}
          </article>
        );
      })}
    </main>
  );
}
