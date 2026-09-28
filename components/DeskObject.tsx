'use client';

import Image from 'next/image';
import { ART } from './ItemArt';
import { useState } from 'react';
import { getItem, MONITOR_SPEC, type Item } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { ItemPhoto } from './ItemPhoto';

export const INK = '#2b2a28';

/**
 * Where the product sits inside each monis.rent packshot: [left, top, right, bottom] as fractions
 * of the (square) photo. Measured from the photos' pixels, so a cropped item is exactly the
 * product: its base sits on the desk and its width is its real width.
 */
const CROP: Record<string, [number, number, number, number]> = {
  'accessories-monitor-24': [0.172, 0.229, 0.839, 0.771],
  'accessories-monitor-27': [0.172, 0.229, 0.841, 0.792],
  'accessories-ultrawide': [0.068, 0.229, 0.932, 0.776],
  'accessories-studio-display': [0.138, 0.221, 0.865, 0.779],
  'accessories-desk-lamp': [0.232, 0.193, 0.674, 0.839],
  'accessories-keyboard': [0.125, 0.385, 0.875, 0.617],
  'accessories-mouse': [0.227, 0.346, 0.773, 0.656],
  'accessories-webcam': [0.167, 0.229, 0.826, 0.75],
  'audio-marshall': [0.094, 0.198, 0.891, 0.747],
  'audio-homepod': [0.305, 0.232, 0.695, 0.724],
  'audio-podcast-mic': [0.276, 0.148, 0.693, 0.852],
  'audio-boom-arm': [0.346, 0.122, 0.693, 0.883],
  'audio-dj-controller': [0.12, 0.284, 0.88, 0.716],
  'computers-mac-mini-m4': [0.169, 0.37, 0.833, 0.635],
  'computers-mac-mini-m2': [0.164, 0.391, 0.826, 0.617],
  'computers-mac-studio': [0.161, 0.323, 0.826, 0.648],
  'computers-dock': [0.049, 0.19, 0.953, 0.773],
  'computers-usb-hub': [0.188, 0.302, 0.849, 0.773],
  'mounts-monitor-riser': [0.169, 0.349, 0.828, 0.633],
};
/** Bottom of the screen (where the stand starts) in each monitor packshot. */
const SCREEN_BOTTOM: Record<string, number> = {
  'accessories-monitor-24': 0.628,
  'accessories-monitor-27': 0.628,
  'accessories-ultrawide': 0.617,
  'accessories-studio-display': 0.643,
};
/** Real size in cm: width, or height when the photo is a side/angled view. */
const SIZE: Record<string, { w?: number; h?: number }> = {
  'accessories-monitor-24': { w: 53.9 },
  'accessories-monitor-27': { w: 61.3 },
  'accessories-ultrawide': { w: 81 },
  'accessories-studio-display': { w: 62.3 },
  'accessories-desk-lamp': { h: 47.9 },
  'accessories-keyboard': { w: 43 },
  'accessories-mouse': { w: 12.5 },
  'accessories-webcam': { w: 10.2 },
  'audio-marshall': { h: 31 },
  'audio-homepod': { h: 16.8 },
  'audio-podcast-mic': { h: 26 },
  'audio-boom-arm': { h: 60 },
  'audio-dj-controller': { w: 48.2 },
  'computers-mac-mini-m4': { w: 12.7 },
  'computers-mac-mini-m2': { w: 19.7 },
  'computers-mac-studio': { w: 19.7 },
  'computers-dock': { w: 22.3 },
  'computers-usb-hub': { w: 11 },
  'mounts-monitor-riser': { w: 29 },
};
/** Stock-photo items are shown as round photo "stickers" of this diameter (cm). */
const STICKER: Record<string, number> = {
  'accessories-plant': 20,
  'audio-desk-speakers': 18,
  'audio-soundbar': 18,
  'audio-studio-monitors': 18,
  'audio-headphones': 18,
  'audio-bt-speaker': 16,
  'computers-gaming-pc': 24,
  'mounts-power-hub': 10,
};
/** Laptops, drawn open: width, screen height (cm), finish. */
export const LAPTOP_DIM: Record<string, { w: number; screen: number; finish: 'silver' | 'dark' | 'space'; tablet?: boolean }> = {
  'computers-macbook-neo': { w: 29.8, screen: 19.5, finish: 'silver' },
  'computers-windows-laptop': { w: 36.4, screen: 22.5, finish: 'dark' },
  'computers-macbook-pro': { w: 31.3, screen: 20.5, finish: 'space' },
  'computers-ipad-pro': { w: 28, screen: 20, finish: 'dark', tablet: true },
};
export const STAND_DIM = { w: 32, h: 15 };

