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

type Unit = { id: string; number: string; building?: { name: string } };
type Vehicle = {
  id: string;
  registrationNumber: string;
  type: string;
  makeModel: string | null;
  ownerName: string | null;
  unitId: string | null;
};

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [type, setType] = useState('CAR');
  const [makeModel, setMakeModel] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [v, u] = await Promise.all([api<Vehicle[]>('/vehicles'), api<Unit[]>('/units')]);
      setVehicles(v);
      setUnits(u);
      if (!unitId && u[0]) setUnitId(u[0].id);
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

  function resetForm() {
    setEditingId(null);
    setRegistrationNumber('');
    setType('CAR');
    setMakeModel('');
    setOwnerName('');
  }

  function startEdit(v: Vehicle) {
    setEditingId(v.id);
    setRegistrationNumber(v.registrationNumber);
    setType(v.type);
    setMakeModel(v.makeModel ?? '');
    setOwnerName(v.ownerName ?? '');
    setUnitId(v.unitId ?? '');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        registrationNumber,
        type,
        makeModel: makeModel || undefined,
        ownerName: ownerName || undefined,
        unitId: unitId || undefined,
      };
      if (editingId) {
        await api(`/vehicles/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/vehicles', { method: 'POST', body: JSON.stringify(body) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Remove vehicle "${label}"?`)) return;
    try {
      await api(`/vehicles/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  function unitLabel(id: string | null) {
    if (!id) return '—';
    const u = units.find((x) => x.id === id);
    if (!u) return '—';
    return `${u.building?.name ? `${u.building.name} / ` : ''}${u.number}`;
  }

  return (
    <>
      <PageHeader
        title="Vehicles"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Vehicles' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit vehicle' : 'Register vehicle'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Registration</label>
              <input
                className={fieldClass}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value)}>
                {['CAR', 'BIKE', 'SCOOTER', 'OTHER'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Make / model</label>
              <input
                className={fieldClass}
                value={makeModel}
                onChange={(e) => setMakeModel(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Owner name</label>
              <input
                className={fieldClass}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select
                className={fieldClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">— optional —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.building?.name ? `${u.building.name} / ` : ''}
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingId ? 'Save changes' : 'Save'}
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
          <Card title="Registered vehicles" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Registration</Th>
                  <Th>Type</Th>
                  <Th>Make / model</Th>
                  <Th>Owner</Th>
                  <Th>Unit</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {vehicles.length === 0 ? (
                  <EmptyRow colSpan={6} message="No vehicles yet." />
                ) : (
                  vehicles.map((v) => (
                    <Tr key={v.id}>
                      <Td className="font-medium">{v.registrationNumber}</Td>
                      <Td muted>{v.type}</Td>
                      <Td muted>{v.makeModel || '—'}</Td>
                      <Td muted>{v.ownerName || '—'}</Td>
                      <Td muted>{unitLabel(v.unitId)}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(v)} />
                          <DeleteIconButton
                            onClick={() => void onDelete(v.id, v.registrationNumber)}
                          />
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
