import { categoryOf, type Item } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { isMonitor } from '@/lib/rules';

const MONITOR_SIZE: Record<string, string> = {
  'accessories-monitor-24': 'h-9 w-12 sm:h-12 sm:w-[4.5rem]',
  'accessories-monitor-27': 'h-10 w-14 sm:h-14 sm:w-20',
  'accessories-ultrawide': 'h-9 w-20 sm:h-12 sm:w-32',
};

/** The visual for an item sitting in the scene (desk top or zone pad). */
export function ItemGlyph({ item, size = 'md' }: { item: Item; size?: 'sm' | 'md' | 'lg' }) {
  const cat = categoryOf(item);

  if (isMonitor(item.id) && size !== 'sm') {
    return (
      <div className="flex flex-col items-center" title={item.name}>
        <div
          className={cn(
            'relative grid place-items-center overflow-hidden rounded-md border-[3px] border-jungle-950 bg-jungle-900 shadow-tile',
            MONITOR_SIZE[item.id],
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_20%,#2fb5a8_0%,#1d4030_55%,#0e2119_100%)] opacity-90" />
          <ItemIcon icon={item.icon} emoji={item.emoji} size={18} className="relative size-4 text-lagoon-100/80 sm:size-5" />
        </div>
        <div className="h-1.5 w-1.5 bg-jungle-950 sm:h-2" />
        <div className="h-1 w-6 rounded-full bg-jungle-950 sm:w-8" />
      </div>
    );
  }

  const box = {
    sm: 'size-8 rounded-lg',
    md: 'size-8 rounded-lg sm:size-12 sm:rounded-xl',
    lg: 'size-14 rounded-2xl',
  }[size];
  const icon = { sm: 'size-4', md: 'size-4 sm:size-6', lg: 'size-7' }[size];

  return (
    <div
      title={item.name}
      className={cn('grid place-items-center border bg-white shadow-tile', box)}
      style={{ color: cat.color, borderColor: `${cat.color}33`, backgroundColor: `color-mix(in oklab, ${cat.color} 10%, white)` }}
    >
      <ItemIcon icon={item.icon} emoji={item.emoji} size={24} className={icon} />
    </div>
  );
}
