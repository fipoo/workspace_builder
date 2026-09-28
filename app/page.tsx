'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES, getItem, type Item, type Slot } from '@/data/catalog';
import { Canvas } from '@/components/Canvas';
import { CartBar } from '@/components/CartBar';
import { Catalog } from '@/components/Catalog';
import { Header } from '@/components/Header';
import { ItemGlyph } from '@/components/ItemGlyph';
import { QuickAdd } from '@/components/QuickAdd';
import { usePlace } from '@/components/usePlace';
import { ZoneRow } from '@/components/ZoneRow';
import { cn, markDragEnd, type DragData, type ZoneData } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { formatIDRShort } from '@/lib/pricing';

type Sheet = 'peek' | 'half' | 'full';
const SHEET_HEIGHT: Record<Sheet, string> = {
  peek: 'calc(8.75rem + env(safe-area-inset-bottom))',
  half: '52dvh',
  full: '86dvh',
};
const SHEET_ORDER: Sheet[] = ['peek', 'half', 'full'];

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

const slotOf = (args: Parameters<CollisionDetection>[0], id: string | number) =>
  (args.droppableContainers.find((c) => c.id === id)?.data.current as ZoneData | undefined)?.slot;

/**
 * Pointer: of all zones under the pointer, prefer the one that matches the dragged item's
 * slot (the desk top sits inside the desk zone). Keyboard: move between matching zones only.
 */
const collision: CollisionDetection = (args) => {
  const slot = (args.active.data.current as DragData | undefined)?.slot;
  if (args.pointerCoordinates) {
    const hits = pointerWithin(args);
    const match = hits.find((h) => slotOf(args, h.id) === slot);
    return match ? [match] : hits.slice(0, 1);
  }
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => (c.data.current as ZoneData)?.slot === slot),
  });
};

const nameOf = (data: unknown) => getItem((data as DragData | undefined)?.itemId ?? '')?.name ?? 'item';

