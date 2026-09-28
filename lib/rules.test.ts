import { describe, expect, it } from 'vitest';
import { CATALOG, type Placed } from '@/data/catalog';
import { applyAdd, applyRemove, LIMITS } from './rules';

let n = 0;
const add = (placed: Placed[], itemId: string) => {
  const item = CATALOG.find((i) => i.id === itemId)!;
  return applyAdd(placed, itemId, item.slot, `u${n++}`);
};

describe('catalog', () => {
  it('has 7 categories x 10 items with unique ids', () => {
    expect(CATALOG).toHaveLength(70);
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(70);
  });
});

describe('single slots', () => {
  it('a new desk replaces the old one', () => {
    const s = add([], 'desks-bamboo').placed;
    const r = add(s, 'desks-gaming');
    expect(r.result.ok && r.result.replaced?.itemId).toBe('desks-bamboo');
    expect(r.placed.filter((p) => p.slot === 'desk').map((p) => p.itemId)).toEqual(['desks-gaming']);
  });

  it('a new chair replaces the old one', () => {
    let s = add([], 'chairs-stool').placed;
    s = add(s, 'chairs-rattan').placed;
    expect(s.map((p) => p.itemId)).toEqual(['chairs-rattan']);
  });
});

describe('desk surface', () => {
  it('needs a desk first', () => {
    const r = add([], 'accessories-plant');
    expect(r.result).toEqual({ ok: false, reason: 'Pick a desk first.' });
    expect(r.placed).toEqual([]);
  });

  it('allows at most 3 monitors', () => {
    let s = add([], 'desks-compact').placed;
    for (let i = 0; i < LIMITS.monitors; i++) s = add(s, 'accessories-monitor-24').placed;
    expect(add(s, 'accessories-ultrawide').result.ok).toBe(false);
    expect(add(s, 'accessories-plant').result.ok).toBe(true);
  });

  it('allows at most 8 accessories', () => {
    let s = add([], 'desks-compact').placed;
    for (let i = 0; i < LIMITS.accessories; i++) s = add(s, 'accessories-mouse').placed;
    expect(s.filter((p) => p.slot === 'desk-surface')).toHaveLength(8);
    expect(add(s, 'accessories-plant').result.ok).toBe(false);
  });

  it('removing the desk clears its accessories', () => {
    let s = add([], 'desks-compact').placed;
    s = add(s, 'accessories-plant').placed;
    s = add(s, 'chairs-stool').placed;
    const desk = s.find((p) => p.slot === 'desk')!;
    const r = applyRemove(s, desk.uid);
    expect(r.removed).toHaveLength(2);
    expect(r.placed.map((p) => p.slot)).toEqual(['chair']);
  });
});

describe('zones', () => {
  it('allow at most 4 items each', () => {
    let s: Placed[] = [];
    for (let i = 0; i < LIMITS.zone; i++) s = add(s, 'coffee-kettle').placed;
    expect(add(s, 'coffee-espresso').result.ok).toBe(false);
    expect(add(s, 'garage-fan').result.ok).toBe(true);
  });

  it('reject items dropped on the wrong slot', () => {
    expect(applyAdd([], 'coffee-kettle', 'garage').result.ok).toBe(false);
  });
});
