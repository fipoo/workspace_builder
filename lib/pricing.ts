import { getItem, type Placed } from '@/data/catalog';

export type Duration = 'week' | 'month' | 'quarter';

export const DURATIONS: Record<Duration, { label: string; multiplier: number; note: string; badge?: string }> = {
  week: { label: '1 week', multiplier: 0.3, note: 'Short-stay rate' },
  month: { label: '1 month', multiplier: 1, note: 'Standard monthly rate' },
  quarter: { label: '3 months', multiplier: 3 * 0.85, note: '15% off the monthly rate', badge: 'Save 15%' },
};

export const DURATION_KEYS = Object.keys(DURATIONS) as Duration[];

/** Rounds to the nearest Rp 1.000 so totals look like real price tags. */
const roundK = (n: number) => Math.round(n / 1000) * 1000;

export function monthlyTotal(placed: Placed[]): number {
  return placed.reduce((sum, p) => sum + (getItem(p.itemId)?.pricePerMonth ?? 0), 0);
}

export function priceFor(pricePerMonth: number, duration: Duration): number {
  return roundK(pricePerMonth * DURATIONS[duration].multiplier);
}

export function cartTotal(placed: Placed[], duration: Duration): number {
  return placed.reduce((sum, p) => sum + priceFor(getItem(p.itemId)?.pricePerMonth ?? 0, duration), 0);
}

/** Savings versus paying the plain monthly rate for the same period. */
export function savings(placed: Placed[], duration: Duration): number {
  if (duration !== 'quarter') return 0;
  return monthlyTotal(placed) * 3 - cartTotal(placed, duration);
}

const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function formatIDR(n: number): string {
  return idr.format(n).replace(/ /g, ' ');
}

/** "Rp 450rb" / "Rp 1,2jt" for tight spaces. */
export function formatIDRShort(n: number): string {
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    return `Rp ${jt.toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`;
  }
  return `Rp ${Math.round(n / 1000)}rb`;
}
