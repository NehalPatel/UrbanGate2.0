'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import {
  btnPrimary,
  btnSecondary,
  Card,
  DataTable,
  DeleteIconButton,
  EditIconButton,
  EmptyRow,
  fieldClass,
  labelClass,
  PageHeader,
  RowActions,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';

type Building = { id: string; name: string };
type Unit = {
  id: string;
  number: string;
  floor: string | null;
  buildingId: string;
  building: Building;
};

export default function UnitsPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function startEdit(u: Unit) {
    setEditingId(u.id);
    setBuildingId(u.buildingId || u.building.id);
    setNumber(u.number);
    setFloor(u.floor ?? '');
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setNumber('');
    setFloor('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/units/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ number, floor: floor || undefined }),
        });
      } else {
        await api('/units', {
          method: 'POST',
          body: JSON.stringify({ buildingId, number, floor: floor || undefined }),
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete unit "${label}"?`)) return;
    setError(null);
    try {
      await api(`/units/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
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
        <Card title={editingId ? 'Edit unit' : 'Add unit'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
                disabled={Boolean(editingId)}
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
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary} disabled={!buildingId}>
                {editingId ? 'Save changes' : 'Add'}
              </button>
              {editingId ? (
                <button type="button" className={btnSecondary} onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Units" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Building</Th>
                  <Th>Number</Th>
                  <Th>Floor</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {units.length === 0 ? (
                  <EmptyRow colSpan={4} message="No units yet." />
                ) : (
                  units.map((u) => (
                    <Tr key={u.id}>
                      <Td className="font-medium">{u.building.name}</Td>
                      <Td muted>{u.number}</Td>
                      <Td muted>{u.floor ?? '—'}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(u)} />
                          <DeleteIconButton onClick={() => void onDelete(u.id, u.number)} />
                        </RowActions>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </Card>
        </div>
      </div>
    </>
  );
}