export type Box = { w: number; h: number };

/** Real on-desk size of an item in cm (width × visible height). */
export function deskBox(itemId: string): Box {
  if (ART[itemId]) return { w: ART[itemId].w, h: ART[itemId].h };
  const crop = CROP[itemId];
  if (crop) {
    const aspect = (crop[2] - crop[0]) / (crop[3] - crop[1]);
    const s = SIZE[itemId] ?? {};
    if (s.w) return { w: s.w, h: s.w / aspect };
    if (s.h) return { w: s.h * aspect, h: s.h };
  }
  if (LAPTOP_DIM[itemId]) {
    const l = LAPTOP_DIM[itemId];
    return { w: l.w, h: l.screen + 3 };
  }
  if (itemId === 'accessories-laptop-stand') return STAND_DIM;
  const d = STICKER[itemId] ?? 16;
  return { w: d, h: d };
}

/** Screen-only size of a monitor (no stand), for arms; swapped when turned to portrait. */
export function screenBox(itemId: string, portrait: boolean): Box {
  const s = MONITOR_SPEC[itemId];
  return portrait ? { w: s.screenH, h: s.w } : { w: s.w, h: s.screenH };
}

/** True when the item is a cropped packshot (white background, blended into the scene). */
export const isPackshot = (itemId: string) => itemId in CROP;

/** A packshot cropped to [x0, y0, x1, y1] so the box is exactly the product. */
function Crop({ item, rect, widthCm }: { item: Item; rect: [number, number, number, number]; widthCm: number }) {
  const [failed, setFailed] = useState(false);
  const [x0, y0, x1, y1] = rect;
  const bw = x1 - x0;
  const bh = y1 - y0;
  // The stage draws about 4.5 px per cm on desktop and 2 px per cm on phones; the photo is 1/bw
  // wider than the cropped product, so ask for exactly that (srcset adds the screen density).
  const px = (perCm: number) => Math.round((widthCm * perCm) / bw);
  const sizes = `(max-width: 767px) ${px(2.1)}px, ${px(4.6)}px`;
  if (failed) {
    return (
      <span className="grid size-full place-items-center rounded-lg bg-white/70 text-jungle-800">
        <ItemIcon icon={item.icon} emoji={item.emoji} size={18} />
      </span>
    );
  }
  return (
    <span className="relative block size-full overflow-hidden">
      <span
        className="absolute block aspect-square"
        style={{ width: `${100 / bw}%`, left: `${(-x0 / bw) * 100}%`, top: `${(-y0 / bh) * 100}%` }}
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes={sizes}
          // Few photos on the stage and they are the page's largest paint: load them right away
          loading="eager"
          fetchPriority={item.id in MONITOR_SPEC ? 'high' : 'auto'}
          draggable={false}
          onError={() => setFailed(true)}
          className="pointer-events-none select-none object-cover"
        />
      </span>
    </span>
  );
}

