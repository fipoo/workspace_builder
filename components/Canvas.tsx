'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Armchair, Lock, Table2, TreePalm } from 'lucide-react';
import { getItem, type Placed } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { useSetup } from '@/store/useSetup';
import { DropZone, StaticZone } from './DropZone';
import { DragHandle, PlacedItem, RemoveButton } from './PlacedItem';

const swap = {
  initial: { opacity: 0, y: -60, scale: 0.85 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 140, y: -30, rotate: 14, scale: 0.8 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 28 },
};

const shade = (tone: string, pct: number) => `color-mix(in oklab, ${tone} ${pct}%, #1a0f08)`;

/** The room stage: desk, desk top and chair. Zone pads live in <ZoneRow />. */
export function Canvas({ interactive = true, className }: { interactive?: boolean; className?: string }) {
  const placed = useSetup((s) => s.placed);
  const desk = placed.find((p) => p.slot === 'desk');
  const chair = placed.find((p) => p.slot === 'chair');
  const surface = placed.filter((p) => p.slot === 'desk-surface');
  const Zone = interactive ? DropZone : StaticZone;

  return (
    <div
      className={cn(
        'relative isolate aspect-[5/4] w-full overflow-hidden rounded-[28px] ring-1 ring-jungle-900/10 sm:aspect-[16/11]',
        interactive && 'shadow-lift',
        className,
      )}
    >
      <RoomBackdrop />

      {/* Desk (with its desk-top zone) */}
      <Zone
        slot="desk"
        className="absolute bottom-[19%] left-1/2 w-[86%] -translate-x-1/2 rounded-2xl sm:w-[70%]"
      >
        <Zone
          slot="desk-surface"
          lockedHint="Pick a desk first"
          className="relative flex min-h-[4.25rem] flex-wrap-reverse content-start items-end justify-center gap-x-1.5 gap-y-1 rounded-xl px-2 pb-0.5 sm:min-h-[5.5rem] sm:gap-x-2.5"
        >
          <AnimatePresence initial={false}>
            {surface.map((p) => (
              <PlacedItem key={p.uid} placed={p} interactive={interactive} />
            ))}
          </AnimatePresence>
          {desk && surface.length === 0 && interactive && (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] font-medium text-jungle-800/50 sm:text-xs">
              Drop monitors, lamps and plants on the desk
            </p>
          )}
        </Zone>
        <div className="relative h-20 sm:h-28">
          <AnimatePresence initial={false}>
            {desk ? (
              <DeskPiece key={desk.uid} placed={desk} interactive={interactive} />
            ) : (
              <GhostDesk key="ghost" interactive={interactive} />
            )}
          </AnimatePresence>
        </div>
      </Zone>

      {/* Chair, in front of the desk */}
      <Zone
        slot="chair"
        className="absolute bottom-[3%] left-1/2 z-10 size-24 -translate-x-1/2 rounded-3xl sm:size-32"
      >
        <AnimatePresence initial={false}>
          {chair ? (
            <ChairPiece key={chair.uid} placed={chair} interactive={interactive} />
          ) : (
            <GhostChair key="ghost" interactive={interactive} />
          )}
        </AnimatePresence>
      </Zone>
    </div>
  );
}

function RoomBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="room-wall absolute inset-x-0 top-0 h-[58%]" />
      <div className="room-floor absolute inset-x-0 bottom-0 h-[42%]" />
      <div className="absolute inset-x-0 top-[58%] h-2 -translate-y-full bg-[#b98a5e]/60" />

      {/* Arched window with a Bali sunset */}
      <div className="absolute left-[6%] top-[9%] h-[34%] w-[20%] overflow-hidden rounded-t-full border-[5px] border-[#8b5e3c] bg-linear-to-b from-[#ffd79a] via-[#f7a36c] to-[#e2683c] shadow-inner">
        <div className="absolute left-1/2 top-[48%] size-[38%] -translate-x-1/2 rounded-full bg-[#fff1c9]/90" />
        <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[#2a7fb0]/70" />
        <TreePalm className="absolute -bottom-1 right-[4%] size-[62%] text-jungle-900/85" strokeWidth={1.8} />
        <div className="absolute inset-y-0 left-1/2 w-[5px] -translate-x-1/2 bg-[#8b5e3c]" />
      </div>

      {/* Wall shelf with a tiny plant and books */}
      <div className="absolute right-[7%] top-[22%] hidden w-[18%] sm:block">
        <div className="flex items-end justify-around px-1">
          <div className="h-5 w-3 rounded-sm bg-sunset-500/80" />
          <div className="h-6 w-2.5 rounded-sm bg-jungle-700/80" />
          <div className="h-4 w-3 rounded-sm bg-lagoon-500/70" />
          <div className="relative h-5 w-5 rounded-b-md bg-[#c9532a]">
            <div className="absolute -top-3 left-1/2 h-4 w-6 -translate-x-1/2 rounded-full bg-jungle-500" />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[#8b5e3c]" />
      </div>

      {/* Pendant lamp */}
      <div className="absolute right-[30%] top-0 hidden flex-col items-center sm:flex">
        <div className="h-8 w-px bg-jungle-900/40" />
        <div className="h-4 w-10 rounded-t-full bg-jungle-800" />
        <div className="h-24 w-28 -translate-y-1 bg-[radial-gradient(closest-side,rgb(255_228_170/0.55),transparent)]" />
      </div>

      {/* Floor shadow under the desk area */}
      <div className="absolute bottom-[14%] left-1/2 h-[10%] w-[70%] -translate-x-1/2 rounded-[50%] bg-jungle-950/15 blur-md" />
    </div>
  );
}

