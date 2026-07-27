'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiUpload, ApiError, attachmentDownloadUrl } from '../../lib/api';
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

type FileRow = { id: string; originalName: string; mimeType: string; sizeBytes: number };
type Doc = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  published: boolean;
  files: FileRow[];
};

export default function DocumentsAdminPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setDocs(await api<Doc[]>('/documents'));
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [router]);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setCategory('GENERAL');
    setDescription('');
    setPublished(true);
    setFile(null);
  }

  function startEdit(d: Doc) {
    setEditingId(d.id);
    setTitle(d.title);
    setCategory(d.category);
    setDescription(d.description ?? '');
    setPublished(d.published);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/documents/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title, category, description: description || undefined, published }),
        });
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          await apiUpload(
            `/attachments?entityType=SocietyDocument&entityId=${encodeURIComponent(editingId)}`,
            fd,
          );
        }
      } else {
        const created = await api<Doc>('/documents', {
          method: 'POST',
          body: JSON.stringify({ title, category, description: description || undefined, published }),
        });
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          await apiUpload(
            `/attachments?entityType=SocietyDocument&entityId=${encodeURIComponent(created.id)}`,
            fd,
          );
        }
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Delete document "${label}"?`)) return;
    await api(`/documents/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <>
      <PageHeader
        title="Documents"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Documents' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit document' : 'Add document'}>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={fieldClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                className={fieldClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {['GENERAL', 'BYLAW', 'CIRCULAR', 'POLICY', 'MINUTES', 'OTHER'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${fieldClass} h-20`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-theme-sm text-gray-600">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              Published for residents
            </label>
            <div>
              <label className={labelClass}>File (optional)</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingId ? 'Save' : 'Create'}
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
          <Card title="Society documents" bodyClassName="p-0">
            <DataTable>
              <THead>
                <tr>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  <Th>Files</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {docs.length === 0 ? (
                  <EmptyRow colSpan={5} message="No documents yet." />
                ) : (
                  docs.map((d) => (
                    <Tr key={d.id}>
                      <Td className="font-medium">
                        <div>{d.title}</div>
                        {d.description ? (
                          <div className="mt-1 text-xs text-gray-500">{d.description}</div>
                        ) : null}
                      </Td>
                      <Td muted>{d.category}</Td>
                      <Td>
                        <StatusBadge active={d.published} label={d.published ? 'Published' : 'Draft'} />
                      </Td>
                      <Td muted>
                        {d.files.length === 0
                          ? '—'
                          : d.files.map((f) => (
                              <div key={f.id}>
                                <a
                                  className="text-brand-600 hover:underline"
                                  href={attachmentDownloadUrl(f.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {f.originalName}
                                </a>
                              </div>
                            ))}
                      </Td>
                      <Td>
                        <RowActions>
                          <EditIconButton onClick={() => startEdit(d)} />
                          <DeleteIconButton onClick={() => void onDelete(d.id, d.title)} />
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
