'use client';

import { useDndContext } from '@dnd-kit/core';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Armchair, Lock, Plus, Ruler, Table2 } from 'lucide-react';
import { deskWidth, getItem, LAPTOP_STAND, LIGHT_BAR, UNDER_DESK, type Item, type Placed } from '@/data/catalog';
import { cn, type DragData } from '@/lib/dnd';
import { canMount, canPlace, deskLayout, deskSpace, isArm, isMonitor, isPortrait, layoutPlane, mountInfo, mountProblem, type Plane, type Rect, type Spot } from '@/lib/rules';
import { formatDims } from '@/data/dims';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';
import { ArmArt, deskBox, DeskObject, INK, isPackshot, LAPTOP_DIM, LaptopArt, LightBarArt, screenBox, ScreenOnly, STAND_DIM, type ArmGeometry } from './DeskObject';
import { DropZone, StaticZone } from './DropZone';
import { ItemPhoto } from './ItemPhoto';
import { DragHandle, PlacedItem, RemoveButton } from './PlacedItem';
import { usePlace } from './usePlace';
import { ChairArt } from './ChairArt';

const swap = {
  initial: { opacity: 0, y: -60, scale: 0.85 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 140, y: -30, rotate: 14, scale: 0.8 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 28 },
};

const shade = (tone: string, pct: number) => `color-mix(in oklab, ${tone} ${pct}%, #1a0f08)`;
const tint = (tone: string, pct: number) => `color-mix(in oklab, ${tone} ${pct}%, white)`;

/** The desk area of the stage is this many cm wide, so everything is drawn to one real scale. */
const SCENE_CM = 190;
/**
 * The desk drawing is 100 cm tall: 75 cm of desk plus the top face seen a little from above.
 * Heights below are in cm from the bottom of the desk drawing.
 */
const DESK_TALL_CM = 100;
/** Where items along the back of the desk top stand. */
const BACK_LINE = 90;
/** Screens on a side-by-side arm float this far above the desk top. */
const ARM_CLEARANCE = 22;
/** The top face is this share of the desk drawing's height (44 of 160 in the art). */
const FACE_PCT = 27.5;
/** The back edge of the top is this much narrower on each side (perspective), in %. */
const BACK_INSET = 5.5;
/** Top face of the desk in the art's 400×160 viewBox. */
const TOP_FACE = '22,0 378,0 400,44 0,44';

