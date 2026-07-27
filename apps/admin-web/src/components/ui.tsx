import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

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
  action,
  className = '',
  bodyClassName = '',
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
          {action}
        </div>
      ) : null}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
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

/** Professional data table shell — use inside Card with bodyClassName="p-0". */
export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
      {children}
    </thead>
  );
}

export function Th({
  children,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-5 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  muted,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { muted?: boolean }) {
  return (
    <td
      className={cn(
        'px-5 py-3.5 align-middle',
        muted ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white/90',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        'border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50/70 dark:border-gray-800 dark:hover:bg-white/[0.02]',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function EmptyRow({ colSpan, message = 'No records yet.' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-gray-500">
        {message}
      </td>
    </tr>
  );
}

export function StatusBadge({
  active,
  label,
}: {
  active: boolean;
  label?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        active
          ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
          : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400',
      )}
    >
      {label ?? (active ? 'Active' : 'Inactive')}
    </span>
  );
}

type IconBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: 'default' | 'danger' | 'brand';
};

export function IconButton({ label, tone = 'default', className, children, ...rest }: IconBtnProps) {
  const tones = {
    default:
      'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white/90',
    brand:
      'text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10',
    danger:
      'text-error-500 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10',
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EditIconButton(props: Omit<IconBtnProps, 'children' | 'tone' | 'label'> & { label?: string }) {
  const { label = 'Edit', ...rest } = props;
  return (
    <IconButton label={label} tone="brand" {...rest}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );
}

export function DeleteIconButton(
  props: Omit<IconBtnProps, 'children' | 'tone' | 'label'> & { label?: string },
) {
  const { label = 'Delete', ...rest } = props;
  return (
    <IconButton label={label} tone="danger" {...rest}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-0.5">{children}</div>;
}

export const fieldClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800';

export const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-white px-3 py-1.5 text-sm font-medium text-error-600 shadow-theme-xs hover:bg-error-50 disabled:opacity-50 dark:border-error-500/40 dark:bg-transparent dark:text-error-400';

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-white/[0.03]';