/** An item as it stands on the desk, sized by its box (the parent sets the width). */
export function DeskObject({ itemId }: { itemId: string }) {
  const item = getItem(itemId);
  if (!item) return null;
  const box = deskBox(itemId);

  if (itemId === 'accessories-laptop-stand') {
    return (
      <div title={item.name} className="w-full" style={{ aspectRatio: `${box.w} / ${box.h}` }}>
        <StandArt />
      </div>
    );
  }
  if (LAPTOP_DIM[itemId]) {
    return (
      <div title={item.name} className="w-full" style={{ aspectRatio: `${box.w} / ${box.h}` }}>
        <LaptopArt itemId={itemId} />
      </div>
    );
  }
  const art = ART[itemId];
  if (art) {
    return (
      <div title={item.name} className="w-full" style={{ aspectRatio: `${art.w} / ${art.h}` }}>
        <art.Draw />
      </div>
    );
  }
  const crop = CROP[itemId];
  if (crop) {
    return (
      <div title={item.name} className="w-full" style={{ aspectRatio: `${box.w} / ${box.h}` }}>
        <Crop item={item} rect={crop} widthCm={box.w} />
      </div>
    );
  }
  return (
    <div title={item.name} className="w-full">
      <ItemPhoto item={item} sizes="80px" className="aspect-square w-full rounded-full shadow-tile ring-2 ring-white" />
    </div>
  );
}

/** Just the screen of a monitor (its stand hidden behind the arm), landscape or portrait. */
export function ScreenOnly({ itemId, portrait }: { itemId: string; portrait: boolean }) {
  const item = getItem(itemId);
  const crop = CROP[itemId];
  if (!item || !crop) return null;
  const rect: [number, number, number, number] = [crop[0], crop[1], crop[2], SCREEN_BOTTOM[itemId]];
  const land = screenBox(itemId, false);
  if (!portrait) {
    return (
      <div className="w-full" style={{ aspectRatio: `${land.w} / ${land.h}` }}>
        <Crop item={item} rect={rect} widthCm={land.w} />
      </div>
    );
  }
  // Portrait: the landscape screen turned 90°, inside a tall box
  return (
    <div className="relative w-full" style={{ aspectRatio: `${land.h} / ${land.w}` }}>
      <div
        className="absolute rotate-90"
        style={{
          width: `${(land.w / land.h) * 100}%`,
          height: `${(land.h / land.w) * 100}%`,
          left: `${((land.h - land.w) / 2 / land.h) * 100}%`,
          top: `${((land.w - land.h) / 2 / land.w) * 100}%`,
        }}
      >
        <Crop item={item} rect={rect} widthCm={land.w} />
      </div>
    </div>
  );
}

/**
 * Aluminium laptop stand (KOLMI style), front view from a little above: the tilted platform with its
 * open centre, a front lip, two raked arms, rubber feet and a soft shadow on the desk.
 */
export function StandArt() {
  const s = { stroke: INK, strokeWidth: 1.1, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 32 15" preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="alu" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9da3aa" />
          <stop offset="0.35" stopColor="#e9ecef" />
          <stop offset="0.6" stopColor="#c9ced4" />
          <stop offset="1" stopColor="#8f959d" />
        </linearGradient>
        <linearGradient id="alu-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f5f7" />
          <stop offset="1" stopColor="#c0c5cb" />
        </linearGradient>
        <radialGradient id="stand-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* shadow on the desk */}
      <ellipse cx="16" cy="14.6" rx="15" ry="1.1" fill="url(#stand-shadow)" />
      {/* back brace, in shadow behind the arms */}
      <rect x="7.5" y="6.5" width="17" height="1" rx="0.3" fill="#7d838b" opacity="0.8" />
      {/* two raked arms, wider at the foot, with a shaded inner face */}
      <polygon points="4.6,4.4 8,4.4 9.4,13.9 3.8,13.9" fill="url(#alu)" {...s} />
      <polygon points="7,4.4 8,4.4 9.4,13.9 8.2,13.9" fill="#80868e" opacity="0.55" />
      <polygon points="24,4.4 27.4,4.4 28.2,13.9 22.6,13.9" fill="url(#alu)" {...s} />
      <polygon points="24,4.4 25,4.4 23.8,13.9 22.6,13.9" fill="#80868e" opacity="0.55" />
      {/* tilted platform with its open centre, and its edge thickness */}
      <path d="M3 1 L29 1 L30.6 3.4 L1.4 3.4 Z M10 1.6 L22 1.6 L22.8 2.9 L9.2 2.9 Z" fill="url(#alu-top)" fillRule="evenodd" {...s} />
      <rect x="1.4" y="3.4" width="29.2" height="1.1" rx="0.3" fill="#aab0b7" {...s} />
      {/* front lip that stops the laptop sliding */}
      <rect x="1.2" y="3" width="29.6" height="0.7" rx="0.3" fill="#d7dbe0" stroke={INK} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      {/* rubber feet */}
      <rect x="3.6" y="13.6" width="6" height="1" rx="0.5" fill="#2e2e30" />
      <rect x="22.4" y="13.6" width="6" height="1" rx="0.5" fill="#2e2e30" />
    </svg>
  );
}

