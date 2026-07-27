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

type Building = { id: string; name: string; code: string | null };

export default function BuildingsPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setBuildings(await api<Building[]>('/buildings'));
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

  function startEdit(b: Building) {
    setEditingId(b.id);
    setName(b.name);
    setCode(b.code ?? '');
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setCode('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/buildings/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, code: code || undefined }),
        });
      } else {
        await api('/buildings', {
          method: 'POST',
          body: JSON.stringify({ name, code: code || undefined }),
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete building "${label}"? Units in this building will also be removed.`)) {
      return;
    }
    setError(null);
    try {
      await api(`/buildings/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Buildings"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Buildings' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit building' : 'Add building'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="building-name">
                Name
              </label>
              <input
                id="building-name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="building-code">
                Code (optional)
              </label>
              <input
                id="building-code"
                className={fieldClass}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
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
          <Card title="Buildings / wings" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Code</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {buildings.length === 0 ? (
                  <EmptyRow colSpan={3} message="No buildings yet." />
                ) : (
                  buildings.map((b) => (
                    <Tr key={b.id}>
                      <Td className="font-medium">{b.name}</Td>
                      <Td muted>{b.code ?? '—'}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(b)} />
                          <DeleteIconButton onClick={() => void onDelete(b.id, b.name)} />
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
