'use client';

import { MousePointerClick, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { getItem, TOPPERS, UNDER_DESK, type Placed } from '@/data/catalog';
import { formatDims } from '@/data/dims';
import { cn } from '@/lib/dnd';
import { layoutPlane, mountInfo } from '@/lib/rules';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';
import { ItemPhoto } from './ItemPhoto';
import { useItemActions, type ActionKey, type ItemAction } from './useItemActions';

/** Where an item sits, as a short tag on its chip. */
function tagOf(p: Placed, onArm: Set<string>) {
  if (p.slot === 'desk') return 'desk';
  if (p.slot === 'chair') return 'chair';
  if (onArm.has(p.uid)) return 'on arm';
  if (TOPPERS.has(p.itemId)) return 'on screen';
  if (UNDER_DESK.has(p.itemId)) return 'under desk';
  return null;
}

/** Keyboard shortcuts while an item is selected (and nothing else has focus). */
const KEYS: Record<string, ActionKey[]> = {
  ArrowLeft: ['left', 'swapLeft'],
  ArrowRight: ['right', 'swapRight'],
  ArrowUp: ['back', 'raise'],
  ArrowDown: ['forward', 'lower'],
  Delete: ['remove'],
  Backspace: ['remove'],
};

/**
 * Item panel under the stage: every item on the desk as a chip (so tiny or crowded items are
 * easy to pick), and one docked toolbar for the selected item, instead of buttons on every item.
 */
export function ItemManager({ className }: { className?: string }) {
  const placed = useSetup((s) => s.placed);
  const selected = useUI((s) => s.selected);
  const select = useUI((s) => s.select);
  const setPeek = useUI((s) => s.setPeek);
  const { placed: p, item, actions } = useItemActions(selected);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const plane = layoutPlane(placed);
  const onArm = new Set(mountInfo(placed).mounted.map((m) => m.uid));
  const rank = (q: Placed): number => {
    if (q.slot === 'desk') return -2;
    if (q.slot === 'chair') return -1;
    const r = plane.rects.get(q.uid);
    if (r) return r.x;
    if (q.host) return rank(placed.find((h) => h.uid === q.host) ?? q) + 0.5;
    return UNDER_DESK.has(q.itemId) ? 1e4 : 5e3;
  };
  const list = placed.filter((q) => q.slot === 'desk' || q.slot === 'chair' || q.slot === 'desk-surface').sort((a, b) => rank(a) - rank(b));

  // Keep the selected chip in view
  useEffect(() => {
    if (!selected) return;
    listRef.current?.querySelector(`[data-chip="${selected}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selected]);

  // Arrow keys / Delete / Esc act on the selected item
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const free = !el || el === document.body || panelRef.current?.contains(el);
      if (e.defaultPrevented || !free || e.altKey || e.ctrlKey || e.metaKey) return;
      if (useUI.getState().menu || useUI.getState().detailId) return;
      if (e.key === 'Escape') {
        select(null);
        return;
      }
      const a = KEYS[e.key]?.map((k) => actionsRef.current.find((x) => x.key === k)).find(Boolean);
      if (!a) return;
      e.preventDefault();
      if (!a.disabled) a.run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, select]);

  const r = p ? plane.rects.get(p.uid) : undefined;
  const groups = actions.reduce<ItemAction[][]>((acc, a) => {
    const last = acc[acc.length - 1];
    if (last && last[0].group === a.group) last.push(a);
    else acc.push([a]);
    return acc;
  }, []);

  return (
    <div ref={panelRef} className={cn('rounded-2xl border-[1.5px] border-[#2b2a28] bg-white/90 shadow-[2px_2px_0_#2b2a28]', className)}>
      {/* Every item, left to right as it stands on the desk */}
      <div className="flex min-h-12 items-center gap-2 border-b border-dashed border-[#2b2a2833] px-3 py-2 pointer-coarse:min-h-14">
        <h2 className="shrink-0 font-display text-xs font-bold text-[#2b2a28] sm:text-sm">
          Items <span className="font-sans font-semibold text-jungle-800/55">{list.length}</span>
        </h2>
        {list.length === 0 ? (
          <p className="text-xs text-jungle-800/55">Drop a desk on the stage to start.</p>
        ) : (
          <ul ref={listRef} aria-label="Items in your setup" className="scroll-thin -my-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1">
            {list.map((q) => {
              const it = getItem(q.itemId);
              if (!it) return null;
              const tag = tagOf(q, onArm);
              const on = q.uid === selected;
              return (
                <li key={q.uid} data-chip={q.uid} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => select(on ? null : q.uid)}
                    onPointerEnter={() => setPeek(q.uid)}
                    onPointerLeave={() => setPeek(null)}
                    onFocus={() => setPeek(q.uid)}
                    onBlur={() => setPeek(null)}
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-full border-[1.5px] py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold transition pointer-coarse:h-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500',
                      on ? 'border-sunset-500 bg-sunset-500 text-white' : 'border-[#2b2a2840] bg-white text-jungle-900 hover:border-[#2b2a28]',
                    )}
                  >
                    <ItemPhoto item={it} fit="cutout" sizes="28px" className="size-6 shrink-0 rounded-full bg-white pointer-coarse:size-8" />
                    <span className="max-w-28 truncate">{it.name}</span>
                    {tag && <span className={cn('font-medium', on ? 'text-white/75' : 'text-jungle-800/50')}>· {tag}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Controls for the selected item */}
      <div className="min-h-12 px-3 py-2">
        {p && item ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 basis-full items-center gap-2 lg:basis-auto lg:w-48">
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold text-jungle-900">{item.name}</p>
                <p aria-live="polite" className="truncate text-[11px] text-jungle-800/60">
                  {formatDims(item.id)}
                  {r && ` · ${Math.round(r.x)} cm from left, ${Math.round(r.y)} cm from back`}
                  {p.turn ? ` · turned ${p.turn}°` : ''}
                </p>
              </div>
              <button
                type="button"
                aria-label="Deselect"
                onClick={() => select(null)}
                className="ml-auto grid size-7 shrink-0 place-items-center rounded-full text-jungle-800/60 hover:bg-[#f1ede6] hover:text-jungle-900 pointer-coarse:size-10"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
            <div role="toolbar" aria-label={`Controls for ${item.name}`} className="flex flex-1 flex-wrap items-center gap-1.5">
              {groups.map((g) => (
                <div key={g[0].group} className={cn('flex gap-1', g[0].group === 'remove' && 'ml-auto')}>
                  {g.map((a) => (
                    <Tool key={a.key} a={a} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 py-1.5 text-xs text-jungle-800/60">
            <MousePointerClick size={14} aria-hidden />
            Click an item on the desk or a chip above to move, turn or remove it. Right-click also works.
          </p>
        )}
      </div>
    </div>
  );
}

function Tool({ a }: { a: ItemAction }) {
  return (
    <button
      type="button"
      title={a.label}
      aria-label={a.label}
      disabled={a.disabled}
      onClick={a.run}
      className={cn(
        'flex h-8 items-center gap-1 rounded-lg border-[1.5px] px-2 text-xs font-semibold transition pointer-coarse:h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500 disabled:pointer-events-none disabled:opacity-30',
        a.danger
          ? 'border-danger-500 text-danger-500 hover:bg-danger-500 hover:text-white'
          : 'border-[#2b2a2840] bg-white text-jungle-900 hover:border-[#2b2a28] hover:bg-[#f1ede6] active:translate-y-px',
      )}
    >
      <a.Icon size={14} strokeWidth={2.5} aria-hidden />
      <span className="hidden sm:inline">{a.short}</span>
    </button>
  );
}
