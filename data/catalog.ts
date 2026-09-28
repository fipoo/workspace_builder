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
  /** Product photo URL */
  image: string;
  /** 'monis' = real monis.rent product photo (white background), 'stock' = Unsplash */
  source: 'monis' | 'stock';
};

export type Placed = {
  uid: string;
  itemId: string;
  slot: Slot;
  /** Webcam / light bar / riser: uid of the monitor it belongs to. */
  host?: string;
  /** Monitors on an arm can be turned to portrait. */
  orient?: 'portrait';
  /** Monitors: false = stands on the desk even when there is an arm with room. */
  arm?: boolean;
  /** Screens on an arm: raised (+) or lowered (−) from the default height, in cm. */
  lift?: number;
  /** Turned on the desk, in degrees (− left, + right), e.g. side screens angled inward. */
  turn?: number;
  /** Spot on the desk top in cm: x from the left edge, y from the back edge (top-left of its footprint). */
  x?: number;
  y?: number;
};

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
  { key: 'mounts', label: 'Monitor Mounts', short: 'Mounts', slot: 'desk-surface', icon: 'Monitor', emoji: '🦾', color: '#3c4a5a' },
  { key: 'audio', label: 'Audio', short: 'Audio', slot: 'desk-surface', icon: 'Speaker', emoji: '🔊', color: '#7a4a8f' },
  { key: 'computers', label: 'Computers', short: 'PC', slot: 'desk-surface', icon: 'Laptop', emoji: '💻', color: '#2a5541' },
];

const monis = (file: string) => `https://strapi.monis.rent/uploads/${file}`;
const stock = (id: string) => `https://images.unsplash.com/${id}?w=600&h=600&fit=crop&q=80`;

type Row = [id: string, name: string, icon: string, emoji: string, price: number, tone: string | undefined, image: string];

function build(categoryKey: string, rows: Row[]): Item[] {
  const cat = CATEGORIES.find((c) => c.key === categoryKey)!;
  return rows.map(([id, name, icon, emoji, pricePerMonth, tone, image]) => ({
    id: `${categoryKey}-${id}`,
    name,
    category: cat.label,
    slot: cat.slot,
    icon,
    emoji,
    pricePerMonth,
    tone,
    image,
    source: image.includes('monis.rent') ? 'monis' : 'stock',
  }));
}

