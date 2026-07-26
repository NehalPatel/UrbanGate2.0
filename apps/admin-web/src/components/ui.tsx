import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  crumbs,
}: {
  title: string;
  crumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h2>
      {crumbs ? (
        <nav className="flex items-center gap-2 text-theme-sm text-gray-500">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-2">
              {i > 0 ? <span>/</span> : null}
              {c.href ? (
                <Link href={c.href} className="hover:text-brand-500">
                  {c.label}
                </Link>
              ) : (
                <span className="text-gray-800 dark:text-white/90">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  children,
  footer,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {title ? (
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
        </div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">{footer}</div>
      ) : null}
    </div>
  );
}

export function StatBox({
  label,
  value,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  tone?: 'brand' | 'success' | 'warning' | 'error' | 'gray';
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
    warning: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    gray: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300',
  };
  return (
    <div className={`rounded-2xl p-5 ${tones[tone]}`}>
      <p className="text-theme-sm opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export const fieldClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800';

export const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]';
