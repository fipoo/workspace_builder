'use client';

import { useCallback } from 'react';
import { getItem, type Slot } from '@/data/catalog';
import { useSetup } from '@/store/useSetup';
import { useUI } from '@/store/useUI';

/** Add/remove with feedback (zone pulse + toast). Shared by drag-and-drop, tap and quick-add. */
export function usePlace() {
  const add = useSetup((s) => s.add);
  const remove = useSetup((s) => s.remove);

  const place = useCallback(
    (itemId: string, slot: Slot, opts: { announce?: boolean } = {}) => {
      const { pulseSlot, showToast } = useUI.getState();
      const item = getItem(itemId);
      const result = add(itemId, slot);
      if (result.ok) {
        pulseSlot(slot, 'accept');
        const old = result.replaced && getItem(result.replaced.itemId);
        if (old) showToast(`Swapped ${old.name} for ${item?.name}`, 'success');
        else if (opts.announce) showToast(`Added ${item?.name}`, 'success');
      } else {
        pulseSlot(slot, 'reject');
        showToast(result.reason, 'error');
      }
      return result;
    },
    [add],
  );

  const removeItem = useCallback(
    (uid: string) => {
      const removed = remove(uid);
      const extra = removed.length - 1;
      if (extra > 0) {
        useUI
          .getState()
          .showToast(`Desk removed, plus the ${extra} ${extra === 1 ? 'item' : 'items'} on it`, 'info');
      }
    },
    [remove],
  );

  return { place, removeItem };
}
