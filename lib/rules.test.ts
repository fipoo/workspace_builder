import { describe, expect, it } from 'vitest';
import { CATALOG, type Placed } from '@/data/catalog';
import { applyLift, applyMount, applyTurn, LIFT_RANGE, applyMoveTo, layoutPlane, applyAdd, applyHost, applyMove, applyOrient, applyRemove, backRow, deskLayout, deskSpace, LIMITS, mountInfo } from './rules';
import { SPECS } from '@/data/specs';

let n = 0;
const add = (placed: Placed[], itemId: string) => {
  const item = CATALOG.find((i) => i.id === itemId)!;
  return applyAdd(placed, itemId, item.slot, `u${n++}`);
};

describe('catalog', () => {
  it('has at least 10 items per category and unique ids', () => {
    expect(new Set(CATALOG.map((i) => i.id)).size).toBe(CATALOG.length);
    for (const c of new Set(CATALOG.map((i) => i.category))) expect(CATALOG.filter((i) => i.category === c).length).toBeGreaterThanOrEqual(10);
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
    let s = add([], 'desks-executive').placed;
    for (let i = 0; i < LIMITS.monitors; i++) s = add(s, 'accessories-monitor-24').placed;
    expect(add(s, 'accessories-ultrawide').result.ok).toBe(false);
    expect(add(s, 'accessories-webcam').result.ok).toBe(true);
  });

  it('the desk top is a real surface: a 100 × 50 cm desk holds 10 plants (20 × 20), not 11', () => {
    let s = add([], 'desks-compact').placed;
    for (let i = 0; i < 10; i++) s = add(s, 'accessories-plant').placed;
    expect(s.filter((p) => p.slot === 'desk-surface')).toHaveLength(10);
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

describe('real-world fit', () => {
  it('rejects screens wider than the desk', () => {
    let s = add([], 'desks-compact').placed; // 100 cm
    s = add(s, 'accessories-monitor-24').placed; // 54
    const r = add(s, 'accessories-monitor-27'); // +61 = 115
    expect(r.result.ok).toBe(false);
    expect(deskSpace(s)).toMatchObject({ width: 100, depth: 50, used: 54 });
  });

  it('three 24" screens (162 cm) only fit the 180 cm desk', () => {
    let s = add([], 'desks-executive').placed;
    for (let i = 0; i < 3; i++) s = add(s, 'accessories-monitor-24').placed;
    expect(deskSpace(s)?.used).toBe(162);
    expect(add(s, 'desks-folding').result.ok).toBe(false); // 160 cm
  });

  it('will not swap to a desk that is too narrow for the setup', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-monitor-27').placed;
    s = add(s, 'accessories-monitor-27').placed; // 122 cm
    expect(add(s, 'desks-compact').result.ok).toBe(false);
    expect(add(s, 'desks-standing').result.ok).toBe(true); // 140 cm
  });

  it('allows one keyboard, and a webcam only with a monitor', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-keyboard').placed;
    expect(add(s, 'accessories-keyboard').result.ok).toBe(false);
    expect(add(s, 'accessories-webcam').result.ok).toBe(false);
    s = add(s, 'accessories-monitor-27').placed;
    expect(add(s, 'accessories-webcam').result.ok).toBe(true);
  });
});

describe('arranging the desk', () => {
  const ids = (placed: Placed[]) => backRow(placed).map((p) => p.itemId.replace('accessories-', ''));

  it('new items land in their natural spot: plant left, screens middle, lamp right', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-desk-lamp').placed;
    s = add(s, 'accessories-monitor-27').placed;
    s = add(s, 'accessories-plant').placed;
    expect(ids(s)).toEqual(['plant', 'monitor-27', 'desk-lamp']);
  });

  it('items can be moved left and right', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-plant').placed;
    s = add(s, 'accessories-monitor-27').placed;
    const plant = backRow(s)[0];
    s = applyMove(s, plant.uid, 5);
    expect(ids(s)).toEqual(['monitor-27', 'plant']);
  });

  it('the webcam clips onto a monitor, can move, and follows when its monitor is removed', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-monitor-24').placed;
    s = add(s, 'accessories-monitor-24').placed;
    s = add(s, 'accessories-webcam').placed;
    const [left, right] = backRow(s);
    const cam = s.find((p) => p.itemId === 'accessories-webcam')!;
    expect(cam.host).toBe(left.uid);
    s = applyHost(s, cam.uid, right.uid);
    expect(s.find((p) => p.uid === cam.uid)?.host).toBe(right.uid);
    s = applyRemove(s, right.uid).placed;
    expect(s.find((p) => p.uid === cam.uid)?.host).toBe(left.uid);
    const r = applyRemove(s, left.uid);
    expect(r.removed.map((p) => p.itemId)).toContain('accessories-webcam');
  });
});

