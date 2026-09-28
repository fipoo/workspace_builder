/**
 * Real-world size of every item: width × depth × height in cm, and weight in kg.
 * monis.rent spec sheets where they exist (see data/specs.ts), typical sizes otherwise.
 * Width × depth is the footprint used to place things on the desk top.
 */
export type Dims = { w: number; d: number; h: number; kg: number };

const D = (w: number, d: number, h: number, kg: number): Dims => ({ w, d, h, kg });

export const DIMS: Record<string, Dims> = {
  // Desks: w × d is the usable top, h is the top height (sit-stand desks: lowest height)
  'desks-standing': D(140, 70, 70, 32), // 70–118 cm
  'desks-l-shape': D(160, 60, 75, 38),
  'desks-minimal-oak': D(120, 60, 75, 22),
  'desks-glass-top': D(120, 60, 75, 26),
  'desks-gaming': D(140, 70, 75, 30),
  'desks-compact': D(100, 50, 75, 14),
  'desks-bamboo': D(120, 70, 70, 29), // IKEA Trotten, 70–120 cm
  'desks-executive': D(180, 80, 76, 55),
  'desks-folding': D(160, 70, 58, 38), // 58–123 cm
  'desks-corner': D(150, 60, 75, 28),

  // Chairs
  'chairs-ergo-mesh': D(66, 66, 125, 19),
  'chairs-gaming': D(70, 70, 135, 22),
  'chairs-executive-leather': D(68, 72, 118, 20),
  'chairs-kneeling': D(48, 70, 58, 8),
  'chairs-saddle': D(50, 50, 70, 7),
  'chairs-stool': D(35, 35, 45, 3),
  'chairs-rattan': D(60, 60, 80, 6),
  'chairs-bean-chair': D(45, 50, 82, 5),
  'chairs-task': D(60, 60, 100, 11),
  'chairs-lounge': D(78, 80, 85, 18),

  // Desk top: monitors (monis.rent spec sheets; depth = stand foot)
  'accessories-monitor-24': D(53.9, 17, 43.4, 3),
  'accessories-monitor-27': D(61.3, 20, 51.5, 3.6),
  'accessories-ultrawide': D(81, 24.3, 52.1, 8.6),
  'accessories-studio-display': D(62.3, 16.8, 47.8, 6.3),
  'accessories-desk-lamp': D(16.2, 16.2, 47.9, 0.8),
  'accessories-plant': D(20, 20, 40, 2.5),
  'accessories-succulent': D(10, 10, 12, 0.5), // low enough to sit under a screen on an arm
  'accessories-keyboard': D(43, 13.2, 2.1, 0.81),
  'accessories-mouse': D(8.4, 12.5, 5.1, 0.14),
  'accessories-laptop-stand': D(26, 24, 15, 1.2),
  'accessories-webcam': D(10.2, 2.7, 2.7, 0.06),

  // Monitor mounts
  'mounts-single-arm': D(10, 12, 45, 2.5), // clamp footprint; reach 50 cm
  'mounts-dual-arm': D(10, 12, 45, 4.5),
  'mounts-triple-arm': D(12, 14, 50, 7),
  'mounts-heavy-arm': D(12, 14, 50, 5),
  'mounts-stacked-arm': D(10, 12, 80, 4),
  'mounts-monitor-riser': D(29, 21, 11, 2.2), // 11–18 cm high
  'mounts-light-bar': D(45, 9, 3, 0.4),
  'mounts-cable-tray': D(80, 13, 12, 1.5),
  'mounts-power-hub': D(8, 8, 8, 0.4),
  'mounts-headphone-hook': D(5, 8, 10, 0.1),

  // Audio (monis.rent where available; Apple's own figures for HomePod)
  'audio-marshall': D(40, 20, 31, 7.45),
  'audio-homepod': D(14.2, 14.2, 16.8, 2.3),
  'audio-podcast-mic': D(15, 15, 25, 0.55), // mic on its mini tripod
  'audio-boom-arm': D(6, 10, 89, 1.6),
  'audio-dj-controller': D(48, 27, 6, 2.1),
  'audio-desk-speakers': D(36, 17, 22, 3.2), // pair, side by side
  'audio-soundbar': D(55, 8, 7, 1.5),
  'audio-studio-monitors': D(40, 23, 25, 7),
  'audio-headphones': D(20, 18, 22, 0.3), // on a stand
  'audio-bt-speaker': D(18, 7, 7, 0.6),

  // Computers (Apple's figures for the Mac mini; monis.rent lists a laptop's size by mistake)
  'computers-macbook-neo': D(29.8, 20.6, 1.3, 1.23),
  'computers-windows-laptop': D(36.4, 24.4, 2, 1.8),
  'computers-mac-mini-m4': D(12.7, 12.7, 5, 0.67),
  'computers-mac-mini-m2': D(19.7, 19.7, 3.6, 1.18),
  'computers-mac-studio': D(19.7, 19.7, 9.5, 2.7),
  'computers-dock': D(22, 8, 3, 0.4),
  'computers-usb-hub': D(11, 4.5, 1.5, 0.08),
  'computers-macbook-pro': D(31.3, 22.1, 1.6, 1.6),
  'computers-gaming-pc': D(22, 45, 48, 12),
  'computers-ipad-pro': D(28.1, 21.5, 1.6, 1.3),

  // Coffee station
  'coffee-espresso': D(8.4, 20.4, 33, 2.3),
  'coffee-drip': D(23.2, 34.7, 29.5, 2.3),
  'coffee-kettle': D(22, 16, 25, 1.1),
  'coffee-grinder': D(13, 18, 30, 1.8),
  'coffee-mini-fridge': D(47, 45, 51, 16),
  'coffee-mug-set': D(24, 12, 10, 1.4),
  'coffee-water-dispenser': D(31, 31, 90, 9),
  'coffee-moka-pot': D(10, 10, 22, 0.6),
  'coffee-french-press': D(17, 11, 24, 0.7),
  'coffee-tea-set': D(30, 20, 15, 1.5),

  // Outdoor
  'outdoor-surfboard': D(56, 8, 213, 4.5),
  'outdoor-motorbike': D(70, 186, 110, 90),
  'outdoor-bicycle': D(60, 175, 105, 14),
  'outdoor-helmet': D(22, 28, 20, 0.9),
  'outdoor-raincoat': D(40, 5, 30, 0.6),
  'outdoor-backpack': D(30, 18, 48, 1.1),
  'outdoor-skateboard': D(20, 80, 10, 2),
  'outdoor-snorkel': D(30, 15, 60, 1.5),
  'outdoor-umbrella': D(180, 180, 220, 3),
  'outdoor-cooler-box': D(46, 30, 32, 3),

  // Relax
  'relax-bean-bag': D(100, 90, 70, 6),
  'relax-sofa': D(200, 88, 80, 45),
  'relax-hammock': D(280, 110, 120, 15),
  'relax-floor-cushion': D(60, 60, 15, 1.5),
  'relax-rug': D(160, 230, 1, 5),
  'relax-yoga-mat': D(61, 183, 0.6, 1),
  'relax-massage-chair': D(80, 140, 115, 70),
  'relax-hanging-chair': D(100, 100, 195, 25),
  'relax-side-table': D(45, 45, 50, 4),
  'relax-floor-lamp': D(11.1, 11.1, 55.3, 0.72),

  // Garage
  'garage-tool-shelf': D(90, 40, 180, 14),
  'garage-toolbox': D(45, 30, 12, 5),
  'garage-workbench': D(150, 60, 90, 30),
  'garage-storage-rack': D(120, 45, 180, 12),
  'garage-bike-rack': D(40, 50, 30, 2),
  'garage-ladder': D(45, 70, 150, 5),
  'garage-pegboard': D(120, 2, 60, 5),
  'garage-drill-set': D(40, 30, 12, 3),
  'garage-fan': D(45, 40, 125, 5),
  'garage-cabinet': D(90, 45, 180, 30),
};

export const dimsOf = (id: string): Dims | undefined => DIMS[id];

/** "53.9 × 17 × 43.4 cm · 3 kg" */
export function formatDims(id: string) {
  const d = DIMS[id];
  if (!d) return '';
  const n = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, ''));
  return `${n(d.w)} × ${n(d.d)} × ${n(d.h)} cm · ${n(d.kg)} kg`;
}
