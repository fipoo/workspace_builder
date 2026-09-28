/** Rearranging, mounting, lifting, turning and removing items. */
import { getItem, MONITOR_SPEC, RISER, TOPPERS, type Placed } from '@/data/catalog';
import { type PlaceResult, isArm, isMonitor, middle, monitorsOf } from './base';
import { mountInfo, mountProblem } from './mount';
import { backRow } from './layout';
import { Spot, fitProblem, freeze, settle } from './plane';

// ---------------------------------------------------------------------------
// Arranging
// ---------------------------------------------------------------------------

/** Move a back-row item to position `to` (0 = far left) among the back-row items. */
export function applyMove(placed: Placed[], uid: string, to: number): Placed[] {
  const row = backRow(placed);
  const from = row.findIndex((p) => p.uid === uid);
  if (from < 0) return placed;
  const nextRow = [...row];
  const [moved] = nextRow.splice(from, 1);
  nextRow.splice(Math.max(0, Math.min(to, nextRow.length)), 0, moved);
  const rowIds = new Set(row.map((p) => p.uid));
  return [...placed.filter((p) => !rowIds.has(p.uid)), ...nextRow];
}

/** Clip a webcam / light bar onto another monitor, or put a riser under one. */
export function applyHost(placed: Placed[], uid: string, monitorUid: string): Placed[] {
  const thing = placed.find((p) => p.uid === uid);
  const monitor = placed.find((p) => p.uid === monitorUid && isMonitor(p.itemId));
  if (!thing || !monitor) return placed;
  if (thing.itemId === RISER) {
    const mounted = mountInfo(placed).mounted.some((m) => m.uid === monitorUid);
    const busy = placed.some((p) => p.itemId === RISER && p.host === monitorUid && p.uid !== uid);
    if (mounted || busy) return placed;
  }
  return placed.map((p) => (p.uid === uid ? { ...p, host: monitorUid } : p));
}

/** Turn a monitor on the arm between landscape and portrait. */
export function applyOrient(placed: Placed[], uid: string): { placed: Placed[]; result: PlaceResult } {
  const m = placed.find((p) => p.uid === uid);
  if (!m || !isMonitor(m.itemId)) return { placed, result: { ok: false, reason: 'Not a monitor.' } };
  const spec = MONITOR_SPEC[m.itemId];
  const onArm = mountInfo(placed).mounted.some((x) => x.uid === uid);
  if (!onArm) return { placed, result: { ok: false, reason: 'Only screens on a monitor arm can turn to portrait.' } };
  if (!spec.portrait) return { placed, result: { ok: false, reason: `The ${getItem(m.itemId)?.name} can't pivot to portrait.` } };
  const next = freeze(placed.map((p) => (p.uid === uid ? { ...p, orient: p.orient === 'portrait' ? undefined : ('portrait' as const) } : p)));
  const desk = placed.find((p) => p.slot === 'desk');
  const problem = desk && fitProblem(next, desk.itemId);
  if (problem) return { placed, result: { ok: false, reason: `Can't turn it: ${problem}.` } };
  return { placed: next, result: { ok: true } };
}

// ---------------------------------------------------------------------------
// Removing
// ---------------------------------------------------------------------------

/**
 * Pure remove. Removing the desk clears the desk top. Webcams and light bars follow their monitor
 * to another one (or come off with the last monitor). Removing an arm or the laptop stand is
 * refused when the screens / laptop would then not fit on the desk.
 */
export function applyRemove(placed: Placed[], uid: string): { placed: Placed[]; removed: Placed[]; reason?: string } {
  const target = placed.find((p) => p.uid === uid);
  if (!target) return { placed, removed: [] };
  const removed = placed.filter((p) => p.uid === uid || (target.slot === 'desk' && p.slot === 'desk-surface'));
  let left = placed.filter((p) => !removed.includes(p));

  if (isMonitor(target.itemId)) {
    const monitors = monitorsOf(left);
    const attached = left.filter((p) => TOPPERS.has(p.itemId) && p.host === target.uid);
    if (attached.length && !monitors.length) {
      removed.push(...attached);
      left = left.filter((p) => !attached.includes(p));
    } else if (attached.length) {
      const to = middle(monitors).uid;
      left = left.map((p) => (attached.includes(p) ? { ...p, host: to } : p));
    }
    // A riser under it stays on the desk; move it under a free monitor if there is one
    left = left.map((p) => {
      if (p.itemId !== RISER || p.host !== target.uid) return p;
      const mounted = new Set(mountInfo(left).mounted.map((m) => m.uid));
      const free = monitors.find((m) => !mounted.has(m.uid) && !left.some((q) => q.itemId === RISER && q.host === m.uid));
      return { ...p, host: free?.uid };
    });
  }

  if (isArm(target.itemId)) {
    left = left.map((p) => (p.orient ? { ...p, orient: undefined } : p));
  }

  const desk = left.find((p) => p.slot === 'desk');
  if (desk && target.slot === 'desk-surface') {
    const problem = fitProblem(left, desk.itemId);
    if (problem) {
      const name = getItem(target.itemId)?.name;
      return { placed, removed: [], reason: `Can't remove the ${name}: without it your setup ${problem}.` };
    }
  }
  return { placed: left, removed };
}

// ---------------------------------------------------------------------------
// Arm: put a screen on / take it off, raise / lower it; turning things on the desk
// ---------------------------------------------------------------------------

/** Put a monitor on the arm (on = true) or stand it on the desk (on = false). */
export function applyMount(placed: Placed[], uid: string, on: boolean, at?: Spot): { placed: Placed[]; result: PlaceResult } {
  if (on) {
    const problem = mountProblem(placed, uid);
    if (problem) return { placed, result: { ok: false, reason: problem } };
  }
  const next = placed.map((p) =>
    p.uid === uid ? { ...p, arm: on, lift: on ? p.lift : undefined, orient: on ? p.orient : undefined, ...(at && !on ? { x: at.x, y: at.y } : {}) } : p,
  );
  const settled = settle(next, uid);
  if (!settled) return { placed, result: { ok: false, reason: 'No room on the desk to stand that screen. Clear some space first.' } };
  return { placed: settled, result: { ok: true } };
}

/** Screens on an arm can go up or down: −10 to +20 cm from the default height. */
export const LIFT_RANGE = { min: -10, max: 20 } as const;

export function applyLift(placed: Placed[], uid: string, delta: number): Placed[] {
  return placed.map((p) =>
    p.uid === uid ? { ...p, lift: Math.max(LIFT_RANGE.min, Math.min(LIFT_RANGE.max, (p.lift ?? 0) + delta)) || undefined } : p,
  );
}

/** Turn an item on the desk in 15° steps, up to 45° either way. Refused if it would no longer fit. */
export function applyTurn(placed: Placed[], uid: string, delta: number): { placed: Placed[]; result: PlaceResult } {
  const next = placed.map((p) =>
    p.uid === uid ? { ...p, turn: Math.max(-45, Math.min(45, (p.turn ?? 0) + delta)) || undefined } : p,
  );
  const settled = settle(next, uid);
  if (!settled) return { placed, result: { ok: false, reason: 'No room to turn it there.' } };
  return { placed: settled, result: { ok: true } };
}
