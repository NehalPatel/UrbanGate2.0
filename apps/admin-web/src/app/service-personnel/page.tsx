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
  StatusBadge,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';

type Unit = { id: string; number: string; building?: { name: string } };
type Personnel = {
  id: string;
  name: string;
  mobile: string;
  serviceType: string;
  status: string;
  unitIds: string[];
};

export default function ServicePersonnelPage() {
  const router = useRouter();
  const [list, setList] = useState<Personnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [serviceType, setServiceType] = useState('MAID');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [p, u] = await Promise.all([
        api<Personnel[]>('/service-personnel'),
        api<Unit[]>('/units'),
      ]);
      setList(p);
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
    setName('');
    setMobile('');
    setServiceType('MAID');
  }

  function startEdit(p: Personnel) {
    setEditingId(p.id);
    setName(p.name);
    setMobile(p.mobile);
    setServiceType(p.serviceType);
    setUnitId(p.unitIds[0] ?? '');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        name,
        mobile,
        serviceType,
        unitIds: unitId ? [unitId] : [],
      };
      if (editingId) {
        await api(`/service-personnel/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await api('/service-personnel', { method: 'POST', body: JSON.stringify(body) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Remove service personnel "${label}"?`)) return;
    try {
      await api(`/service-personnel/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Service personnel"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Service personnel' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit personnel' : 'Add personnel'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Mobile</label>
              <input
                className={fieldClass}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={fieldClass}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                {['MAID', 'COOK', 'DRIVER', 'CLEANER', 'PLUMBER', 'ELECTRICIAN', 'OTHER'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Primary unit</label>
              <select
                className={fieldClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">— none —</option>
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
          <Card title="Directory" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Mobile</Th>
                  <Th>Status</Th>
                  <Th>Units</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {list.length === 0 ? (
                  <EmptyRow colSpan={6} message="No service personnel yet." />
                ) : (
                  list.map((p) => (
                    <Tr key={p.id}>
                      <Td className="font-medium">{p.name}</Td>
                      <Td muted>{p.serviceType}</Td>
                      <Td muted>{p.mobile}</Td>
                      <Td>
                        <StatusBadge active={p.status === 'ACTIVE'} label={p.status} />
                      </Td>
                      <Td muted>{p.unitIds.length}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(p)} />
                          <DeleteIconButton onClick={() => void onDelete(p.id, p.name)} />
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
