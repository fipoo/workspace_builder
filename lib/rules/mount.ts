/** Monitor arms: which screens an arm holds, and why one cannot go on it. */
import { ARMS, getItem, MONITOR_SPEC, type ArmSpec, type Placed } from '@/data/catalog';
import { isArm, isMonitor, monitorsOf, onDesk, perPlaced } from './base';

// ---------------------------------------------------------------------------
// Monitor arms
// ---------------------------------------------------------------------------

export type MountInfo = {
  arm: Placed | null;
  spec: ArmSpec | null;
  /** Monitors held by the arm, left → right (or bottom → top for a stacked arm). */
  mounted: Placed[];
  /** Width the mounted screens take, in cm. */
  rowWidth: number;
};

/** Which monitors the arm holds: VESA screens light enough for it, in desk order, up to its capacity. */
export const mountInfo = perPlaced(function mountInfo(placed: Placed[]): MountInfo {
  const arm = onDesk(placed).find((p) => isArm(p.itemId)) ?? null;
  const spec = arm ? ARMS[arm.itemId] : null;
  const mounted: Placed[] = [];
  if (spec) {
    for (const m of monitorsOf(placed)) {
      if (m.arm !== false && mounted.length < spec.cap && canMount(m.itemId, spec)) mounted.push(m);
    }
  }
  const widths = mounted.map((m) => screenWidth(m, true));
  const rowWidth = spec?.layout === 'stack' ? Math.max(0, ...widths) : widths.reduce((a, b) => a + b, 0) + 1.5 * Math.max(0, widths.length - 1);
  return { arm, spec, mounted, rowWidth: Math.round(rowWidth) };
});

/** A screen can go on an arm when it has a VESA mount and the arm can carry its weight. */
export function canMount(itemId: string, spec: ArmSpec) {
  const ms = MONITOR_SPEC[itemId];
  return !!ms?.vesa && ms.kg <= spec.maxKg;
}

/** Why this monitor can't go on the arm, or null if it can. */
export function mountProblem(placed: Placed[], uid: string): string | null {
  const m = placed.find((p) => p.uid === uid);
  const info = mountInfo(placed);
  if (!m || !isMonitor(m.itemId)) return 'Only monitors go on an arm.';
  if (!info.arm || !info.spec) return 'Add a monitor arm first (Mounts).';
  const name = getItem(m.itemId)?.name;
  if (!MONITOR_SPEC[m.itemId]?.vesa) return `The ${name} has no VESA mount, so it stays on its own stand.`;
  if (MONITOR_SPEC[m.itemId].kg > info.spec.maxKg) return `The ${name} (${MONITOR_SPEC[m.itemId].kg} kg) is too heavy for this arm (max ${info.spec.maxKg} kg).`;
  if (!info.mounted.some((x) => x.uid === uid) && info.mounted.length >= info.spec.cap) {
    return `The ${getItem(info.arm.itemId)?.name} holds ${info.spec.cap} screen${info.spec.cap > 1 ? 's' : ''}. Take one off first.`;
  }
  return null;
}

/** Portrait only works on an arm, and only for screens that can pivot. */
export function isPortrait(m: Placed, mounted: boolean) {
  return mounted && m.orient === 'portrait' && !!MONITOR_SPEC[m.itemId]?.portrait;
}

/** Visible screen width in cm (turned screens are as wide as they were tall). */
export function screenWidth(m: Placed, mounted: boolean) {
  const s = MONITOR_SPEC[m.itemId];
  if (!s) return 0;
  return isPortrait(m, mounted) ? s.screenH : s.w;
}
