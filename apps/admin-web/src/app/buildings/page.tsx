'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

type Building = { id: string; name: string; code: string | null };

export default function BuildingsPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
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

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/buildings', {
        method: 'POST',
        body: JSON.stringify({ name, code: code || undefined }),
      });
      setName('');
      setCode('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
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
        <Card title="Add building">
          <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
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
            <button type="submit" className={btnPrimary}>
              Add
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Buildings / wings">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <th className="px-1 py-3 font-medium">Name</th>
                  <th className="px-1 py-3 font-medium">Code</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-1 py-3 text-gray-800 dark:text-white/90">{b.name}</td>
                    <td className="px-1 py-3 text-gray-500">{b.code ?? '—'}</td>
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
