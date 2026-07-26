'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import {
  btnPrimary,
  btnSecondary,
  Card,
  fieldClass,
  labelClass,
  PageHeader,
} from '../../components/ui';

type Society = { id: string; name: string; slug: string; timezone: string };

export default function SocietiesPage() {
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [name, setName] = useState('');
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

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/societies', { method: 'POST', body: JSON.stringify({ name }) });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
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
        <Card title="Create society">
          <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
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
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary}>
              Create
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Your societies">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                    <th className="px-1 py-3 font-medium">Name</th>
                    <th className="px-1 py-3 font-medium">Slug</th>
                    <th className="px-1 py-3 font-medium">Timezone</th>
                    <th className="px-1 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {societies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 text-gray-500">
                        No societies yet.
                      </td>
                    </tr>
                  ) : (
                    societies.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-1 py-3 text-gray-800 dark:text-white/90">{s.name}</td>
                        <td className="px-1 py-3 text-gray-500">{s.slug}</td>
                        <td className="px-1 py-3 text-gray-500">{s.timezone}</td>
                        <td className="px-1 py-3">
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => void activate(s.id)}
                          >
                            Set active
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
