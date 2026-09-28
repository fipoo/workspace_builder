export type Slot = 'desk' | 'chair' | 'desk-surface' | 'coffee' | 'outdoor' | 'relax' | 'garage';

export type Item = {
  id: string;
  name: string;
  category: string;
  slot: Slot;
  /** lucide-react icon name (see lib/icons.tsx) */
  icon: string;
  /** Shown when the lucide icon is not available */
  emoji: string;
  pricePerMonth: number;
  /** Optional tint, used for desk tops and chair seats on the canvas */
  tone?: string;
};

export type Placed = { uid: string; itemId: string; slot: Slot };

export type Category = {
  key: string;
  label: string;
  short: string;
  slot: Slot;
  icon: string;
  emoji: string;
  /** Accent color for tiles in this category */
  color: string;
};

export const CATEGORIES: Category[] = [
  { key: 'desks', label: 'Desks', short: 'Desks', slot: 'desk', icon: 'Table2', emoji: '🪵', color: '#a0673f' },
  { key: 'chairs', label: 'Chairs', short: 'Chairs', slot: 'chair', icon: 'Armchair', emoji: '🪑', color: '#c9532a' },
  { key: 'accessories', label: 'Accessories', short: 'Gear', slot: 'desk-surface', icon: 'Monitor', emoji: '🖥️', color: '#1f9e93' },
  { key: 'coffee', label: 'Coffee Station', short: 'Coffee', slot: 'coffee', icon: 'Coffee', emoji: '☕', color: '#7a4a2e' },
  { key: 'outdoor', label: 'Outdoor Gear', short: 'Outdoor', slot: 'outdoor', icon: 'Waves', emoji: '🏄', color: '#2a7fb0' },
  { key: 'relax', label: 'Relax Zone', short: 'Relax', slot: 'relax', icon: 'Sofa', emoji: '🛋️', color: '#b0527f' },
  { key: 'garage', label: 'Garage Space', short: 'Garage', slot: 'garage', icon: 'Wrench', emoji: '🧰', color: '#5d6670' },
];

type Row = [id: string, name: string, icon: string, emoji: string, price: number, tone?: string];

function build(categoryKey: string, rows: Row[]): Item[] {
  const cat = CATEGORIES.find((c) => c.key === categoryKey)!;
  return rows.map(([id, name, icon, emoji, pricePerMonth, tone]) => ({
    id: `${categoryKey}-${id}`,
    name,
    category: cat.label,
    slot: cat.slot,
    icon,
    emoji,
    pricePerMonth,
    tone,
  }));
}

