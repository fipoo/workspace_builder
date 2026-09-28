'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { CATEGORIES, itemsInCategory, type Item } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { LIMITS } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { DraggableItem } from './DraggableItem';

const HINTS: Record<string, string> = {
  desks: 'One desk at a time. Dropping a new one swaps it in.',
  chairs: 'One chair. Pick the one your back deserves.',
  accessories: `Stacks on your desk: up to ${LIMITS.accessories} items, max ${LIMITS.monitors} monitors.`,
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
      <div
        role="tablist"
        aria-label="Catalog categories"
        className="scrollbar-none -mx-1 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible"
      >
        {CATEGORIES.map((c) => {
          const active = c.key === cat.key;
          return (
            <button
              key={c.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTab(c.key)}
              className={cn(
                'relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition',
                active ? 'text-white' : 'bg-white/60 text-jungle-800 hover:bg-white',
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <ItemIcon icon={c.icon} emoji={c.emoji} size={14} />
                {c.short}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex shrink-0 items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold tracking-tight">{cat.label}</h2>
        <span className="text-xs font-medium text-jungle-800/50">Drag or tap</span>
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

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-0.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="tabpanel"
            aria-label={cat.label}
            className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-2 md:gap-2.5"
          >
            {items.map((item) => (
              <DraggableItem key={item.id} item={item} onTap={onTap} locked={locked} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
