'use client';

import { create } from 'zustand';
import type { Slot } from '@/data/catalog';

type Toast = { id: number; message: string; tone: 'info' | 'error' | 'success' };
type Pulse = { slot: Slot; kind: 'accept' | 'reject'; id: number };

type UIStore = {
  toast: Toast | null;
  pulse: Pulse | null;
  showToast(message: string, tone?: Toast['tone']): void;
  dismissToast(): void;
  pulseSlot(slot: Slot, kind: Pulse['kind']): void;
  /** Right-click / long-press options menu for an item. */
  menu: { uid: string; x: number; y: number } | null;
  openMenu(uid: string, x: number, y: number): void;
  closeMenu(): void;
  /** Item picked on the stage or in the item panel; the panel shows its controls. */
  selected: string | null;
  select(uid: string | null): void;
  /** Item highlighted on the stage while its chip in the item panel is hovered. */
  peek: string | null;
  setPeek(uid: string | null): void;
  /** Item whose details are open, if any. */
  detailId: string | null;
  openDetail(id: string): void;
  closeDetail(): void;
};

let seq = 0;

/** Transient, non-persisted UI feedback: toasts and zone accept/reject pulses. */
export const useUI = create<UIStore>()((set) => ({
  toast: null,
  pulse: null,
  menu: null,
  openMenu(uid, x, y) {
    set({ menu: { uid, x, y }, selected: uid });
  },
  closeMenu() {
    set({ menu: null });
  },
  selected: null,
  select(uid) {
    set({ selected: uid });
  },
  peek: null,
  setPeek(uid) {
    set({ peek: uid });
  },
  detailId: null,
  openDetail(id) {
    set({ detailId: id });
  },
  closeDetail() {
    set({ detailId: null });
  },
  showToast(message, tone = 'info') {
    set({ toast: { id: ++seq, message, tone } });
  },
  dismissToast() {
    set({ toast: null });
  },
  pulseSlot(slot, kind) {
    set({ pulse: { slot, kind, id: ++seq } });
  },
}));