const MAC = new Set(['computers-macbook-neo', 'computers-macbook-pro']);

/** Open laptop (or iPad on its keyboard), front view, lid up. `ghost` = the customer's own laptop. */
export function LaptopArt({ itemId, ghost }: { itemId: string; ghost?: boolean }) {
  const d = LAPTOP_DIM[itemId] ?? LAPTOP_DIM['computers-macbook-neo'];
  const s = {
    stroke: ghost ? '#6b6b6b' : INK,
    strokeWidth: 1.1,
    vectorEffect: 'non-scaling-stroke' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: ghost ? '3 2' : undefined,
  };
  const body = d.finish === 'silver' ? '#d5d8dc' : d.finish === 'space' ? '#5d6066' : '#2f3136';
  const deck = d.finish === 'silver' ? '#c3c7cc' : d.finish === 'space' ? '#4d5055' : '#26282c';
  const W = d.w;
  const H = d.screen + 3;
  const bezel = d.tablet ? 0.9 : 0.7;
  const id = `scr-${itemId}${ghost ? '-ghost' : ''}`;
  const sx = 0.8 + bezel;
  const sw = W - 1.6 - 2 * bezel;
  const sh = d.screen - 2 * bezel - 0.6;

  if (ghost) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden>
        <rect x={0.8} y={0} width={W - 1.6} height={d.screen} rx={0.9} fill="#ffffff" fillOpacity="0.55" {...s} />
        <polygon points={`${W * 0.06},${d.screen + 0.4} ${W * 0.94},${d.screen + 0.4} ${W},${H - 0.4} 0,${H - 0.4}`} fill="#ffffff" fillOpacity="0.55" {...s} />
        <text x={W / 2} y={d.screen / 2 + 1} textAnchor="middle" fontSize="2.6" fontWeight="600" fill="#6b6b6b">
          your laptop
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={MAC.has(itemId) ? '#f6c6a8' : '#9bd1ff'} />
          <stop offset="0.5" stopColor={MAC.has(itemId) ? '#b566c9' : '#3f77d8'} />
          <stop offset="1" stopColor={MAC.has(itemId) ? '#3c2a7a' : '#1c2a66'} />
        </linearGradient>
        <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* lid with its screen */}
      <rect x={0.8} y={0} width={W - 1.6} height={d.screen} rx={0.9} fill={d.tablet ? '#1d1e21' : '#1f2023'} {...s} />
      <rect x={sx} y={bezel} width={sw} height={sh} rx={0.3} fill={`url(#${id})`} />
      {MAC.has(itemId) ? (
        <>
          {/* menu bar, notch and dock */}
          <rect x={sx} y={bezel} width={sw} height={0.7} fill="#000" opacity="0.25" />
          <rect x={W / 2 - 1.6} y={bezel} width={3.2} height={0.8} rx={0.35} fill="#111" />
          <rect x={W / 2 - sw * 0.22} y={bezel + sh - 1.5} width={sw * 0.44} height={1.1} rx={0.45} fill="#fff" opacity="0.35" />
        </>
      ) : (
        <>
          {/* Windows taskbar */}
          <rect x={sx} y={bezel + sh - 1.1} width={sw} height={1.1} fill="#0e1a3a" opacity="0.85" />
          <rect x={W / 2 - 0.5} y={bezel + sh - 0.9} width={0.7} height={0.7} fill="#6fb6ff" />
          <circle cx={W / 2} cy={bezel / 2 + 0.05} r={0.18} fill="#555" />
        </>
      )}
      <rect x={sx} y={bezel} width={sw} height={sh} rx={0.3} fill={`url(#${id}-glare)`} />
      {/* hinge + keyboard deck seen from above */}
      <rect x={W * 0.08} y={d.screen - 0.2} width={W * 0.84} height={0.6} fill={body} {...s} />
      <polygon points={`${W * 0.06},${d.screen + 0.4} ${W * 0.94},${d.screen + 0.4} ${W},${H - 0.4} 0,${H - 0.4}`} fill={deck} {...s} />
      {!d.tablet && (
        <>
          <rect x={W * 0.12} y={d.screen + 0.75} width={W * 0.76} height={0.55} rx={0.15} fill="#000" opacity="0.18" />
          <rect x={W * 0.38} y={d.screen + 1.5} width={W * 0.24} height={0.8} rx={0.2} fill={body} opacity="0.8" />
        </>
      )}
    </svg>
  );
}

