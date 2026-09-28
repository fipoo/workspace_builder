'use client';

import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { CATEGORIES, getItem, ZONE_SLOTS } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { LIMITS } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { DropZone } from './DropZone';
import { ItemPhoto } from './ItemPhoto';
import { PlacedItem } from './PlacedItem';
import { usePlace } from './usePlace';

/** Shortcut tiles per zone, like the sketch's "+ Add Coffee Machine" / "+ Add Surfboard". */
const SUGGEST: Record<string, [id: string, label: string][]> = {
  coffee: [
    ['coffee-espresso', 'Coffee Machine'],
    ['coffee-mini-fridge', 'Mini Fridge'],
  ],
  outdoor: [
    ['outdoor-surfboard', 'Surfboard'],
    ['outdoor-motorbike', 'Motorcycle'],
  ],
  relax: [
    ['relax-bean-bag', 'Bean Bag'],
    ['relax-hammock', 'Hammock'],
  ],
  garage: [
    ['garage-tool-shelf', 'Tool Shelf'],
    ['garage-workbench', 'Workbench'],
  ],
};

/** Coffee Station | Outdoor Gear | Relax Zone | Garage Space, each holding up to 4 items. */
export function ZoneRow({ onPickCategory }: { onPickCategory?: (key: string) => void }) {
  const placed = useSetup((s) => s.placed);
  const { place } = usePlace();

  return (
    <section aria-label="Extra zones" className="grid grid-cols-2 border-t-[1.5px] border-[#2b2a28] lg:grid-cols-4">
      {ZONE_SLOTS.map((slot, i) => {
        const cat = CATEGORIES.find((c) => c.slot === slot)!;
        const items = placed.filter((p) => p.slot === slot);
        const room = LIMITS.zone - items.length;
        const ideas = SUGGEST[cat.key].filter(([id]) => !items.some((p) => p.itemId === id)).slice(0, Math.min(2, room));
        return (
          <DropZone
            key={slot}
            slot={slot}
            lockedHint="Zone full"
            className={cn(
              'relative flex min-h-[9.5rem] flex-col items-center gap-3 px-3 pb-4',
              i % 2 === 1 && 'border-l-[1.5px] border-dashed border-[#2b2a2866]',
              i >= 2 && 'max-lg:border-t-[1.5px] max-lg:border-dashed max-lg:border-[#2b2a2866]',
              i === 2 && 'lg:border-l-[1.5px] lg:border-dashed lg:border-[#2b2a2866]',
            )}
          >
            <button
              type="button"
              onClick={() => onPickCategory?.(cat.key)}
              title={`Browse all ${cat.label}`}
              className="-mt-px rounded-b-xl border-[1.5px] border-t-0 border-[#2b2a28] bg-white px-4 py-1.5 font-display text-sm font-bold hover:bg-[#f7f5f0] sm:text-base"
            >
              {cat.label}
            </button>

            <div className="flex flex-wrap items-start justify-center gap-2">
              <AnimatePresence initial={false}>
                {items.map((p) => (
                  <PlacedItem key={p.uid} placed={p} removable />
                ))}
              </AnimatePresence>
              {ideas.map(([id, label]) => {
                const item = getItem(id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => place(id, slot, { announce: true })}
                    className="group flex w-[5.5rem] flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed border-[#2b2a2866] bg-white p-1.5 transition hover:border-solid hover:border-[#2b2a28]"
                  >
                    <ItemPhoto item={item} sizes="80px" className="aspect-square w-full rounded-lg opacity-80 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
                    <span className="flex items-center gap-0.5 text-[10.5px] font-semibold leading-tight text-jungle-900">
                      <Plus size={10} strokeWidth={3} aria-hidden /> {label}
                    </span>
                  </button>
                );
              })}
            </div>
            {room === 0 && <span className="text-[11px] font-medium text-jungle-800/50">Zone full ({LIMITS.zone}/{LIMITS.zone})</span>}
          </DropZone>
        );
      })}
    </section>
  );
}
