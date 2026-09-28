'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { forwardRef } from 'react';
import { getItem, type Placed } from '@/data/catalog';
import { cn, type DragData } from '@/lib/dnd';
import { ItemGlyph } from './ItemGlyph';
import { usePlace } from './usePlace';

export const popIn = {
  initial: { opacity: 0, scale: 0.3, y: -36 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.4, y: -24, rotate: -12 },
  transition: { type: 'spring' as const, stiffness: 520, damping: 26, mass: 0.7 },
};

/** Makes a placed piece draggable so it can be pulled off the canvas to remove it. */
export function DragHandle({
  placed,
  className,
  children,
}: {
  placed: Placed;
  className?: string;
  children: React.ReactNode;
}) {
  const data: DragData = { kind: 'placed', uid: placed.uid, itemId: placed.itemId, slot: placed.slot };
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `placed:${placed.uid}`, data });
  const item = getItem(placed.itemId);
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`${item?.name}. Drag off the canvas to remove.`}
      className={cn('cursor-grab touch-manipulation active:cursor-grabbing', className)}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      {children}
    </div>
  );
}

export function RemoveButton({ placed, className }: { placed: Placed; className?: string }) {
  const { removeItem } = usePlace();
  const item = getItem(placed.itemId);
  return (
    <button
      type="button"
      aria-label={`Remove ${item?.name}`}
      onClick={(e) => {
        e.stopPropagation();
        removeItem(placed.uid);
      }}
      className={cn(
        'z-10 grid size-5 place-items-center rounded-full bg-white/95 text-jungle-900 shadow-md ring-1 ring-jungle-900/10 transition hover:bg-sunset-500 hover:text-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-sunset-500 md:opacity-0 md:group-hover:opacity-100',
        className,
      )}
    >
      <X size={11} strokeWidth={3} aria-hidden />
    </button>
  );
}

type Props = { placed: Placed; interactive?: boolean; showLabel?: boolean };

/** A stackable item (desk-top accessory or zone item) with pop-in animation and a ✕ button. */
export const PlacedItem = forwardRef<HTMLDivElement, Props>(function PlacedItem(
  { placed, interactive = true, showLabel = false },
  ref,
) {
  const item = getItem(placed.itemId);
  if (!item) return null;
  const glyph = <ItemGlyph item={item} />;
  return (
    <motion.div ref={ref} layout {...popIn} className="group relative flex flex-col items-center">
      {interactive ? <DragHandle placed={placed}>{glyph}</DragHandle> : glyph}
      {showLabel && (
        <span className="mt-1 max-w-16 truncate text-[10px] font-medium text-jungle-800/80">{item.name}</span>
      )}
      {interactive && <RemoveButton placed={placed} className="absolute -right-1.5 -top-1.5" />}
    </motion.div>
  );
});