describe('monitor arms', () => {
  const setup = (desk: string, ...ids: string[]) => ids.reduce((s, id) => add(s, id).placed, add([], desk).placed);

  it('an arm lifts screens off the desk, freeing the width underneath', () => {
    let s = setup('desks-standing', 'accessories-monitor-27', 'accessories-monitor-27'); // 140 cm, 122 used
    expect(add(s, 'accessories-laptop-stand').result.ok).toBe(false); // 32 cm won't fit
    s = add(s, 'mounts-dual-arm').placed;
    expect(mountInfo(s).mounted).toHaveLength(2);
    expect(deskSpace(s)?.used).toBe(10); // just the clamp
    s = add(s, 'accessories-laptop-stand').placed; // 15 cm high: fits under the screens
    expect(s.some((p) => p.itemId === 'accessories-laptop-stand')).toBe(true);
    expect(add(s, 'accessories-plant').result.ok).toBe(false); // 40 cm plant is too tall to go under
    expect(add(s, 'accessories-succulent').result.ok).toBe(true); // 12 cm succulent fits
  });

  it('arms carry up to 9 kg: the 8.6 kg 34" ultrawide mounts; the Studio Display (no VESA) cannot', () => {
    let s = setup('desks-executive', 'accessories-ultrawide', 'mounts-dual-arm');
    expect(mountInfo(s).mounted.map((m) => m.itemId)).toEqual(['accessories-ultrawide']);
    s = setup('desks-executive', 'accessories-studio-display', 'mounts-dual-arm');
    const studio = s.find((p) => p.itemId === 'accessories-studio-display')!;
    expect(mountInfo(s).mounted).toHaveLength(0);
    expect(applyMount(s, studio.uid, true).result.ok).toBe(false);
  });

  it('a screen can be taken off the arm onto the desk and put back, and raised or lowered', () => {
    let s = setup('desks-executive', 'accessories-monitor-27', 'mounts-single-arm');
    const m = s.find((p) => p.itemId === 'accessories-monitor-27')!;
    expect(mountInfo(s).mounted).toHaveLength(1);
    s = applyMount(s, m.uid, false).placed;
    expect(mountInfo(s).mounted).toHaveLength(0);
    expect(layoutPlane(s).rects.has(m.uid)).toBe(true); // standing on the desk now
    s = applyMount(s, m.uid, true).placed;
    expect(mountInfo(s).mounted).toHaveLength(1);
    s = applyLift(s, m.uid, 5);
    s = applyLift(s, m.uid, 50);
    expect(s.find((p) => p.uid === m.uid)?.lift).toBe(LIFT_RANGE.max);
  });

  it('turning an item widens its footprint', () => {
    let s = setup('desks-executive', 'accessories-keyboard');
    const k = s.find((p) => p.itemId === 'accessories-keyboard')!;
    const before = layoutPlane(s).rects.get(k.uid)!;
    s = applyTurn(s, k.uid, 30).placed;
    const after = layoutPlane(s).rects.get(k.uid)!;
    expect(after.d).toBeGreaterThan(before.d);
    expect(s.find((p) => p.uid === k.uid)?.turn).toBe(30);
  });

  it('the Studio Display has no VESA mount, so it stays on its stand', () => {
    const s = setup('desks-executive', 'accessories-studio-display', 'mounts-single-arm');
    expect(mountInfo(s).mounted).toHaveLength(0);
  });

  it('only one arm per desk', () => {
    const s = setup('desks-executive', 'mounts-dual-arm');
    expect(add(s, 'mounts-triple-arm').result.ok).toBe(false);
  });

  it('portrait works on the arm and makes the row narrower', () => {
    let s = setup('desks-executive', 'accessories-monitor-27', 'accessories-monitor-27', 'mounts-dual-arm');
    const [a] = mountInfo(s).mounted;
    const before = mountInfo(s).rowWidth;
    const r = applyOrient(s, a.uid);
    expect(r.result.ok).toBe(true);
    s = r.placed;
    expect(mountInfo(s).rowWidth).toBeLessThan(before);
  });

  it('portrait is refused on a stand and for the ultrawide', () => {
    let s = setup('desks-executive', 'accessories-monitor-24');
    expect(applyOrient(s, s.find((p) => p.itemId === 'accessories-monitor-24')!.uid).result.ok).toBe(false);
    s = setup('desks-executive', 'accessories-ultrawide', 'mounts-heavy-arm');
    expect(applyOrient(s, s.find((p) => p.itemId === 'accessories-ultrawide')!.uid).result.ok).toBe(false);
  });

  it('a stacked arm holds two screens one above the other (row width = widest)', () => {
    const s = setup('desks-compact', 'mounts-stacked-arm', 'accessories-monitor-27', 'accessories-monitor-24');
    expect(mountInfo(s).mounted).toHaveLength(2);
    expect(mountInfo(s).rowWidth).toBe(61);
  });

  it('removing the arm is refused when the screens would no longer fit on the desk', () => {
    const s = setup('desks-standing', 'mounts-dual-arm', 'accessories-monitor-27', 'accessories-monitor-27', 'accessories-laptop-stand');
    const arm = s.find((p) => p.itemId === 'mounts-dual-arm')!;
    const r = applyRemove(s, arm.uid);
    expect(r.reason).toBeTruthy();
    expect(r.placed).toBe(s);
  });
});

