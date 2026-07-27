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

type Rule = {
  id: string;
  name: string;
  code: string | null;
  amount: string;
  frequency: string;
  active: boolean;
};

export default function MaintenancePage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('3500');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRules(await api<Rule[]>('/maintenance-rules'));
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

  function startEdit(r: Rule) {
    setEditingId(r.id);
    setName(r.name);
    setAmount(String(r.amount));
    setActive(r.active);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setAmount('3500');
    setActive(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/maintenance-rules/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, amount, active }),
        });
      } else {
        await api('/maintenance-rules', {
          method: 'POST',
          body: JSON.stringify({ name, amount, frequency: 'MONTHLY' }),
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete maintenance rule "${label}"?`)) return;
    setError(null);
    try {
      await api(`/maintenance-rules/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Maintenance' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit rule' : 'Add rule'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="rule-name">
                Name
              </label>
              <input
                id="rule-name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="rule-amount">
                Amount (INR)
              </label>
              <input
                id="rule-amount"
                className={fieldClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {editingId ? (
              <label className="flex items-center gap-2 text-theme-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Active
              </label>
            ) : null}
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingId ? 'Save changes' : 'Add rule'}
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
          <Card title="Rules" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Amount</Th>
                  <Th>Frequency</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {rules.length === 0 ? (
                  <EmptyRow colSpan={5} message="No maintenance rules yet." />
                ) : (
                  rules.map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-medium">{r.name}</Td>
                      <Td muted>₹{String(r.amount)}</Td>
                      <Td muted>{r.frequency}</Td>
                      <Td>
                        <StatusBadge active={r.active} />
                      </Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(r)} />
                          <DeleteIconButton onClick={() => void onDelete(r.id, r.name)} />
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
