/** Pure tenancy scope rules for Gate C+ tests. */

export function shouldScopeToLinkedUnits(input: {
  isPlatformAdmin: boolean;
  permissions: string[];
}): boolean {
  if (input.isPlatformAdmin) return false;
  const p = new Set(input.permissions);
  if (
    p.has('invoice.create') ||
    p.has('member.invite') ||
    p.has('society.update') ||
    p.has('gate.manage') ||
    p.has('building.create')
  ) {
    return false;
  }
  if (p.has('visitor.checkin')) return false;
  if (p.has('member.view') && p.has('complaint.assign')) return false;
  return true;
}
