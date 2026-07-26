export const PERMISSIONS = [
  'society.view',
  'society.create',
  'society.update',
  'building.view',
  'building.create',
  'building.update',
  'building.delete',
  'unit.view',
  'unit.create',
  'unit.update',
  'unit.delete',
  'member.view',
  'member.invite',
  'member.update',
  'audit.view',
  'invoice.view',
  'invoice.create',
  'invoice.issue',
  'invoice.cancel',
  'payment.view',
  'payment.record',
  'payment.verify',
  'payment.reverse',
  'maintenance.view',
  'maintenance.manage',
  'notice.view',
  'notice.create',
  'notice.publish',
  'complaint.view',
  'complaint.create',
  'complaint.assign',
  'complaint.resolve',
  'meeting.view',
  'meeting.create',
  'meeting.update',
  'meeting.complete',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_KEYS = [
  'PLATFORM_ADMIN',
  'SOCIETY_ADMIN',
  'CHAIRMAN',
  'SECRETARY',
  'TREASURER',
  'COMMITTEE_MEMBER',
  'ACCOUNTANT',
  'OWNER',
  'TENANT',
  'RESIDENT',
  'SECURITY_SUPERVISOR',
  'SECURITY_GUARD',
  'STAFF',
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

const COMMUNITY_ADMIN: Permission[] = [
  'notice.view',
  'notice.create',
  'notice.publish',
  'complaint.view',
  'complaint.create',
  'complaint.assign',
  'complaint.resolve',
  'meeting.view',
  'meeting.create',
  'meeting.update',
  'meeting.complete',
];

const ALL_SOCIETY_ADMIN: Permission[] = [
  'society.view',
  'society.update',
  'building.view',
  'building.create',
  'building.update',
  'building.delete',
  'unit.view',
  'unit.create',
  'unit.update',
  'unit.delete',
  'member.view',
  'member.invite',
  'member.update',
  'audit.view',
  'invoice.view',
  'invoice.create',
  'invoice.issue',
  'invoice.cancel',
  'payment.view',
  'payment.record',
  'payment.verify',
  'payment.reverse',
  'maintenance.view',
  'maintenance.manage',
  ...COMMUNITY_ADMIN,
];

const FINANCE_CORE: Permission[] = [
  'society.view',
  'building.view',
  'unit.view',
  'member.view',
  'audit.view',
  'invoice.view',
  'invoice.create',
  'invoice.issue',
  'invoice.cancel',
  'payment.view',
  'payment.record',
  'payment.verify',
  'payment.reverse',
  'maintenance.view',
  'maintenance.manage',
];

export const ROLE_PERMISSIONS: Record<RoleKey, readonly Permission[]> = {
  PLATFORM_ADMIN: [...PERMISSIONS],
  SOCIETY_ADMIN: ALL_SOCIETY_ADMIN,
  CHAIRMAN: ALL_SOCIETY_ADMIN,
  SECRETARY: [
    'society.view',
    'building.view',
    'building.create',
    'building.update',
    'unit.view',
    'unit.create',
    'unit.update',
    'member.view',
    'member.invite',
    'member.update',
    'audit.view',
    'invoice.view',
    'maintenance.view',
    ...COMMUNITY_ADMIN,
  ],
  TREASURER: FINANCE_CORE,
  COMMITTEE_MEMBER: [
    'society.view',
    'building.view',
    'unit.view',
    'member.view',
    'invoice.view',
    'notice.view',
    'complaint.view',
    'complaint.assign',
    'meeting.view',
  ],
  ACCOUNTANT: FINANCE_CORE,
  OWNER: [
    'society.view',
    'building.view',
    'unit.view',
    'member.view',
    'invoice.view',
    'payment.view',
    'notice.view',
    'complaint.view',
    'complaint.create',
    'meeting.view',
  ],
  TENANT: [
    'society.view',
    'building.view',
    'unit.view',
    'invoice.view',
    'payment.view',
    'notice.view',
    'complaint.view',
    'complaint.create',
    'meeting.view',
  ],
  RESIDENT: [
    'society.view',
    'building.view',
    'unit.view',
    'invoice.view',
    'notice.view',
    'complaint.view',
    'complaint.create',
    'meeting.view',
  ],
  SECURITY_SUPERVISOR: ['society.view', 'building.view', 'unit.view', 'member.view'],
  SECURITY_GUARD: ['society.view', 'building.view', 'unit.view'],
  STAFF: ['society.view', 'building.view', 'unit.view', 'complaint.view', 'complaint.assign'],
};

export function permissionsForRoles(roleKeys: string[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const key of roleKeys) {
    const perms = ROLE_PERMISSIONS[key as RoleKey];
    if (!perms) continue;
    for (const p of perms) set.add(p);
  }
  return set;
}

export function hasPermission(roleKeys: string[], permission: Permission): boolean {
  return permissionsForRoles(roleKeys).has(permission);
}
