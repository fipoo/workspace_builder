'use client';

import { AnimatePresence, m } from 'framer-motion';
import { Lock } from 'lucide-react';
import { CATEGORIES, itemsInCategory, type Item } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { LIMITS } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { DraggableItem } from './DraggableItem';

const MAIN = ['chairs', 'desks', 'accessories'];
const ZONES = ['coffee', 'outdoor', 'relax', 'garage'];
/** Chip rows under the folder tabs: desk add-ons, then the zones below the stage. */
const GROUPS: [string, string[]][] = [
  ['Desk', ['mounts', 'audio', 'computers']],
  ['Zones', ZONES],
];

const HINTS: Record<string, string> = {
  desks: 'One desk at a time. Dropping a new one swaps it in.',
  chairs: 'One chair. Pick the one your back deserves.',
  accessories: `Drop anything anywhere on the desk top. Up to ${LIMITS.monitors} monitors; nothing tall in front of a screen.`,
  mounts: 'An arm lifts your screens off the desk: turn them to portrait, and use the space underneath (low items only).',
  audio: 'Speakers and mics stand on the desk top. Drop them where you want them.',
  computers: 'A laptop sits on the laptop stand if you have one. Mac mini and Mac Studio fit under a screen on an arm.',
};

type Props = {
  tab: string;
  onTab: (key: string) => void;
  onTap: (item: Item) => void;
  className?: string;
};

/** Tabs of 7 categories x 10 draggable items. */
export function Catalog({ tab, onTab, onTap, className }: Props) {
  const hasDesk = useSetup((s) => s.placed.some((p) => p.slot === 'desk'));
  const cat = CATEGORIES.find((c) => c.key === tab) ?? CATEGORIES[0];
  const items = itemsInCategory(cat.key);
  const locked = cat.slot === 'desk-surface' && !hasDesk;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* Folder tabs, like the sketch: Chairs | Desks | Accessories */}
      <div role="tablist" aria-label="Catalog categories" className="-mb-[1.5px] flex shrink-0 gap-1">
        {MAIN.map((key) => {
          const c = CATEGORIES.find((x) => x.key === key)!;
          const active = c.key === cat.key;
          return (
            <button
              key={c.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTab(c.key)}
              className={cn(
                'relative flex-1 rounded-t-xl border-[1.5px] border-b-0 px-2 py-2 font-display text-[13px] font-bold transition sm:text-sm',
                active ? 'z-10 border-[#2b2a28] bg-white text-jungle-900' : 'border-[#2b2a2855] bg-[#efece6] text-jungle-800/70 hover:bg-white',
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex min-h-0 flex-1 flex-col rounded-b-2xl rounded-tr-2xl border-[1.5px] border-[#2b2a28] bg-white px-3 pt-3 md:rounded-tr-none">
        {GROUPS.map(([title, keys]) => (
          <div
            key={title}
            role="tablist"
            aria-label={`${title} categories`}
            className="scrollbar-none -mx-1 mb-1 flex shrink-0 items-center gap-1 overflow-x-auto px-1"
          >
            <span className="mr-0.5 w-10 shrink-0 text-[10px] font-bold uppercase tracking-wide text-jungle-800/45">{title}</span>
            {keys.map((key) => {
              const c = CATEGORIES.find((x) => x.key === key)!;
              const active = c.key === cat.key;
              return (
                <button
                  key={c.key}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => onTab(c.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition',
                    active ? 'border-[#2b2a28] bg-jungle-900 text-white' : 'border-dashed border-[#2b2a2866] text-jungle-800 hover:border-solid',
                  )}
                >
                  {c.short}
                </button>
              );
            })}
          </div>
        ))}

      <div className="mt-3 flex shrink-0 items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold tracking-tight">{cat.label}</h2>
        <span className="text-[11px] font-medium text-jungle-800/50">Drag, tap, or ⓘ for specs</span>
      </div>
      <p className="mt-0.5 shrink-0 text-xs text-jungle-800/65">
        {HINTS[cat.key] ?? `Up to ${LIMITS.zone} items in the ${cat.label} zone.`}
      </p>

      {locked && (
        <button
          type="button"
          onClick={() => onTab('desks')}
          className="mt-2 flex shrink-0 items-center gap-2 rounded-xl bg-sand-200/80 px-3 py-2 text-left text-xs font-semibold text-jungle-900 ring-1 ring-sand-400/60 hover:bg-sand-200"
        >
          <Lock size={14} aria-hidden /> Pick a desk first. Accessories sit on it. →
        </button>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pr-0.5 md:h-[16.25rem] md:flex-none">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={cat.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="tabpanel"
            aria-label={cat.label}
            className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-3"
          >
            {items.map((item) => (
              <DraggableItem key={item.id} item={item} onTap={onTap} locked={locked} />
            ))}
          </m.div>
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
