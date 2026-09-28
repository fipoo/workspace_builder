'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/dnd';
import { DURATIONS, formatIDR } from '@/lib/pricing';
import { selectCount, selectTotal, useSetup } from '@/store/useSetup';

/** "Ready to Rent?" call to action with a live total. */
export function CartBar({ className }: { className?: string }) {
  const count = useSetup(selectCount);
  const total = useSetup(selectTotal);
  const duration = useSetup((s) => s.duration);
  const hasDesk = useSetup((s) => s.placed.some((p) => p.slot === 'desk'));
  const hasChair = useSetup((s) => s.placed.some((p) => p.slot === 'chair'));
  const empty = count === 0;

  const nudge = !hasDesk ? 'Start with a desk' : !hasChair ? 'Add a chair to finish the basics' : 'Looking good. Ready when you are.';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-3xl bg-jungle-900 p-4 text-sand-50 shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-5',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="font-display text-xl font-bold tracking-tight">Ready to Rent?</p>
        <p className="text-sm text-sand-50/70">
          {empty ? (
            'Your room is empty. Drag in a desk to begin.'
          ) : (
            <>
              <span className="font-semibold text-sand-50">{count} {count === 1 ? 'item' : 'items'}</span> ·{' '}
              <span className="font-semibold tabular-nums text-sand-50">{formatIDR(total)}</span> for{' '}
              {DURATIONS[duration].label} · {nudge}
            </>
          )}
        </p>
      </div>
      <Link
        href="/checkout"
        aria-disabled={empty}
        tabIndex={empty ? -1 : undefined}
        className={cn(
          'group flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-base font-bold transition',
          empty
            ? 'pointer-events-none bg-sand-50/10 text-sand-50/40'
            : 'bg-sunset-500 text-white shadow-[0_8px_24px_-8px_#e2683c] hover:bg-sunset-400 active:scale-95',
        )}
      >
        Rent Setup
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>
    </div>
  );
}
