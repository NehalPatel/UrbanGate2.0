'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { notifyAuthChanged, type MeResponse } from '../../lib/auth';
import {
  btnPrimary,
  btnSecondary,
  Card,
  fieldClass,
  labelClass,
  PageHeader,
} from '../../components/ui';
import { cn } from '../../lib/cn';

type StepId = 1 | 2 | 3 | 4 | 5;

type Society = { id: string; name: string; slug: string };
type Building = { id: string; name: string; code: string | null };
type Unit = {
  id: string;
  number: string;
  floor: string | null;
  buildingId: string;
  building: { id: string; name: string };
  relationships?: Array<{
    id: string;
    userId: string;
    type: string;
  }>;
};
type Membership = {
  id: string;
  roleKeys: string[];
  temporaryPassword?: string;
  user: { id: string; email: string; name: string; status: string };
};

type DraftUnitRow = { key: string; number: string; floor: string };

const STEPS: Array<{ id: StepId; title: string; hint: string }> = [
  { id: 1, title: 'Society', hint: 'Create or select' },
  { id: 2, title: 'Buildings', hint: 'Add wings' },
  { id: 3, title: 'Units', hint: 'Add flats' },
  { id: 4, title: 'Members', hint: 'Invite & assign' },
  { id: 5, title: 'Done', hint: 'Summary' },
];

const RELATIONSHIP_TYPES = ['OWNER', 'CO_OWNER', 'TENANT', 'RESIDENT', 'FAMILY_MEMBER'] as const;

