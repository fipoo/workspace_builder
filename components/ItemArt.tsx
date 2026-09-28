'use client';

import { useId } from 'react';

/**
 * Drawn versions of desk items that have no cut-out product photo, so everything on the desk looks
 * like a real object rather than a photo sticker. Each drawing uses a viewBox in centimetres
 * (width × height), so it is drawn at its real size.
 */

const INK = '#2b2a28';
const s = { stroke: INK, strokeWidth: 1.1, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };

export type Art = { w: number; h: number; Draw: () => React.ReactElement };

function Svg({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block size-full overflow-visible" aria-hidden>
      {children}
    </svg>
  );
}

/** Leafy plant (rubber-plant style) in a white ceramic pot. 20 × 40 cm. */
function Plant() {
  const id = useId().replace(/:/g, '');
  const leaves: [number, number, number, number][] = [
    // cx, cy, rotate, scale
    [6, 12, -40, 1],
    [14, 10, 35, 1.05],
    [9, 6, -15, 0.9],
    [12, 3.5, 10, 0.8],
    [4.5, 18, -60, 0.85],
    [15.5, 17, 60, 0.9],
    [10, 14, 0, 0.95],
  ];
  return (
    <Svg w={20} h={40}>
      <defs>
        <linearGradient id={`leaf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5f9e5a" />
          <stop offset="1" stopColor="#2f6b3a" />
        </linearGradient>
        <linearGradient id={`pot-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9d5ce" />
          <stop offset="0.4" stopColor="#fbfaf7" />
          <stop offset="1" stopColor="#c9c4bb" />
        </linearGradient>
      </defs>
      {/* stems */}
      <path d="M10 27 C9 20 7 16 6 12 M10 27 C11 20 13 15 14 10 M10 27 V14 M10 27 C9.5 18 9 10 9 6 M10 27 C10.5 15 11.5 8 12 3.5" fill="none" stroke="#3f6b35" strokeWidth="0.6" />
      {leaves.map(([cx, cy, r, k], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) rotate(${r}) scale(${k})`}>
          <path d="M0 -5 C3 -3 3 3 0 5 C-3 3 -3 -3 0 -5 Z" fill={`url(#leaf-${id})`} stroke="#23452a" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
          <path d="M0 -4.4 V4.4" stroke="#b9d8a8" strokeWidth="0.35" opacity="0.8" />
        </g>
      ))}
      {/* pot */}
      <path d="M3 26 H17 L15.5 39.5 H4.5 Z" fill={`url(#pot-${id})`} {...s} />
      <rect x="2.5" y="25" width="15" height="2.4" rx="0.8" fill="#f1efea" {...s} />
      <ellipse cx="10" cy="39.7" rx="6" ry="0.6" fill="#000" opacity="0.15" />
    </Svg>
  );
}

/** Echeveria succulent in a small concrete pot. 10 × 12 cm. */
function Succulent() {
  const petals = [-70, -45, -20, 0, 20, 45, 70];
  return (
    <Svg w={10} h={12}>
      {petals.map((r, i) => (
        <path
          key={i}
          d="M5 6.5 C4 4.5 4.3 2.3 5 1 C5.7 2.3 6 4.5 5 6.5 Z"
          transform={`rotate(${r} 5 6.5)`}
          fill={i % 2 ? '#8fb9a8' : '#a7ccb9'}
          stroke="#4f7f6c"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d="M1.2 6.3 H8.8 L8 11.7 H2 Z" fill="#b9b6b0" {...s} />
      <rect x="1" y="5.8" width="8" height="1.1" rx="0.4" fill="#cdcac4" {...s} />
    </Svg>
  );
}

/** A single bookshelf speaker (walnut sides, woofer + tweeter). */
function Speaker({ x, w, h, body, cone }: { x: number; w: number; h: number; body: string; cone: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="0" width={w} height={h} rx="0.8" fill={body} {...s} />
      <circle cx={w / 2} cy={h * 0.28} r={w * 0.14} fill="#1b1b1d" {...s} />
      <circle cx={w / 2} cy={h * 0.64} r={w * 0.34} fill="#1b1b1d" {...s} />
      <circle cx={w / 2} cy={h * 0.64} r={w * 0.26} fill={cone} />
      <circle cx={w / 2} cy={h * 0.64} r={w * 0.08} fill="#0d0d0e" />
    </g>
  );
}

/** Pair of desktop speakers, one at each end of a 36 cm span. */
function DeskSpeakers() {
  return (
    <Svg w={36} h={22}>
      <Speaker x={0} w={13} h={22} body="#7a5536" cone="#3a3a3d" />
      <Speaker x={23} w={13} h={22} body="#7a5536" cone="#3a3a3d" />
    </Svg>
  );
}

/** Pair of studio monitors (black, yellow cones). */
function StudioMonitors() {
  return (
    <Svg w={40} h={25}>
      <Speaker x={0} w={15} h={25} body="#1e1e21" cone="#e3b23c" />
      <Speaker x={25} w={15} h={25} body="#1e1e21" cone="#e3b23c" />
    </Svg>
  );
}

/** Low soundbar under the screen. 55 × 7 cm. */
function Soundbar() {
  const dots = [];
  for (let x = 3; x < 52; x += 1.6) for (let y = 2; y < 5.5; y += 1.4) dots.push([x, y]);
  return (
    <Svg w={55} h={7}>
      <rect x="0" y="0.5" width="55" height="5.5" rx="2.7" fill="#2c2d31" {...s} />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.28" fill="#55575d" />
      ))}
      <rect x="6" y="6" width="3" height="1" rx="0.4" fill="#1a1a1c" />
      <rect x="46" y="6" width="3" height="1" rx="0.4" fill="#1a1a1c" />
    </Svg>
  );
}

/** Over-ear headphones hanging on a desk stand. 20 × 22 cm (stand). */
function Headphones() {
  return (
    <Svg w={20} h={26}>
      <ellipse cx="10" cy="25.2" rx="6" ry="0.9" fill="#3a3a3d" {...s} />
      <rect x="9.3" y="6" width="1.4" height="19" fill="#4a4a4e" {...s} />
      <path d="M3 13 C3 3 17 3 17 13" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="1" y="11.5" width="4.4" height="7.5" rx="2" fill="#2a2a2e" {...s} />
      <rect x="14.6" y="11.5" width="4.4" height="7.5" rx="2" fill="#2a2a2e" {...s} />
      <rect x="1.6" y="12.3" width="1.4" height="5.9" rx="0.7" fill="#6b6b70" />
      <rect x="17" y="12.3" width="1.4" height="5.9" rx="0.7" fill="#6b6b70" />
    </Svg>
  );
}

/** Portable fabric Bluetooth speaker. 18 × 7 cm. */
function BtSpeaker() {
  return (
    <Svg w={18} h={7}>
      <rect x="0" y="0" width="18" height="7" rx="3.5" fill="#3d5a80" {...s} />
      <rect x="2.5" y="1.4" width="13" height="4.2" rx="2.1" fill="#34506f" />
      <circle cx="9" cy="3.5" r="0.9" fill="#e8eef5" opacity="0.8" />
      <path d="M0.6 2 C-1.3 2.5 -1.3 4.5 0.6 5" fill="none" stroke="#222" strokeWidth="0.8" />
    </Svg>
  );
}

/** Gaming PC tower, front panel with RGB strip. 22 × 48 cm. */
function GamingPc() {
  return (
    <Svg w={22} h={48}>
      <rect x="0" y="0" width="22" height="46" rx="1.2" fill="#18181c" {...s} />
      <rect x="3" y="3" width="16" height="36" rx="1" fill="#101014" stroke="#2f2f35" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      {[10, 21, 32].map((y) => (
        <g key={y}>
          <circle cx="11" cy={y} r="4.6" fill="none" stroke="#b36bff" strokeWidth="0.9" opacity="0.9" />
          <circle cx="11" cy={y} r="1.4" fill="#2a2a30" />
        </g>
      ))}
      <rect x="1.2" y="3" width="0.8" height="36" fill="#2fb5a8" opacity="0.9" />
      <circle cx="11" cy="42.5" r="1" fill="#2fb5a8" />
      <rect x="2" y="46" width="4" height="2" fill="#0d0d0f" />
      <rect x="16" y="46" width="4" height="2" fill="#0d0d0f" />
    </Svg>
  );
}

/** Desk power hub: small cube with sockets and USB ports. 8 × 8 cm. */
function PowerHub() {
  return (
    <Svg w={8} h={8}>
      <rect x="0" y="0" width="8" height="8" rx="1.2" fill="#f2f2f0" {...s} />
      <circle cx="4" cy="3" r="1.6" fill="#dcdcd8" {...s} />
      <circle cx="3.4" cy="3" r="0.25" fill={INK} />
      <circle cx="4.6" cy="3" r="0.25" fill={INK} />
      <rect x="2" y="5.6" width="1.6" height="0.7" fill={INK} />
      <rect x="4.4" y="5.6" width="1.6" height="0.7" fill={INK} />
    </Svg>
  );
}

/** Mesh cable tray, hung under the desk top. 80 × 12 cm. */
function CableTray() {
  const bars = [];
  for (let x = 2; x < 78; x += 3) bars.push(x);
  return (
    <Svg w={80} h={12}>
      <path d="M0 0 V10 Q0 12 2 12 H78 Q80 12 80 10 V0" fill="none" stroke="#3b3b3b" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      {bars.map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="11.5" stroke="#3b3b3b" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      ))}
      <line x1="0" y1="6" x2="80" y2="6" stroke="#3b3b3b" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      <path d="M10 3 C25 9 40 2 55 8 S72 4 76 7" fill="none" stroke="#111" strokeWidth="1.2" />
    </Svg>
  );
}

