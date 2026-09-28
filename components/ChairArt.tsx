'use client';

import { useId } from 'react';
import { DIMS } from '@/data/dims';
import type { Item } from '@/data/catalog';

const INK = '#2b2a28';
const shade = (tone: string, pct: number) => `color-mix(in oklab, ${tone} ${pct}%, #1a0f08)`;
const tint = (tone: string, pct: number) => `color-mix(in oklab, ${tone} ${pct}%, white)`;

/** Drawing units per cm: the tallest chair (135 cm) just fits the 190-unit-high box. */
const K = 1.35;
/** Floor line in the 120 × 190 viewBox. */
const FLOOR = 186;

/**
 * Each chair from the catalog, seen from behind as it is pulled up to the desk, drawn to its real
 * height and width in the sketch's line style.
 */
export function ChairArt({ item }: { item: Item }) {
  const uid = useId().replace(/:/g, '');
  const tone = item.tone ?? '#4a5568';
  const h = (DIMS[item.id]?.h ?? 100) * K;
  const top = FLOOR - h;
  const s = { stroke: INK, strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };

  const defs = (
    <defs>
      <pattern id={`mesh-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="4" fill={tone} />
        <line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeOpacity="0.28" strokeWidth="1.2" />
      </pattern>
      <pattern id={`weave-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill={tint(tone, 90)} />
        <path d="M0 3 H6 M3 0 V6" stroke={shade(tone, 70)} strokeWidth="1.4" />
      </pattern>
      <linearGradient id={`chrome-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a8f96" />
        <stop offset="0.5" stopColor="#eef0f2" />
        <stop offset="1" stopColor="#80858c" />
      </linearGradient>
    </defs>
  );

  /** Gas lift, 5-star base and casters, shared by office chairs. */
  const officeBase = (seatBottom: number, metal = '#2f2f33') => (
    <g>
      <rect x="55" y={seatBottom} width="10" height={FLOOR - 16 - seatBottom} fill={metal} {...s} />
      <path d={`M60 ${FLOOR - 16} L12 ${FLOOR - 6} M60 ${FLOOR - 16} L108 ${FLOOR - 6} M60 ${FLOOR - 16} L32 ${FLOOR - 1} M60 ${FLOOR - 16} L88 ${FLOOR - 1} M60 ${FLOOR - 16} L60 ${FLOOR - 3}`} fill="none" stroke={metal === '#2f2f33' ? INK : '#6f747b'} strokeWidth="5" strokeLinecap="round" />
      {[
        [12, FLOOR - 3],
        [108, FLOOR - 3],
        [32, FLOOR + 1.5],
        [88, FLOOR + 1.5],
        [60, FLOOR - 0.5],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.2" fill="#fff" {...s} />
      ))}
    </g>
  );

  const box = (children: React.ReactNode) => (
    <svg viewBox="0 0 120 190" className="size-full overflow-visible" aria-hidden>
      {defs}
      <ellipse cx="60" cy={FLOOR + 2} rx="52" ry="5" fill="#000" opacity="0.08" />
      {children}
    </svg>
  );

  switch (item.id) {
    // Mesh back with headrest, lumbar bar and 4D arms (the monis.rent OCA259PRO)
    case 'chairs-ergo-mesh': {
      const seat = FLOOR - 62;
      return box(
        <>
          <path d={`M30 ${seat - 18} v-14 h12 v18 M90 ${seat - 18} v-14 h-12 v18`} fill={shade(tone, 70)} {...s} />
          <rect x="12" y={seat} width="96" height="13" rx="6.5" fill={shade(tone, 78)} {...s} />
          <rect x="44" y={top} width="32" height="16" rx="6" fill={`url(#mesh-${uid})`} {...s} />
          <rect x="57" y={top + 16} width="6" height="8" fill="#2f2f33" {...s} />
          <path d={`M28 ${top + 26} Q60 ${top + 18} 92 ${top + 26} Q98 ${seat - 40} 90 ${seat + 2} H30 Q22 ${seat - 40} 28 ${top + 26} Z`} fill={`url(#mesh-${uid})`} {...s} />
          <path d={`M33 ${seat - 22} Q60 ${seat - 28} 87 ${seat - 22}`} fill="none" stroke="#2f2f33" strokeWidth="4" strokeLinecap="round" />
          {officeBase(seat + 13)}
        </>,
      );
    }
    // Mid-back mesh task chair, fixed loop arms
    case 'chairs-task': {
      const seat = FLOOR - 60;
      return box(
        <>
          <path d={`M26 ${seat + 4} V${seat - 20} H36 M94 ${seat + 4} V${seat - 20} H84`} fill="none" stroke="#2f2f33" strokeWidth="4" strokeLinecap="round" />
          <rect x="16" y={seat} width="88" height="12" rx="6" fill={shade(tone, 78)} {...s} />
          <path d={`M34 ${top} Q60 ${top - 6} 86 ${top} Q92 ${seat - 30} 86 ${seat + 2} H34 Q28 ${seat - 30} 34 ${top} Z`} fill={`url(#mesh-${uid})`} {...s} />
          {officeBase(seat + 12)}
        </>,
      );
    }
    // Racing-style gaming chair: shoulder wings, harness slots, neck pillow, coloured side panels
    case 'chairs-gaming': {
      const seat = FLOOR - 64;
      const body = '#1f1f24';
      return box(
        <>
          <path d={`M24 ${seat - 16} v-14 h12 v18 M96 ${seat - 16} v-14 h-12 v18`} fill={body} {...s} />
          <path d={`M10 ${seat - 2} Q14 ${seat + 12} 30 ${seat + 13} H90 Q106 ${seat + 12} 110 ${seat - 2} Z`} fill={body} {...s} />
          <path
            d={`M40 ${top} H80 Q88 ${top + 4} 88 ${top + 22} Q100 ${top + 28} 98 ${top + 48} Q92 ${seat - 30} 92 ${seat + 2} H28 Q28 ${seat - 30} 22 ${top + 48} Q20 ${top + 28} 32 ${top + 22} Q32 ${top + 4} 40 ${top} Z`}
            fill={body}
            {...s}
          />
          <path d={`M26 ${top + 46} Q30 ${seat - 30} 32 ${seat} M94 ${top + 46} Q90 ${seat - 30} 88 ${seat}`} fill="none" stroke={tone} strokeWidth="5" />
          <rect x="48" y={top + 10} width="7" height="12" rx="2" fill="#000" opacity="0.6" />
          <rect x="65" y={top + 10} width="7" height="12" rx="2" fill="#000" opacity="0.6" />
          <rect x="44" y={top + 26} width="32" height="10" rx="5" fill={tone} {...s} />
          {officeBase(seat + 13)}
        </>,
      );
    }
    // High, tufted leather back with chrome loop arms
    case 'chairs-executive-leather': {
      const seat = FLOOR - 62;
      const dots = [];
      for (let y = top + 16; y < seat - 8; y += 14) for (let x = 40; x <= 80; x += 13) dots.push([x + ((y - top) % 28 ? 6.5 : 0), y]);
      return box(
        <>
          <path d={`M22 ${seat + 6} Q20 ${seat - 22} 34 ${seat - 22} M98 ${seat + 6} Q100 ${seat - 22} 86 ${seat - 22}`} fill="none" stroke={`url(#chrome-${uid})`} strokeWidth="5" strokeLinecap="round" />
          <rect x="14" y={seat} width="92" height="14" rx="7" fill={shade(tone, 85)} {...s} />
          <path d={`M30 ${top + 8} Q60 ${top - 6} 90 ${top + 8} Q96 ${seat - 40} 90 ${seat + 2} H30 Q24 ${seat - 40} 30 ${top + 8} Z`} fill={tone} {...s} />
          <path d={`M36 ${top + 14} Q60 ${top + 4} 84 ${top + 14}`} fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" />
          {dots.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#000" opacity="0.35" />
          ))}
          {officeBase(seat + 14, `url(#chrome-${uid})`)}
        </>,
      );
    }
    // Kneeling chair: sloped seat pad, knee pad lower in front, wooden frame on rockers
    case 'chairs-kneeling':
      return box(
        <>
          <path d={`M22 ${FLOOR - 2} Q60 ${FLOOR - 14} 98 ${FLOOR - 2}`} fill="none" stroke="#8b5e3c" strokeWidth="6" strokeLinecap="round" />
          <path d={`M36 ${FLOOR - 8} L50 ${top + 14} M84 ${FLOOR - 8} L70 ${top + 14}`} stroke="#8b5e3c" strokeWidth="6" strokeLinecap="round" />
          <rect x="24" y={FLOOR - 36} width="72" height="12" rx="6" fill={shade(tone, 80)} {...s} />
          <rect x="30" y={top} width="60" height="16" rx="7" fill={tone} {...s} />
        </>,
      );
    // Saddle stool: two-lobed saddle on a gas lift
    case 'chairs-saddle': {
      const seat = top;
      return box(
        <>
          <path d={`M24 ${seat + 10} Q24 ${seat} 42 ${seat + 3} Q60 ${seat + 10} 78 ${seat + 3} Q96 ${seat} 96 ${seat + 10} Q96 ${seat + 20} 60 ${seat + 20} Q24 ${seat + 20} 24 ${seat + 10} Z`} fill={tone} {...s} />
          {officeBase(seat + 20)}
        </>,
      );
    }
    // Wooden stool: round top, four splayed legs and a foot ring
    case 'chairs-stool':
      return box(
        <>
          <path d={`M42 ${top + 8} L30 ${FLOOR} M78 ${top + 8} L90 ${FLOOR} M52 ${top + 8} L48 ${FLOOR - 2} M68 ${top + 8} L72 ${FLOOR - 2}`} stroke={shade(tone, 75)} strokeWidth="5" strokeLinecap="round" />
          <path d={`M36 ${FLOOR - 26} H84`} stroke={shade(tone, 70)} strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="60" cy={top + 5} rx="26" ry="6" fill={tone} {...s} />
          <rect x="34" y={top + 5} width="52" height="6" fill={shade(tone, 85)} {...s} />
        </>,
      );
    // Woven rattan chair with rounded back and arms
    case 'chairs-rattan': {
      const seat = FLOOR - 44;
      return box(
        <>
          <path d={`M28 ${seat + 8} L26 ${FLOOR} M92 ${seat + 8} L94 ${FLOOR}`} stroke={shade(tone, 70)} strokeWidth="5" strokeLinecap="round" />
          <path d={`M16 ${seat + 8} Q12 ${top + 30} 34 ${top + 26} M104 ${seat + 8} Q108 ${top + 30} 86 ${top + 26}`} fill="none" stroke={shade(tone, 80)} strokeWidth="6" strokeLinecap="round" />
          <rect x="18" y={seat} width="84" height="11" rx="5" fill={shade(tone, 88)} {...s} />
          <path d={`M24 ${top + 16} Q60 ${top - 8} 96 ${top + 16} Q98 ${seat - 16} 92 ${seat + 2} H28 Q22 ${seat - 16} 24 ${top + 16} Z`} fill={`url(#weave-${uid})`} {...s} />
        </>,
      );
    }
    // Wooden chair with a spindle back
    case 'chairs-bean-chair': {
      const seat = FLOOR - 46;
      return box(
        <>
          <path d={`M34 ${seat + 6} L32 ${FLOOR} M86 ${seat + 6} L88 ${FLOOR}`} stroke={shade(tone, 75)} strokeWidth="5" strokeLinecap="round" />
          <rect x="26" y={seat} width="68" height="9" rx="3" fill={shade(tone, 90)} {...s} />
          <path d={`M34 ${top + 4} V${seat} M86 ${top + 4} V${seat}`} stroke={shade(tone, 80)} strokeWidth="5" strokeLinecap="round" />
          {[44, 52, 60, 68, 76].map((x) => (
            <line key={x} x1={x} y1={top + 12} x2={x} y2={seat} stroke={tone} strokeWidth="3.2" strokeLinecap="round" />
          ))}
          <rect x="30" y={top} width="60" height="12" rx="5" fill={tone} {...s} />
        </>,
      );
    }
    // Wide upholstered lounge armchair on short tapered legs
    case 'chairs-lounge': {
      const seat = FLOOR - 50;
      return box(
        <>
          <path d={`M22 ${FLOOR - 16} L18 ${FLOOR} M98 ${FLOOR - 16} L102 ${FLOOR}`} stroke="#8b5e3c" strokeWidth="4" strokeLinecap="round" />
          <rect x="8" y={seat - 20} width="22" height={FLOOR - 16 - (seat - 20)} rx="10" fill={shade(tone, 85)} {...s} />
          <rect x="90" y={seat - 20} width="22" height={FLOOR - 16 - (seat - 20)} rx="10" fill={shade(tone, 85)} {...s} />
          <path d={`M18 ${top + 14} Q60 ${top - 4} 102 ${top + 14} V${seat + 6} H18 Z`} fill={tone} {...s} />
          <rect x="26" y={seat} width="68" height={FLOOR - 16 - seat} rx="6" fill={shade(tone, 92)} {...s} />
        </>,
      );
    }
    default: {
      // Generic office chair
      const seat = FLOOR - 60;
      return box(
        <>
          <rect x="12" y={seat} width="96" height="13" rx="6.5" fill={shade(tone, 80)} {...s} />
          <path d={`M28 ${top + 8} Q60 ${top - 4} 92 ${top + 8} Q98 ${seat - 30} 90 ${seat + 2} H30 Q22 ${seat - 30} 28 ${top + 8} Z`} fill={tone} {...s} />
          {officeBase(seat + 13)}
        </>,
      );
    }
  }
}
