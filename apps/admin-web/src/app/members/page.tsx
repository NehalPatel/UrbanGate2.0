'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

type Membership = {
  id: string;
  roleKeys: string[];
  user: { id: string; email: string; name: string; status: string };
};

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Membership[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleKeys, setRoleKeys] = useState('RESIDENT');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setMembers(await api<Membership[]>('/memberships'));
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

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/memberships/invite', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name,
          roleKeys: roleKeys
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        }),
      });
      setEmail('');
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invite failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Members"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Members' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Invite member">
          <form onSubmit={(e) => void onInvite(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="member-name">
                Name
              </label>
              <input
                id="member-name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="member-email">
                Email
              </label>
              <input
                id="member-email"
                type="email"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="roles">
                Role keys
              </label>
              <input
                id="roles"
                className={fieldClass}
                value={roleKeys}
                onChange={(e) => setRoleKeys(e.target.value)}
              />
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary}>
              Invite
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Members">
            <table className="min-w-full text-left text-theme-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <th className="px-1 py-3 font-medium">Name</th>
                  <th className="px-1 py-3 font-medium">Email</th>
                  <th className="px-1 py-3 font-medium">Status</th>
                  <th className="px-1 py-3 font-medium">Roles</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-1 py-3 text-gray-800 dark:text-white/90">{m.user.name}</td>
                    <td className="px-1 py-3 text-gray-500">{m.user.email}</td>
                    <td className="px-1 py-3 text-gray-500">{m.user.status}</td>
                    <td className="px-1 py-3 text-gray-500">{m.roleKeys.join(', ')}</td>
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
