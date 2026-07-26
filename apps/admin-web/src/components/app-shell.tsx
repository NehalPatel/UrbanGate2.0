'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { api, ApiError } from '../lib/api';
import {
  AUTH_CHANGED_EVENT,
  type AuthUser,
  type MeResponse,
  notifyAuthChanged,
} from '../lib/auth';
import { AppHeader } from '../layout/AppHeader';
import { AppSidebar } from '../layout/AppSidebar';
import { Backdrop } from '../layout/Backdrop';
import { cn } from '../lib/cn';

function AuthenticatedShell({
  user,
  children,
  onLogout,
}: {
  user: AuthUser;
  children: ReactNode;
  onLogout: () => void;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const activeSociety = user.memberships.find(
    (m) => m.societyId === user.activeSocietyId,
  )?.society;

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out',
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]',
          isMobileOpen ? 'ml-0' : '',
        )}
      >
        <AppHeader
          user={user}
          activeSocietyName={activeSociety?.name}
          onLogout={onLogout}
        />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const isLoginPage = pathname === '/login';

  const refreshAuth = useCallback(async () => {
    try {
      const data = await api<MeResponse>('/auth/me');
      setUser(data.user);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
        setUser(null);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth, pathname]);

  useEffect(() => {
    const onChange = () => void refreshAuth();
    window.addEventListener(AUTH_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
  }, [refreshAuth]);

  useEffect(() => {
    if (!ready) return;
    if (user && isLoginPage) router.replace('/');
    if (!user && !isLoginPage) router.replace('/login');
  }, [ready, user, isLoginPage, router]);

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      notifyAuthChanged();
      router.push('/login');
    }
  }

  if (isLoginPage || (ready && !user)) {
    return <>{children}</>;
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AuthenticatedShell user={user} onLogout={() => void logout()}>
        {children}
      </AuthenticatedShell>
    </SidebarProvider>
  );
}
