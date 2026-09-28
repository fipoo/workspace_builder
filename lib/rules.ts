import { getItem, MONITOR_IDS, SLOT_LABEL, type Item, type Placed, type Slot } from '@/data/catalog';

export const LIMITS = { monitors: 3, accessories: 8, zone: 4 } as const;

export type PlaceResult =
  | { ok: true; replaced?: Placed }
  | { ok: false; reason: string };

const SINGLE_SLOTS: Slot[] = ['desk', 'chair'];

export function isSingleSlot(slot: Slot) {
  return SINGLE_SLOTS.includes(slot);
}

export function isMonitor(itemId: string) {
  return MONITOR_IDS.has(itemId);
}

/** Decides whether `item` may go into `slot` given what is already placed. */
export function canPlace(placed: Placed[], item: Item, slot: Slot): PlaceResult {
  if (item.slot !== slot) {
    return { ok: false, reason: `${item.name} belongs on ${SLOT_LABEL[item.slot]}.` };
  }

  if (isSingleSlot(slot)) {
    return { ok: true, replaced: placed.find((p) => p.slot === slot) };
  }

  const inSlot = placed.filter((p) => p.slot === slot);

  if (slot === 'desk-surface') {
    if (!placed.some((p) => p.slot === 'desk')) {
      return { ok: false, reason: 'Pick a desk first.' };
    }
    if (inSlot.length >= LIMITS.accessories) {
      return { ok: false, reason: `Desk is full: max ${LIMITS.accessories} accessories.` };
    }
    if (isMonitor(item.id) && inSlot.filter((p) => isMonitor(p.itemId)).length >= LIMITS.monitors) {
      return { ok: false, reason: `Max ${LIMITS.monitors} monitors. Your neck will thank you.` };
    }
    return { ok: true };
  }

  if (inSlot.length >= LIMITS.zone) {
    return { ok: false, reason: `That zone is full: max ${LIMITS.zone} items.` };
  }
  return { ok: true };
}

export function newUid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Pure add: returns the next `placed` list plus the rule result. */
export function applyAdd(
  placed: Placed[],
  itemId: string,
  slot: Slot,
  uid: string = newUid(),
): { placed: Placed[]; result: PlaceResult } {
  const item = getItem(itemId);
  if (!item) return { placed, result: { ok: false, reason: 'Unknown item.' } };

  const result = canPlace(placed, item, slot);
  if (!result.ok) return { placed, result };

  const replaced = result.replaced;
  const kept = replaced ? placed.filter((p) => p.uid !== replaced.uid) : placed;
  return { placed: [...kept, { uid, itemId, slot }], result };
}

/** Pure remove. Removing the desk also clears the desk top, since accessories need a desk. */
export function applyRemove(placed: Placed[], uid: string): { placed: Placed[]; removed: Placed[] } {
  const target = placed.find((p) => p.uid === uid);
  if (!target) return { placed, removed: [] };
  const removed = placed.filter(
    (p) => p.uid === uid || (target.slot === 'desk' && p.slot === 'desk-surface'),
  );
  return { placed: placed.filter((p) => !removed.includes(p)), removed };
}
