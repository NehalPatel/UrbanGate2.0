'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../lib/api';
import type { MeResponse } from '../lib/auth';

type Gate = { id: string; name: string };
type Unit = { id: string; number: string; building: { name: string } };
type Visitor = {
  id: string;
  name: string;
  mobile: string;
  category: string;
  status: string;
  purpose: string | null;
  vehicleNumber: string | null;
};
type Emergency = { id: string; label: string; phone: string; category: string };
type Vehicle = { id: string; registrationNumber: string; makeModel: string | null; ownerName: string | null };
type Member = { userId: string; name: string; email: string };

export default function SecurityHomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [gates, setGates] = useState<Gate[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [emergency, setEmergency] = useState<Emergency[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [gateId, setGateId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('GUEST');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [lookupQ, setLookupQ] = useState('');
  const [vehicleQ, setVehicleQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'entry' | 'list' | 'lookup' | 'emergency'>('entry');

  async function refreshVisitors() {
    setVisitors(await api<Visitor[]>('/visitors'));
  }

  async function boot() {
    try {
      const me = await api<MeResponse>('/auth/me');
      setUserName(me.user.name);
      const [g, u, e] = await Promise.all([
        api<Gate[]>('/gates'),
        api<Unit[]>('/lookups/units'),
        api<Emergency[]>('/emergency-contacts'),
      ]);
      setGates(g);
      setUnits(u);
      setEmergency(e);
      if (g[0]) setGateId(g[0].id);
      await refreshVisitors();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void boot();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/visitors', {
        method: 'POST',
        body: JSON.stringify({
          name,
          mobile,
          category,
          purpose: purpose || undefined,
          vehicleNumber: vehicleNumber || undefined,
          unitId: unitId || undefined,
          gateId: gateId || undefined,
          checkInNow: true,
        }),
      });
      setName('');
      setMobile('');
      setPurpose('');
      setVehicleNumber('');
      setTab('list');
      await refreshVisitors();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  }

  async function checkOut(id: string) {
    await api(`/visitors/${id}/check-out`, { method: 'POST' });
    await refreshVisitors();
  }

  async function checkIn(id: string) {
    await api(`/visitors/${id}/check-in`, { method: 'POST' });
    await refreshVisitors();
  }

  async function doLookup() {
    const [m, v] = await Promise.all([
      api<Member[]>(`/lookups/members?q=${encodeURIComponent(lookupQ)}`),
      api<Vehicle[]>(`/vehicles?q=${encodeURIComponent(vehicleQ || lookupQ)}`),
    ]);
    setMembers(m);
    setVehicles(v);
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <main className="shell">
      <header className="top">
        <div>
          <p className="eyebrow">UrbanGate Security</p>
          <h1>Gate desk</h1>
          <p className="muted">{userName || '…'}</p>
        </div>
        <button type="button" className="ghost" onClick={() => void logout()}>
          Logout
        </button>
      </header>

      <nav className="tabs">
        {(
          [
            ['entry', 'Entry'],
            ['list', 'On site'],
            ['lookup', 'Lookup'],
            ['emergency', 'Emergency'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'tab active' : 'tab'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error ? <p className="error">{error}</p> : null}

      {tab === 'entry' ? (
        <form className="card" onSubmit={(e) => void onCreate(e)}>
          <h2>Visitor entry + check-in</h2>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Mobile
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['GUEST', 'DELIVERY', 'CAB', 'VENDOR', 'SERVICE', 'CONTRACTOR', 'OTHER'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gate
            <select value={gateId} onChange={(e) => setGateId(e.target.value)}>
              {gates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">— optional —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.building.name} / {u.number}
                </option>
              ))}
            </select>
          </label>
          <label>
            Purpose
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </label>
          <label>
            Vehicle no.
            <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
          </label>
          <button type="submit">Check in now</button>
        </form>
      ) : null}

      {tab === 'list' ? (
        <section className="card">
          <h2>Visitors</h2>
          <ul className="list">
            {visitors.map((v) => (
              <li key={v.id}>
                <div>
                  <strong>{v.name}</strong>
                  <p className="muted">
                    {v.status} · {v.category} · {v.mobile}
                    {v.vehicleNumber ? ` · ${v.vehicleNumber}` : ''}
                  </p>
                </div>
                <div className="actions">
                  {v.status === 'APPROVED' || v.status === 'REQUESTED' ? (
                    <button type="button" onClick={() => void checkIn(v.id)}>
                      In
                    </button>
                  ) : null}
                  {v.status === 'CHECKED_IN' ? (
                    <button type="button" onClick={() => void checkOut(v.id)}>
                      Out
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
            {visitors.length === 0 ? <li className="muted">No visitors yet.</li> : null}
          </ul>
        </section>
      ) : null}

      {tab === 'lookup' ? (
        <section className="card">
          <h2>Member / vehicle lookup</h2>
          <label>
            Member search
            <input value={lookupQ} onChange={(e) => setLookupQ(e.target.value)} />
          </label>
          <label>
            Vehicle search
            <input value={vehicleQ} onChange={(e) => setVehicleQ(e.target.value)} />
          </label>
          <button type="button" onClick={() => void doLookup()}>
            Search
          </button>
          <h3>Members</h3>
          <ul className="list">
            {members.map((m) => (
              <li key={m.userId}>
                <strong>{m.name}</strong>
                <p className="muted">{m.email}</p>
              </li>
            ))}
          </ul>
          <h3>Vehicles</h3>
          <ul className="list">
            {vehicles.map((v) => (
              <li key={v.id}>
                <strong>{v.registrationNumber}</strong>
                <p className="muted">
                  {v.makeModel || '—'} · {v.ownerName || '—'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'emergency' ? (
        <section className="card">
          <h2>Emergency contacts</h2>
          <ul className="list">
            {emergency.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong>
                <p className="muted">
                  {c.category} · <a href={`tel:${c.phone}`}>{c.phone}</a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
