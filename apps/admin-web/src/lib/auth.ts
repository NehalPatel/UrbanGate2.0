export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isPlatformAdmin: boolean;
  activeSocietyId: string | null;
  memberships: Array<{
    societyId: string;
    roleKeys: string[];
    society: { id: string; name: string; slug: string };
  }>;
  permissions: string[];
};

export type MeResponse = { user: AuthUser };

export const AUTH_CHANGED_EVENT = 'ug:auth-changed';

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}
