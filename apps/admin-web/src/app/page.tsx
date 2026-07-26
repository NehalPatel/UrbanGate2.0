'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '../lib/api';
import { notifyAuthChanged, type MeResponse } from '../lib/auth';
import { btnPrimary, btnSecondary, Card, PageHeader, StatBox } from '../components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse['user'] | null>(null);
  const [buildingCount, setBuildingCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api<MeResponse>('/auth/me');
        setMe(data.user);
        if (data.user.activeSocietyId) {
          try {
            const buildings = await api<unknown[]>('/buildings');
            setBuildingCount(buildings.length);
          } catch {
            setBuildingCount(0);
          }
        } else {
          setBuildingCount(0);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [router]);

  async function switchSociety(societyId: string) {
    const data = await api<MeResponse>('/auth/switch-society', {
      method: 'POST',
      body: JSON.stringify({ societyId }),
    });
    setMe(data.user);
    notifyAuthChanged();
    try {
      const buildings = await api<unknown[]>('/buildings');
      setBuildingCount(buildings.length);
    } catch {
      setBuildingCount(0);
    }
  }

  if (error) {
    return <p className="text-error-600">{error}</p>;
  }
  if (!me) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const active = me.memberships.find((m) => m.societyId === me.activeSocietyId);
  const setupIncomplete = me.memberships.length === 0 || buildingCount === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
      />

      {setupIncomplete ? (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Complete society setup
          </h3>
          <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">
            Create a society, add buildings and units, invite members, and assign units — all on one
            page.
          </p>
          <Link href="/setup" className={`${btnPrimary} mt-4`}>
            Open setup wizard
          </Link>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Societies" value={me.memberships.length} tone="brand" />
        <StatBox label="Permissions" value={me.permissions.length} tone="success" />
        <StatBox label="Active society" value={active?.society.name ?? 'None'} tone="warning" />
        <StatBox label="Platform admin" value={me.isPlatformAdmin ? 'Yes' : 'No'} tone="gray" />
      </div>

      <div className="mb-6">
        <Card title={`Welcome, ${me.name}`}>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">{me.email}</p>
          <p className="mt-2 text-theme-sm text-gray-700 dark:text-gray-300">
            Active society:{' '}
            <span className="font-medium text-gray-800 dark:text-white/90">
              {active?.society.name ?? 'None — use Setup to create one'}
            </span>
          </p>
          {!setupIncomplete ? (
            <Link href="/setup" className={`${btnSecondary} mt-4`}>
              Run setup again
            </Link>
          ) : null}
        </Card>
      </div>

      {me.memberships.length > 0 ? (
        <Card title="Your societies">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <th className="px-1 py-3 font-medium">Society</th>
                  <th className="px-1 py-3 font-medium">Roles</th>
                  <th className="px-1 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {me.memberships.map((m) => (
                  <tr key={m.societyId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-1 py-3 text-gray-800 dark:text-white/90">{m.society.name}</td>
                    <td className="px-1 py-3 text-gray-500">{m.roleKeys.join(', ')}</td>
                    <td className="px-1 py-3">
                      <button
                        type="button"
                        className={btnSecondary}
                        disabled={m.societyId === me.activeSocietyId}
                        onClick={() => void switchSociety(m.societyId)}
                      >
                        {m.societyId === me.activeSocietyId ? 'Active' : 'Switch'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </>
  );
}