/** The room stage in the sketch's view: round platform, desk seen a little from above, chair from behind. */
export function Canvas({ interactive = true, className }: { interactive?: boolean; className?: string }) {
  const placed = useSetup((s) => s.placed);
  const move = useSetup((s) => s.move);
  const moveTo = useSetup((s) => s.moveTo);
  const lift = useSetup((s) => s.lift);
  const { removeItem } = usePlace();
  const desk = placed.find((p) => p.slot === 'desk');
  const chair = placed.find((p) => p.slot === 'chair');
  const Zone = interactive ? DropZone : StaticZone;
  const deskW = desk ? deskWidth(desk.itemId) : 150;
  const space = deskSpace(placed);
  const L = deskLayout(placed);
  const under = placed.filter((p) => p.slot === 'desk-surface' && UNDER_DESK.has(p.itemId));
  const surfaceCount = placed.filter((p) => p.slot === 'desk-surface').length;

  const pct = (cm: number) => `${(cm / deskW) * 100}%`;
  const plane = layoutPlane(placed);
  const byUid = new Map(placed.map((p) => [p.uid, p]));
  /**
   * Where an item stands on the drawn desk top. The top face is the top FACE_PCT of the desk drawing
   * and narrows a little towards the back (perspective), so deeper items sit higher and slightly smaller.
   */
  const onTop = (r: Rect, boxW: number): React.CSSProperties => {
    const yf = Math.min(1, (r.y + r.d * 0.6) / plane.D);
    const inset = BACK_INSET * (1 - yf);
    const span = 100 - 2 * inset;
    const cx = inset + ((r.x + r.w / 2) / plane.W) * span;
    const w = (boxW / plane.W) * span;
    return { left: `${cx - w / 2}%`, width: `${w}%`, bottom: `${100 - yf * FACE_PCT}%` };
  };
  const rowIndex = (uid: string) => L.row.findIndex((p) => p.uid === uid);

  /** Webcam / light bar on a monitor whose visible width is `wCm`. */
  const toppersFor = (monitor: Placed, wCm: number) => {
    const list = L.toppers.get(monitor.uid);
    if (!list?.length) return undefined;
    return list.map((t) => (
      <PlacedItem
        key={t.uid}
        placed={t}
        interactive={interactive}
        blend={t.itemId !== LIGHT_BAR}
        style={{ width: `${(Math.min(t.itemId === LIGHT_BAR ? 45 : deskBox(t.itemId).w, wCm * 0.8) / wCm) * 100}%` }}
        glyph={
          t.itemId === LIGHT_BAR ? (
            <div className="w-full" style={{ aspectRatio: '45 / 3' }}>
              <LightBarArt />
            </div>
          ) : (
            <DeskObject itemId={t.itemId} />
          )
        }
      />
    ));
  };

  // ---- Screens on the arm -------------------------------------------------------------
  const armRect = L.arm ? plane.rects.get(L.arm.uid) : undefined;
  const arm = L.arm && L.spec ? layoutArm(L.mounted, L.spec.layout, deskW, armRect ? armRect.x + armRect.w / 2 : deskW / 2) : null;

  return (
    <div className={cn('w-full', className)} onClick={() => useUI.getState().select(null)}>
      {interactive && (
        // Fixed height, rendered before the saved setup loads too, so the stage never jumps (CLS)
        <div className="mb-2 flex min-h-7 flex-wrap items-start gap-2 sm:min-h-14">
          {space && (
          <>
          <span className="flex items-center gap-1 rounded-full border border-dashed border-[#2b2a2855] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-jungle-900">
            <Ruler size={12} aria-hidden /> {space.width} × {space.depth} cm desk · {space.freePct}% free
            {L.arm && L.mounted.length > 0 && <span className="text-jungle-800/60"> · {L.mounted.length} on arm</span>}
          </span>
          <DeskPlan className="hidden sm:block" plane={plane} screens={arm ? arm.screens.map((x) => [x.x, x.box.w] as [number, number]) : []} />
          {interactive && plane.overflow.length > 0 && (
            <div role="alert" className="max-w-56 rounded-xl border-[1.5px] border-danger-500 bg-white p-2 text-[11px] font-semibold text-danger-500 shadow-sm">
              Doesn't fit on this desk:
              <ul className="mt-1 space-y-1">
                {plane.overflow.map((p) => (
                  <li key={p.uid} className="flex items-center justify-between gap-2 text-jungle-900">
                    <span className="truncate">{getItem(p.itemId)?.name}</span>
                    <button type="button" onClick={() => removeItem(p.uid)} className="shrink-0 rounded-full border border-danger-500 px-1.5 text-danger-500 hover:bg-danger-500 hover:text-white">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          </>
          )}
        </div>
      )}

    <div
      className={cn(
        'relative isolate aspect-square w-full sm:aspect-[4/3]',
        interactive ? 'paper overflow-visible' : 'overflow-hidden rounded-[28px] bg-white ring-1 ring-jungle-900/10',
      )}
    >
      <Stage />

      {/* Desk area. No transforms on this branch: packshots on the desk blend (multiply) with the stage. */}
      <Zone slot="desk" className="absolute bottom-[15%] left-[4%] right-[4%] flex justify-center rounded-2xl sm:left-[15%] sm:right-[15%]">
        <motion.div
          className="relative"
          initial={false}
          animate={{ width: `${(deskW / SCENE_CM) * 100}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <div data-desk-plane style={{ aspectRatio: `${deskW} / ${DESK_TALL_CM}` }} className="relative w-full">
            <AnimatePresence initial={false}>
              {desk ? <DeskPiece key={desk.uid} placed={desk} interactive={interactive} /> : <GhostDesk key="ghost" interactive={interactive} />}
            </AnimatePresence>
          </div>

          {interactive && <DragHints />}

          {/* Drop target for the desk top: covers the top face and the space above it */}
          <Zone slot="desk-surface" lockedHint="Pick a desk first" className="absolute inset-x-0 bottom-[70%] h-[120%] rounded-2xl">
            {desk && surfaceCount === 0 && interactive && (
              <p className="pointer-events-none absolute inset-x-0 bottom-[30%] text-center text-[11px] font-medium text-jungle-800/50 sm:text-xs">
                Drop monitors, a lamp and a plant on the desk
              </p>
            )}
          </Zone>

          {/* Monitor arm: pole behind everything, screens floating above the desk */}
          {L.arm && arm && (
            <>
              <div
                className="pointer-events-none absolute left-0 w-full"
                style={{ bottom: 0, aspectRatio: `${deskW} / ${arm.g.top}` }}
              >
                <ArmArt g={arm.g} />
              </div>
              <PlacedItem
                key={L.arm.uid}
                placed={L.arm}
                interactive={interactive}
                style={{ position: 'absolute', left: pct(arm.g.pole.x - 5), bottom: `${arm.g.pole.bottom - 2}%`, width: pct(10) }}
                glyph={<div className="w-full" style={{ aspectRatio: `10 / ${Math.max(10, arm.g.pole.top - arm.g.pole.bottom)}` }} />}
              />
              <AnimatePresence initial={false}>
                {arm.screens.map(({ m, x, y, box, portrait }) => {
                  return (
                    <PlacedItem
                      key={m.uid}
                      placed={m}
                      row="screen"
                      interactive={interactive}
                      style={{ position: 'absolute', left: pct(x), bottom: `${y}%`, width: pct(box.w) }}
                      glyph={<ScreenOnly itemId={m.itemId} portrait={portrait} />}
                      onArrow={(dx, dy) => (dy ? lift(m.uid, -dy) : move(m.uid, Math.max(0, rowIndex(m.uid) + Math.sign(dx))))}
                      topper={toppersFor(m, box.w)}
                    />
                  );
                })}
              </AnimatePresence>
            </>
          )}

          {/* Desk top: every item stands at its real spot (x across, y into the depth), back ones first */}
          {[...plane.rects.values()]
            .filter((r) => !isArm(r.itemId))
            .sort((a, b) => a.y + a.d - (b.y + b.d))
            .map((r) => {
              const p = byUid.get(r.uid);
              if (!p) return null;
              const box = deskBox(p.itemId);
              const riser = isMonitor(p.itemId) ? L.risers.get(p.uid) : undefined;
              const laptop = p.itemId === LAPTOP_STAND ? L.laptopOnStand : null;
              return (
                <PlacedItem
                  key={p.uid}
                  placed={p}
                  row={isMonitor(p.itemId) ? 'back' : undefined}
                  interactive={interactive}
                  blend={isPackshot(p.itemId)}
                  style={{ position: 'absolute', ...onTop(r, box.w) }}
                  glyph={
                    <div style={p.turn ? { transform: `perspective(500px) rotateY(${-p.turn}deg)` } : undefined} className="transition-transform duration-300">
                      <DeskObject itemId={p.itemId} />
                    </div>
                  }
                  label={`${getItem(p.itemId)?.name} · ${formatDims(p.itemId)}${p.turn ? ` · turned ${p.turn}°` : ''}`}
                  topper={
                    isMonitor(p.itemId) ? (
                      toppersFor(p, box.w)
                    ) : laptop ? (
                      <PlacedItem
                        placed={laptop}
                        interactive={interactive}
                        style={{ width: `${(LAPTOP_DIM[laptop.itemId].w / STAND_DIM.w) * 100}%`, marginBottom: '-12%' }}
                        glyph={<DeskObject itemId={laptop.itemId} />}
                      />
                    ) : p.itemId === LAPTOP_STAND ? (
                      // Most nomads bring their own laptop: show where it goes
                      <div
                        className="pointer-events-none"
                        title="Your own laptop goes here (or rent one from Computers)"
                        style={{ width: `${(LAPTOP_DIM['computers-macbook-neo'].w / STAND_DIM.w) * 100}%`, marginBottom: '-12%' }}
                      >
                        <div style={{ aspectRatio: `${LAPTOP_DIM['computers-macbook-neo'].w} / ${LAPTOP_DIM['computers-macbook-neo'].screen + 3}` }}>
                          <LaptopArt itemId="computers-macbook-neo" ghost />
                        </div>
                      </div>
                    ) : undefined
                  }
                  under={
                    riser ? (
                      <PlacedItem
                        placed={riser}
                        interactive={interactive}
                        blend
                        style={{ width: `${(deskBox(riser.itemId).w / box.w) * 100}%` }}
                        glyph={<DeskObject itemId={riser.itemId} />}
                      />
                    ) : undefined
                  }
                  onArrow={(dx, dy) => moveTo(p.uid, { x: r.x + dx, y: r.y + dy })}
                />
              );
            })}

          {/* Under the desk: cable tray, headphone hook */}
          {under.length > 0 && (
            <div className="pointer-events-none absolute left-[26%] flex items-start gap-1 *:pointer-events-auto" style={{ top: '34%' }}>
              {under.map((p) => (
                <PlacedItem
                  key={p.uid}
                  placed={p}
                  interactive={interactive}
                  style={{ width: pct(deskBox(p.itemId).w) }}
                  glyph={<DeskObject itemId={p.itemId} />}
                />
              ))}
            </div>
          )}
        </motion.div>
      </Zone>

      {/* Chair, seen from behind, pulled up to the desk */}
      <Zone slot="chair" className="absolute bottom-[2%] left-1/2 z-20 aspect-[120/190] w-[32%] -translate-x-1/2 rounded-3xl sm:w-[24%]">
        <AnimatePresence initial={false}>
          {chair ? <ChairPiece key={chair.uid} placed={chair} interactive={interactive} /> : <GhostChair key="ghost" interactive={interactive} />}
        </AnimatePresence>
      </Zone>

      {interactive && <AddMonitorChip />}
      <Watermark />
    </div>
    </div>
  );
}

/** Where each screen on the arm goes, and the arm geometry to draw, in desk centimetres. */
function layoutArm(mounted: Placed[], layout: 'row' | 'stack', deskW: number, cx: number) {
  const screens = mounted.map((m) => {
    const portrait = isPortrait(m, true);
    return { m, portrait, box: screenBox(m.itemId, portrait), x: 0, y: 0 };
  });
  const base = BACK_LINE;
  if (layout === 'row') {
    const gap = 1.5;
    const total = screens.reduce((s, x) => s + x.box.w, 0) + gap * Math.max(0, screens.length - 1);
    const maxH = Math.max(0, ...screens.map((s) => s.box.h));
    const cy = base + ARM_CLEARANCE + maxH / 2;
    let x = cx - total / 2;
    for (const s of screens) {
      s.x = x;
      s.y = cy - s.box.h / 2 + (s.m.lift ?? 0);
      x += s.box.w + gap;
    }
  } else {
    let y = base + 14;
    for (const s of screens) {
      s.x = cx - s.box.w / 2;
      s.y = y + (s.m.lift ?? 0);
      y += s.box.h + 2;
    }
  }
  const tops = screens.map((s) => s.y + s.box.h);
  const joints = screens.map((s) => ({ x: s.x + s.box.w / 2, y: s.y + s.box.h / 2 }));
  const poleTop = joints.length ? Math.max(...joints.map((j) => j.y)) + 3 : base + 40;
  const top = Math.max(poleTop, ...tops) + 4;
  const g: ArmGeometry = { deskW, top, pole: { x: cx, bottom: 97, top: poleTop }, joints };
  return { g, screens };
}

/** The "+ Add Monitor!" chip from the sketch, next to the desk. */
function AddMonitorChip() {
  const placed = useSetup((s) => s.placed);
  const { place } = usePlace();
  const id = 'accessories-monitor-24';
  const check = canPlace(placed, getItem(id)!, 'desk-surface');
  return (
    <button
      type="button"
      onClick={() => place(id, 'desk-surface', { announce: true })}
      title={check.ok ? 'Add a 24" monitor' : check.reason}
      className={cn(
        'absolute bottom-[20%] right-[1%] z-20 flex items-center gap-1 rounded-lg border-[1.5px] border-[#2b2a28] bg-white px-2.5 py-1 font-display text-xs font-bold text-[#2b2a28] shadow-[2px_2px_0_#2b2a28] transition hover:-translate-y-0.5 active:translate-y-0 sm:text-sm',
        !check.ok && 'opacity-50',
      )}
    >
      <Plus size={14} strokeWidth={3} aria-hidden /> Add Monitor!
    </button>
  );
}

/** The round platform from the sketch: a line-drawn disc with a visible rim. */
function Stage() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute bottom-[3%] left-1/2 h-[30%] w-[100%] -translate-x-1/2 rounded-[50%] border-[1.5px] bg-[#f1ede6]" style={{ borderColor: INK }} />
      <div className="absolute bottom-[5.5%] left-1/2 h-[30%] w-[100%] -translate-x-1/2 rounded-[50%] border-[1.5px] bg-white" style={{ borderColor: INK }} />
      <div className="absolute bottom-[12%] left-1/2 h-[10%] w-[58%] -translate-x-1/2 rounded-[50%] bg-jungle-950/10 blur-md" />
    </div>
  );
}

type DeskKind = 'pedestal' | 'frame' | 'glass';
function deskKind(item: Item): DeskKind {
  if (item.id === 'desks-glass-top') return 'glass';
  if (['desks-standing', 'desks-bamboo', 'desks-folding', 'desks-gaming', 'desks-compact'].includes(item.id)) return 'frame';
  return 'pedestal';
}

/**
 * Desk drawn like the sketch: seen from the front and a little above, so the top is a deep
 * trapezoid (room for screens at the back and keyboard/mouse at the front), with drawer
 * pedestals or a leg frame underneath. ViewBox 400×160: top face 0–44, front edge 44–53.
 */
function DeskArt({ item }: { item: Item }) {
  const tone = item.tone ?? '#c8a27a';
  const kind = deskKind(item);
  const glass = kind === 'glass';
  const s = { stroke: INK, strokeWidth: 1.6, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };
  const metal = item.id === 'desks-gaming' ? '#1b1b25' : '#3b3b3b';

  return (
    <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
      <polygon points={TOP_FACE} fill={glass ? 'rgb(169 214 223 / 0.45)' : tint(tone, 80)} {...s} />
      <line x1="34" y1="8" x2="366" y2="8" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <rect x="0" y="44" width="400" height="9" fill={glass ? 'rgb(90 110 120 / 0.35)' : tone} {...s} />

      {kind === 'pedestal' && (
        <>
          <rect x="104" y="53" width="192" height="46" fill={shade(tone, 62)} opacity="0.55" {...s} />
          {[6, 296].map((x) => (
            <g key={x}>
              <rect x={x} y="53" width="98" height="107" fill={shade(tone, 90)} {...s} />
              <polygon points={x === 6 ? '104,53 112,53 112,156 104,160' : '296,53 288,53 288,156 296,160'} fill={shade(tone, 70)} {...s} />
              {[60, 93, 126].map((y) => (
                <g key={y}>
                  <rect x={x + 7} y={y} width="84" height="28" rx="2" fill={tint(tone, 92)} {...s} />
                  <rect x={x + 36} y={y + 12} width="26" height="4" rx="2" fill={INK} opacity="0.55" />
                </g>
              ))}
            </g>
          ))}
        </>
      )}

      {kind === 'frame' && (
        <g>
          <rect x="44" y="53" width="8" height="86" fill={metal} opacity="0.45" {...s} />
          <rect x="348" y="53" width="8" height="86" fill={metal} opacity="0.45" {...s} />
          <rect x="36" y="60" width="328" height="6" fill={metal} opacity="0.7" {...s} />
          <rect x="24" y="53" width="12" height="100" fill={metal} {...s} />
          <rect x="364" y="53" width="12" height="100" fill={metal} {...s} />
          <rect x="8" y="152" width="44" height="7" rx="3" fill={metal} {...s} />
          <rect x="348" y="152" width="44" height="7" rx="3" fill={metal} {...s} />
          {item.id !== 'desks-compact' && item.id !== 'desks-gaming' && <rect x="318" y="53" width="26" height="6" rx="1.5" fill="#222" {...s} />}
          {item.id === 'desks-gaming' && <rect x="0" y="53" width="400" height="2" fill="#2fb5a8" opacity="0.9" />}
        </g>
      )}

      {glass && (
        <g fill="none" {...s} strokeWidth={2.2}>
          <path d="M22 53 L70 158 M70 53 L22 158" />
          <path d="M330 53 L378 158 M378 53 L330 158" />
        </g>
      )}
    </svg>
  );
}

/** Round photo + name chip, so the drawn piece is tied to the real product. */
function PhotoPlate({ item, extra }: { item: Item; extra?: string }) {
  return (
    <span className="flex max-w-full items-center gap-1.5 rounded-full border-[1.5px] border-[#2b2a28] bg-white py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold text-jungle-900 sm:text-xs">
      <ItemPhoto item={item} sizes="32px" className="size-6 shrink-0 rounded-full bg-white sm:size-7" />
      <span className="truncate">{item.name}</span>
      {extra && <span className="shrink-0 font-medium text-jungle-800/55">{extra}</span>}
    </span>
  );
}

function DeskPiece({ placed, interactive }: { placed: Placed; interactive: boolean }) {
  const openMenu = useUI((st) => st.openMenu);
  const selected = useUI((st) => st.selected === placed.uid);
  const item = getItem(placed.itemId);
  if (!item) return null;
  const onContextMenu = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    openMenu(placed.uid, e.clientX, e.clientY);
  };
  const plate = <PhotoPlate item={item} extra={`${deskWidth(item.id)} cm`} />;

  return (
    <motion.div {...swap} className="group absolute inset-0" onContextMenu={onContextMenu}>
      <DeskArt item={item} />
      {selected && <div aria-hidden className="pointer-events-none absolute -inset-1.5 rounded-lg outline-2 outline-dashed outline-sunset-500" />}
      <div className="absolute -bottom-3 left-0 z-10 flex max-w-[48%] items-center gap-1">
        {interactive ? (
          <DragHandle placed={placed} className="min-w-0" onSelect>
            {plate}
          </DragHandle>
        ) : (
          plate
        )}
        {interactive && <RemoveButton placed={placed} className="shrink-0" />}
      </div>
    </motion.div>
  );
}

function GhostDesk({ interactive }: { interactive: boolean }) {
  const s = { vectorEffect: 'non-scaling-stroke' as const, strokeDasharray: '6 5' };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 text-jungle-800/60">
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="ghost-outline absolute inset-0 size-full" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2">
        <polygon points={TOP_FACE} {...s} />
        <rect x="6" y="53" width="98" height="107" {...s} />
        <rect x="296" y="53" width="98" height="107" {...s} />
      </svg>
      {interactive && (
        <div className="absolute inset-x-4 top-[38%] flex flex-col items-center gap-1 text-center">
          <span className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#2b2a28] bg-white px-3 py-1 text-xs font-semibold">
            <Table2 size={14} aria-hidden /> Drop a desk here
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-jungle-900/50 sm:text-[11px]">
            <Lock size={10} aria-hidden /> Accessories unlock with a desk
          </span>
        </div>
      )}
    </motion.div>
  );
}

function ChairPiece({ placed, interactive }: { placed: Placed; interactive: boolean }) {
  const openMenu = useUI((st) => st.openMenu);
  const selected = useUI((st) => st.selected === placed.uid);
  const item = getItem(placed.itemId);
  if (!item) return null;
  const onContextMenu = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.preventDefault();
    openMenu(placed.uid, e.clientX, e.clientY);
  };

  const body = (
    <div className="relative flex h-full w-full flex-col items-center" title={item.name}>
      <div className="relative min-h-0 w-full flex-1">
        <ChairArt item={item} />
      </div>
      <div className="mt-1 max-w-[200%] whitespace-nowrap">
        <PhotoPlate item={item} />
      </div>
    </div>
  );

  return (
    <motion.div
      {...swap}
      className={cn('group absolute inset-0 rounded-3xl p-1', selected && 'outline-2 outline-dashed outline-sunset-500')}
      onContextMenu={onContextMenu}
    >
      {interactive ? (
        <DragHandle placed={placed} className="h-full w-full" onSelect>
          {body}
        </DragHandle>
      ) : (
        body
      )}
      {interactive && <RemoveButton placed={placed} className="absolute right-0 top-0" />}
    </motion.div>
  );
}

function GhostChair({ interactive }: { interactive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ghost-outline absolute inset-1.5 flex flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-jungle-800/30 bg-white/60 text-jungle-800/60"
    >
      <Armchair className="size-7 sm:size-9" strokeWidth={1.6} aria-hidden />
      {interactive && <span className="text-[10px] font-semibold sm:text-xs">Chair goes here</span>}
    </motion.div>
  );
}

/** Top-down plan of the desk: what takes up room, and the free space left (drawn to scale). */
function DeskPlan({ plane, screens, className }: { plane: Plane; screens: [number, number][]; className?: string }) {
  const rects = [...plane.rects.values()];
  return (
    <svg
      viewBox={`-2 -2 ${plane.W + 4} ${plane.D + 4}`}
      className={cn('h-14 w-auto rounded-md border border-dashed border-[#2b2a2855] bg-white/90', className)}
      role="img"
      aria-label={`Desk plan, ${plane.W} by ${plane.D} cm`}
    >
      <rect x="0" y="0" width={plane.W} height={plane.D} fill="#f1ede6" stroke={INK} strokeWidth="1" />
      {screens.map(([x, w], i) => (
        <rect key={i} x={x} y={0} width={w} height={6} fill="none" stroke={INK} strokeDasharray="3 2" strokeWidth="0.8" />
      ))}
      {rects.map((r) => (
        <rect
          key={r.uid}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.d}
          rx="1.5"
          fill={isMonitor(r.itemId) ? '#2b2a28' : isArm(r.itemId) ? '#6b7280' : '#1f9e93'}
          fillOpacity={isMonitor(r.itemId) ? 0.85 : 0.55}
        />
      ))}
    </svg>
  );
}

/** Screen point → spot on the desk top (cm from left / back edge) for an item of w × d cm. */
export function toDeskSpot(clientX: number, clientY: number, w: number, d: number, W: number, D: number): Spot | null {
  const el = document.querySelector('[data-desk-plane]');
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const yf = Math.max(0, Math.min(1, (clientY - b.top) / b.height / (FACE_PCT / 100)));
  const inset = (BACK_INSET / 100) * (1 - yf);
  const xf = ((clientX - b.left) / b.width - inset) / (1 - 2 * inset);
  return { x: xf * W - w / 2, y: yf * D - d / 2 };
}

/** While dragging a monitor: where to drop it to go on the arm, or to stand it on the desk. */
function DragHints() {
  const { active } = useDndContext();
  const placed = useSetup((s) => s.placed);
  const data = active?.data.current as DragData | undefined;
  if (!data || !isMonitor(data.itemId)) return null;
  const info = mountInfo(placed);
  if (!info.arm || !info.spec) return null;
  const onArm = data.kind === 'placed' && info.mounted.some((m) => m.uid === data.uid);
  const armHasRoom = info.mounted.length < info.spec.cap && canMount(data.itemId, info.spec);
  if (onArm) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 grid h-[27.5%] place-items-center rounded-lg border-2 border-dashed border-lagoon-500 bg-lagoon-50/60 text-[11px] font-bold text-lagoon-500">
        Drop on the desk to stand it here
      </div>
    );
  }
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-[8%] bottom-[104%] z-10 grid h-[55%] place-items-center rounded-2xl border-2 border-dashed text-xs font-bold',
        armHasRoom ? 'border-lagoon-500 bg-lagoon-50/60 text-lagoon-500' : 'border-danger-500 bg-white/70 text-danger-500',
      )}
    >
      {armHasRoom ? 'Drop here to mount it on the arm' : mountProblem([...placed, ...(data.kind === 'catalog' ? [{ uid: '__probe', itemId: data.itemId, slot: 'desk-surface' as const }] : [])], data.kind === 'catalog' ? '__probe' : data.uid) ?? 'The arm is full'}
    </div>
  );
}

/** Vertical position of a screen point relative to the desk drawing: 0 = back edge of the top, 0.275 = front edge, < 0 = above the desk. */
export function deskRatioY(clientY: number): number | null {
  const el = document.querySelector('[data-desk-plane]');
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return (clientY - b.top) / b.height;
}

/** Author watermark on the stage. */
function Watermark() {
  return (
    <a
      href="https://iqbaldwir.my.id"
      target="_blank"
      rel="noreferrer"
      className="absolute bottom-1 right-2 z-10 select-none font-display text-[10px] font-semibold tracking-wide text-[#2b2a28]/40 transition hover:text-[#2b2a28]/80 sm:text-[11px]"
    >
      iqbaldwir.my.id
    </a>
  );
}
