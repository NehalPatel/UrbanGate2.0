'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, btnSecondary, Card, PageHeader } from '../../components/ui';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  entityType: string | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await api<Notification[]>('/notifications'));
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

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: 'POST' });
    await load();
  }

  async function markAll() {
    await api('/notifications/read-all', { method: 'POST' });
    await load();
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Notifications' },
        ]}
      />
      <Card
        title={`Inbox${unread ? ` · ${unread} unread` : ''}`}
        action={
          unread > 0 ? (
            <button type="button" className={btnSecondary} onClick={() => void markAll()}>
              Mark all read
            </button>
          ) : null
        }
      >
        {error ? <p className="mb-3 text-theme-sm text-error-600">{error}</p> : null}
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.readAt
                  ? 'border-gray-100 dark:border-gray-800'
                  : 'border-brand-200 bg-gray-50 dark:border-brand-800 dark:bg-white/[0.03]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{n.title}</p>
                  <p className="mt-1 text-theme-sm text-gray-500">{n.body}</p>
                  <p className="mt-2 text-theme-xs text-gray-400">
                    {n.type} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.readAt ? (
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => void markRead(n.id)}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="text-theme-sm text-gray-500">No notifications yet.</li>
          ) : null}
        </ul>
      </Card>
    </>
  );
}
