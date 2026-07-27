'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import {
  btnPrimary,
  btnSecondary,
  Card,
  DataTable,
  EditIconButton,
  EmptyRow,
  fieldClass,
  IconButton,
  labelClass,
  PageHeader,
  RowActions,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';

type Society = { id: string; name: string; slug: string; timezone: string };

export default function SocietiesPage() {
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setSocieties(await api<Society[]>('/societies'));
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

  function startEdit(s: Society) {
    setEditingId(s.id);
    setName(s.name);
    setTimezone(s.timezone);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setTimezone('Asia/Kolkata');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/societies/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, timezone }),
        });
      } else {
        await api('/societies', { method: 'POST', body: JSON.stringify({ name }) });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function activate(societyId: string) {
    await api('/auth/switch-society', {
      method: 'POST',
      body: JSON.stringify({ societyId }),
    });
    router.push('/');
  }

  return (
    <>
      <PageHeader
        title="Societies"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Societies' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit society' : 'Create society'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="society-name">
                Society name
              </label>
              <input
                id="society-name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            {editingId ? (
              <div>
                <label className={labelClass} htmlFor="society-tz">
                  Timezone
                </label>
                <input
                  id="society-tz"
                  className={fieldClass}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            ) : null}
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingId ? 'Save changes' : 'Create'}
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
          <Card title="Your societies" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Timezone</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {societies.length === 0 ? (
                  <EmptyRow colSpan={4} message="No societies yet." />
                ) : (
                  societies.map((s) => (
                    <Tr key={s.id}>
                      <Td className="font-medium">{s.name}</Td>
                      <Td muted>{s.slug}</Td>
                      <Td muted>{s.timezone}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(s)} />
                          <IconButton
                            label="Set active"
                            tone="brand"
                            onClick={() => void activate(s.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path
                                d="M20 6 9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </IconButton>
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
