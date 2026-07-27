'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiUpload, ApiError, attachmentDownloadUrl } from '../../lib/api';
import {
  btnPrimary,
  btnSecondary,
  Card,
  DeleteIconButton,
  EditIconButton,
  fieldClass,
  labelClass,
  PageHeader,
} from '../../components/ui';

type Notice = {
  id: string;
  title: string;
  body: string;
  status: string;
  audience: string;
  publishedAt: string | null;
  createdAt: string;
};

type Attachment = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attachmentsByNotice, setAttachmentsByNotice] = useState<Record<string, Attachment[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publish, setPublish] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAttachments(noticeId: string) {
    const rows = await api<Attachment[]>(
      `/attachments?entityType=Notice&entityId=${encodeURIComponent(noticeId)}`,
    );
    setAttachmentsByNotice((prev) => ({ ...prev, [noticeId]: rows }));
  }

  async function load() {
    try {
      const list = await api<Notice[]>('/notices');
      setNotices(list);
      await Promise.all(list.map((n) => loadAttachments(n.id)));
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

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setBody('');
    setPublish(true);
  }

  function startEdit(n: Notice) {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setPublish(false);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/notices/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title, body }),
        });
      } else {
        await api('/notices', {
          method: 'POST',
          body: JSON.stringify({ title, body, publish }),
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
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

  async function deleteNotice(id: string, label: string) {
    if (!window.confirm(`Delete notice "${label}"?`)) return;
    try {
      await api(`/notices/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  async function onAttach(noticeId: string, file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiUpload(
        `/attachments?entityType=Notice&entityId=${encodeURIComponent(noticeId)}`,
        fd,
      );
      await loadAttachments(noticeId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    }
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
        <Card title={editingId ? 'Edit notice' : 'Create notice'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
            {!editingId ? (
              <label className="flex items-center gap-2 text-theme-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                />
                Publish immediately
              </label>
            ) : null}
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingId ? 'Save changes' : 'Save notice'}
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
                      <ul className="mt-2 space-y-1">
                        {(attachmentsByNotice[n.id] ?? []).map((a) => (
                          <li key={a.id} className="text-theme-xs">
                            <a
                              className="text-brand-600 hover:underline"
                              href={attachmentDownloadUrl(a.id)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {a.originalName}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <label className="mt-2 inline-block text-theme-xs text-gray-500">
                        Attach file
                        <input
                          type="file"
                          className="ml-2"
                          onChange={(e) => void onAttach(n.id, e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <EditIconButton onClick={() => startEdit(n)} />
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
                      <DeleteIconButton onClick={() => void deleteNotice(n.id, n.title)} />
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
