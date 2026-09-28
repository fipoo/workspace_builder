/** The desk top as a real surface in cm: placing, view rules, fit checks. */
import { ARM_OVERHANG_CM, deskOrder, deskWidth, footprint, FRONT_OF_DESK, getItem, LAPTOP_STAND, type Placed } from '@/data/catalog';
import { DIMS } from '@/data/dims';
import { clamp, isArm, isMonitor, perPlaced } from './base';
import { mountInfo, screenWidth } from './mount';
import { deskLayout, usedWidth } from './layout';

// ---------------------------------------------------------------------------
// Desk top as a real surface (width × depth in cm): every item has a spot, nothing overlaps
// ---------------------------------------------------------------------------

export type Spot = { x: number; y: number };
export type Rect = Spot & { uid: string; itemId: string; w: number; d: number };
export type Plane = { W: number; D: number; rects: Map<string, Rect>; overflow: Placed[] };

export const deskDepth = (deskId: string) => DIMS[deskId]?.d ?? 60;

/** Things that stand on the desk top, with the footprint each one takes. */
function planeItems(placed: Placed[]): { p: Placed; w: number; d: number }[] {
  const L = deskLayout(placed);
  const mounted = new Set(L.mounted.map((m) => m.uid));
  const size = (id: string) => DIMS[id] ?? { w: footprint(id) || 15, d: 15 };
  const out: { p: Placed; w: number; d: number }[] = [];
  for (const p of [...L.row, ...L.front]) {
    if (mounted.has(p.uid)) continue; // floats on the arm: the desk under it stays free
    let { w, d } = size(p.itemId);
    if (p.turn) {
      // A turned item takes the bounding box of its rotated footprint
      const a = (Math.abs(p.turn) * Math.PI) / 180;
      ({ w, d } = { w: w * Math.cos(a) + d * Math.sin(a), d: w * Math.sin(a) + d * Math.cos(a) });
    }
    const riser = L.risers.get(p.uid);
    if (riser) {
      w = Math.max(w, size(riser.itemId).w);
      d = Math.max(d, size(riser.itemId).d);
    }
    if (p.itemId === LAPTOP_STAND && L.laptopOnStand) {
      const lap = size(L.laptopOnStand.itemId);
      w = Math.max(w, lap.w);
      d = Math.max(d, lap.d);
    }
    out.push({ p, w, d });
  }
  if (L.arm) out.push({ p: L.arm, w: size(L.arm.itemId).w, d: size(L.arm.itemId).d });
  return out;
}

/** Where an item goes when you don't say: screens centre-back, plant left, lamp right, keyboard front. */
function defaultSpot(itemId: string, w: number, d: number, W: number, D: number): Spot {
  const front = Math.max(0, D - d - 5);
  if (itemId === 'accessories-keyboard') return { x: (W - w) / 2, y: front };
  if (itemId === 'accessories-mouse') return { x: W / 2 + 26, y: front };
  if (FRONT_OF_DESK.has(itemId)) return { x: W / 2 - 40, y: front };
  if (isArm(itemId)) return { x: (W - w) / 2, y: 0 };
  const order = isMonitor(itemId) ? 4.5 : deskOrder(itemId);
  return { x: (order / 9) * Math.max(0, W - w), y: 0 };
}

const overlaps = (a: { x: number; y: number; w: number; d: number }, b: Rect) =>
  a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.d - 0.01 && b.y < a.y + a.d - 0.01;

/** Nearest free spot to `target` (x weighs less than y, so things slide along their row first). */
function nearestFree(target: Spot, w: number, d: number, W: number, D: number, ok: (s: Spot) => boolean): Spot | null {
  if (w > W || d > D) return null;
  let best: Spot | null = null;
  let bestCost = Infinity;
  for (let y = 0; y <= D - d + 1e-6; y += 1) {
    for (let x = 0; x <= W - w + 1e-6; x += 1) {
      const cost = Math.abs(x - target.x) + 2.5 * Math.abs(y - target.y);
      if (cost >= bestCost) continue;
      if (!ok({ x, y })) continue;
      best = { x, y };
      bestCost = cost;
    }
  }
  return best;
}

/**
 * Lays out the desk top. Items with a saved spot keep it when it is free; otherwise they take the
 * nearest free spot. `last` is placed after everything else (the item being dragged or added).
 */
export function layoutPlane(placed: Placed[], last?: string): Plane {
  return last === undefined ? planeCached(placed) : computePlane(placed, last);
}

const planeCached = perPlaced((placed) => computePlane(placed));

