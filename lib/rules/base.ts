/** Shared basics: limits, item kinds and small helpers. */
import { ARMS, MONITOR_IDS, type Placed, type Slot } from '@/data/catalog';

export const LIMITS = { monitors: 3, zone: 4 } as const;

export type PlaceResult = { ok: true; replaced?: Placed } | { ok: false; reason: string };

const SINGLE_SLOTS: Slot[] = ['desk', 'chair'];

export function isSingleSlot(slot: Slot) {
  return SINGLE_SLOTS.includes(slot);
}

export function isMonitor(itemId: string) {
  return MONITOR_IDS.has(itemId);
}

export function isArm(itemId: string) {
  return itemId in ARMS;
}

export const onDesk = (placed: Placed[]) => placed.filter((p) => p.slot === 'desk-surface');
export const monitorsOf = (placed: Placed[]) => onDesk(placed).filter((p) => isMonitor(p.itemId));
export const middle = <T,>(list: T[]) => list[Math.floor((list.length - 1) / 2)];

export function newUid() {
  return Math.random().toString(36).slice(2, 10);
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Caches a pure function of the placed list. The store never mutates `placed`, so the same array
 * always gives the same answer; the canvas, menus and panels share one computation per change.
 */
export function perPlaced<T>(fn: (placed: Placed[]) => T): (placed: Placed[]) => T {
  const cache = new WeakMap<Placed[], T>();
  return (placed) => {
    let v = cache.get(placed);
    if (v === undefined) cache.set(placed, (v = fn(placed)));
    return v;
  };
}
