'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

type Building = { id: string; name: string };
type Unit = {
  id: string;
  number: string;
  floor: string | null;
  building: Building;
};

export default function UnitsPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [b, u] = await Promise.all([api<Building[]>('/buildings'), api<Unit[]>('/units')]);
      setBuildings(b);
      setUnits(u);
      if (!buildingId && b[0]) setBuildingId(b[0].id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/units', {
        method: 'POST',
        body: JSON.stringify({ buildingId, number, floor: floor || undefined }),
      });
      setNumber('');
      setFloor('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Units"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Units' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Add unit">
          <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="building">
                Building
              </label>
              <select
                id="building"
                className={fieldClass}
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                required
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="number">
                Unit number
              </label>
              <input
                id="number"
                className={fieldClass}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="floor">
                Floor (optional)
              </label>
              <input
                id="floor"
                className={fieldClass}
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary} disabled={!buildingId}>
              Add
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Units">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <th className="px-1 py-3 font-medium">Building</th>
                  <th className="px-1 py-3 font-medium">Number</th>
                  <th className="px-1 py-3 font-medium">Floor</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-1 py-3 text-gray-800 dark:text-white/90">{u.building.name}</td>
                    <td className="px-1 py-3 text-gray-500">{u.number}</td>
                    <td className="px-1 py-3 text-gray-500">{u.floor ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
