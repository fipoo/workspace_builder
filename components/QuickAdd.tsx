'use client';

import { Plus, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getItem } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { formatIDRShort } from '@/lib/pricing';
import { canPlace } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { ItemPhoto } from './ItemPhoto';
import { usePlace } from './usePlace';

/** The sketch's right-hand tiles: one tap puts the item straight onto the desk. */
const QUICK = [
  ['accessories-monitor-24', 'Monitor'],
  ['mounts-dual-arm', 'Arm'],
  ['accessories-laptop-stand', 'Stand'],
  ['accessories-plant', 'Plant'],
  ['accessories-desk-lamp', 'Lamp'],
  ['accessories-webcam', 'Webcam'],
] as const;

export function QuickAdd({ className }: { className?: string }) {
  const placed = useSetup((s) => s.placed);
  const reset = useSetup((s) => s.reset);
  const { place } = usePlace();
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 2500);
    return () => clearTimeout(t);
  }, [confirm]);

  return (
    <section aria-label="Quick add" className={cn('flex flex-col gap-3', className)}>
      <div className="grid grid-cols-3 gap-x-1.5 gap-y-3.5">
        {QUICK.map(([id, label]) => {
          const item = getItem(id)!;
          const check = canPlace(placed, item, item.slot);
          return (
            <button
              key={id}
              type="button"
              onClick={() => place(id, item.slot, { announce: true })}
              title={check.ok ? `${item.name} · ${formatIDRShort(item.pricePerMonth)}/mo` : check.reason}
              className={cn('group relative flex flex-col items-center pb-3 transition active:scale-95', !check.ok && 'opacity-45')}
            >
              <span className="grid aspect-[5/4] w-full place-items-center rounded-xl border-[1.5px] border-dashed border-[#2b2a2866] bg-white transition group-hover:border-solid group-hover:border-[#2b2a28]">
                <ItemPhoto item={item} fit="cutout" sizes="96px" className="size-[70%] mix-blend-multiply" />
              </span>
              <span className="absolute -bottom-0.5 flex items-center gap-0.5 whitespace-nowrap rounded-md border-[1.5px] border-[#2b2a28] bg-white px-1 py-px font-display text-[10px] font-bold text-[#2b2a28] shadow-[1.5px_1.5px_0_#2b2a28]">
                <Plus size={9} strokeWidth={3} aria-hidden />
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          if (confirm) {
            reset();
            setConfirm(false);
          } else setConfirm(true);
        }}
        disabled={placed.length === 0}
        className={cn(
          'mt-1 flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed py-2 text-xs font-semibold transition disabled:opacity-40',
          confirm ? 'border-danger-500 bg-danger-500 text-white' : 'border-[#2b2a2866] text-jungle-800 hover:border-solid hover:border-[#2b2a28]',
        )}
      >
        <RotateCcw size={13} aria-hidden /> {confirm ? 'Tap again to clear the room' : 'Reset room'}
      </button>
    </section>
  );
}