export const CATALOG: Item[] = [
  ...build('desks', [
    ['standing', 'Standing Desk', 'ArrowUpToLine', '🧍', 650_000, '#c8a27a'],
    ['l-shape', 'L-Shape', 'LayoutPanelLeft', '📐', 550_000, '#8b5e3c'],
    ['minimal-oak', 'Minimal Oak', 'TreeDeciduous', '🌳', 400_000, '#d9b88f'],
    ['glass-top', 'Glass Top', 'Gem', '💎', 450_000, '#a9d6df'],
    ['gaming', 'Gaming Desk', 'Gamepad2', '🎮', 600_000, '#2b2b3a'],
    ['compact', 'Compact', 'Minimize2', '📦', 250_000, '#e3cfae'],
    ['bamboo', 'Bamboo', 'Leaf', '🎋', 350_000, '#cdb46b'],
    ['executive', 'Executive', 'Briefcase', '💼', 750_000, '#5a3a24'],
    ['folding', 'Folding', 'FoldHorizontal', '🗂️', 150_000, '#b9b2a6'],
    ['corner', 'Corner Desk', 'Table2', '📏', 480_000, '#a47148'],
  ]),
  ...build('chairs', [
    ['ergo-mesh', 'Ergo Mesh', 'Grid3x3', '🪑', 450_000, '#3c4a5a'],
    ['gaming', 'Gaming', 'Gamepad', '🎮', 500_000, '#d64545'],
    ['executive-leather', 'Executive Leather', 'Crown', '👑', 650_000, '#5a3a24'],
    ['kneeling', 'Kneeling', 'ArrowDownToLine', '🧎', 250_000, '#6b8f71'],
    ['saddle', 'Saddle', 'Bike', '🐎', 300_000, '#8b5e3c'],
    ['stool', 'Stool', 'CircleDot', '⭕', 100_000, '#c8a27a'],
    ['rattan', 'Rattan', 'TreePalm', '🌴', 200_000, '#c79a5b'],
    ['bean-chair', 'Bean Chair', 'Bean', '🫘', 180_000, '#e2683c'],
    ['task', 'Task Chair', 'Armchair', '🪑', 280_000, '#4a5568'],
    ['lounge', 'Lounge Chair', 'Sofa', '🛋️', 380_000, '#2f6f5e'],
  ]),
  ...build('accessories', [
    ['monitor-24', 'Monitor 24"', 'Monitor', '🖥️', 250_000],
    ['monitor-27', 'Monitor 27"', 'TvMinimal', '🖥️', 350_000],
    ['ultrawide', 'Ultrawide', 'RectangleHorizontal', '🖥️', 550_000],
    ['desk-lamp', 'Desk Lamp', 'LampDesk', '💡', 80_000],
    ['plant', 'Plant', 'Sprout', '🪴', 60_000],
    ['keyboard', 'Keyboard', 'Keyboard', '⌨️', 120_000],
    ['mouse', 'Mouse', 'Mouse', '🖱️', 60_000],
    ['laptop-stand', 'Laptop Stand', 'Laptop', '💻', 70_000],
    ['webcam', 'Webcam', 'Webcam', '📷', 110_000],
    ['speaker', 'Speaker', 'Speaker', '🔊', 150_000],
  ]),
  ...build('coffee', [
    ['espresso', 'Espresso Machine', 'Coffee', '☕', 450_000],
    ['drip', 'Drip Maker', 'Droplet', '💧', 150_000],
    ['kettle', 'Kettle', 'CookingPot', '🫖', 70_000],
    ['grinder', 'Grinder', 'Cog', '⚙️', 120_000],
    ['mini-fridge', 'Mini Fridge', 'Refrigerator', '🧊', 300_000],
    ['mug-set', 'Mug Set', 'CupSoda', '🍵', 40_000],
    ['water-dispenser', 'Water Dispenser', 'GlassWater', '🚰', 120_000],
    ['moka-pot', 'Moka Pot', 'Flame', '🔥', 60_000],
    ['snack-rack', 'Snack Rack', 'Cookie', '🍪', 80_000],
    ['tea-set', 'Tea Set', 'LeafyGreen', '🍃', 70_000],
  ]),
  ...build('outdoor', [
    ['surfboard', 'Surfboard', 'Waves', '🏄', 400_000],
    ['motorbike', 'Motorbike', 'Motorbike', '🏍️', 900_000],
    ['bicycle', 'Bicycle', 'Bike', '🚲', 250_000],
    ['helmet', 'Helmet', 'HardHat', '⛑️', 50_000],
    ['raincoat', 'Raincoat', 'CloudRain', '🧥', 40_000],
    ['backpack', 'Backpack', 'Backpack', '🎒', 90_000],
    ['scooter', 'Scooter', 'Scooter', '🛵', 700_000],
    ['hammock', 'Hammock', 'TentTree', '🏕️', 120_000],
    ['umbrella', 'Umbrella', 'Umbrella', '☂️', 30_000],
    ['cooler-box', 'Cooler Box', 'Package', '🧊', 80_000],
  ]),
  ...build('relax', [
    ['bean-bag', 'Bean Bag', 'Bean', '🫘', 150_000],
    ['sofa', 'Sofa', 'Sofa', '🛋️', 600_000],
    ['hammock', 'Hammock', 'TreePalm', '🌴', 150_000],
    ['floor-cushion', 'Floor Cushion', 'Square', '🟫', 60_000],
    ['rug', 'Rug', 'Layers', '🧶', 180_000],
    ['yoga-mat', 'Yoga Mat', 'PersonStanding', '🧘', 50_000],
    ['massage-chair', 'Massage Chair', 'Hand', '💆', 900_000],
    ['lounge-chair', 'Lounge Chair', 'Armchair', '🪑', 380_000],
    ['side-table', 'Side Table', 'Table', '🪵', 90_000],
    ['floor-lamp', 'Floor Lamp', 'LampFloor', '💡', 110_000],
  ]),
  ...build('garage', [
    ['tool-shelf', 'Tool Shelf', 'ShelvingUnit', '🗄️', 150_000],
    ['toolbox', 'Toolbox', 'Wrench', '🧰', 90_000],
    ['workbench', 'Workbench', 'Hammer', '🔨', 350_000],
    ['storage-rack', 'Storage Rack', 'Boxes', '📦', 200_000],
    ['bike-rack', 'Bike Rack', 'Bike', '🚲', 100_000],
    ['ladder', 'Ladder', 'TrainTrack', '🪜', 80_000],
    ['pegboard', 'Pegboard', 'LayoutGrid', '🔲', 70_000],
    ['drill-set', 'Drill Set', 'Drill', '🪛', 120_000],
    ['fan', 'Fan', 'Fan', '🌀', 90_000],
    ['cabinet', 'Cabinet', 'Archive', '🗃️', 220_000],
  ]),
];

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function getItem(id: string): Item | undefined {
  return BY_ID.get(id);
}

export function itemsInCategory(key: string): Item[] {
  const cat = CATEGORIES.find((c) => c.key === key);
  return cat ? CATALOG.filter((i) => i.category === cat.label) : [];
}

export function categoryOf(item: Item): Category {
  return CATEGORIES.find((c) => c.label === item.category)!;
}

export const MONITOR_IDS = new Set(['accessories-monitor-24', 'accessories-monitor-27', 'accessories-ultrawide']);

export const SLOT_LABEL: Record<Slot, string> = {
  desk: 'the desk spot',
  chair: 'the chair spot',
  'desk-surface': 'the desk top',
  coffee: 'the Coffee Station',
  outdoor: 'the Outdoor Gear zone',
  relax: 'the Relax Zone',
  garage: 'the Garage',
};

export const ZONE_SLOTS = ['coffee', 'outdoor', 'relax', 'garage'] as const satisfies readonly Slot[];