describe('laptop, stand and riser', () => {
  it('a laptop sits on the laptop stand', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-laptop-stand').placed;
    s = add(s, 'computers-macbook-neo').placed;
    const l = deskLayout(s);
    expect(l.laptopOnStand?.itemId).toBe('computers-macbook-neo');
    expect(l.row.some((p) => p.itemId === 'computers-macbook-neo')).toBe(false);
    expect(deskSpace(s)?.used).toBe(32); // the laptop fits on the stand's footprint
  });

  it('a riser goes under a monitor on its own stand', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-monitor-24').placed;
    s = add(s, 'mounts-monitor-riser').placed;
    const m = s.find((p) => p.itemId === 'accessories-monitor-24')!;
    expect(deskLayout(s).risers.get(m.uid)?.itemId).toBe('mounts-monitor-riser');
    expect(deskSpace(s)?.used).toBe(54); // no extra width under the monitor
  });
});

describe('specs', () => {
  it('every item has details', () => {
    expect(CATALOG.filter((i) => !SPECS[i.id]).map((i) => i.id)).toEqual([]);
  });
});

describe('desk top in 2D (width × depth)', () => {
  it('every desk item gets a spot inside the desk, and nothing overlaps', () => {
    let s = add([], 'desks-executive').placed;
    for (const id of ['accessories-monitor-27', 'accessories-monitor-27', 'accessories-keyboard', 'accessories-mouse', 'accessories-desk-lamp', 'accessories-plant'])
      s = add(s, id).placed;
    const rects = [...layoutPlane(s).rects.values()];
    expect(rects).toHaveLength(6);
    for (const a of rects) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.x + a.w).toBeLessThanOrEqual(180.01);
      expect(a.y + a.d).toBeLessThanOrEqual(80.01);
      for (const b of rects) if (a !== b) expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d).toBe(false);
    }
  });

  it('screens stand side by side, never one behind another', () => {
    let s = add([], 'desks-compact').placed; // 100 × 50
    s = add(s, 'accessories-monitor-27').placed;
    expect(add(s, 'accessories-monitor-27').result.ok).toBe(false); // 122 cm won't fit, and not behind
  });

  it('a dropped item goes where it was dropped, or the nearest free spot', () => {
    let s = add([], 'desks-executive').placed;
    s = applyAdd(s, 'accessories-plant', 'desk-surface', 'p1', { x: 150, y: 50 }).placed;
    const r = layoutPlane(s).rects.get('p1')!;
    expect([r.x, r.y]).toEqual([150, 50]);
    s = applyMoveTo(s, 'p1', { x: 10, y: 5 });
    expect(layoutPlane(s).rects.get('p1')).toMatchObject({ x: 10, y: 5 });
  });

  it('tall things cannot stand in front of a screen; low things can', () => {
    let s = add([], 'desks-executive').placed;
    s = add(s, 'accessories-monitor-27').placed;
    const m = layoutPlane(s).rects.get(s.find((p) => p.itemId === 'accessories-monitor-27')!.uid)!;
    s = applyAdd(s, 'accessories-plant', 'desk-surface', 'p2', { x: m.x + 20, y: 40 }).placed;
    const plant = layoutPlane(s).rects.get('p2')!;
    expect(plant.x + plant.w <= m.x || plant.x >= m.x + m.w).toBe(true); // slid out from in front of the screen
    s = applyAdd(s, 'accessories-keyboard', 'desk-surface', 'k', { x: m.x + 10, y: 50 }).placed;
    expect(layoutPlane(s).rects.get('k')).toMatchObject({ x: m.x + 10, y: 50 });
  });
});
