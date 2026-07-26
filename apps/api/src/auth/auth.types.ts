import type { Permission } from '@urbangate/permissions';

export type AuthMembership = {
  id: string;
  societyId: string;
  roleKeys: string[];
  society: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  isPlatformAdmin: boolean;
  sessionId: string;
  activeSocietyId: string | null;
  memberships: AuthMembership[];
  permissions: Permission[];
};
