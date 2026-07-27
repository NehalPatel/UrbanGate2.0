'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  outstandingAmount: string;
  dueDate: string | null;
  unit?: { number: string; building?: { name: string } };
};

export default function InvoicesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setRows(await api<Invoice[]>('/invoices'));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, [router]);

  return (
    <main className="shell">
      <p className="eyebrow">Finance</p>
      <h1>My bills</h1>
      <p className="muted">Invoices for your linked units</p>
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginTop: '1rem' }}>
        {rows.map((inv) => (
          <article key={inv.id} className="card">
            <div className="row">
              <div>
                <h3>{inv.invoiceNumber}</h3>
                <p className="meta">
                  {inv.unit?.building?.name ? `${inv.unit.building.name} / ` : ''}
                  {inv.unit?.number ?? '—'}
                  {inv.dueDate ? ` · due ${new Date(inv.dueDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <span className="badge">{inv.status}</span>
            </div>
            <p className="meta" style={{ marginTop: '0.5rem' }}>
              Total ₹{inv.total} · Outstanding ₹{inv.outstandingAmount}
            </p>
          </article>
        ))}
        {rows.length === 0 && !error ? <p className="muted">No invoices yet.</p> : null}
      </div>
    </main>
  );
}
