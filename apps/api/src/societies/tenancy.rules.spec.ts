import { shouldScopeToLinkedUnits } from './tenancy.rules';

describe('tenancy scope rules', () => {
  it('scopes owners to linked units', () => {
    expect(
      shouldScopeToLinkedUnits({
        isPlatformAdmin: false,
        permissions: ['invoice.view', 'visitor.create', 'booking.create'],
      }),
    ).toBe(true);
  });

  it('does not scope society admins', () => {
    expect(
      shouldScopeToLinkedUnits({
        isPlatformAdmin: false,
        permissions: ['invoice.create', 'member.invite', 'building.create'],
      }),
    ).toBe(false);
  });

  it('does not scope security guards with check-in', () => {
    expect(
      shouldScopeToLinkedUnits({
        isPlatformAdmin: false,
        permissions: ['visitor.checkin', 'unit.view', 'gate.view'],
      }),
    ).toBe(false);
  });

  it('does not scope platform admins', () => {
    expect(shouldScopeToLinkedUnits({ isPlatformAdmin: true, permissions: [] })).toBe(false);
  });
});
