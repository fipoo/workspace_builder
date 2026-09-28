'use client';

import { CATEGORIES, getItem, ZONE_SLOTS } from '@/data/catalog';
import { ItemIcon } from '@/lib/icons';
import { useSetup } from '@/store/useSetup';
import { Canvas } from './Canvas';
import { ItemGlyph } from './ItemGlyph';

/** Read-only snapshot of the room plus zone items, for checkout. */
export function MiniPreview() {
  const placed = useSetup((s) => s.placed);
  const zones = ZONE_SLOTS.map((slot) => ({
    cat: CATEGORIES.find((c) => c.slot === slot)!,
    items: placed.filter((p) => p.slot === slot),
  })).filter((z) => z.items.length > 0);

  return (
    <div className="space-y-3">
      <Canvas interactive={false} />
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {zones.map(({ cat, items }) => (
            <div
              key={cat.key}
              className="flex items-center gap-1.5 rounded-2xl bg-white/70 py-1.5 pl-2 pr-1.5 ring-1 ring-jungle-900/5"
            >
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: cat.color }}>
                <ItemIcon icon={cat.icon} emoji={cat.emoji} size={14} /> {cat.short}
              </span>
              {items.map((p) => {
                const item = getItem(p.itemId);
                return item ? <ItemGlyph key={p.uid} item={item} size="sm" /> : null;
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