const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${nameOf(active.data.current)}.`,
  onDragOver: ({ active, over }) =>
    over ? `${nameOf(active.data.current)} is over the ${String(over.id).replace('zone-', '')} zone.` : undefined,
  onDragEnd: ({ active, over }) =>
    over ? `Dropped ${nameOf(active.data.current)} on the ${String(over.id).replace('zone-', '')} zone.` : `Dropped ${nameOf(active.data.current)}.`,
  onDragCancel: ({ active }) => `Cancelled dragging ${nameOf(active.data.current)}.`,
};

export default function BuilderPage() {
  const { place, removeItem } = usePlace();
  const [tab, setTab] = useState(CATEGORIES[0].key);
  const [sheet, setSheet] = useState<Sheet>('peek');
  const [active, setActive] = useState<DragData | null>(null);
  const [overSlot, setOverSlot] = useState<Slot | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    // Space picks up, Enter stays free for tap-to-add.
    useSensor(KeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] } }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setActive(active.data.current as DragData);
    if (isMobile()) setSheet('peek');
  };

  const onDragOver = ({ over }: DragOverEvent) => {
    setOverSlot((over?.data.current as ZoneData | undefined)?.slot ?? null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const data = active.data.current as DragData;
    const target = (over?.data.current as ZoneData | undefined)?.slot;
    setActive(null);
    setOverSlot(null);
    markDragEnd();

    if (data.kind === 'catalog') {
      if (target) place(data.itemId, target);
    } else if (target !== data.slot) {
      removeItem(data.uid);
    }
  };

  const onDragCancel = () => {
    setActive(null);
    setOverSlot(null);
    markDragEnd();
  };

  const onTap = (item: Item) => {
    place(item.id, item.slot, { announce: true });
    if (isMobile() && sheet === 'full') setSheet('half');
  };

  const pickCategory = (key: string) => {
    setTab(key);
    if (isMobile()) setSheet('half');
  };

  const cycleSheet = (dir: 1 | -1) => {
    const i = SHEET_ORDER.indexOf(sheet) + dir;
    setSheet(SHEET_ORDER[Math.max(0, Math.min(SHEET_ORDER.length - 1, i))]);
  };

  return (
    <DndContext
      id="workspace-builder"
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      accessibility={{ announcements }}
    >
      <Header />

      <main className="mx-auto grid max-w-[1440px] gap-5 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:grid-cols-[17.5rem_minmax(0,1fr)] md:pb-8 xl:grid-cols-[19rem_minmax(0,1fr)_16rem]">
        {/* Catalog: sidebar on md+, bottom sheet on phones */}
        <aside
          aria-label="Catalog"
          style={{ height: SHEET_HEIGHT[sheet] }}
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[28px] bg-sand-50/95 px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-12px_rgb(20_48_31/0.35)] ring-1 ring-jungle-900/10 backdrop-blur-md transition-[height] duration-300 ease-out',
            'md:sticky md:top-20 md:z-auto md:h-[calc(100dvh-6.5rem)]! md:rounded-3xl md:bg-white/55 md:px-4 md:pt-4 md:shadow-tile md:transition-none',
          )}
        >
          <button
            type="button"
            aria-label={sheet === 'full' ? 'Collapse catalog' : 'Expand catalog'}
            onClick={() => setSheet(sheet === 'peek' ? 'half' : sheet === 'half' ? 'full' : 'peek')}
            onTouchStart={(e) => ((e.currentTarget.dataset.y = String(e.touches[0].clientY)))}
            onTouchEnd={(e) => {
              const start = Number(e.currentTarget.dataset.y);
              const dy = e.changedTouches[0].clientY - start;
              if (Math.abs(dy) > 30) {
                e.preventDefault();
                cycleSheet(dy < 0 ? 1 : -1);
              }
            }}
            className="flex w-full flex-col items-center gap-1 pb-2 pt-2.5 md:hidden"
          >
            <span className="h-1.5 w-10 rounded-full bg-jungle-900/20" />
            <span className="flex items-center gap-1 text-[11px] font-semibold text-jungle-800/60">
              <ChevronUp size={12} className={cn('transition-transform', sheet === 'full' && 'rotate-180')} aria-hidden />
              {sheet === 'peek' ? 'Browse 70 items' : 'Catalog'}
            </span>
          </button>
          <Catalog tab={tab} onTab={pickCategory} onTap={onTap} className="min-h-0 flex-1" />
        </aside>

        {/* Stage */}
        <section aria-label="Your workspace" className="flex min-w-0 flex-col gap-4">
          <Canvas />
          <ZoneRow onPickCategory={pickCategory} />
          <div className="hidden md:sticky md:bottom-4 md:z-20 md:block">
            <CartBar />
          </div>
        </section>

        <QuickAdd className="md:col-start-2 xl:col-start-3 xl:row-start-1 xl:self-start" />
        {/* On phones the call to action comes last, after quick add */}
        <CartBar className="md:hidden" />
      </main>

      <DragOverlay dropAnimation={null}>{active && <DragPreview data={active} overSlot={overSlot} />}</DragOverlay>
    </DndContext>
  );
}

function DragPreview({ data, overSlot }: { data: DragData; overSlot: Slot | null }) {
  const item = getItem(data.itemId);
  if (!item) return null;

  if (data.kind === 'placed') {
    const removing = overSlot !== data.slot;
    return (
      <div className="relative flex cursor-grabbing flex-col items-center">
        <div className={cn('transition', removing && 'scale-90 opacity-70 grayscale')}>
          <ItemGlyph item={item} />
        </div>
        {removing && (
          <span className="mt-1.5 flex items-center gap-1 whitespace-nowrap rounded-full bg-danger-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
            <Trash2 size={11} aria-hidden /> Release to remove
          </span>
        )}
      </div>
    );
  }

  const cat = CATEGORIES.find((c) => c.label === item.category)!;
  return (
    <div className="flex w-36 -rotate-3 cursor-grabbing items-center gap-2 rounded-2xl bg-white p-2.5 shadow-lift ring-2" style={{ ['--tw-ring-color' as string]: cat.color }}>
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ color: cat.color, backgroundColor: `color-mix(in oklab, ${cat.color} 12%, white)` }}
      >
        <ItemIcon icon={item.icon} emoji={item.emoji} size={22} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">{item.name}</span>
        <span className="block text-[11px] text-jungle-800/60">{formatIDRShort(item.pricePerMonth)}/mo</span>
      </span>
    </div>
  );
}