/** Monitor light bar across the top edge of a screen. */
export function LightBarArt() {
  return (
    <svg viewBox="0 0 45 3" preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="lb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4d52" />
          <stop offset="1" stopColor="#1e1f22" />
        </linearGradient>
      </defs>
      <rect x="0" y="0.4" width="45" height="1.6" rx="0.8" fill="url(#lb)" stroke={INK} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect x="20.5" y="1.8" width="4" height="1.2" rx="0.3" fill="#2a2b2e" />
      <rect x="2" y="1.7" width="41" height="0.4" fill="#ffe7a8" opacity="0.9" />
    </svg>
  );
}

export type ArmGeometry = {
  /** Desk width in cm (viewBox width). */
  deskW: number;
  /** Top of the drawing in cm above the desk bottom (viewBox height). */
  top: number;
  pole: { x: number; bottom: number; top: number };
  /** Screen centres the arms reach to, in cm above the desk bottom. */
  joints: { x: number; y: number }[];
};

/** Pole-and-arm monitor mount, drawn in desk centimetres (y measured up from the desk bottom). */
export function ArmArt({ g, className }: { g: ArmGeometry; className?: string }) {
  const Y = (y: number) => g.top - y;
  const metal = '#2f3134';
  return (
    <svg viewBox={`0 0 ${g.deskW} ${g.top}`} preserveAspectRatio="none" className={cn('block size-full overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id="pole" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1f2022" />
          <stop offset="0.5" stopColor="#55585d" />
          <stop offset="1" stopColor="#1f2022" />
        </linearGradient>
      </defs>
      {/* arms from the pole to each screen's VESA plate */}
      {g.joints.map((j, i) => (
        <g key={i}>
          <line x1={g.pole.x} y1={Y(j.y)} x2={j.x} y2={Y(j.y)} stroke={metal} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={(g.pole.x + j.x) / 2} cy={Y(j.y)} r={1.5} fill="#44474c" stroke={INK} strokeWidth={0.3} />
          <rect x={j.x - 5} y={Y(j.y) - 5} width={10} height={10} rx={1} fill="#26272a" />
        </g>
      ))}
      {/* pole and desk clamp */}
      <rect x={g.pole.x - 1.3} y={Y(g.pole.top)} width={2.6} height={g.pole.top - g.pole.bottom} rx={1.2} fill="url(#pole)" stroke={INK} strokeWidth={0.3} />
      <rect x={g.pole.x - 4.5} y={Y(g.pole.bottom) - 1.2} width={9} height={3} rx={0.8} fill="#1d1e20" stroke={INK} strokeWidth={0.3} />
    </svg>
  );
}