function newDraftRow(): DraftUnitRow {
  return { key: `${Date.now()}-${Math.random()}`, number: '', floor: '' };
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>(1);
  const [me, setMe] = useState<MeResponse['user'] | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1
  const [societyName, setSocietyName] = useState('');

  // Step 2
  const [buildingName, setBuildingName] = useState('');
  const [buildingCode, setBuildingCode] = useState('');

  // Step 3
  const [unitBuildingId, setUnitBuildingId] = useState('');
  const [draftUnits, setDraftUnits] = useState<DraftUnitRow[]>([newDraftRow()]);

  // Step 4
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRoles, setMemberRoles] = useState('OWNER');
  const [assignUnitId, setAssignUnitId] = useState('');
  const [assignType, setAssignType] =
    useState<(typeof RELATIONSHIP_TYPES)[number]>('OWNER');

  const activeSociety = me?.memberships.find((m) => m.societyId === me.activeSocietyId)?.society;

  const refreshMe = useCallback(async () => {
    const data = await api<MeResponse>('/auth/me');
    setMe(data.user);
    notifyAuthChanged();
    return data.user;
  }, []);

  const loadLists = useCallback(async (hasSociety: boolean) => {
    const societyList = await api<Society[]>('/societies');
    setSocieties(societyList);
    if (!hasSociety) {
      setBuildings([]);
      setUnits([]);
      setMembers([]);
      return;
    }
    const [b, u, m] = await Promise.all([
      api<Building[]>('/buildings'),
      api<Unit[]>('/units'),
      api<Membership[]>('/memberships'),
    ]);
    setBuildings(b);
    setUnits(u);
    setMembers(m);
    setUnitBuildingId((prev) => prev || b[0]?.id || '');
    setAssignUnitId((prev) => prev || u[0]?.id || '');
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const user = await refreshMe();
        await loadLists(Boolean(user.activeSocietyId));
        if (!user.activeSocietyId) setStep(1);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [loadLists, refreshMe, router]);

  function goTo(next: StepId) {
    setError(null);
    if (next > 1 && !me?.activeSocietyId) {
      setStep(1);
      setError('Create or select a society first.');
      return;
    }
    if (next >= 3 && buildings.length === 0) {
      setStep(2);
      setError('Add at least one building before units.');
      return;
    }
    if (next >= 4 && units.length === 0) {
      setStep(3);
      setError('Add at least one unit before inviting members.');
      return;
    }
    setStep(next);
  }

  async function onCreateSociety(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/societies', {
        method: 'POST',
        body: JSON.stringify({ name: societyName }),
      });
      setSocietyName('');
      const user = await refreshMe();
      await loadLists(Boolean(user.activeSocietyId));
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create society');
    } finally {
      setBusy(false);
    }
  }

  async function onSelectSociety(societyId: string) {
    setBusy(true);
    setError(null);
    try {
      await api('/auth/switch-society', {
        method: 'POST',
        body: JSON.stringify({ societyId }),
      });
      const user = await refreshMe();
      await loadLists(Boolean(user.activeSocietyId));
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not switch society');
    } finally {
      setBusy(false);
    }
  }

  async function onCreateBuilding(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/buildings', {
        method: 'POST',
        body: JSON.stringify({
          name: buildingName,
          code: buildingCode || undefined,
        }),
      });
      setBuildingName('');
      setBuildingCode('');
      await loadLists(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add building');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveUnits(e: FormEvent) {
    e.preventDefault();
    if (!unitBuildingId) {
      setError('Select a building.');
      return;
    }
    const rows = draftUnits.filter((r) => r.number.trim());
    if (rows.length === 0) {
      setError('Enter at least one unit number.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const row of rows) {
        await api('/units', {
          method: 'POST',
          body: JSON.stringify({
            buildingId: unitBuildingId,
            number: row.number.trim(),
            floor: row.floor.trim() || undefined,
          }),
        });
      }
      setDraftUnits([newDraftRow()]);
      await loadLists(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add units');
    } finally {
      setBusy(false);
    }
  }

  async function onInviteAndAssign(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInviteHint(null);
    try {
      const membership = await api<Membership>('/memberships/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: memberEmail,
          name: memberName,
          roleKeys: memberRoles
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        }),
      });

      if (assignUnitId) {
        await api('/units/relationships', {
          method: 'POST',
          body: JSON.stringify({
            unitId: assignUnitId,
            userId: membership.user.id,
            type: assignType,
          }),
        });
      }

      if (membership.temporaryPassword) {
        setInviteHint(
          `Invited ${membership.user.email}. Temporary password: ${membership.temporaryPassword}`,
        );
      }

      setMemberName('');
      setMemberEmail('');
      await loadLists(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invite / assign failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Society setup"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Setup' },
        ]}
      />
      <p className="mb-6 text-theme-sm text-gray-500 dark:text-gray-400">
        Guided onboarding: society → buildings → units → members & unit assignment.
        {activeSociety ? (
          <>
            {' '}
            Active: <span className="font-medium text-gray-800 dark:text-white/90">{activeSociety.name}</span>
          </>
        ) : null}
      </p>

      <ol className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-theme-sm font-medium transition',
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                    : done
                      ? 'border-success-200 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500'
                      : 'border-gray-200 text-gray-500 dark:border-gray-700',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    active || done ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500',
                    done && !active ? 'bg-success-500' : null,
                  )}
                >
                  {done && !active ? '✓' : s.id}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Create society">
            <form onSubmit={(e) => void onCreateSociety(e)} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="society-name">
                  Society name
                </label>
                <input
                  id="society-name"
                  className={fieldClass}
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  placeholder="Green Valley Residency"
                  required
                  minLength={2}
                />
              </div>
              <button type="submit" className={btnPrimary} disabled={busy}>
                Create & continue
              </button>
            </form>
          </Card>
          <Card title="Or continue with existing">
            {societies.length === 0 ? (
              <p className="text-theme-sm text-gray-500">No societies yet.</p>
            ) : (
              <ul className="space-y-2">
                {societies.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">{s.name}</p>
                      <p className="text-theme-xs text-gray-500">{s.slug}</p>
                    </div>
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={busy}
                      onClick={() => void onSelectSociety(s.id)}
                    >
                      {me?.activeSocietyId === s.id ? 'Continue' : 'Use'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card title="Add building / wing">
            <form onSubmit={(e) => void onCreateBuilding(e)} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="building-name">
                  Name
                </label>
                <input
                  id="building-name"
                  className={fieldClass}
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
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
                  value={buildingCode}
                  onChange={(e) => setBuildingCode(e.target.value)}
                  placeholder="A"
                />
              </div>
              <button type="submit" className={btnPrimary} disabled={busy}>
                Add building
              </button>
            </form>
          </Card>
          <div className="xl:col-span-2">
            <Card title={`Buildings (${buildings.length})`}>
              {buildings.length === 0 ? (
                <p className="text-theme-sm text-gray-500">Add at least one building to continue.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {buildings.map((b) => (
                    <li key={b.id} className="flex justify-between py-2 text-theme-sm">
                      <span className="font-medium text-gray-800 dark:text-white/90">{b.name}</span>
                      <span className="text-gray-500">{b.code ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={() => goTo(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={buildings.length === 0}
                  onClick={() => goTo(3)}
                >
                  Continue to units
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card title="Add units (bulk)">
            <form onSubmit={(e) => void onSaveUnits(e)} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="unit-building">
                  Building
                </label>
                <select
                  id="unit-building"
                  className={fieldClass}
                  value={unitBuildingId}
                  onChange={(e) => setUnitBuildingId(e.target.value)}
                  required
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              {draftUnits.map((row, index) => (
                <div key={row.key} className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Unit #</label>
                    <input
                      className={fieldClass}
                      value={row.number}
                      onChange={(e) => {
                        const next = [...draftUnits];
                        next[index] = { ...row, number: e.target.value };
                        setDraftUnits(next);
                      }}
                      placeholder="101"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Floor</label>
                    <input
                      className={fieldClass}
                      value={row.floor}
                      onChange={(e) => {
                        const next = [...draftUnits];
                        next[index] = { ...row, floor: e.target.value };
                        setDraftUnits(next);
                      }}
                      placeholder="1"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setDraftUnits((rows) => [...rows, newDraftRow()])}
              >
                + Another row
              </button>
              <button type="submit" className={btnPrimary} disabled={busy}>
                Save units
              </button>
            </form>
          </Card>
          <div className="xl:col-span-2">
            <Card title={`Units (${units.length})`}>
              {units.length === 0 ? (
                <p className="text-theme-sm text-gray-500">No units yet.</p>
              ) : (
                <table className="min-w-full text-left text-theme-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                      <th className="py-2 font-medium">Building</th>
                      <th className="py-2 font-medium">Number</th>
                      <th className="py-2 font-medium">Floor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-gray-800 dark:text-white/90">{u.building.name}</td>
                        <td className="py-2 text-gray-500">{u.number}</td>
                        <td className="py-2 text-gray-500">{u.floor ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={() => goTo(2)}>
                  Back
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={units.length === 0}
                  onClick={() => goTo(4)}
                >
                  Continue to members
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card title="Invite & assign unit">
            <form onSubmit={(e) => void onInviteAndAssign(e)} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="member-name">
                  Name
                </label>
                <input
                  id="member-name"
                  className={fieldClass}
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
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
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="member-roles">
                  Roles (comma-separated)
                </label>
                <input
                  id="member-roles"
                  className={fieldClass}
                  value={memberRoles}
                  onChange={(e) => setMemberRoles(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="assign-unit">
                  Assign unit
                </label>
                <select
                  id="assign-unit"
                  className={fieldClass}
                  value={assignUnitId}
                  onChange={(e) => setAssignUnitId(e.target.value)}
                  required
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.building.name}-{u.number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="assign-type">
                  Relationship
                </label>
                <select
                  id="assign-type"
                  className={fieldClass}
                  value={assignType}
                  onChange={(e) =>
                    setAssignType(e.target.value as (typeof RELATIONSHIP_TYPES)[number])
                  }
                >
                  {RELATIONSHIP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={btnPrimary} disabled={busy}>
                Invite & assign
              </button>
              {inviteHint ? (
                <p className="text-theme-sm text-success-600">{inviteHint}</p>
              ) : null}
            </form>
          </Card>
          <div className="xl:col-span-2 space-y-6">
            <Card title={`Members (${members.length})`}>
              <table className="min-w-full text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-gray-800 dark:text-white/90">{m.user.name}</td>
                      <td className="py-2 text-gray-500">{m.user.email}</td>
                      <td className="py-2 text-gray-500">{m.roleKeys.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Unit assignments">
              <table className="min-w-full text-left text-theme-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                    <th className="py-2 font-medium">Unit</th>
                    <th className="py-2 font-medium">User</th>
                    <th className="py-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {units.flatMap((u) =>
                    (u.relationships ?? []).map((r) => {
                      const member = members.find((m) => m.user.id === r.userId);
                      return (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 text-gray-800 dark:text-white/90">
                            {u.building.name}-{u.number}
                          </td>
                          <td className="py-2 text-gray-500">
                            {member?.user.name ?? r.userId.slice(0, 8)}
                          </td>
                          <td className="py-2 text-gray-500">{r.type}</td>
                        </tr>
                      );
                    }),
                  )}
                  {units.every((u) => !(u.relationships && u.relationships.length)) ? (
                    <tr>
                      <td colSpan={3} className="py-2 text-gray-500">
                        No assignments yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={() => goTo(3)}>
                  Back
                </button>
                <button type="button" className={btnPrimary} onClick={() => goTo(5)}>
                  Finish setup
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <Card title="Setup complete">
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Society" value={activeSociety?.name ?? '—'} />
            <SummaryStat label="Buildings" value={buildings.length} />
            <SummaryStat label="Units" value={units.length} />
            <SummaryStat label="Members" value={members.length} />
          </div>
          <p className="mb-4 text-theme-sm text-gray-500">
            You can refine details anytime on the individual pages, or run billing from Finance.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className={btnPrimary}>
              Dashboard
            </Link>
            <Link href="/finance" className={btnSecondary}>
              Finance
            </Link>
            <Link href="/maintenance" className={btnSecondary}>
              Maintenance
            </Link>
            <button type="button" className={btnSecondary} onClick={() => goTo(1)}>
              Run setup again
            </button>
          </div>
        </Card>
      ) : null}
    </>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-3 dark:bg-white/5">
      <p className="text-theme-xs text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}
