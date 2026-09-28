import { type Item } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { isMonitor } from '@/lib/rules';
import { ItemPhoto } from './ItemPhoto';

/** Box shape of each desk item in the scene. Width comes from the canvas (real cm), this sets height. */
const DESK_ASPECT: Record<string, string> = {
  'accessories-desk-lamp': 'aspect-[1/2]',
  'accessories-webcam': 'aspect-[3/2]',
  'accessories-keyboard': 'aspect-[3/1]',
  'accessories-mouse': 'aspect-[3/2]',
};

/**
 * The visual for an item sitting in the scene.
 * - desk: product cut-out on the desk top, sized to real width by the canvas
 * - zone: rounded photo tile on a zone pad
 * - sm: small thumbnail for lists (checkout, mini preview)
 */
export function ItemGlyph({ item, size = 'md' }: { item: Item; size?: 'sm' | 'md' | 'lg' }) {
  if (size === 'sm') {
    return <ItemPhoto item={item} sizes="40px" className="size-9 rounded-lg bg-white ring-1 ring-jungle-900/10" />;
  }

  if (item.id === 'accessories-laptop-stand') {
    return (
      <div title={item.name} className="w-full">
        <LaptopOnStand />
      </div>
    );
  }

  if (item.slot === 'desk-surface') {
    const stock = item.source === 'stock';
    // Crop the square packshot to the product so thin items (lamp) and flat ones (keyboard) read at full size
    const wide = ['accessories-keyboard', 'accessories-mouse', 'accessories-desk-lamp', 'accessories-webcam'].includes(item.id);
    return (
      <div title={item.name} className="flex w-full flex-col items-center">
        <ItemPhoto
          item={item}
          fit={stock ? 'cover' : wide ? 'cutout-crop' : 'cutout'}
          sizes="(min-width: 640px) 180px, 110px"
          className={cn('w-full', DESK_ASPECT[item.id] ?? 'aspect-square', stock && 'rounded-full shadow-tile ring-2 ring-white')}
        />
        {isMonitor(item.id) && <div className="-mt-1 h-1 w-1/2 rounded-full bg-jungle-950/20 blur-[2px]" />}
      </div>
    );
  }

  const box = size === 'lg' ? 'size-20 rounded-2xl' : 'size-14 rounded-xl sm:size-16';
  return (
    <div title={item.name} className={cn('overflow-hidden bg-white shadow-tile ring-2 ring-white', box)}>
      <ItemPhoto item={item} sizes="80px" className="size-full" />
    </div>
  );
}

/**
 * Laptop on an aluminium stand, front view, in the sketch's line style. The stand lifts the
 * screen ~15 cm so its top edge lines up with the lower edge of the monitors beside it.
 */
function LaptopOnStand() {
  const s = { stroke: '#2b2a28', strokeWidth: 1.4, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 36 40" className="block w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="laptop-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe8f2" />
          <stop offset="0.55" stopColor="#5fb3c9" />
          <stop offset="1" stopColor="#2c6f86" />
        </linearGradient>
      </defs>
      {/* screen */}
      <rect x="3" y="2" width="30" height="20" rx="1.2" fill="#2d2d30" {...s} />
      <rect x="4.2" y="3.2" width="27.6" height="17.4" rx="0.4" fill="url(#laptop-screen)" />
      {/* keyboard deck, tilted toward you */}
      <polygon points="2,22 34,22 35.5,25 0.5,25" fill="#c9ccd1" {...s} />
      {/* stand: two raised arms and a foot */}
      <polygon points="8,25 11,25 12.5,38 7.5,38" fill="#b4b8bf" {...s} />
      <polygon points="25,25 28,25 28.5,38 23.5,38" fill="#b4b8bf" {...s} />
      <rect x="6" y="37.5" width="24" height="2" rx="1" fill="#9ea3ab" {...s} />
    </svg>
  );
}
