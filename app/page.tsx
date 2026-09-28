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
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { CATEGORIES, getItem, TOPPERS, type Item, type Slot } from '@/data/catalog';
import { DIMS } from '@/data/dims';
import { backRow, isMonitor, layoutPlane, mountInfo } from '@/lib/rules';
import { useUI } from '@/store/useUI';
import { useSetup } from '@/store/useSetup';
import { Canvas, deskRatioY, toDeskSpot } from '@/components/Canvas';
import { CartBar } from '@/components/CartBar';
import { Catalog } from '@/components/Catalog';
import { Header } from '@/components/Header';
import { ItemGlyph } from '@/components/ItemGlyph';
import { ItemManager } from '@/components/ItemManager';
import { ItemMenu } from '@/components/ItemMenu';
import { QuickAdd } from '@/components/QuickAdd';
import { usePlace } from '@/components/usePlace';
import { ZoneRow } from '@/components/ZoneRow';
import { cn, markDragEnd, type DragData, type ZoneData } from '@/lib/dnd';
import { ItemPhoto } from '@/components/ItemPhoto';
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

// Details panel (and its 28 KB of specs) loads the first time someone opens it.
const ProductDetail = dynamic(() => import('@/components/ProductDetail').then((r) => r.ProductDetail), { ssr: false });
function LazyDetail() {
  const open = useUI((s) => s.detailId !== null);
  const ever = useRef(false);
  if (open) ever.current = true;
  return ever.current ? <ProductDetail /> : null;
}

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

    const r = active.rect.current.translated;
    if (data.kind === 'catalog') {
      if (target === 'desk-surface' && r) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const before = new Set(useSetup.getState().placed.map((p) => p.uid));
        const res = place(data.itemId, target, { at: dropSpot(data.itemId, cx, cy) });
        // A monitor dropped on the desk top stands there, even when the arm has room
        const ry = deskRatioY(cy);
        if (res.ok && isMonitor(data.itemId) && ry !== null && ry >= 0) {
          const added = useSetup.getState().placed.find((p) => !before.has(p.uid));
          if (added && mountInfo(useSetup.getState().placed).mounted.some((m) => m.uid === added.uid)) {
            useSetup.getState().mount(added.uid, false, dropSpot(data.itemId, cx, cy));
          }
        }
      } else if (target) place(data.itemId, target);
    } else if (target !== data.slot) {
      removeItem(data.uid);
    } else if (data.slot === 'desk-surface') {
      // Dropped back on the desk: move it to where it was dropped.
      if (r) rearrange(data.uid, data.itemId, r.left + r.width / 2, r.top + r.height / 2);
    }
  };

  /** Where on the desk top (cm) an item dropped at this screen point should go. */
  const dropSpot = (itemId: string, x: number, y: number) => {
    const { placed } = useSetup.getState();
    const plane = layoutPlane(placed);
    const size = DIMS[itemId] ?? { w: 15, d: 15 };
    return toDeskSpot(x, y, size.w, size.d, plane.W, plane.D) ?? undefined;
  };

  const rearrange = (uid: string, itemId: string, x: number, y: number) => {
    const { move, setHost, moveTo, placed } = useSetup.getState();
    const center = (el: Element) => {
      const b = el.getBoundingClientRect();
      return b.left + b.width / 2;
    };
    const nearest = (sel: string) =>
      [...document.querySelectorAll<HTMLElement>(sel)].sort((a, b) => Math.abs(center(a) - x) - Math.abs(center(b) - x))[0];

    // Webcam / light bar: clip onto the nearest monitor
    if (TOPPERS.has(itemId)) {
      const m = nearest('[data-monitor]');
      if (m?.dataset.uid) setHost(uid, m.dataset.uid);
      return;
    }
    const ry = deskRatioY(y);
    const info = mountInfo(placed);
    const onArm = info.mounted.some((m) => m.uid === uid);
    const report = (r: { ok: boolean; reason?: string }) => {
      if (!r.ok && r.reason) useUI.getState().showToast(r.reason, 'error');
    };
    // Screen dragged off the arm onto the desk top: stand it there
    if (onArm && ry !== null && ry >= 0) {
      report(useSetup.getState().mount(uid, false, dropSpot(itemId, x, y)));
      return;
    }
    // Standing screen lifted up above the desk: put it on the arm
    if (!onArm && isMonitor(itemId) && info.arm && ry !== null && ry < -0.05) {
      report(useSetup.getState().mount(uid, true));
      return;
    }
    // Screens on the arm: change their order on the arm
    if (onArm) {
      const others = [...document.querySelectorAll<HTMLElement>('[data-row="screen"]')].filter((el) => el.dataset.uid !== uid);
      const index = backRow(placed).findIndex((p) => p.uid === others.filter((el) => center(el) < x).pop()?.dataset.uid);
      move(uid, index + 1);
      return;
    }
    // Anything else: put it where it was dropped on the desk top
    const spot = dropSpot(itemId, x, y);
    if (spot) moveTo(uid, spot);
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

      <main className="mx-auto grid max-w-[1440px] gap-x-6 gap-y-5 px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:grid-cols-[17rem_minmax(0,1fr)] md:pb-10 xl:grid-cols-[17rem_minmax(0,1fr)_13rem]">
        {/* Title, centred like the sketch */}
        <div className="text-center md:col-span-2 xl:col-span-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#2b2a28] sm:text-4xl">Design Your Workspace!</h1>
          <p className="mt-1 text-sm font-medium text-jungle-800/70 sm:text-base">— Create Your Perfect Setup! —</p>
        </div>

        {/* Catalog: folder-tab panel on md+, bottom sheet on phones */}
        <aside
          aria-label="Catalog"
          style={{ height: SHEET_HEIGHT[sheet] }}
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[28px] bg-[#f8f7f4]/95 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-12px_rgb(20_48_31/0.35)] ring-1 ring-jungle-900/10 backdrop-blur-md transition-[height] duration-300 ease-out',
            'md:sticky md:top-20 md:z-auto md:h-auto! md:self-start md:rounded-none md:bg-transparent md:px-0 md:shadow-none md:ring-0 md:backdrop-blur-none md:transition-none',
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

        {/* Stage: platform, desk and chair, then the rent call to action */}
        <section aria-label="Your workspace" className="flex min-w-0 flex-col gap-5">
          <Canvas />
          <ItemManager className="-mt-2" />
          <CartBar />
        </section>

        <QuickAdd className="mx-auto w-full max-w-sm md:col-start-2 xl:col-start-3 xl:row-start-2 xl:max-w-none xl:self-center" />

        {/* Coffee | Outdoor | Relax | Garage, across the full width like the sketch */}
        <div className="md:col-start-2 xl:col-end-4">
          <ZoneRow onPickCategory={pickCategory} />
        </div>
      </main>

      <footer className="mx-auto max-w-[1440px] px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] text-center text-xs text-jungle-800/60 sm:px-6 md:pb-8">
        Built by{' '}
        <a href="https://iqbaldwir.my.id" target="_blank" rel="noreferrer" className="font-semibold underline decoration-dashed underline-offset-2 hover:text-jungle-900">
          iqbaldwir.my.id
        </a>{' '}
        · Product photos and specs from monis.rent
      </footer>

      <LazyDetail />
      <ItemMenu />
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
      <ItemPhoto
        item={item}
        fit={item.source === 'monis' ? 'cutout' : 'cover'}
        sizes="48px"
        className="size-11 shrink-0 rounded-xl bg-white ring-1 ring-jungle-900/5"
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">{item.name}</span>
        <span className="block text-[11px] text-jungle-800/60">{formatIDRShort(item.pricePerMonth)}/mo</span>
      </span>
    </div>
  );
}
