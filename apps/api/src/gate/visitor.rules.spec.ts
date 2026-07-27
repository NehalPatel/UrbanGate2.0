import { canTransitionVisitor } from './visitor.rules';

describe('visitor status transitions', () => {
  it('allows approve from REQUESTED', () => {
    expect(canTransitionVisitor('REQUESTED', 'APPROVED')).toBe(true);
  });

  it('rejects approve from CHECKED_IN', () => {
    expect(canTransitionVisitor('CHECKED_IN', 'APPROVED')).toBe(false);
  });

  it('allows check-out only from CHECKED_IN', () => {
    expect(canTransitionVisitor('CHECKED_IN', 'CHECKED_OUT')).toBe(true);
    expect(canTransitionVisitor('APPROVED', 'CHECKED_OUT')).toBe(false);
  });
});
