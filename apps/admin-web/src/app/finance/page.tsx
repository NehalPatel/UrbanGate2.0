'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import {
  btnPrimary,
  btnSecondary,
  Card,
  fieldClass,
  labelClass,
  PageHeader,
  StatBox,
} from '../../components/ui';

type BillingRun = {
  id: string;
  label: string;
  invoiceCount: number;
  status: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  paidAmount: string;
  outstandingAmount: string;
  unit: { number: string; building: { name: string } };
};

type CollectionReport = {
  invoiceCount: number;
  billed: string;
  collected: string;
  outstanding: string;
};

type Payment = {
  id: string;
  amount: string;
  mode: string;
  status: string;
  receiptNumber: string | null;
  paidAt: string;
  reference: string | null;
};

type Receipt = {
  receiptNumber: string;
  society: { name: string; currency: string };
  payment: {
    id: string;
    amount: string;
    mode: string;
    status: string;
    reference: string | null;
    paidAt: string;
    notes: string | null;
  };
  unit: { number: string; building: string } | null;
  recordedBy: { name: string; email: string } | null;
  invoices: Array<{ invoiceNumber: string; amount: string }>;
};

function statusClass(status: string) {
  if (status === 'PAID') return 'bg-success-50 text-success-600';
  if (status === 'PARTIALLY_PAID') return 'bg-orange-50 text-orange-600';
  if (status === 'ISSUED') return 'bg-brand-50 text-brand-600';
  return 'bg-gray-100 text-gray-600';
}

export default function FinancePage() {
  const router = useRouter();
  const [runs, setRuns] = useState<BillingRun[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [label, setLabel] = useState('2026-08');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [r, inv, rep, pay] = await Promise.all([
        api<BillingRun[]>('/billing-runs'),
        api<Invoice[]>('/invoices'),
        api<CollectionReport>('/invoices/reports/collection'),
        api<Payment[]>('/payments'),
      ]);
      setRuns(r);
      setInvoices(inv);
      setReport(rep);
      setPayments(pay);
      if (!payInvoiceId && inv[0]) setPayInvoiceId(inv[0].id);
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

  async function onBilling(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/billing-runs', {
        method: 'POST',
        body: JSON.stringify({ label, dueDay: 10 }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Billing failed');
    }
  }

  async function onPay(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: payInvoiceId,
          amount: payAmount,
          mode: 'UPI',
          reference: `DEMO-${Date.now()}`,
        }),
      });
      setPayAmount('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment failed');
    }
  }

  async function viewReceipt(paymentId: string) {
    try {
      setReceipt(await api<Receipt>(`/payments/${paymentId}/receipt`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Receipt failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Finance"
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Finance' },
        ]}
      />
      {error ? <p className="mb-4 text-theme-sm text-error-600">{error}</p> : null}

      {report ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox label="Billed" value={`₹${report.billed}`} tone="brand" />
          <StatBox label="Collected" value={`₹${report.collected}`} tone="success" />
          <StatBox label="Outstanding" value={`₹${report.outstanding}`} tone="warning" />
          <StatBox label="Invoices" value={report.invoiceCount} tone="gray" />
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Run billing">
          <form onSubmit={(e) => void onBilling(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="label">
                Period (YYYY-MM)
              </label>
              <input
                id="label"
                className={fieldClass}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={btnPrimary}>
              Generate invoices
            </button>
          </form>
        </Card>
        <Card title="Record payment">
          <form onSubmit={(e) => void onPay(e)} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="invoice">
                Invoice
              </label>
              <select
                id="invoice"
                className={fieldClass}
                value={payInvoiceId}
                onChange={(e) => setPayInvoiceId(e.target.value)}
                required
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} · {inv.unit.building.name}-{inv.unit.number} · due ₹
                    {String(inv.outstandingAmount)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="amount">
                Amount
              </label>
              <input
                id="amount"
                className={fieldClass}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={btnPrimary}>
              Record UPI payment
            </button>
          </form>
        </Card>
      </div>

      <div className="mb-6">
        <Card title="Billing runs">
          <table className="min-w-full text-left text-theme-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                <th className="px-1 py-3 font-medium">Period</th>
                <th className="px-1 py-3 font-medium">Invoices</th>
                <th className="px-1 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-1 py-3 text-gray-800 dark:text-white/90">{r.label}</td>
                  <td className="px-1 py-3 text-gray-500">{r.invoiceCount}</td>
                  <td className="px-1 py-3 text-gray-500">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="Invoices">
        <table className="min-w-full text-left text-theme-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
              <th className="px-1 py-3 font-medium">Invoice</th>
              <th className="px-1 py-3 font-medium">Unit</th>
              <th className="px-1 py-3 font-medium">Status</th>
              <th className="px-1 py-3 font-medium">Paid / Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-1 py-3 text-gray-800 dark:text-white/90">{inv.invoiceNumber}</td>
                <td className="px-1 py-3 text-gray-500">
                  {inv.unit.building.name}-{inv.unit.number}
                </td>
                <td className="px-1 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-1 py-3 text-gray-500">
                  ₹{String(inv.paidAmount)} / ₹{String(inv.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-6">
        <Card title="Payments & receipts">
          <table className="min-w-full text-left text-theme-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                <th className="px-1 py-3 font-medium">Receipt</th>
                <th className="px-1 py-3 font-medium">Amount</th>
                <th className="px-1 py-3 font-medium">Mode</th>
                <th className="px-1 py-3 font-medium">Status</th>
                <th className="px-1 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-1 py-3 text-gray-800 dark:text-white/90">
                    {p.receiptNumber ?? '—'}
                  </td>
                  <td className="px-1 py-3 text-gray-500">₹{p.amount}</td>
                  <td className="px-1 py-3 text-gray-500">{p.mode}</td>
                  <td className="px-1 py-3 text-gray-500">{p.status}</td>
                  <td className="px-1 py-3">
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => void viewReceipt(p.id)}
                    >
                      View receipt
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-1 py-3 text-gray-500">
                    No payments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>

      {receipt ? (
        <div className="mt-6">
          <Card title={`Receipt ${receipt.receiptNumber}`}>
            <div className="space-y-2 text-theme-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>{receipt.society.name}</strong>
              </p>
              <p>
                Amount: ₹{receipt.payment.amount} ({receipt.payment.mode})
              </p>
              <p>Paid at: {new Date(receipt.payment.paidAt).toLocaleString()}</p>
              {receipt.unit ? (
                <p>
                  Unit: {receipt.unit.building}-{receipt.unit.number}
                </p>
              ) : null}
              {receipt.recordedBy ? <p>Recorded by: {receipt.recordedBy.name}</p> : null}
              <p>
                Against:{' '}
                {receipt.invoices.map((i) => `${i.invoiceNumber} (₹${i.amount})`).join(', ')}
              </p>
              {receipt.payment.reference ? <p>Ref: {receipt.payment.reference}</p> : null}
            </div>
            <button type="button" className={`${btnSecondary} mt-4`} onClick={() => setReceipt(null)}>
              Close
            </button>
          </Card>
        </div>
      ) : null}
    </>
  );
}
