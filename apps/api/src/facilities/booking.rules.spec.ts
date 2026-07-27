import { rangesOverlap, isCapacityExceeded } from './booking.rules';

describe('booking overlap rules', () => {
  const start = new Date('2026-07-28T10:00:00.000Z');
  const end = new Date('2026-07-28T11:00:00.000Z');

  it('detects overlapping ranges', () => {
    expect(
      rangesOverlap(start, end, new Date('2026-07-28T10:30:00.000Z'), new Date('2026-07-28T11:30:00.000Z')),
    ).toBe(true);
  });

  it('allows adjacent non-overlapping ranges', () => {
    expect(
      rangesOverlap(start, end, new Date('2026-07-28T11:00:00.000Z'), new Date('2026-07-28T12:00:00.000Z')),
    ).toBe(false);
  });

  it('blocks when capacity is full', () => {
    expect(isCapacityExceeded(1, 1)).toBe(true);
    expect(isCapacityExceeded(0, 1)).toBe(false);
  });
});
