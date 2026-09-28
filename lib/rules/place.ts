/** Adding items and moving them to a spot. */
import { deskOrder, deskWidth, getItem, LIGHT_BAR, ONE_PER_DESK, RISER, SLOT_LABEL, TOPPERS, WEBCAM, type Item, type Placed, type Slot } from '@/data/catalog';
import { LIMITS, type PlaceResult, isArm, isMonitor, isSingleSlot, middle, monitorsOf, newUid } from './base';
import { mountInfo } from './mount';
import { usedWidth } from './layout';
import { Spot, fitProblem, freeze, layoutPlane, settle } from './plane';

// ---------------------------------------------------------------------------
// Adding
// ---------------------------------------------------------------------------

/** Decides whether `item` may go into `slot` given what is already placed. */
export function canPlace(placed: Placed[], item: Item, slot: Slot): PlaceResult {
  if (item.slot !== slot) {
    return { ok: false, reason: `${item.name} belongs on ${SLOT_LABEL[item.slot]}.` };
  }

  if (isSingleSlot(slot)) {
    const replaced = placed.find((p) => p.slot === slot);
    if (slot === 'desk') {
      const problem = fitProblem(placed, item.id);
      if (problem) return { ok: false, reason: `Your setup ${problem}. Remove something first.` };
    }
    return { ok: true, replaced };
  }

  const inSlot = placed.filter((p) => p.slot === slot);

  if (slot === 'desk-surface') {
    const desk = placed.find((p) => p.slot === 'desk');
    if (!desk) return { ok: false, reason: 'Pick a desk first.' };
    const monitors = monitorsOf(placed);

    if (isMonitor(item.id) && monitors.length >= LIMITS.monitors) {
      return { ok: false, reason: `Max ${LIMITS.monitors} monitors. Your neck will thank you.` };
    }
    if (ONE_PER_DESK.has(item.id) && inSlot.some((p) => p.itemId === item.id)) {
      return { ok: false, reason: `You already have a ${item.name}. One is enough.` };
    }
    if (isArm(item.id)) {
      const other = inSlot.find((p) => isArm(p.itemId));
      if (other) return { ok: false, reason: `You already have a ${getItem(other.itemId)?.name}. Remove it first.` };
    }
    if (TOPPERS.has(item.id)) {
      if (!monitors.length) return { ok: false, reason: `The ${item.name} clips onto a monitor. Add a monitor first.` };
      const taken = inSlot.filter((p) => p.itemId === item.id).length;
      if (item.id === LIGHT_BAR && taken >= monitors.length) {
        return { ok: false, reason: 'Every monitor already has a light bar.' };
      }
    }

    const next = applyAddRaw(placed, item.id, slot, 'probe');
    const problem = fitProblem(next, desk.itemId);
    if (problem) {
      const need = usedWidth(next) - usedWidth(placed);
      const free = deskWidth(desk.itemId) - usedWidth(placed);
      return {
        ok: false,
        reason: problem.startsWith('the screens')
          ? `No room: ${problem}. Try a portrait screen or fewer screens.`
          : `No room: ${item.name} needs ${need} cm, only ${free} cm left on the ${getItem(desk.itemId)?.name}.`,
      };
    }
    return { ok: true };
  }

  if (inSlot.length >= LIMITS.zone) {
    return { ok: false, reason: `That zone is full: max ${LIMITS.zone} items.` };
  }
  return { ok: true };
}

/** Adds without checking rules: picks the host (webcam, light bar, riser) and the natural spot. */
function applyAddRaw(placed: Placed[], itemId: string, slot: Slot, uid: string, at?: Spot): Placed[] {
  const kept = isSingleSlot(slot) ? placed.filter((p) => p.slot !== slot) : placed;
  const next: Placed = { uid, itemId, slot, ...(at && slot === 'desk-surface' ? { x: at.x, y: at.y } : {}) };

  if (slot === 'desk-surface') {
    const monitors = monitorsOf(kept);
    if (itemId === WEBCAM) next.host = middle(monitors)?.uid;
    if (itemId === LIGHT_BAR) {
      const free = monitors.filter((m) => !kept.some((p) => p.itemId === LIGHT_BAR && p.host === m.uid));
      next.host = middle(free)?.uid;
    }
    if (itemId === RISER) {
      const mounted = new Set(mountInfo(kept).mounted.map((m) => m.uid));
      next.host = monitors.find((m) => !mounted.has(m.uid) && !kept.some((p) => p.itemId === RISER && p.host === m.uid))?.uid;
    }
    // Drop it into its natural spot: plant left, screens in the middle, lamp right.
    const at = kept.findIndex((p) => p.slot === 'desk-surface' && deskOrder(p.itemId) > deskOrder(itemId));
    if (at >= 0) return [...kept.slice(0, at), next, ...kept.slice(at)];
  }
  return [...kept, next];
}

/** Pure add: returns the next `placed` list plus the rule result. */
export function applyAdd(
  placed: Placed[],
  itemId: string,
  slot: Slot,
  uid: string = newUid(),
  at?: Spot,
): { placed: Placed[]; result: PlaceResult } {
  const item = getItem(itemId);
  if (!item) return { placed, result: { ok: false, reason: 'Unknown item.' } };
  const result = canPlace(placed, item, slot);
  if (!result.ok) return { placed, result };
  const next = settle(applyAddRaw(placed, itemId, slot, uid, at), uid);
  if (!next) return { placed, result: { ok: false, reason: `No room for the ${item.name} on this desk.` } };
  return { placed: next, result };
}

/** Move an item on the desk top to `at` (cm from left / back); it takes the nearest free spot. */
export function applyMoveTo(placed: Placed[], uid: string, at: Spot): Placed[] {
  if (!placed.some((p) => p.uid === uid)) return placed;
  const moved = placed.map((p) => (p.uid === uid ? { ...p, x: at.x, y: at.y } : p));
  return layoutPlane(moved, uid).overflow.length ? placed : freeze(moved, uid);
}
