'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CATEGORIES, getItem, type Item, type Placed, type Slot } from '@/data/catalog';
import { cartTotal, type Duration } from '@/lib/pricing';
import { applyAdd, applyRemove, type PlaceResult } from '@/lib/rules';

type Store = {
  placed: Placed[];
  duration: Duration;
  add(itemId: string, slot: Slot): PlaceResult;
  remove(uid: string): Placed[];
  reset(): void;
  setDuration(duration: Duration): void;
};

export const useSetup = create<Store>()(
  persist(
    (set, get) => ({
      placed: [],
      duration: 'month',
      add(itemId, slot) {
        const { placed, result } = applyAdd(get().placed, itemId, slot);
        if (result.ok) set({ placed });
        return result;
      },
      remove(uid) {
        const { placed, removed } = applyRemove(get().placed, uid);
        set({ placed });
        return removed;
      },
      reset() {
        set({ placed: [] });
      },
      setDuration(duration) {
        set({ duration });
      },
    }),
    {
      name: 'monis-setup',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ placed: s.placed, duration: s.duration }),
      // Rehydrated in <SetupHydrator /> so server and first client render match.
      skipHydration: true,
    },
  ),
);

export function rehydrateSetup() {
  return useSetup.persist.rehydrate();
}

/** True once the persisted setup has been loaded from localStorage. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useSetup.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSetup.persist.onFinishHydration(() => setHydrated(true));
    if (useSetup.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}

// Selectors

export const selectCount = (s: Store) => s.placed.length;
export const selectTotal = (s: Store) => cartTotal(s.placed, s.duration);

export function groupByCategory(placed: Placed[]) {
  return CATEGORIES.map((cat) => ({
    category: cat,
    lines: placed
      .map((p) => ({ placed: p, item: getItem(p.itemId) }))
      .filter((l): l is { placed: Placed; item: Item } => l.item?.category === cat.label),
  })).filter((g) => g.lines.length > 0);
}
