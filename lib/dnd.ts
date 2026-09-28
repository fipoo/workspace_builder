import type { Slot } from '@/data/catalog';

export type DragData =
  | { kind: 'catalog'; itemId: string; slot: Slot }
  | { kind: 'placed'; uid: string; itemId: string; slot: Slot };

export type ZoneData = { slot: Slot };

export const zoneId = (slot: Slot) => `zone-${slot}`;

// A drag that ends back on its own tile can still fire a click. Swallow that click
// so a drag never doubles as a tap-to-add.
let lastDragEnd = 0;

export function markDragEnd() {
  lastDragEnd = Date.now();
}

export function recentlyDragged() {
  return Date.now() - lastDragEnd < 300;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
