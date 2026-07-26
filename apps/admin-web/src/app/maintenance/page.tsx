'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

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
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('3500');
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

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/maintenance-rules', {
        method: 'POST',
        body: JSON.stringify({ name, amount, frequency: 'MONTHLY' }),
      });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
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
        <Card title="Add rule">
          <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
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
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary}>
              Add rule
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Rules">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <th className="px-1 py-3 font-medium">Name</th>
                  <th className="px-1 py-3 font-medium">Amount</th>
                  <th className="px-1 py-3 font-medium">Frequency</th>
                  <th className="px-1 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-1 py-3 text-gray-800 dark:text-white/90">{r.name}</td>
                    <td className="px-1 py-3 text-gray-500">₹{String(r.amount)}</td>
                    <td className="px-1 py-3 text-gray-500">{r.frequency}</td>
                    <td className="px-1 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.active
                            ? 'bg-success-50 text-success-600 dark:bg-success-500/15'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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
