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
};

let seq = 0;

/** Transient, non-persisted UI feedback: toasts and zone accept/reject pulses. */
export const useUI = create<UIStore>()((set) => ({
  toast: null,
  pulse: null,
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
