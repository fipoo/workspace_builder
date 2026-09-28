'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useUI } from '@/store/useUI';

const TONES = {
  info: { Icon: Info, cls: 'bg-jungle-900 text-sand-50' },
  success: { Icon: CircleCheck, cls: 'bg-jungle-800 text-sand-50' },
  error: { Icon: CircleAlert, cls: 'bg-sunset-600 text-white' },
};

export function Toast() {
  const toast = useUI((s) => s.toast);
  const dismiss = useUI((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 2400);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lift ${TONES[toast.tone].cls}`}
            onClick={dismiss}
          >
            {(() => {
              const { Icon } = TONES[toast.tone];
              return <Icon size={18} aria-hidden />;
            })()}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
