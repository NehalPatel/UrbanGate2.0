import { paiseToRupees, rupeesToPaise, subPaise } from './money';

describe('money helpers', () => {
  it('converts rupees to paise', () => {
    expect(rupeesToPaise('3500')).toBe(350000);
    expect(rupeesToPaise(3500.5)).toBe(350050);
  });

  it('converts paise to rupee string', () => {
    expect(paiseToRupees(400000)).toBe('4000.00');
    expect(paiseToRupees(250050)).toBe('2500.50');
  });

  it('computes outstanding after partial payment', () => {
    const total = rupeesToPaise(4000);
    const paid = rupeesToPaise(2500);
    expect(subPaise(total, paid)).toBe(150000);
    expect(paiseToRupees(subPaise(total, paid))).toBe('1500.00');
  });

  it('marks fully paid when amounts equal', () => {
    const total = rupeesToPaise(4000);
    const paid = rupeesToPaise(4000);
    expect(paid === total).toBe(true);
    expect(subPaise(total, paid)).toBe(0);
  });
});
