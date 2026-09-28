'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CATEGORIES, getItem, type Item, type Placed, type Slot } from '@/data/catalog';
import { cartTotal, type Duration } from '@/lib/pricing';
import { applyAdd, applyHost, applyLift, applyMount, applyMove, applyMoveTo, applyTurn, applyOrient, applyRemove, freeze, type PlaceResult, type Spot } from '@/lib/rules';

type Store = {
  placed: Placed[];
  duration: Duration;
  /** `at` = where on the desk top it was dropped (cm from left / back edge). */
  add(itemId: string, slot: Slot, at?: Spot): PlaceResult;
  /** Put a monitor on the arm or stand it on the desk (optionally at a spot). */
  mount(uid: string, on: boolean, at?: Spot): PlaceResult;
  /** Raise (+) or lower (−) a screen on the arm, in cm. */
  lift(uid: string, delta: number): void;
  /** Turn an item on the desk by `delta` degrees. */
  turn(uid: string, delta: number): PlaceResult;
  /** Move a desk-top item to a spot (cm); it takes the nearest free one. */
  moveTo(uid: string, at: Spot): void;
  /** Move a back-row desk item to position `to` (0 = far left). */
  move(uid: string, to: number): void;
  /** Clip a webcam / light bar onto another monitor, or move a riser under one. */
  setHost(uid: string, monitorUid: string): void;
  /** Returns what was removed, or a reason when removing would break the setup. */
  remove(uid: string): { removed: Placed[]; reason?: string };
  /** Turn a monitor on the arm between landscape and portrait. */
  toggleOrient(uid: string): PlaceResult;
  reset(): void;
  setDuration(duration: Duration): void;
};

export const useSetup = create<Store>()(
  persist(
    (set, get) => ({
      placed: [],
      duration: 'month',
      add(itemId, slot, at) {
        const { placed, result } = applyAdd(get().placed, itemId, slot, undefined, at);
        if (result.ok) set({ placed });
        return result;
      },
      mount(uid, on, at) {
        const { placed, result } = applyMount(get().placed, uid, on, at);
        if (result.ok) set({ placed });
        return result;
      },
      lift(uid, delta) {
        set({ placed: applyLift(get().placed, uid, delta) });
      },
      turn(uid, delta) {
        const { placed, result } = applyTurn(get().placed, uid, delta);
        if (result.ok) set({ placed });
        return result;
      },
      moveTo(uid, at) {
        set({ placed: applyMoveTo(get().placed, uid, at) });
      },
      move(uid, to) {
        set({ placed: applyMove(get().placed, uid, to) });
      },
      setHost(uid, monitorUid) {
        set({ placed: applyHost(get().placed, uid, monitorUid) });
      },
      remove(uid) {
        const { placed, removed, reason } = applyRemove(get().placed, uid);
        if (!reason) set({ placed });
        return { removed, reason };
      },
      toggleOrient(uid) {
        const { placed, result } = applyOrient(get().placed, uid);
        if (result.ok) set({ placed });
        return result;
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
      version: 3,
      // v2 renamed a few catalog items; v3 gives desk items a spot (x, y) on the desk top.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<Pick<Store, 'placed' | 'duration'>>;
        return { ...state, placed: freeze((state.placed ?? []).filter((p) => getItem(p.itemId))) } as Store;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ placed: s.placed, duration: s.duration }),
      // Rehydrated in <SetupHydrator /> so server and first client render match.
      skipHydration: true,
    },
  ),
);

// On the server there is no localStorage, so zustand leaves out the persist API.
const persistApi = () => (useSetup as Partial<typeof useSetup>).persist;

export function rehydrateSetup() {
  return persistApi()?.rehydrate();
}

/** True once the persisted setup has been loaded from localStorage. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(() => persistApi()?.hasHydrated() ?? false);
  useEffect(() => {
    const api = persistApi();
    if (!api) return;
    const unsub = api.onFinishHydration(() => setHydrated(true));
    if (api.hasHydrated()) setHydrated(true);
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
