'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { btnPrimary, btnSecondary, Card, fieldClass, labelClass, PageHeader } from '../../components/ui';

type Meeting = {
  id: string;
  title: string;
  agenda: string;
  description: string | null;
  scheduledAt: string;
  location: string | null;
  onlineLink: string | null;
  audience: string;
  status: string;
  minutes: string | null;
};

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setMeetings(await api<Meeting[]>('/meetings'));
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
      await api('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          agenda,
          location: location || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
          schedule: true,
        }),
      });
      setTitle('');
      setAgenda('');
      setLocation('');
      setScheduledAt('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function scheduleMeeting(id: string) {
    await api(`/meetings/${id}/schedule`, { method: 'POST' });
    await load();
  }

  async function completeMeeting(id: string) {
    await api(`/meetings/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ minutes: 'Demo minutes recorded from admin.' }),
    });
    await load();
  }

  async function cancelMeeting(id: string) {
    await api(`/meetings/${id}/cancel`, { method: 'POST' });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Meetings"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Meetings' },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Schedule meeting">
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
              <label className={labelClass} htmlFor="agenda">
                Agenda
              </label>
              <textarea
                id="agenda"
                className={`${fieldClass} h-24`}
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="when">
                Date & time
              </label>
              <input
                id="when"
                type="datetime-local"
                className={fieldClass}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className={fieldClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Clubhouse / online"
              />
            </div>
            {error ? <p className="text-theme-sm text-error-600">{error}</p> : null}
            <button type="submit" className={btnPrimary}>
              Create meeting
            </button>
          </form>
        </Card>
        <div className="xl:col-span-2">
          <Card title="Society meetings">
            <ul className="space-y-3">
              {meetings.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{m.title}</p>
                      <p className="mt-1 text-theme-sm text-gray-500">{m.agenda}</p>
                      <p className="mt-2 text-theme-xs text-gray-400">
                        {m.status} · {new Date(m.scheduledAt).toLocaleString()}
                        {m.location ? ` · ${m.location}` : ''}
                      </p>
                      {m.minutes ? (
                        <p className="mt-2 text-theme-sm text-gray-600">Minutes: {m.minutes}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.status === 'DRAFT' ? (
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => void scheduleMeeting(m.id)}
                        >
                          Schedule
                        </button>
                      ) : null}
                      {m.status === 'DRAFT' || m.status === 'SCHEDULED' ? (
                        <>
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => void completeMeeting(m.id)}
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            className={btnSecondary}
                            onClick={() => void cancelMeeting(m.id)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
              {meetings.length === 0 ? (
                <li className="text-theme-sm text-gray-500">No meetings yet.</li>
              ) : null}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
