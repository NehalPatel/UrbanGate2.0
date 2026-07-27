'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
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
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';

type Amenity = {
  id: string;
  name: string;
  capacity: number;
  fee: string;
  slotMinutes: number;
  active: boolean;
};
type Booking = {
  id: string;
  amenityId: string;
  startAt: string;
  endAt: string;
  status: string;
  fee: string;
};
type Unit = { id: string; number: string; building?: { name: string } };

export default function AmenitiesPage() {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [feeRupees, setFeeRupees] = useState('0');
  const [amenityId, setAmenityId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeAmenities = amenities.filter((a) => a.active);

  async function load() {
    try {
      const [a, b, u] = await Promise.all([
        api<Amenity[]>('/amenities'),
        api<Booking[]>('/bookings'),
        api<Unit[]>('/units'),
      ]);
      setAmenities(a);
      setBookings(b);
      setUnits(u);
      if (!amenityId && a.find((x) => x.active)) setAmenityId(a.find((x) => x.active)!.id);
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

  function resetAmenityForm() {
    setEditingId(null);
    setName('');
    setFeeRupees('0');
  }

  async function saveAmenity(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api(`/amenities/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, feeRupees }),
        });
      } else {
        await api('/amenities', {
          method: 'POST',
          body: JSON.stringify({ name, feeRupees, capacity: 1, slotMinutes: 60 }),
        });
      }
      resetAmenityForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function deleteAmenity(id: string, label: string) {
    if (!window.confirm(`Remove amenity "${label}"?`)) return;
    try {
      await api(`/amenities/${id}`, { method: 'DELETE' });
      if (editingId === id) resetAmenityForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  async function addBooking(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          amenityId,
          unitId: unitId || undefined,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        }),
      });
      setStartAt('');
      setEndAt('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking failed');
    }
  }

  async function cancelBooking(id: string) {
    await api(`/bookings/${id}/cancel`, { method: 'POST' });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Amenities & bookings"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Amenities' },
        ]}
      />
      {error ? <p className="mb-4 text-theme-sm text-error-600">{error}</p> : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title={editingId ? 'Edit amenity' : 'Add amenity'}>
          <form onSubmit={(e) => void saveAmenity(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fee (₹)</label>
              <input
                className={fieldClass}
                value={feeRupees}
                onChange={(e) => setFeeRupees(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary}>
                {editingId ? 'Save' : 'Save amenity'}
              </button>
              {editingId ? (
                <button type="button" className={btnSecondary} onClick={resetAmenityForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <div className="mt-4 -mx-5 border-t border-gray-100 dark:border-gray-800">
            <DataTable>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Fee</Th>
                  <Th>Slot</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {amenities.filter((a) => a.active).length === 0 ? (
                  <EmptyRow colSpan={4} message="No amenities yet." />
                ) : (
                  amenities
                    .filter((a) => a.active)
                    .map((a) => (
                      <Tr key={a.id}>
                        <Td className="font-medium">{a.name}</Td>
                        <Td muted>₹{a.fee}</Td>
                        <Td muted>{a.slotMinutes}m</Td>
                        <Td>
                          <RowActions>
                            <EditIconButton
                              onClick={() => {
                                setEditingId(a.id);
                                setName(a.name);
                                setFeeRupees(String(a.fee));
                              }}
                            />
                            <DeleteIconButton onClick={() => void deleteAmenity(a.id, a.name)} />
                          </RowActions>
                        </Td>
                      </Tr>
                    ))
                )}
              </tbody>
            </DataTable>
          </div>
        </Card>
        <Card title="New booking">
          <form onSubmit={(e) => void addBooking(e)} className="space-y-3">
            <div>
              <label className={labelClass}>Amenity</label>
              <select
                className={fieldClass}
                value={amenityId}
                onChange={(e) => setAmenityId(e.target.value)}
                required
              >
                {activeAmenities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select
                className={fieldClass}
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">— optional —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.building?.name ? `${u.building.name} / ` : ''}
                    {u.number}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Start</label>
              <input
                type="datetime-local"
                className={fieldClass}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>End</label>
              <input
                type="datetime-local"
                className={fieldClass}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={btnPrimary}>
              Book
            </button>
          </form>
        </Card>
        <Card title="Bookings">
          <ul className="space-y-3">
            {bookings.map((b) => {
              const amenity = amenities.find((a) => a.id === b.amenityId);
              return (
                <li
                  key={b.id}
                  className="rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                >
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {amenity?.name ?? b.amenityId}
                  </p>
                  <p className="text-theme-xs text-gray-400">
                    {b.status} · ₹{b.fee} · {new Date(b.startAt).toLocaleString()} →{' '}
                    {new Date(b.endAt).toLocaleString()}
                  </p>
                  {b.status === 'CONFIRMED' || b.status === 'REQUESTED' ? (
                    <button
                      type="button"
                      className={`${btnSecondary} mt-2`}
                      onClick={() => void cancelBooking(b.id)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </li>
              );
            })}
            {bookings.length === 0 ? (
              <li className="text-theme-sm text-gray-500">No bookings yet.</li>
            ) : null}
          </ul>
        </Card>
      </div>
    </>
  );
}
