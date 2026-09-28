'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/dnd';
import { useUI } from '@/store/useUI';
import { useItemActions } from './useItemActions';

/**
 * Options for one item, opened by right-click, long-press, or the keyboard (Menu key / Shift+F10).
 * Handy when an item is too small to grab: everything you can do by dragging is here too.
 */
export function ItemMenu() {
  const menu = useUI((s) => s.menu);
  const close = useUI((s) => s.closeMenu);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const { placed: p, item, actions } = useItemActions(menu?.uid ?? null);

  // Keep the menu on screen
  useLayoutEffect(() => {
    if (!menu || !ref.current) return;
    const b = ref.current.getBoundingClientRect();
    setPos({
      x: Math.max(8, Math.min(menu.x, window.innerWidth - b.width - 8)),
      y: Math.max(8, Math.min(menu.y, window.innerHeight - b.height - 8)),
    });
  }, [menu]);

  // Focus the first option; Esc / arrows / Tab
  useEffect(() => {
    if (!menu) return;
    const first = ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, close]);

  if (!menu || !p || !item) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={close} onContextMenu={(e) => (e.preventDefault(), close())}>
      <div
        ref={ref}
        role="menu"
        aria-label={`Options for ${item.name}`}
        onClick={(e) => e.stopPropagation()}
        style={{ left: pos.x, top: pos.y }}
        className="fixed max-h-[80dvh] w-60 overflow-y-auto rounded-xl border-[1.5px] border-[#2b2a28] bg-white p-1 shadow-[3px_3px_0_#2b2a28]"
      >
        <p className="truncate px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-jungle-800/55">{item.name}</p>
        {actions.map((a, i) => (
          <Fragment key={a.key}>
            {i > 0 && actions[i - 1].group !== a.group && <div role="separator" className="my-1 border-t border-dashed border-[#2b2a2833]" />}
            <button
              type="button"
              role="menuitem"
              disabled={a.disabled}
              onClick={() => {
                a.run();
                close();
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition focus-visible:bg-lagoon-50 focus-visible:ring-2 focus-visible:ring-lagoon-500 disabled:pointer-events-none disabled:opacity-35 pointer-coarse:py-3',
                a.danger ? 'text-danger-500 hover:bg-danger-500 hover:text-white' : 'text-jungle-900 hover:bg-[#f1ede6]',
              )}
            >
              <a.Icon size={15} aria-hidden />
              {a.label}
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
