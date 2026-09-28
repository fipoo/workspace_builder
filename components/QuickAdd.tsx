'use client';

import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getItem } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';
import { formatIDRShort } from '@/lib/pricing';
import { canPlace } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';
import { usePlace } from './usePlace';

const QUICK = [
  ['accessories-monitor-24', 'Monitor'],
  ['accessories-plant', 'Plant'],
  ['accessories-desk-lamp', 'Lamp'],
  ['accessories-keyboard', 'Keyboard'],
  ['coffee-espresso', 'Espresso'],
  ['outdoor-scooter', 'Scooter'],
] as const;

const LEVELS = ['Empty villa', 'Moving in', 'Getting there', 'Productive', 'Nomad Pro'];

/** One-tap shortcuts plus a "setup level" meter. */
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

  const checks = [
    { label: 'Desk', done: placed.some((p) => p.slot === 'desk') },
    { label: 'Chair', done: placed.some((p) => p.slot === 'chair') },
    { label: '2+ accessories', done: placed.filter((p) => p.slot === 'desk-surface').length >= 2 },
    { label: 'A zone item', done: placed.some((p) => ['coffee', 'outdoor', 'relax', 'garage'].includes(p.slot)) },
  ];
  const score = checks.filter((c) => c.done).length;

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-1', className)}>
      <section aria-labelledby="quick-add" className="rounded-3xl bg-white/70 p-4 shadow-tile ring-1 ring-jungle-900/5">
        <h2 id="quick-add" className="font-display text-base font-bold">Quick add</h2>
        <p className="text-xs text-jungle-800/60">One tap, straight into place.</p>
        <div className="mt-3 grid grid-cols-3 gap-2 xl:grid-cols-2">
          {QUICK.map(([id, label]) => {
            const item = getItem(id)!;
            const check = canPlace(placed, item, item.slot);
            const ok = check.ok;
            return (
              <button
                key={id}
                type="button"
                onClick={() => place(id, item.slot, { announce: true })}
                title={check.ok ? `Add ${item.name}` : check.reason}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-jungle-900/15 px-2 py-2.5 text-xs font-semibold transition hover:border-solid hover:border-lagoon-400 hover:bg-lagoon-50 active:scale-95',
                  !ok && 'opacity-45',
                )}
              >
                <ItemIcon icon={item.icon} emoji={item.emoji} size={20} className="text-jungle-800" />
                <span>+{label}</span>
                <span className="text-[10px] font-medium text-jungle-800/50">{formatIDRShort(item.pricePerMonth)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="level" className="rounded-3xl bg-white/70 p-4 shadow-tile ring-1 ring-jungle-900/5">
        <div className="flex items-baseline justify-between">
          <h2 id="level" className="font-display text-base font-bold">Setup level</h2>
          <span className="text-xs font-bold tabular-nums text-jungle-800/60">{score}/4</span>
        </div>
        <motion.p key={score} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-xl font-extrabold text-sunset-600">
          {LEVELS[score]}
          {score === 4 && ' 🌴'}
        </motion.p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-jungle-900/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-lagoon-400 via-jungle-500 to-sunset-500"
            animate={{ width: `${(score / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          />
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          {checks.map((c) => (
            <li key={c.label} className={cn('flex items-center gap-1.5', c.done ? 'font-semibold text-jungle-900' : 'text-jungle-800/50')}>
              <span
                className={cn(
                  'grid size-4 place-items-center rounded-full',
                  c.done ? 'bg-jungle-700 text-white' : 'border border-jungle-900/20',
                )}
              >
                {c.done && <Check size={10} strokeWidth={3} aria-hidden />}
              </span>
              {c.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={placed.length === 0}
          onClick={() => {
            if (!confirm) return setConfirm(true);
            reset();
            setConfirm(false);
            useUI.getState().showToast('Room cleared. Fresh start!', 'info');
          }}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition disabled:opacity-40',
            confirm ? 'bg-danger-500 text-white' : 'bg-jungle-900/5 text-jungle-800 hover:bg-jungle-900/10',
          )}
        >
          <RotateCcw size={13} aria-hidden />
          {confirm ? 'Tap again to clear everything' : 'Reset room'}
        </button>
      </section>
    </div>
  );
}
