'use client';

import { useDroppable } from '@dnd-kit/core';
import { animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { getItem, type Slot } from '@/data/catalog';
import { cn, zoneId, type DragData } from '@/lib/dnd';
import { canPlace } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';

export type ZoneState = 'idle' | 'valid' | 'over' | 'locked' | 'blocked' | 'home' | 'leaving';

const CHIP: Partial<Record<ZoneState, { text: string; cls: string }>> = {
  valid: { text: 'Drop here', cls: 'bg-lagoon-500 text-white' },
  over: { text: 'Release!', cls: 'bg-lagoon-500 text-white' },
  blocked: { text: 'Not here', cls: 'bg-danger-500 text-white' },
};

type Props = {
  slot: Slot;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** Chip text shown when the zone matches but its rules say no (e.g. no desk yet). */
  lockedHint?: string;
  /** Hide the floating state chip (for nested zones). */
  quiet?: boolean;
};

/** A droppable slot. It highlights while a compatible item is dragged and shakes on a rejected drop. */
export function DropZone({ slot, className, style, children, lockedHint, quiet }: Props) {
  const { setNodeRef, isOver, active } = useDroppable({ id: zoneId(slot), data: { slot } });
  const placed = useSetup((s) => s.placed);
  const pulse = useUI((s) => s.pulse);
  const ref = useRef<HTMLDivElement | null>(null);

  const data = active?.data.current as DragData | undefined;
  let state: ZoneState = 'idle';
  if (data?.kind === 'catalog') {
    const item = getItem(data.itemId);
    if (item?.slot === slot) {
      const ok = canPlace(placed, item, slot).ok;
      state = isOver ? (ok ? 'over' : 'blocked') : ok ? 'valid' : 'locked';
    } else if (isOver) {
      state = 'blocked';
    }
  } else if (data?.kind === 'placed' && data.slot === slot) {
    state = isOver ? 'home' : 'leaving';
  }

  useEffect(() => {
    if (!pulse || pulse.slot !== slot || !ref.current) return;
    if (pulse.kind === 'reject') {
      animate(ref.current, { x: [0, -10, 10, -7, 7, -3, 0] }, { duration: 0.45 });
    } else {
      animate(ref.current, { scale: [1, 1.03, 1] }, { duration: 0.3 });
    }
  }, [pulse, slot]);

  const chip = state === 'locked' ? { text: lockedHint ?? 'Full', cls: 'bg-sand-400 text-jungle-900' } : CHIP[state];

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        ref.current = node;
      }}
      data-zone={slot}
      data-state={state}
      style={style}
      className={cn('transition-[outline-color,background-color] duration-150', className)}
    >
      {children}
      {chip && !quiet && (
        <span
          className={cn(
            'pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-md',
            chip.cls,
          )}
        >
          {chip.text}
        </span>
      )}
    </div>
  );
}

/** Non-interactive stand-in with the same layout, for read-only previews. */
export function StaticZone({ className, style, children }: Props) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
