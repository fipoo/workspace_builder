'use client';

import { useDraggable } from '@dnd-kit/core';
import { m } from 'framer-motion';
import { X } from 'lucide-react';
import { forwardRef } from 'react';
import { getItem, type Placed } from '@/data/catalog';
import { formatDims } from '@/data/dims';
import { useUI } from '@/store/useUI';
import { cn, type DragData } from '@/lib/dnd';
import { isMonitor } from '@/lib/rules';
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
  onSelect,
}: {
  placed: Placed;
  className?: string;
  children: React.ReactNode;
  /** Clicking it selects the item (desk and chair; other items select from PlacedItem). */
  onSelect?: boolean;
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
      onClick={
        onSelect
          ? (e) => {
              e.stopPropagation();
              const { selected, select } = useUI.getState();
              select(selected === placed.uid ? null : placed.uid);
            }
          : undefined
      }
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
        'z-10 grid size-6 place-items-center rounded-full bg-white/95 pointer-coarse:size-8 text-jungle-900 shadow-md ring-1 ring-jungle-900/10 transition hover:bg-sunset-500 hover:text-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-sunset-500 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100',
        className,
      )}
    >
      <X size={11} strokeWidth={3} aria-hidden />
    </button>
  );
}

type Props = {
  placed: Placed;
  interactive?: boolean;
  showLabel?: boolean;
  style?: React.CSSProperties;
  /** Custom visual (desk objects); defaults to the item's photo tile. */
  glyph?: React.ReactNode;
  /** Hover label; defaults to the name with its real size. */
  label?: string;
  /** Things clipped on top of this item (webcam / light bar on a monitor, laptop on its stand). */
  topper?: React.ReactNode;
  /** Something this item stands on (a riser under a monitor). */
  under?: React.ReactNode;
  /** Show a ✕ on hover (zone tiles). Desk items are managed from the item panel instead. */
  removable?: boolean;
  /** Blend a white-background packshot into the scene. */
  blend?: boolean;
  /** Arrow keys on a focused item: move it (dx, dy in cm). */
  onArrow?: (dx: number, dy: number) => void;
  /** Marks items so a drop can work out the new position. */
  row?: 'back' | 'screen';
};

/**
 * A placed item (desk object or zone tile): pop-in animation, name on hover, click to select it
 * (the item panel then shows its controls), right-click for the options menu.
 */
export const PlacedItem = forwardRef<HTMLDivElement, Props>(function PlacedItem(
  { placed, interactive = true, showLabel = false, style, glyph, label, topper, under, removable = false, blend, row, onArrow },
  ref,
) {
  const isSelected = useUI((s) => s.selected === placed.uid);
  const isPeek = useUI((s) => s.peek === placed.uid);
  const select = useUI((s) => s.select);
  const openMenu = useUI((s) => s.openMenu);
  const { removeItem } = usePlace();
  const item = getItem(placed.itemId);
  if (!item) return null;
  const body = (
    <>
      {glyph ?? <ItemGlyph item={item} />}
      {/* Name on hover / keyboard focus */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-jungle-900 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/label:opacity-100 group-focus-visible/label:opacity-100 sm:text-[11px]"
      >
        {label ?? (formatDims(item.id) ? `${item.name} · ${formatDims(item.id)}` : item.name)}
      </span>
    </>
  );
  return (
    <m.div
      ref={ref}
      layout
      {...popIn}
      style={style}
      data-uid={placed.uid}
      data-selected={isSelected}
      data-peek={isPeek}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        select(isSelected ? null : placed.uid);
      }}
      onContextMenu={(e) => {
        if (!interactive) return;
        e.preventDefault();
        e.stopPropagation();
        openMenu(placed.uid, e.clientX, e.clientY);
      }}
      onKeyDown={(e) => {
        if (!interactive || e.defaultPrevented) return;
        const r = (e.target as HTMLElement).getBoundingClientRect();
        if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
          e.preventDefault();
          openMenu(placed.uid, r.left, r.bottom + 4);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          removeItem(placed.uid);
        } else if (onArrow && e.key.startsWith('Arrow')) {
          e.preventDefault();
          const step = e.shiftKey ? 1 : 5;
          if (e.key === 'ArrowLeft') onArrow(-step, 0);
          if (e.key === 'ArrowRight') onArrow(step, 0);
          if (e.key === 'ArrowUp') onArrow(0, -step);
          if (e.key === 'ArrowDown') onArrow(0, step);
        }
      }}
      data-row={row}
      data-monitor={isMonitor(item.id) ? '' : undefined}
      className={cn(
        'group relative flex flex-col items-center rounded-md outline-offset-2',
        'data-[peek=true]:outline-2 data-[peek=true]:outline-dashed data-[peek=true]:outline-lagoon-500',
        'data-[selected=true]:z-10 data-[selected=true]:outline-2 data-[selected=true]:outline-dashed data-[selected=true]:outline-sunset-500',
        style && 'shrink-0',
        blend && 'mix-blend-multiply',
      )}
    >
      <div className="relative w-full">
        {interactive ? (
          <DragHandle placed={placed} className="group/label relative w-full">
            {body}
          </DragHandle>
        ) : (
          <div className="group/label relative w-full">{body}</div>
        )}
        {topper && <div className="pointer-events-none absolute inset-x-0 bottom-[97%] flex items-end justify-center gap-[3%] *:pointer-events-auto">{topper}</div>}
      </div>
      {under}
      {showLabel && <span className="mt-1 max-w-16 truncate text-[10px] font-medium text-jungle-800/80">{item.name}</span>}
      {interactive && removable && <RemoveButton placed={placed} className="absolute -right-1.5 -top-1.5" />}
    </m.div>
  );
});
