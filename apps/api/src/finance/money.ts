/**
 * Money helpers — MongoDB/Prisma has no Decimal type.
 * Store INR amounts as integer paise (1 rupee = 100 paise).
 * ADR-012 amended for MongoDB.
 */

export function rupeesToPaise(rupees: string | number): number {
  const n = typeof rupees === 'number' ? rupees : Number(rupees);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid rupee amount: ${rupees}`);
  }
  return Math.round(n * 100);
}

export function paiseToRupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function addPaise(a: number, b: number): number {
  return a + b;
}

export function subPaise(a: number, b: number): number {
  return a - b;
}