function computePlane(placed: Placed[], last?: string): Plane {
  const desk = placed.find((p) => p.slot === 'desk');
  const W = desk ? deskWidth(desk.itemId) : 150;
  const D = desk ? deskDepth(desk.itemId) : 60;
  const items = planeItems(placed);
  const arms = items.filter((i) => isArm(i.p.itemId));
  const rest = items.filter((i) => !isArm(i.p.itemId));
  const ordered = [
    ...arms,
    ...rest.filter((i) => i.p.uid !== last && i.p.x !== undefined),
    ...rest.filter((i) => i.p.uid !== last && i.p.x === undefined),
    ...rest.filter((i) => i.p.uid === last),
  ];
  const rects = new Map<string, Rect>();
  const overflow: Placed[] = [];
  const armInfo = mountInfo(placed);
  let screens: [number, number] | null = null; // x-range the arm's screens cover

  // Screens without a spot line up as one centred group, side by side
  const autoScreens = rest.filter((i) => isMonitor(i.p.itemId) && i.p.x === undefined);
  const groupW = autoScreens.reduce((a, i) => a + i.w, 0);
  const groupX = new Map<string, number>();
  autoScreens.reduce((x, i) => (groupX.set(i.p.uid, x), x + i.w), Math.max(0, (W - groupW) / 2));

  for (const { p, w, d } of ordered) {
    const taken = [...rects.values()];
    const inside = (r: Spot) => r.x >= -0.01 && r.y >= -0.01 && r.x + w <= W + 0.01 && r.y + d <= D + 0.01;
    const ok = (r: Spot) => inside(r) && !taken.some((t) => overlaps({ ...r, w, d }, t)) && viewOk(p.itemId, { ...r, w, d }, taken, screens);
    const want: Spot =
      p.x !== undefined && p.y !== undefined
        ? { x: clamp(p.x, 0, Math.max(0, W - w)), y: clamp(p.y, 0, Math.max(0, D - d)) }
        : groupX.has(p.uid)
          ? { x: groupX.get(p.uid)!, y: 0 }
          : defaultSpot(p.itemId, w, d, W, D);
    const spot = w <= W && d <= D && ok(want) ? want : nearestFree(want, w, d, W, D, ok);
    if (spot) {
      rects.set(p.uid, { uid: p.uid, itemId: p.itemId, x: spot.x, y: spot.y, w, d });
      if (isArm(p.itemId) && armInfo.mounted.length && armInfo.spec?.layout === 'row') {
        const cx = spot.x + w / 2;
        screens = [cx - armInfo.rowWidth / 2, cx + armInfo.rowWidth / 2];
      } else if (isArm(p.itemId) && armInfo.mounted.length) {
        const cx = spot.x + w / 2;
        const widest = Math.max(...armInfo.mounted.map((m) => screenWidth(m, true)));
        screens = [cx - widest / 2, cx + widest / 2];
      }
    } else overflow.push(p);
  }
  return { W, D, rects, overflow };
}

/** Anything taller than this in front of a screen would block it. */
export const BLOCKS_VIEW_CM = 12;
/** Room under screens on an arm. */
export const UNDER_ARM_CM = 20;

const heightOf = (id: string) => DIMS[id]?.h ?? 10;
const xOverlap = (a: { x: number; w: number }, b: { x: number; w: number }) => a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01;

/**
 * Real-world view rules: screens stand side by side (never one behind another), nothing tall stands
 * in front of a screen, and only low things fit under screens on an arm.
 */
function viewOk(itemId: string, r: Spot & { w: number; d: number }, taken: Rect[], screens: [number, number] | null) {
  const tall = heightOf(itemId) > BLOCKS_VIEW_CM;
  if (isMonitor(itemId)) {
    for (const t of taken) {
      if (!xOverlap(r, t)) continue;
      if (isMonitor(t.itemId)) return false; // one screen behind another
      if (heightOf(t.itemId) > BLOCKS_VIEW_CM && t.y > r.y) return false; // something tall in front of it
    }
  } else if (tall) {
    // Tall things can't stand in front of a screen
    if (taken.some((t) => isMonitor(t.itemId) && xOverlap(r, t) && t.y < r.y)) return false;
  }
  if (screens && !isArm(itemId) && heightOf(itemId) > UNDER_ARM_CM && r.x < screens[1] && screens[0] < r.x + r.w) {
    return false; // too tall to fit under the screens on the arm
  }
  return true;
}

/**
 * Lays out the desk top and saves every spot. If things don't fit where they are, tries once more
 * with everything re-packed from scratch (like sliding things over on a real desk).
 * Returns null when it doesn't fit either way.
 */
export function settle(placed: Placed[], last?: string): Placed[] | null {
  if (!layoutPlane(placed, last).overflow.length) return freeze(placed, last);
  const loose = placed.map((p) => (p.slot === 'desk-surface' && p.uid !== last ? { ...p, x: undefined, y: undefined } : p));
  if (!layoutPlane(loose, last).overflow.length) return freeze(loose, last);
  return null;
}

/** Saves every item's resolved spot, so later changes don't shuffle things around. */
export function freeze(placed: Placed[], last?: string): Placed[] {
  const { rects } = layoutPlane(placed, last);
  return placed.map((p) => {
    const r = rects.get(p.uid);
    return r ? { ...p, x: Math.round(r.x * 2) / 2, y: Math.round(r.y * 2) / 2 } : p;
  });
}

/** Desk size and how much of its top is taken. `null` when there is no desk. */
export function deskSpace(placed: Placed[]) {
  const desk = placed.find((p) => p.slot === 'desk');
  if (!desk) return null;
  const plane = layoutPlane(placed);
  const area = plane.W * plane.D;
  const used = [...plane.rects.values()].reduce((a, r) => a + r.w * r.d, 0);
  return {
    deskId: desk.itemId,
    width: plane.W,
    depth: plane.D,
    used: usedWidth(placed),
    freePct: Math.max(0, Math.round(100 - (used / area) * 100)),
  };
}

/** Why this setup does not fit its desk, or null if it does. */
export function fitProblem(placed: Placed[], deskId: string): string | null {
  const probe = [...placed.filter((p) => p.slot !== 'desk'), { uid: '__desk', itemId: deskId, slot: 'desk' as const }];
  const plane = layoutPlane(probe);
  if (plane.overflow.length && !settle(probe)) {
    const names = plane.overflow.map((p) => getItem(p.itemId)?.name).join(', ');
    return `has no room for the ${names} on the ${getItem(deskId)?.name} (${plane.W} × ${plane.D} cm)`;
  }
  const { spec, rowWidth } = mountInfo(placed);
  if (spec && rowWidth > plane.W + ARM_OVERHANG_CM) {
    return `the screens on the arm would be ${rowWidth} cm wide, more than the ${plane.W} cm desk can hold`;
  }
  return null;
}
