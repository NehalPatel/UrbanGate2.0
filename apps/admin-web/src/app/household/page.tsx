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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('FAMILY');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [u, m] = await Promise.all([
        api<Unit[]>('/units'),
        api<Member[]>('/household-members'),
      ]);
      setUnits(u);
      setMembers(m);
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
    setRelation('FAMILY');
    setMobile('');
  }

  function startEdit(m: Member) {
    setEditingId(m.id);
    setUnitId(m.unitId);
    setName(m.name);
    setRelation(m.relation);
    setMobile(m.mobile ?? '');
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        unitId,
        name,
        relation,
        mobile: mobile || undefined,
      };
      if (editingId) {
        await api(`/household-members/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await api('/household-members', { method: 'POST', body: JSON.stringify(body) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Remove household member "${label}"?`)) return;
    try {
      await api(`/household-members/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  function unitLabel(id: string) {
    const u = units.find((x) => x.id === id);
    if (!u) return '—';
    return `${u.building?.name ? `${u.building.name} / ` : ''}${u.number}`;
  }

  return (
    <>
      <PageHeader
        title="Household"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Household' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit member' : 'Add household member'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Unit</label>
              <select
                className={fieldClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.building?.name ? `${u.building.name} / ` : ''}
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
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
              <label className={labelClass}>Relation</label>
              <input
                className={fieldClass}
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile</label>
              <input
                className={fieldClass}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
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
          <Card title="Household members" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Relation</Th>
                  <Th>Unit</Th>
                  <Th>Mobile</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {members.length === 0 ? (
                  <EmptyRow colSpan={5} message="No household members yet." />
                ) : (
                  members.map((m) => (
                    <Tr key={m.id}>
                      <Td className="font-medium">{m.name}</Td>
                      <Td muted>{m.relation}</Td>
                      <Td muted>{unitLabel(m.unitId)}</Td>
                      <Td muted>{m.mobile || '—'}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(m)} />
                          <DeleteIconButton onClick={() => void onDelete(m.id, m.name)} />
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
