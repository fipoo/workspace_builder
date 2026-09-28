/** What stands where on the desk: back row, front, toppers, risers, laptop on stand. */
import { footprint, FRONT_OF_DESK, LAPTOP_STAND, LAPTOPS, RISER, TOPPERS, UNDER_DESK, type Placed } from '@/data/catalog';
import { isArm, monitorsOf, onDesk, perPlaced } from './base';
import { type MountInfo, mountInfo } from './mount';

// ---------------------------------------------------------------------------
// Desk layout: what stands where
// ---------------------------------------------------------------------------

export type DeskLayout = MountInfo & {
  /** Items standing along the back edge, left → right (includes mounted monitors, which keep their order). */
  row: Placed[];
  front: Placed[];
  /** Webcam / light bar per monitor uid. */
  toppers: Map<string, Placed[]>;
  /** Riser under each monitor uid. */
  risers: Map<string, Placed>;
  /** The laptop sitting on the laptop stand, if both are on the desk. */
  laptopOnStand: Placed | null;
};

export const deskLayout = perPlaced(function deskLayout(placed: Placed[]): DeskLayout {
  const info = mountInfo(placed);
  const items = onDesk(placed);
  const monitorIds = new Set(monitorsOf(placed).map((m) => m.uid));
  const mountedIds = new Set(info.mounted.map((m) => m.uid));

  const toppers = new Map<string, Placed[]>();
  const risers = new Map<string, Placed>();
  for (const p of items) {
    if (TOPPERS.has(p.itemId) && p.host && monitorIds.has(p.host)) {
      toppers.set(p.host, [...(toppers.get(p.host) ?? []), p]);
    }
    // A riser only lifts a monitor that stands on its own stand (not one on an arm)
    if (p.itemId === RISER && p.host && monitorIds.has(p.host) && !mountedIds.has(p.host) && !risers.has(p.host)) {
      risers.set(p.host, p);
    }
  }
  const riserIds = new Set([...risers.values()].map((r) => r.uid));
  const topperIds = new Set([...toppers.values()].flat().map((t) => t.uid));
  const hasStand = items.some((p) => p.itemId === LAPTOP_STAND);
  const laptopOnStand = hasStand ? (items.find((p) => LAPTOPS.has(p.itemId)) ?? null) : null;

  const row = items.filter(
    (p) =>
      !FRONT_OF_DESK.has(p.itemId) &&
      !UNDER_DESK.has(p.itemId) &&
      !isArm(p.itemId) &&
      !topperIds.has(p.uid) &&
      !riserIds.has(p.uid) &&
      p !== laptopOnStand,
  );
  const front = items.filter((p) => FRONT_OF_DESK.has(p.itemId));
  return { ...info, row, front, toppers, risers, laptopOnStand };
});

/** Items that can be moved left/right along the back edge. */
export function backRow(placed: Placed[]) {
  return deskLayout(placed).row;
}

/** Centimetres of desk width used along the back edge. */
export function usedWidth(placed: Placed[]) {
  const l = deskLayout(placed);
  const mountedIds = new Set(l.mounted.map((m) => m.uid));
  let cm = 0;
  for (const p of l.row) cm += mountedIds.has(p.uid) ? 0 : footprint(p.itemId);
  if (l.arm) cm += footprint(l.arm.itemId);
  if (l.laptopOnStand) cm += Math.max(0, footprint(l.laptopOnStand.itemId) - footprint(LAPTOP_STAND));
  return cm;
}
