'use client';

import { useDraggable } from '@dnd-kit/core';
import { Check, Info, Plus } from 'lucide-react';
import { type Item } from '@/data/catalog';
import { cn, recentlyDragged, type DragData } from '@/lib/dnd';
import { formatIDRShort } from '@/lib/pricing';
import { isSingleSlot } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';
import { ItemPhoto } from './ItemPhoto';

/** Catalog tile (sketch style): drag it onto the stage, tap/Enter to add, ⓘ for full specs. */
export function DraggableItem({ item, onTap, locked }: { item: Item; onTap: (item: Item) => void; locked?: boolean }) {
  const data: DragData = { kind: 'catalog', itemId: item.id, slot: item.slot };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `catalog:${item.id}`, data });
  const count = useSetup((s) => s.placed.filter((p) => p.itemId === item.id).length);
  const openDetail = useUI((s) => s.openDetail);
  const single = isSingleSlot(item.slot);

  return (
    <div className="group relative">
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
          'flex w-full touch-manipulation select-none flex-col items-stretch gap-0.5 rounded-lg border-[1.5px] bg-white p-1 text-left transition duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500 active:scale-[0.97]',
          count > 0 ? 'border-solid border-[#2b2a28] shadow-[2px_2px_0_#2b2a28]' : 'border-dashed border-[#2b2a2866] hover:border-solid hover:border-[#2b2a28]',
          locked && 'opacity-70',
        )}
        style={{ opacity: isDragging ? 0.4 : undefined }}
      >
        <span className="relative block overflow-hidden rounded-lg bg-white">
          <ItemPhoto
            item={item}
            fit={item.source === 'monis' ? 'cutout' : 'cover'}
            sizes="(min-width: 1024px) 140px, 30vw"
            className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
          />
          {item.source === 'monis' && (
            <span className="absolute bottom-0.5 left-0.5 rounded-full bg-jungle-900/85 px-1 py-px text-[7.5px] font-bold tracking-wide text-sand-50">
              monis.rent
            </span>
          )}
        </span>
        <span className="line-clamp-2 min-h-[2.2em] px-0.5 text-[10.5px] font-semibold leading-tight text-jungle-900">{item.name}</span>
        <span className="whitespace-nowrap px-0.5 text-[9.5px] font-medium text-jungle-700/75">
          {formatIDRShort(item.pricePerMonth)}
          <span className="text-jungle-700/50">/mo</span>
        </span>
      </button>

      {count > 0 ? (
        <span className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-jungle-900 px-1 py-px text-[8.5px] font-bold text-white">
          {single ? (
            <>
              <Check size={9} strokeWidth={3} aria-hidden /> In use
            </>
          ) : (
            `×${count}`
          )}
        </span>
      ) : (
        <span className="pointer-events-none absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white/95 text-jungle-800/70 shadow-sm ring-1 ring-[#2b2a2833] transition group-hover:bg-jungle-900 group-hover:text-sand-50">
          <Plus size={11} strokeWidth={2.5} aria-hidden />
        </span>
      )}

      <button
        type="button"
        onClick={() => openDetail(item.id)}
        aria-label={`Details and specs for ${item.name}`}
        title="Details & specs"
        className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-full border border-[#2b2a2855] bg-white text-jungle-800 transition hover:border-[#2b2a28] hover:bg-jungle-900 hover:text-white"
      >
        <Info size={11} aria-hidden />
      </button>
    </div>
  );
}
