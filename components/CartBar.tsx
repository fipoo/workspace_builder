'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/dnd';
import { DURATIONS, formatIDR } from '@/lib/pricing';
import { selectCount, selectTotal, useSetup } from '@/store/useSetup';

/** The sketch's "Ready to Rent? / Rent Your Setup!" call to action, centred under the platform. */
export function CartBar({ className }: { className?: string }) {
  const count = useSetup(selectCount);
  const total = useSetup(selectTotal);
  const duration = useSetup((s) => s.duration);
  const hasDesk = useSetup((s) => s.placed.some((p) => p.slot === 'desk'));
  const hasChair = useSetup((s) => s.placed.some((p) => p.slot === 'chair'));
  const empty = count === 0;
  const nudge = !hasDesk ? 'Start with a desk' : !hasChair ? 'Add a chair to finish the basics' : null;

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="rounded-xl border-[1.5px] border-[#2b2a28] bg-white px-7 py-2 shadow-[3px_3px_0_#2b2a28]">
        <p className="font-display text-lg font-extrabold tracking-tight sm:text-xl">Ready to Rent?</p>
        <p className="text-xs text-jungle-800/70">
          {empty ? (
            'Your room is empty. Drag in a desk to begin.'
          ) : (
            <>
              <span className="font-semibold text-jungle-900">
                {count} {count === 1 ? 'item' : 'items'}
              </span>{' '}
              · <span className="font-semibold tabular-nums text-jungle-900">{formatIDR(total)}</span> for {DURATIONS[duration].label}
              {nudge && <> · {nudge}</>}
            </>
          )}
        </p>
      </div>
      <Link
        href="/checkout"
        aria-disabled={empty}
        tabIndex={empty ? -1 : undefined}
        className={cn(
          'group -mt-0.5 flex items-center gap-2 rounded-xl border-[1.5px] border-[#2b2a28] px-6 py-2 font-display text-base font-bold transition',
          empty
            ? 'pointer-events-none bg-[#efece6] text-jungle-800/40'
            : 'bg-sunset-500 text-white shadow-[3px_3px_0_#2b2a28] hover:-translate-y-0.5 active:translate-y-0',
        )}
      >
        Rent Your Setup!
        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
    </div>
  );
}
