'use client';

import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  RotateCcw,
  RotateCw,
  Smartphone,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { getItem, MONITOR_SPEC, TOPPERS, type Item, type Placed } from '@/data/catalog';
import { backRow, deskLayout, isMonitor, layoutPlane, mountInfo } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';
import { usePlace } from './usePlace';

export type ActionKey =
  | 'left' | 'right' | 'back' | 'forward'
  | 'turnLeft' | 'turnRight'
  | 'raise' | 'lower' | 'portrait' | 'swapLeft' | 'swapRight' | 'offArm' | 'onArm'
  | 'nextMonitor' | 'details' | 'remove';

export type ItemAction = {
  key: ActionKey;
  /** Full label (menu, screen readers). */
  label: string;
  /** Short label for the toolbar. */
  short: string;
  Icon: LucideIcon;
  run: () => void;
  group: 'move' | 'turn' | 'arm' | 'clip' | 'info' | 'remove';
  disabled?: boolean;
  danger?: boolean;
};

const report = (r: { ok: boolean; reason?: string } | void) => {
  if (r && !r.ok && r.reason) useUI.getState().showToast(r.reason, 'error');
};

/** Everything you can do with one placed item. Shared by the right-click menu and the item panel. */
export function useItemActions(uid: string | null): { placed?: Placed; item?: Item; actions: ItemAction[] } {
  const all = useSetup((s) => s.placed);
  const { removeItem } = usePlace();
  const p = uid ? all.find((x) => x.uid === uid) : undefined;
  const item = p ? getItem(p.itemId) : undefined;
  if (!p || !item) return { actions: [] };

  const s = useSetup.getState;
  const actions: ItemAction[] = [];
  const add = (a: ItemAction) => actions.push(a);

  if (p.slot === 'desk-surface') {
    const plane = layoutPlane(all);
    const r = plane.rects.get(p.uid);
    const onArm = mountInfo(all).mounted.some((m) => m.uid === p.uid);

    if (r) {
      const to = (dx: number, dy: number) => () => s().moveTo(p.uid, { x: r.x + dx, y: r.y + dy });
      add({ key: 'left', label: 'Move left 5 cm', short: 'Left', Icon: ChevronLeft, run: to(-5, 0), group: 'move', disabled: r.x <= 0 });
      add({ key: 'back', label: 'Move back 5 cm', short: 'Back', Icon: ChevronUp, run: to(0, -5), group: 'move', disabled: r.y <= 0 });
      add({ key: 'forward', label: 'Move forward 5 cm', short: 'Front', Icon: ChevronDown, run: to(0, 5), group: 'move', disabled: r.y + r.d >= plane.D });
      add({ key: 'right', label: 'Move right 5 cm', short: 'Right', Icon: ChevronRight, run: to(5, 0), group: 'move', disabled: r.x + r.w >= plane.W });
      add({ key: 'turnLeft', label: 'Turn 15° left', short: 'Turn', Icon: RotateCcw, run: () => report(s().turn(p.uid, -15)), group: 'turn', disabled: (p.turn ?? 0) <= -45 });
      add({ key: 'turnRight', label: 'Turn 15° right', short: 'Turn', Icon: RotateCw, run: () => report(s().turn(p.uid, 15)), group: 'turn', disabled: (p.turn ?? 0) >= 45 });
      if (isMonitor(p.itemId) && deskLayout(all).arm) {
        add({ key: 'onArm', label: 'Put on the monitor arm', short: 'On arm', Icon: ArrowUpToLine, run: () => report(s().mount(p.uid, true)), group: 'arm' });
      }
    }

    if (onArm) {
      const row = backRow(all);
      const i = row.findIndex((x) => x.uid === p.uid);
      const onArmList = mountInfo(all).mounted;
      const j = onArmList.findIndex((x) => x.uid === p.uid);
      add({ key: 'raise', label: 'Raise screen 5 cm', short: 'Raise', Icon: ChevronUp, run: () => s().lift(p.uid, 5), group: 'arm', disabled: (p.lift ?? 0) >= 20 });
      add({ key: 'lower', label: 'Lower screen 5 cm', short: 'Lower', Icon: ChevronDown, run: () => s().lift(p.uid, -5), group: 'arm', disabled: (p.lift ?? 0) <= -10 });
      if (MONITOR_SPEC[p.itemId]?.portrait) {
        add({ key: 'portrait', label: p.orient ? 'Turn to landscape' : 'Turn to portrait', short: p.orient ? 'Landscape' : 'Portrait', Icon: Smartphone, run: () => report(s().toggleOrient(p.uid)), group: 'arm' });
      }
      if (onArmList.length > 1) {
        add({ key: 'swapLeft', label: 'Swap with the screen on the left', short: 'Swap', Icon: ChevronLeft, run: () => s().move(p.uid, Math.max(0, i - 1)), group: 'arm', disabled: j <= 0 });
        add({ key: 'swapRight', label: 'Swap with the screen on the right', short: 'Swap', Icon: ChevronRight, run: () => s().move(p.uid, i + 1), group: 'arm', disabled: j >= onArmList.length - 1 });
      }
      add({ key: 'offArm', label: 'Take off the arm', short: 'Off arm', Icon: ArrowDownToLine, run: () => report(s().mount(p.uid, false)), group: 'arm' });
    }

    if (TOPPERS.has(p.itemId)) {
      const monitors = all.filter((x) => x.slot === 'desk-surface' && isMonitor(x.itemId));
      const i = monitors.findIndex((m) => m.uid === p.host);
      if (monitors.length > 1) {
        add({ key: 'nextMonitor', label: 'Move to the next monitor', short: 'Next screen', Icon: ArrowLeftRight, run: () => s().setHost(p.uid, monitors[(i + 1) % monitors.length].uid), group: 'clip' });
      }
    }
  }

  add({ key: 'details', label: 'Details & specs', short: 'Details', Icon: Info, run: () => useUI.getState().openDetail(item.id), group: 'info' });
  add({ key: 'remove', label: `Remove ${item.name}`, short: 'Remove', Icon: Trash2, run: () => removeItem(p.uid), group: 'remove', danger: true });
  return { placed: p, item, actions };
}
