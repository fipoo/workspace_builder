'use client';

import { AnimatePresence } from 'framer-motion';
import { CATEGORIES, ZONE_SLOTS } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { LIMITS } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { DropZone } from './DropZone';
import { PlacedItem } from './PlacedItem';

/** Coffee | Outdoor | Relax | Garage pads, each holding up to 4 items. */
export function ZoneRow({ onPickCategory }: { onPickCategory?: (key: string) => void }) {
  const placed = useSetup((s) => s.placed);

  return (
    <section aria-label="Extra zones" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ZONE_SLOTS.map((slot) => {
        const cat = CATEGORIES.find((c) => c.slot === slot)!;
        const items = placed.filter((p) => p.slot === slot);
        const full = items.length >= LIMITS.zone;
        return (
          <DropZone
            key={slot}
            slot={slot}
            lockedHint="Zone full"
            className="relative flex min-h-[8.5rem] flex-col rounded-2xl border border-jungle-900/5 bg-[var(--zone-tint)] p-3 shadow-tile"
            style={{ ['--zone-tint' as string]: `color-mix(in oklab, ${cat.color} 9%, #fdf8f1)` }}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onPickCategory?.(cat.key)}
                className="flex min-w-0 items-center gap-1.5 rounded-lg text-left text-sm font-semibold hover:underline"
                style={{ color: cat.color }}
                title={`Browse ${cat.label}`}
              >
                <ItemIcon icon={cat.icon} emoji={cat.emoji} size={16} className="shrink-0" />
                <span className="truncate font-display">{cat.short}</span>
              </button>
              <span className="flex gap-0.5" aria-label={`${items.length} of ${LIMITS.zone} used`}>
                {Array.from({ length: LIMITS.zone }, (_, i) => (
                  <span
                    key={i}
                    className={cn('size-1.5 rounded-full', i < items.length ? '' : 'bg-jungle-900/15')}
                    style={i < items.length ? { backgroundColor: cat.color } : undefined}
                  />
                ))}
              </span>
            </div>
            <div
              className={cn(
                'mt-2 flex flex-1 flex-wrap content-center items-center gap-2 rounded-xl',
                items.length === 0 && 'justify-center border-2 border-dashed',
              )}
              style={items.length === 0 ? { borderColor: `${cat.color}33` } : undefined}
            >
              <AnimatePresence initial={false}>
                {items.map((p) => (
                  <PlacedItem key={p.uid} placed={p} />
                ))}
              </AnimatePresence>
              {items.length === 0 && (
                <span className="px-2 text-center text-[11px] font-medium text-jungle-800/45">
                  Drop {cat.short.toLowerCase()} gear here
                </span>
              )}
            </div>
            {full && <span className="sr-only">Zone full</span>}
          </DropZone>
        );
      })}
    </section>
  );
}
