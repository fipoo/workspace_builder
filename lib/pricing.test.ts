import { describe, expect, it } from 'vitest';
import type { Placed } from '@/data/catalog';
import { cartTotal, formatIDR, formatIDRShort, monthlyTotal, savings } from './pricing';

const setup: Placed[] = [
  { uid: 'a', itemId: 'desks-minimal-oak', slot: 'desk' }, // 400k
  { uid: 'b', itemId: 'chairs-ergo-mesh', slot: 'chair' }, // 450k
  { uid: 'c', itemId: 'accessories-plant', slot: 'desk-surface' }, // 60k
];

describe('pricing', () => {
  it('sums the monthly price', () => {
    expect(monthlyTotal(setup)).toBe(910_000);
    expect(cartTotal(setup, 'month')).toBe(910_000);
  });

  it('applies the weekly rate', () => {
    // 120k + 135k + 18k
    expect(cartTotal(setup, 'week')).toBe(273_000);
  });

  it('applies 15% off for 3 months', () => {
    // 1.020.000 + 1.147.500 (rounds to 1.148.000) + 153.000
    expect(cartTotal(setup, 'quarter')).toBe(2_321_000);
    expect(savings(setup, 'quarter')).toBe(910_000 * 3 - 2_321_000);
  });

  it('is zero for an empty cart', () => {
    expect(cartTotal([], 'quarter')).toBe(0);
  });

  it('formats rupiah', () => {
    expect(formatIDR(910_000)).toBe('Rp 910.000');
    expect(formatIDRShort(450_000)).toBe('Rp 450rb');
    expect(formatIDRShort(1_200_000)).toBe('Rp 1,2jt');
  });
});
