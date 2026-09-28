'use client';

import { AnimatePresence, m } from 'framer-motion';
import { ExternalLink, Plus, X } from 'lucide-react';
import { useEffect } from 'react';
import { footprint, getItem } from '@/data/catalog';
import { SPECS } from '@/data/specs';
import { formatDims } from '@/data/dims';
import { formatIDR } from '@/lib/pricing';
import { canPlace } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';
import { ItemPhoto } from './ItemPhoto';
import { usePlace } from './usePlace';

/** Product sheet: photo, specs from monis.rent (or typical specs), price and "Add to setup". */
export function ProductDetail() {
  const id = useUI((s) => s.detailId);
  const close = useUI((s) => s.closeDetail);
  const placed = useSetup((s) => s.placed);
  const { place } = usePlace();
  const item = id ? getItem(id) : undefined;
  const spec = id ? SPECS[id] : undefined;

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, close]);

  const check = item ? canPlace(placed, item, item.slot) : null;
  const cm = item ? footprint(item.id) : 0;

  return (
    <AnimatePresence>
      {item && spec && (
        <m.div
          key="detail"
          className="fixed inset-0 z-50 grid place-items-end bg-jungle-950/40 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-[1.5px] border-[#2b2a28] bg-white p-5 shadow-[4px_4px_0_#2b2a28] sm:max-w-2xl sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border-[1.5px] border-[#2b2a28] bg-white hover:bg-jungle-900 hover:text-white"
            >
              <X size={16} aria-hidden />
            </button>

            <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
              <div className="relative overflow-hidden rounded-2xl border-[1.5px] border-dashed border-[#2b2a2866] bg-white">
                <ItemPhoto item={item} fit={item.source === 'monis' ? 'cutout' : 'cover'} sizes="240px" className="aspect-square w-full" priority />
                {item.source === 'monis' && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-jungle-900 px-2 py-0.5 text-[10px] font-bold text-sand-50">monis.rent</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-jungle-800/55">{item.category}</p>
                <h2 id="detail-title" className="pr-8 font-display text-2xl font-extrabold leading-tight tracking-tight">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-jungle-800/75">{spec.summary}</p>
                <p className="mt-3 font-display text-lg font-bold">
                  {formatIDR(item.pricePerMonth)}
                  <span className="text-sm font-medium text-jungle-800/55">/month</span>
                </p>
                {formatDims(item.id) && <p className="text-xs font-semibold text-jungle-800/70">Size: {formatDims(item.id)} (W × D × H)</p>}
                {cm > 0 && <p className="text-xs text-jungle-800/60">Takes {cm} cm along the desk</p>}
              </div>
            </div>

            <dl className="mt-5 divide-y divide-dashed divide-[#2b2a2833] rounded-2xl border-[1.5px] border-dashed border-[#2b2a2855] px-4">
              {spec.specs.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 text-sm">
                  <dt className="font-semibold text-jungle-800/70">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              {spec.included && (
                <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 text-sm">
                  <dt className="font-semibold text-jungle-800/70">In the box</dt>
                  <dd>{spec.included.join(', ')}</dd>
                </div>
              )}
            </dl>

            <p className="mt-2 text-[11px] text-jungle-800/55">
              {spec.source === 'monis'
                ? 'Specs from the monis.rent product page. Price is sample data.'
                : 'Not on monis.rent yet: typical specs and a sample price for this demo.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!check?.ok}
                onClick={() => {
                  if (place(item.id, item.slot, { announce: true }).ok) close();
                }}
                className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-[#2b2a28] bg-jungle-900 px-4 py-2 font-display text-sm font-bold text-white shadow-[3px_3px_0_#2b2a28] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                <Plus size={16} strokeWidth={3} aria-hidden /> Add to my setup
              </button>
              {spec.url && (
                <a
                  href={spec.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-xl border-[1.5px] border-[#2b2a28] bg-white px-3 py-2 text-sm font-semibold hover:bg-sand-100"
                >
                  View on monis.rent <ExternalLink size={14} aria-hidden />
                </a>
              )}
              {check && !check.ok && <p className="w-full text-xs font-medium text-danger-500">{check.reason}</p>}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
