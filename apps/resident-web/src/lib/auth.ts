export type AuthUser = {
  id: string;
  name: string;
  email: string;
  activeSocietyId: string | null;
  permissions: string[];
};

export type MeResponse = { user: AuthUser };
