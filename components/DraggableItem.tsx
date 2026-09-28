'use client';

import { useDraggable } from '@dnd-kit/core';
import { Check, Plus } from 'lucide-react';
import { categoryOf, type Item } from '@/data/catalog';
import { cn, recentlyDragged, type DragData } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { formatIDRShort } from '@/lib/pricing';
import { isSingleSlot } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';

/** Catalog tile: drag it onto the canvas, or tap/Enter to send it to its slot. */
export function DraggableItem({ item, onTap, locked }: { item: Item; onTap: (item: Item) => void; locked?: boolean }) {
  const data: DragData = { kind: 'catalog', itemId: item.id, slot: item.slot };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `catalog:${item.id}`, data });
  const count = useSetup((s) => s.placed.filter((p) => p.itemId === item.id).length);
  const cat = categoryOf(item);
  const single = isSingleSlot(item.slot);

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`${item.name}, ${formatIDRShort(item.pricePerMonth)} per month. Press Enter to add, Space to drag.`}
      onClick={() => {
        if (!recentlyDragged()) onTap(item);
      }}
      className={cn(
        'group relative flex touch-manipulation select-none flex-col items-start gap-2 rounded-2xl bg-white/85 p-2.5 text-left shadow-tile ring-1 ring-jungle-900/5 transition duration-150 hover:-translate-y-0.5 hover:bg-white hover:ring-jungle-900/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500 active:scale-[0.97] sm:p-3',
        count > 0 && 'ring-2',
        locked && 'opacity-70',
      )}
      style={{
        opacity: isDragging ? 0.4 : undefined,
        ...(count > 0 ? { ['--tw-ring-color' as string]: cat.color } : {}),
      }}
    >
      <span
        className="grid size-10 place-items-center rounded-xl transition-transform group-hover:-rotate-6 group-hover:scale-110 sm:size-11"
        style={{ color: cat.color, backgroundColor: `color-mix(in oklab, ${cat.color} 12%, white)` }}
      >
        <ItemIcon icon={item.icon} emoji={item.emoji} size={22} />
      </span>
      <span className="line-clamp-2 min-h-[2.1em] text-[13px] font-semibold leading-tight text-jungle-900">
        {item.name}
      </span>
      <span className="text-xs font-medium text-jungle-700/75">
        {formatIDRShort(item.pricePerMonth)}
        <span className="text-jungle-700/50">/mo</span>
      </span>

      {count > 0 ? (
        <span
          className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: cat.color }}
        >
          {single ? (
            <>
              <Check size={10} strokeWidth={3} aria-hidden /> In use
            </>
          ) : (
            `×${count}`
          )}
        </span>
      ) : (
        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-jungle-900/5 text-jungle-800/60 transition group-hover:bg-jungle-900 group-hover:text-sand-50">
          <Plus size={14} strokeWidth={2.5} aria-hidden />
        </span>
      )}
    </button>
  );
}
