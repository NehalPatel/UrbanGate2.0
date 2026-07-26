'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '../../lib/api';
import { notifyAuthChanged } from '../../lib/auth';
import { btnPrimary, fieldClass, labelClass } from '../../components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, name, password }),
        });
      }
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      notifyAuthChanged();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center p-6 sm:p-0">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
            UG
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {mode === 'login' ? 'Sign In' : 'Create account'}
          </h1>
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
            UrbanGate society administration
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 dark:border-gray-800 dark:bg-white/[0.03]">
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' ? (
              <div>
                <label className={labelClass} htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            ) : null}
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                minLength={8}
                className={fieldClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-error-50 px-3 py-2 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-500">
                {error}
              </p>
            ) : null}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Register & Sign In'}
            </button>
          </form>
          <p className="mt-5 text-center text-theme-sm text-gray-500">
            {mode === 'login' ? 'Need an account?' : 'Have an account?'}{' '}
            <button
              type="button"
              className="font-medium text-brand-500 hover:text-brand-600"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          <p className="mt-4 text-center text-theme-xs text-gray-400">
            Demo: admin@urbangate.demo / Password123!
          </p>
        </div>
      </div>
    </div>
  );
}