export const CATALOG: Item[] = [
  ...build('desks', [
    ['standing', 'Electric Adjustable Desk', 'ArrowUpToLine', '🧍', 650_000, '#c8a27a', monis('desk_titel_new_3db151d44c.jpg')],
    ['l-shape', 'L-Shape Desk', 'LayoutPanelLeft', '📐', 550_000, '#8b5e3c', stock('photo-1718524767521-1aec8589115b')],
    ['minimal-oak', 'Minimal Oak Desk', 'TreeDeciduous', '🌳', 400_000, '#d9b88f', stock('photo-1597072689227-8882273e8f6a')],
    ['glass-top', 'Glass Top Desk', 'Gem', '💎', 450_000, '#a9d6df', stock('photo-1499750310107-5fef28a66643')],
    ['gaming', 'Gaming Desk', 'Gamepad2', '🎮', 600_000, '#2b2b3a', stock('photo-1603481588273-2f908a9a7a1b')],
    ['compact', 'Compact Desk', 'Minimize2', '📦', 250_000, '#e3cfae', stock('photo-1449247709967-d4461a6a6103')],
    ['bamboo', 'Mechanical Adjustable Desk', 'Leaf', '🎋', 350_000, '#cdb46b', monis('Mechanical_Adjustable_Desk_front_new_a83b8077b0.jpg')],
    ['executive', 'Executive Desk', 'Briefcase', '💼', 750_000, '#5a3a24', stock('photo-1770515857331-4dd7d063f779')],
    ['folding', 'Dual-Motor Standing Desk', 'FoldHorizontal', '🗂️', 850_000, '#b9b2a6', monis('Dual_Motor_Standing_Desk_8_9f364ae87f.jpg')],
    ['corner', 'Corner Desk', 'Table2', '📏', 480_000, '#a47148', stock('photo-1651936717122-77e95cc1ba78')],
  ]),
  ...build('chairs', [
    ['ergo-mesh', 'Ergonomic Office Chair', 'Grid3x3', '🪑', 450_000, '#3c4a5a', monis('fantech_oca259s_chair_6_b632a0c529.jpg')],
    ['gaming', 'Gaming Chair', 'Gamepad', '🎮', 500_000, '#d64545', stock('photo-1670946839270-cc4febd43b09')],
    ['executive-leather', 'Executive Leather', 'Crown', '👑', 650_000, '#5a3a24', stock('photo-1612372606404-0ab33e7187ee')],
    ['kneeling', 'Kneeling Chair', 'ArrowDownToLine', '🧎', 250_000, '#6b8f71', stock('photo-1597480552972-de9b150b5b43')],
    ['saddle', 'Saddle Stool', 'Bike', '🐎', 300_000, '#8b5e3c', stock('photo-1552324190-9e86fa095c4a')],
    ['stool', 'Wooden Stool', 'CircleDot', '⭕', 100_000, '#c8a27a', stock('photo-1634798245965-03669c757183')],
    ['rattan', 'Rattan Chair', 'TreePalm', '🌴', 200_000, '#c79a5b', stock('photo-1579146510179-6d8a87d24d54')],
    ['bean-chair', 'Wooden Chair', 'Bean', '🪑', 180_000, '#a0673f', stock('photo-1506439773649-6e0eb8cfb237')],
    ['task', 'Mesh Task Chair', 'Armchair', '🪑', 280_000, '#4a5568', stock('photo-1688578735427-994ecdea3ea4')],
    ['lounge', 'Lounge Armchair', 'Sofa', '🛋️', 380_000, '#2f6f5e', stock('photo-1763279934323-edb3735f6a6e')],
  ]),
  ...build('accessories', [
    ['monitor-24', '24" Full HD Monitor', 'Monitor', '🖥️', 250_000, undefined, monis('24_full_HD_office_monitor_a24i_2026_be9e6bf958.jpg')],
    ['monitor-27', '27" 4K Monitor', 'TvMinimal', '🖥️', 350_000, undefined, monis('27_4_K_A27_U_Multitasking_Monitor_1_ce29d15357.jpg')],
    ['ultrawide', '34" Curved Ultrawide', 'RectangleHorizontal', '🖥️', 550_000, undefined, monis('34_4_K_Gaming_Monitor_7_3f6b2ba627.jpg')],
    ['desk-lamp', 'Smart LED Desk Lamp', 'LampDesk', '💡', 80_000, undefined, monis('Xiaomi_Mi_Led_Desk_Lamp_1_S_10_3777ddd163.jpg')],
    ['plant', 'Desk Plant', 'Sprout', '🪴', 60_000, undefined, stock('photo-1520412099551-62b6bafeb5bb')],
    ['keyboard', 'Logitech MX Keys', 'Keyboard', '⌨️', 120_000, undefined, monis('Logitech_MX_keys_1_9977480ae1.jpg')],
    ['mouse', 'Logitech MX Master 3S', 'Mouse', '🖱️', 60_000, undefined, monis('Logitech_S3_6_4cf1e523b8.jpg')],
    ['laptop-stand', 'Ergonomic Laptop Stand', 'Laptop', '💻', 70_000, undefined, monis('Laptop_stand_back_new2_91df29c3c8.jpg')],
    ['webcam', 'Logitech Brio 4K Webcam', 'Webcam', '📷', 110_000, undefined, monis('Logitech_Brio_4_K_Webcam_6_d7ea7e69b0.jpg')],
    ['studio-display', '27" 5K Studio Display', 'Monitor', '🖥️', 1_200_000, undefined, monis('Apple_Studio_Display_6_94c6329a05.jpg')],
    ['succulent', 'Mini Succulent (fits under a screen)', 'Sprout', '🌵', 30_000, undefined, stock('photo-1602197294610-09b19e2186bc')],
  ]),
  ...build('coffee', [
    ['espresso', 'Nespresso Essenza', 'Coffee', '☕', 450_000, undefined, monis('NESPRESSO_Essenza_Mini_2_4ea4cc0abc.jpg')],
    ['drip', 'Bosch Drip Coffee Maker', 'Droplet', '💧', 150_000, undefined, monis('Bosch_Drip_95f3cf0130.jpg')],
    ['kettle', 'Electric Kettle', 'CookingPot', '🫖', 70_000, undefined, stock('photo-1738520420652-0c47cea3922b')],
    ['grinder', 'Coffee Grinder', 'Cog', '⚙️', 120_000, undefined, stock('photo-1537130508299-46ab547b4be3')],
    ['mini-fridge', 'Mini Fridge', 'Refrigerator', '🧊', 300_000, undefined, stock('photo-1643494847705-74808059bf07')],
    ['mug-set', 'Ceramic Mug Set', 'CupSoda', '🍵', 40_000, undefined, stock('photo-1590422749897-47036da0b0ff')],
    ['water-dispenser', 'Water Dispenser', 'GlassWater', '🚰', 120_000, undefined, stock('photo-1628239532623-c035054bff4e')],
    ['moka-pot', 'Moka Pot', 'Flame', '🔥', 60_000, undefined, stock('photo-1581701663554-291c6c9e56d2')],
    ['french-press', 'French Press', 'Coffee', '☕', 50_000, undefined, stock('photo-1639906512494-dd4a536abc4e')],
    ['tea-set', 'Tea Set', 'LeafyGreen', '🍃', 70_000, undefined, stock('photo-1612846213933-916a1f56d859')],
  ]),
  ...build('outdoor', [
    ['surfboard', 'Surfboard', 'Waves', '🏄', 400_000, undefined, stock('photo-1531722569936-825d3dd91b15')],
    ['motorbike', 'Scooter Motorbike', 'Motorbike', '🛵', 900_000, undefined, stock('photo-1712213248719-aade0e02a591')],
    ['bicycle', 'City Bicycle', 'Bike', '🚲', 250_000, undefined, stock('photo-1501147830916-ce44a6359892')],
    ['helmet', 'Helmet', 'HardHat', '⛑️', 50_000, undefined, stock('photo-1590506995460-d0d9892b54da')],
    ['raincoat', 'Raincoat', 'CloudRain', '🧥', 40_000, undefined, stock('photo-1504616267454-5460d659c9be')],
    ['backpack', 'Travel Backpack', 'Backpack', '🎒', 90_000, undefined, stock('photo-1509762774605-f07235a08f1f')],
    ['skateboard', 'Skateboard', 'CircleDot', '🛹', 150_000, undefined, stock('photo-1520045892732-304bc3ac5d8e')],
    ['snorkel', 'Snorkel Set', 'Waves', '🤿', 80_000, undefined, stock('photo-1664922114319-4700c0ef74b1')],
    ['umbrella', 'Beach Umbrella', 'Umbrella', '⛱️', 30_000, undefined, stock('photo-1521170813716-0b3f42fcfb65')],
    ['cooler-box', 'Cooler Box', 'Package', '🧊', 80_000, undefined, stock('photo-1550720295-a59523cb8872')],
  ]),
  ...build('relax', [
    ['bean-bag', 'Bean Bag', 'Bean', '🫘', 150_000, undefined, stock('photo-1637782855823-5423b6afb07b')],
    ['sofa', 'Sofa', 'Sofa', '🛋️', 600_000, undefined, stock('photo-1555041469-a586c61ea9bc')],
    ['hammock', 'Hammock', 'TreePalm', '🌴', 150_000, undefined, stock('photo-1573209580826-13bdfd6db7e7')],
    ['floor-cushion', 'Floor Cushion', 'Square', '🟫', 60_000, undefined, stock('photo-1611489704434-2612dc89c992')],
    ['rug', 'Area Rug', 'Layers', '🧶', 180_000, undefined, stock('photo-1698936061086-2bf99c7b9fc5')],
    ['yoga-mat', 'Yoga Mat', 'PersonStanding', '🧘', 50_000, undefined, stock('photo-1552196563-55cd4e45efb3')],
    ['massage-chair', 'Massage Chair', 'Hand', '💆', 900_000, undefined, stock('photo-1611769446317-3e7a467fb35e')],
    ['hanging-chair', 'Hanging Egg Chair', 'Armchair', '🪺', 300_000, undefined, stock('photo-1776363116182-51694a04a1d5')],
    ['side-table', 'Side Table', 'Table', '🪵', 90_000, undefined, stock('photo-1592991694176-3878d223a0f7')],
    ['floor-lamp', 'Hue Gradient Lamp', 'LampFloor', '💡', 200_000, undefined, monis('Philips_Hue_Signe_gradient_table_lamp_new_e4eeba8c56.jpg')],
  ]),
  ...build('garage', [
    ['tool-shelf', 'Tool Shelf', 'ShelvingUnit', '🗄️', 150_000, undefined, stock('photo-1631856954913-c751a44490ec')],
    ['toolbox', 'Toolbox', 'Wrench', '🧰', 90_000, undefined, stock('photo-1558906050-d6d6aa390fd3')],
    ['workbench', 'Workbench', 'Hammer', '🔨', 350_000, undefined, stock('photo-1610850760052-edbc52ef7618')],
    ['storage-rack', 'Storage Rack', 'Boxes', '📦', 200_000, undefined, stock('photo-1622030411594-c282a63aa1bc')],
    ['bike-rack', 'Bike Rack', 'Bike', '🚲', 100_000, undefined, stock('photo-1752606302437-bde1f84687b2')],
    ['ladder', 'Step Ladder', 'TrainTrack', '🪜', 80_000, undefined, stock('photo-1570050785780-3c79854c7813')],
    ['pegboard', 'Pegboard', 'LayoutGrid', '🔲', 70_000, undefined, stock('photo-1426927308491-6380b6a9936f')],
    ['drill-set', 'Cordless Drill Set', 'Drill', '🪛', 120_000, undefined, stock('photo-1572981779307-38b8cabb2407')],
    ['fan', 'Standing Fan', 'Fan', '🌀', 90_000, undefined, stock('photo-1601084195907-44baaa49dabd')],
    ['cabinet', 'Storage Cabinet', 'Archive', '🗃️', 220_000, undefined, stock('photo-1600422086908-72be2c8f5f3f')],
  ]),
  ...build('mounts', [
    ['single-arm', 'Single Monitor Arm', 'Monitor', '🦾', 120_000, undefined, stock('photo-1666771410333-3457e9603dd4')],
    ['dual-arm', 'Dual Monitor Arm', 'Monitor', '🦾', 180_000, undefined, stock('photo-1598550476439-6847785fcea6')],
    ['triple-arm', 'Triple Monitor Arm', 'Monitor', '🦾', 260_000, undefined, stock('photo-1591370874773-6702e8f12fd8')],
    ['heavy-arm', 'Heavy-Duty Ultrawide Arm', 'Monitor', '🦾', 200_000, undefined, stock('photo-1587831990711-23ca6441447b')],
    ['stacked-arm', 'Dual Stacked Arm (vertical)', 'Monitor', '🦾', 200_000, undefined, stock('photo-1613413561312-e329d024ed65')],
    ['monitor-riser', 'Adjustable Monitor Stand', 'Layers', '🗄️', 60_000, undefined, monis('Adjustable_Monitor_Stand_4_e6ae3a1d06.jpg')],
    ['light-bar', 'Monitor Light Bar', 'LampDesk', '💡', 90_000, undefined, monis('Monitor_Light_Bar_1_8e97972171.jpg')],
    ['cable-tray', 'Under-desk Cable Tray', 'Layers', '🧵', 50_000, undefined, stock('photo-1760348213270-7cd00b8c3405')],
    ['power-hub', 'Desk Power Hub', 'Package', '🔌', 70_000, undefined, stock('photo-1633325825614-c13232a83563')],
    ['headphone-hook', 'Headphone Hook', 'Package', '🎧', 25_000, undefined, stock('photo-1593121925328-369cc8459c08')],
  ]),
  ...build('audio', [
    ['marshall', 'Marshall Woburn III', 'Speaker', '🔊', 350_000, undefined, monis('marshall_woburn_2_1_227171e0f8.jpg')],
    ['homepod', 'Apple HomePod (2nd gen)', 'Speaker', '🔊', 250_000, undefined, monis('Apple_homepod_1_4fe0a77250.jpg')],
    ['podcast-mic', 'Podcast Mic Kit (Shure MV7)', 'Speaker', '🎙️', 300_000, undefined, monis('Shure_MV_7_Podcast_Microphone_Kit_1_fefd9453fb.jpg')],
    ['boom-arm', 'Microphone Boom Arm', 'Speaker', '🎙️', 60_000, undefined, monis('Boom_arm_6_5e6dadb9ab.jpg')],
    ['dj-controller', 'Pioneer DDJ-FLX4 DJ Controller', 'Speaker', '🎛️', 400_000, undefined, monis('Pioneer_DDJ_FLX_4_DJ_Controller_1_e10d47ee5f.jpg')],
    ['desk-speakers', 'Desktop Speakers (pair)', 'Speaker', '🔈', 120_000, undefined, stock('photo-1545454675-3531b543be5d')],
    ['soundbar', 'Monitor Soundbar', 'Speaker', '🔈', 150_000, undefined, stock('photo-1604914416956-38b08c516877')],
    ['studio-monitors', 'Studio Monitors (pair)', 'Speaker', '🔈', 300_000, undefined, stock('photo-1531104985437-603d6490e6d4')],
    ['headphones', 'Over-ear Headphones', 'Speaker', '🎧', 150_000, undefined, stock('photo-1505740420928-5e560c06d30e')],
    ['bt-speaker', 'Portable Bluetooth Speaker', 'Speaker', '🔈', 80_000, undefined, stock('photo-1608043152269-423dbba4e7e1')],
  ]),
  ...build('computers', [
    ['macbook-neo', 'Apple MacBook Neo 13"', 'Laptop', '💻', 900_000, undefined, monis('Mac_Book_Neo_Silver_6_ceb2d1d671.jpg')],
    ['windows-laptop', '15" Office Windows Laptop', 'Laptop', '💻', 600_000, undefined, monis('15_Office_Windows_Laptop_1_c1221bb234.jpg')],
    ['mac-mini-m4', 'Apple Mac mini M4', 'Package', '🖥️', 800_000, undefined, monis('Mac_mini_M4_front_b152d10743.jpg')],
    ['mac-mini-m2', 'Apple Mac mini M2', 'Package', '🖥️', 600_000, undefined, monis('Apple_Mac_Mini_M2_6_1d4fce6808.jpg')],
    ['mac-studio', 'Apple Mac Studio', 'Package', '🖥️', 1_500_000, undefined, monis('Mac_Studio_M1_6_7488521ebb.jpg')],
    ['dock', 'Display Docking Station', 'Package', '🔌', 150_000, undefined, monis('Chat_GPT_Image_Apr_7_2026_02_38_23_PM_5d6f60c5e2.jpg')],
    ['usb-hub', '6-in-1 USB-C Hub', 'Package', '🔌', 40_000, undefined, monis('mac_dongle_product_photo_0316bc4b50.jpg')],
    ['macbook-pro', 'MacBook Pro 14"', 'Laptop', '💻', 1_300_000, undefined, stock('photo-1611186871348-b1ce696e52c9')],
    ['gaming-pc', 'Gaming PC Tower', 'Package', '🖥️', 1_200_000, undefined, stock('photo-1587202372775-e229f172b9d7')],
    ['ipad-pro', 'iPad Pro + Magic Keyboard', 'Laptop', '📱', 700_000, undefined, stock('photo-1546868871-0f936769675e')],
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

export const MONITOR_IDS = new Set([
  'accessories-monitor-24',
  'accessories-monitor-27',
  'accessories-ultrawide',
  'accessories-studio-display',
]);

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

// ---------------------------------------------------------------------------
// Real-world sizes, so only setups that would fit in real life can be built.
// ---------------------------------------------------------------------------

/** Usable desk top width in cm. */
export const DESK_WIDTH_CM: Record<string, number> = {
  'desks-standing': 140,
  'desks-l-shape': 160,
  'desks-minimal-oak': 120,
  'desks-glass-top': 120,
  'desks-gaming': 140,
  'desks-compact': 100,
  'desks-bamboo': 120,
  'desks-executive': 180,
  'desks-folding': 160,
  'desks-corner': 150,
};

/** Width an item takes along the back of the desk, in cm (screen width incl. bezel for monitors). */
export const FOOTPRINT_CM: Record<string, number> = {
  'accessories-monitor-24': 54, // 539 mm (monis.rent spec)
  'accessories-monitor-27': 61, // 613 mm
  'accessories-ultrawide': 81, // 810 mm
  'accessories-studio-display': 62, // 623 mm
  'accessories-desk-lamp': 16, // 162 mm base
  'accessories-plant': 20,
  'accessories-laptop-stand': 32,
  // Mounts: an arm only takes its clamp; a riser under a monitor adds nothing (29 cm on its own)
  'mounts-single-arm': 10,
  'mounts-dual-arm': 10,
  'mounts-triple-arm': 10,
  'mounts-heavy-arm': 10,
  'mounts-stacked-arm': 10,
  'mounts-monitor-riser': 29,
  'mounts-power-hub': 8,
  // Audio
  'audio-marshall': 40,
  'audio-homepod': 14,
  'audio-podcast-mic': 12,
  'audio-boom-arm': 6,
  'audio-dj-controller': 48,
  'audio-desk-speakers': 36,
  'audio-soundbar': 55,
  'audio-studio-monitors': 40,
  'audio-headphones': 20,
  'audio-bt-speaker': 18,
  // Computers (a laptop on the laptop stand only adds what sticks out past the stand)
  'computers-macbook-neo': 30,
  'computers-windows-laptop': 36,
  'computers-macbook-pro': 31,
  'computers-ipad-pro': 28,
  'computers-mac-mini-m4': 13,
  'computers-mac-mini-m2': 20,
  'computers-mac-studio': 20,
  'computers-dock': 22,
  'computers-gaming-pc': 22,
};

/** Items you only ever need one of on a desk. */
export const ONE_PER_DESK = new Set([
  'accessories-keyboard',
  'accessories-mouse',
  'accessories-webcam',
  'accessories-laptop-stand',
  'accessories-desk-lamp',
  'mounts-cable-tray',
  'mounts-power-hub',
  'mounts-headphone-hook',
  'computers-usb-hub',
  'computers-dock',
]);

/** Sit in front of the screens, not along the back edge. */
export const FRONT_OF_DESK = new Set(['accessories-keyboard', 'accessories-mouse', 'computers-usb-hub']);

/** Not drawn on the desk top (under the desk / clipped to its edge). */
export const UNDER_DESK = new Set(['mounts-cable-tray', 'mounts-headphone-hook']);

/** Default left → right spot along the back edge: plant, laptop, screens, gear, speakers, lamp. */
export const DESK_ORDER: Record<string, number> = {
  'accessories-plant': 0,
  'accessories-succulent': 3,
  'accessories-laptop-stand': 1,
  'computers-macbook-neo': 1,
  'computers-windows-laptop': 1,
  'computers-macbook-pro': 1,
  'computers-ipad-pro': 1,
  'audio-podcast-mic': 1,
  'audio-boom-arm': 0,
  'computers-mac-mini-m4': 7,
  'computers-mac-mini-m2': 7,
  'computers-mac-studio': 7,
  'computers-dock': 7,
  'computers-gaming-pc': 9,
  'audio-homepod': 8,
  'audio-marshall': 8,
  'audio-bt-speaker': 8,
  'audio-headphones': 8,
  'mounts-power-hub': 8,
  'accessories-desk-lamp': 9,
};
export const deskOrder = (itemId: string) => DESK_ORDER[itemId] ?? 5;

export const WEBCAM = 'accessories-webcam';
export const LIGHT_BAR = 'mounts-light-bar';
export const RISER = 'mounts-monitor-riser';
export const LAPTOP_STAND = 'accessories-laptop-stand';
/** Clip onto the top edge of a monitor. */
export const TOPPERS = new Set([WEBCAM, LIGHT_BAR]);
/** Can sit on the laptop stand. */
export const LAPTOPS = new Set(['computers-macbook-neo', 'computers-windows-laptop', 'computers-macbook-pro', 'computers-ipad-pro']);

/** Real monitor data (monis.rent spec sheets): width, total height on its stand, screen height, weight. */
export type MonitorSpec = { w: number; h: number; screenH: number; kg: number; vesa: boolean; portrait: boolean };
export const MONITOR_SPEC: Record<string, MonitorSpec> = {
  'accessories-monitor-24': { w: 53.9, h: 43.4, screenH: 31.9, kg: 3, vesa: true, portrait: true },
  'accessories-monitor-27': { w: 61.3, h: 51.5, screenH: 36.5, kg: 3.6, vesa: true, portrait: true },
  'accessories-ultrawide': { w: 81, h: 52, screenH: 36.9, kg: 8.6, vesa: true, portrait: false },
  // Studio Display with the standard tilt stand has no VESA mount
  'accessories-studio-display': { w: 62.3, h: 47.8, screenH: 35.6, kg: 6.3, vesa: false, portrait: false },
};

/** Monitor arms: how many screens, max weight per screen, and side by side or stacked. */
export type ArmSpec = { cap: number; maxKg: number; layout: 'row' | 'stack' };
export const ARMS: Record<string, ArmSpec> = {
  'mounts-single-arm': { cap: 1, maxKg: 9, layout: 'row' },
  'mounts-dual-arm': { cap: 2, maxKg: 9, layout: 'row' },
  'mounts-triple-arm': { cap: 3, maxKg: 9, layout: 'row' },
  'mounts-heavy-arm': { cap: 1, maxKg: 15, layout: 'row' },
  'mounts-stacked-arm': { cap: 2, maxKg: 9, layout: 'stack' },
};
/** An arm may hold screens a little wider than the desk (overhang). */
export const ARM_OVERHANG_CM = 20;

export const deskWidth = (deskId: string) => DESK_WIDTH_CM[deskId] ?? 120;
export const footprint = (itemId: string) => FOOTPRINT_CM[itemId] ?? 0;