/** Headphone hook clamped under the desk edge. 5 × 10 cm. */
function HeadphoneHook() {
  return (
    <Svg w={6} h={10}>
      <rect x="0" y="0" width="6" height="2" fill="#2e2e30" {...s} />
      <path d="M3 2 V7 Q3 9.5 5.5 9" fill="none" stroke="#2e2e30" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export const ART: Record<string, Art> = {
  'accessories-plant': { w: 20, h: 40, Draw: Plant },
  'accessories-succulent': { w: 10, h: 12, Draw: Succulent },
  'audio-desk-speakers': { w: 36, h: 22, Draw: DeskSpeakers },
  'audio-studio-monitors': { w: 40, h: 25, Draw: StudioMonitors },
  'audio-soundbar': { w: 55, h: 7, Draw: Soundbar },
  'audio-headphones': { w: 20, h: 26, Draw: Headphones },
  'audio-bt-speaker': { w: 18, h: 7, Draw: BtSpeaker },
  'computers-gaming-pc': { w: 22, h: 48, Draw: GamingPc },
  'mounts-power-hub': { w: 8, h: 8, Draw: PowerHub },
  'mounts-cable-tray': { w: 80, h: 12, Draw: CableTray },
  'mounts-headphone-hook': { w: 6, h: 10, Draw: HeadphoneHook },
};
