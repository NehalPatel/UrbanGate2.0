'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSidebar } from '../context/SidebarContext';
import type { AuthUser } from '../lib/auth';
import { cn } from '../lib/cn';

type Props = {
  user: AuthUser;
  activeSocietyName?: string;
  onLogout: () => void;
};

export function AppHeader({ user, activeSocietyName, onLogout }: Props) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white lg:border-b dark:border-gray-800 dark:bg-gray-900">
      <div className="flex w-full grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 dark:border-gray-800">
          <button
            type="button"
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg border-gray-200 text-gray-500 lg:flex lg:h-11 lg:w-11 lg:border dark:border-gray-800 dark:text-gray-400"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <span className="text-xl leading-none">×</span>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          <Link href="/" className="lg:hidden">
            <span className="text-lg font-semibold text-gray-800 dark:text-white/90">UrbanGate</span>
          </Link>

          <div className="hidden lg:block">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              {activeSocietyName ?? 'No active society'}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-3 px-3 py-3 lg:px-0 lg:py-4">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pr-2.5 pl-1.5 dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.name}
                </span>
              </span>
            </button>
            <div
              className={cn(
                'absolute right-0 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark',
                menuOpen ? 'block' : 'hidden',
              )}
            >
              <div className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-800">
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{user.name}</p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <button
                type="button"
                className="flex w-full items-center rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                onClick={onLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
