'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, btnSecondary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

type Notice = {
  id: string;
  title: string;
  body: string;
  status: string;
  audience: string;
  publishedAt: string | null;
  createdAt: string;
};

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setNotices(await api<Notice[]>('/notices'));
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/notices', {
        method: 'POST',
        body: JSON.stringify({ title, body, publish }),
      });
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function publishNotice(id: string) {
    await api(`/notices/${id}/publish`, { method: 'POST' });
    await load();
  }

  async function archiveNotice(id: string) {
    await api(`/notices/${id}/archive`, { method: 'POST' });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Notices"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Notices' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Create notice">
          <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className={fieldClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="body">
                Body
              </label>
              <textarea
                id="body"
                className={`${fieldClass} h-28`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-theme-sm text-gray-600">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
              />
              Publish immediately
            </label>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary}>
              Save notice
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Society notices">
            <ul className="space-y-3">
              {notices.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{n.title}</p>
                      <p className="mt-1 text-theme-sm text-gray-500">{n.body}</p>
                      <p className="mt-2 text-theme-xs text-gray-400">
                        {n.status} · {n.audience}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {n.status === 'DRAFT' ? (
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => void publishNotice(n.id)}
                        >
                          Publish
                        </button>
                      ) : null}
                      {n.status !== 'ARCHIVED' ? (
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => void archiveNotice(n.id)}
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
              {notices.length === 0 ? (
                <li className="text-theme-sm text-gray-500">No notices yet.</li>
              ) : null}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