function DeskPiece({ placed, interactive }: { placed: Placed; interactive: boolean }) {
  const item = getItem(placed.itemId);
  if (!item) return null;
  const tone = item.tone ?? '#c8a27a';
  const glass = item.id === 'desks-glass-top';
  const gaming = item.id === 'desks-gaming';

  const plate = (
    <div className="flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/85 py-0.5 pl-1 pr-2.5 text-[11px] font-semibold text-jungle-900 shadow-sm sm:text-xs">
      <span className="grid size-5 place-items-center rounded-full text-white" style={{ backgroundColor: tone }}>
        <ItemIcon icon={item.icon} emoji={item.emoji} size={12} />
      </span>
      <span className="truncate">{item.name}</span>
    </div>
  );

  return (
    <motion.div {...swap} className="group absolute inset-0">
      {/* Tabletop */}
      <div
        className="relative h-3.5 rounded-md sm:h-4"
        style={{
          backgroundColor: glass ? 'rgb(169 214 223 / 0.65)' : tone,
          boxShadow: `inset 0 2px 0 rgb(255 255 255 / 0.35), 0 3px 0 ${shade(tone, 70)}${
            gaming ? ', 0 6px 18px -2px #2fb5a8, 0 8px 22px -4px #e2683c' : ''
          }`,
          backdropFilter: glass ? 'blur(2px)' : undefined,
        }}
      />
      {/* Apron with the name plate */}
      <div
        className="mx-[3%] flex h-7 items-center justify-between gap-2 rounded-b-md px-2 sm:h-8"
        style={{ backgroundColor: glass ? 'rgb(90 110 120 / 0.35)' : shade(tone, 82) }}
      >
        {interactive ? (
          <DragHandle placed={placed} className="min-w-0">
            {plate}
          </DragHandle>
        ) : (
          plate
        )}
        {interactive && <RemoveButton placed={placed} className="shrink-0" />}
      </div>
      {/* Legs */}
      {['left-[5%]', 'right-[5%]'].map((pos) => (
        <div
          key={pos}
          className={cn('absolute bottom-0 top-[2.6rem] w-2.5 rounded-b-sm sm:top-12 sm:w-3', pos)}
          style={{ backgroundColor: glass ? '#6b7c85' : shade(tone, 66) }}
        />
      ))}
    </motion.div>
  );
}

function GhostDesk({ interactive }: { interactive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 text-jungle-800/60"
    >
      <div className="ghost-outline h-3.5 rounded-md border-2 border-dashed border-jungle-800/30 sm:h-4" />
      <div className="absolute bottom-0 left-[5%] top-5 w-2.5 rounded-b-sm border-2 border-dashed border-jungle-800/25" />
      <div className="absolute bottom-0 right-[5%] top-5 w-2.5 rounded-b-sm border-2 border-dashed border-jungle-800/25" />
      {interactive && (
        <div className="absolute inset-x-8 top-6 flex flex-col items-center gap-1 text-center sm:top-8">
          <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold shadow-sm">
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
  const item = getItem(placed.itemId);
  if (!item) return null;
  const tone = item.tone ?? '#4a5568';

  const body = (
    <div className="relative flex h-full w-full flex-col items-center" title={item.name}>
      {/* Backrest */}
      <div
        className="relative grid h-[46%] w-[64%] place-items-center rounded-t-[45%] rounded-b-lg"
        style={{ backgroundColor: tone, boxShadow: `inset 0 3px 0 rgb(255 255 255 / 0.25), 0 3px 0 ${shade(tone, 70)}` }}
      >
        <ItemIcon icon={item.icon} emoji={item.emoji} size={24} className="size-5 text-white/90 sm:size-7" />
      </div>
      {/* Seat */}
      <div
        className="-mt-0.5 h-[13%] w-[84%] rounded-lg"
        style={{ backgroundColor: shade(tone, 85), boxShadow: `0 3px 0 ${shade(tone, 60)}` }}
      />
      {/* Stem + base */}
      <div className="h-[9%] w-2 bg-jungle-950/80" />
      <div className="h-1.5 w-[62%] rounded-full bg-jungle-950/85" />
      <span className="mt-1 max-w-full truncate rounded-full bg-white/85 px-2 text-[10px] font-semibold text-jungle-900 shadow-sm sm:text-[11px]">
        {item.name}
      </span>
    </div>
  );

  return (
    <motion.div {...swap} className="group absolute inset-0 p-1.5">
      {interactive ? (
        <DragHandle placed={placed} className="h-full w-full">
          {body}
        </DragHandle>
      ) : (
        body
      )}
      {interactive && <RemoveButton placed={placed} className="absolute right-1 top-1" />}
    </motion.div>
  );
}

function GhostChair({ interactive }: { interactive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ghost-outline absolute inset-1.5 flex flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-jungle-800/30 bg-white/20 text-jungle-800/60"
    >
      <Armchair className="size-7 sm:size-9" strokeWidth={1.6} aria-hidden />
      {interactive && <span className="text-[10px] font-semibold sm:text-xs">Chair goes here</span>}
    </motion.div>
  );
}
