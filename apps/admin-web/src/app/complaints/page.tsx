'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

type Unit = { id: string; number: string; building: { name: string } };
type Complaint = {
  id: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  unitId: string | null;
  createdAt: string;
};

const STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];

export default function ComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [c, u] = await Promise.all([
        api<Complaint[]>('/complaints'),
        api<Unit[]>('/units'),
      ]);
      setComplaints(c);
      setUnits(u);
      if (!unitId && u[0]) setUnitId(u[0].id);
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
      await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          category,
          subject,
          description,
          priority,
          unitId: unitId || undefined,
        }),
      });
      setSubject('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function setStatus(id: string, status: string) {
    await api(`/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Complaints"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Complaints' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Log complaint">
          <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="category">
                Category
              </label>
              <input
                id="category"
                className={fieldClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="subject">
                Subject
              </label>
              <input
                id="subject"
                className={fieldClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className={`${fieldClass} h-28`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                className={fieldClass}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="unit">
                Unit (optional)
              </label>
              <select
                id="unit"
                className={fieldClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">None</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.building.name}-{u.number}
                  </option>
                ))}
              </select>
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary}>
              Create
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Complaints">
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{c.subject}</p>
                      <p className="mt-1 text-theme-sm text-gray-500">{c.description}</p>
                      <p className="mt-2 text-theme-xs text-gray-400">
                        {c.category} · {c.priority} · {c.status}
                      </p>
                    </div>
                    <select
                      className={fieldClass}
                      style={{ width: 'auto', marginBottom: 0 }}
                      value={c.status}
                      onChange={(e) => void setStatus(c.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {complaints.length === 0 ? (
                <p className="text-theme-sm text-gray-500">No complaints yet.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
