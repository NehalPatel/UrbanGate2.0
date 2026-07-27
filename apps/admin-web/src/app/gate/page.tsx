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

type Gate = { id: string; name: string; code: string | null; active: boolean };
type Visitor = {
  id: string;
  name: string;
  mobile: string;
  category: string;
  status: string;
  createdAt: string;
};
type Emergency = { id: string; label: string; phone: string; category: string };

export default function GateAdminPage() {
  const router = useRouter();
  const [gates, setGates] = useState<Gate[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [emergency, setEmergency] = useState<Emergency[]>([]);
  const [editingGateId, setEditingGateId] = useState<string | null>(null);
  const [editingEmId, setEditingEmId] = useState<string | null>(null);
  const [gateName, setGateName] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [emLabel, setEmLabel] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [g, v, e] = await Promise.all([
        api<Gate[]>('/gates'),
        api<Visitor[]>('/visitors'),
        api<Emergency[]>('/emergency-contacts'),
      ]);
      setGates(g);
      setVisitors(v);
      setEmergency(e);
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

  function resetGateForm() {
    setEditingGateId(null);
    setGateName('');
    setGateCode('');
  }

  function resetEmForm() {
    setEditingEmId(null);
    setEmLabel('');
    setEmPhone('');
  }

  async function saveGate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingGateId) {
        await api(`/gates/${editingGateId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: gateName, code: gateCode || undefined }),
        });
      } else {
        await api('/gates', {
          method: 'POST',
          body: JSON.stringify({ name: gateName, code: gateCode || undefined }),
        });
      }
      resetGateForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gate save failed');
    }
  }

  async function deleteGate(id: string, label: string) {
    if (!window.confirm(`Delete gate "${label}"?`)) return;
    try {
      await api(`/gates/${id}`, { method: 'DELETE' });
      if (editingGateId === id) resetGateForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  async function saveEmergency(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingEmId) {
        await api(`/emergency-contacts/${editingEmId}`, {
          method: 'PATCH',
          body: JSON.stringify({ label: emLabel, phone: emPhone }),
        });
      } else {
        await api('/emergency-contacts', {
          method: 'POST',
          body: JSON.stringify({ label: emLabel, phone: emPhone, category: 'OTHER' }),
        });
      }
      resetEmForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Contact save failed');
    }
  }

  async function deleteEmergency(id: string, label: string) {
    if (!window.confirm(`Remove contact "${label}"?`)) return;
    try {
      await api(`/emergency-contacts/${id}`, { method: 'DELETE' });
      if (editingEmId === id) resetEmForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Gate"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Gate' },
        ]}
      />
      {error ? <p className="mb-4 text-theme-sm text-error-600">{error}</p> : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingGateId ? 'Edit gate' : 'Add gate'}>
          <form onSubmit={(e) => void saveGate(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={fieldClass}
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Code (optional)</label>
              <input
                className={fieldClass}
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingGateId ? 'Save' : 'Create gate'}
              </button>
              {editingGateId ? (
                <button type="button" className={btnSecondary} onClick={resetGateForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <div className="mt-4 -mx-5 border-t border-gray-100 dark:border-gray-800">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Code</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {gates.length === 0 ? (
                  <EmptyRow colSpan={3} message="No gates yet." />
                ) : (
                  gates.map((g) => (
                    <Tr key={g.id}>
                      <Td className="font-medium">{g.name}</Td>
                      <Td muted>{g.code ?? '—'}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton
                            onClick={() => {
                              setEditingGateId(g.id);
                              setGateName(g.name);
                              setGateCode(g.code ?? '');
                            }}
                          />
                          <DeleteIconButton onClick={() => void deleteGate(g.id, g.name)} />
                        </RowActions>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </div>
        </Card>
        <Card title={editingEmId ? 'Edit contact' : 'Emergency contacts'}>
          <form onSubmit={(e) => void saveEmergency(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Label</label>
              <input
                className={fieldClass}
                value={emLabel}
                onChange={(e) => setEmLabel(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={fieldClass}
                value={emPhone}
                onChange={(e) => setEmPhone(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnSecondary}>
                {editingEmId ? 'Save' : 'Add contact'}
              </button>
              {editingEmId ? (
                <button type="button" className={btnSecondary} onClick={resetEmForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <div className="mt-4 -mx-5 border-t border-gray-100 dark:border-gray-800">
            <DataTable>
              <THead>
                <tr>
                  <Th>Label</Th>
                  <Th>Phone</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {emergency.length === 0 ? (
                  <EmptyRow colSpan={3} message="No contacts yet." />
                ) : (
                  emergency.map((c) => (
                    <Tr key={c.id}>
                      <Td className="font-medium">{c.label}</Td>
                      <Td muted>{c.phone}</Td>
                      <Td>
                        <RowActions>
                          <EditIconButton
                            onClick={() => {
                              setEditingEmId(c.id);
                              setEmLabel(c.label);
                              setEmPhone(c.phone);
                            }}
                          />
                          <DeleteIconButton onClick={() => void deleteEmergency(c.id, c.label)} />
                        </RowActions>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </DataTable>
          </div>
        </Card>
        <Card title="Recent visitors" bodyClassName="p-0">
          <DataTable>
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Category</Th>
                <Th>Mobile</Th>
              </tr>
            </THead>
            <tbody>
              {visitors.length === 0 ? (
                <EmptyRow colSpan={4} message="No visitors yet." />
              ) : (
                visitors.slice(0, 12).map((v) => (
                  <Tr key={v.id}>
                    <Td className="font-medium">{v.name}</Td>
                    <Td muted>{v.status}</Td>
                    <Td muted>{v.category}</Td>
                    <Td muted>{v.mobile}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </DataTable>
        </Card>
      </div>
    </>
  );
}
