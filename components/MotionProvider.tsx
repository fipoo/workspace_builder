'use client';

import { LazyMotion, MotionConfig } from 'framer-motion';

const features = () => import('@/lib/motionFeatures').then((r) => r.default);

/**
 * Animations load in a separate chunk after the page is interactive (smaller first load), and
 * follow the visitor's "reduce motion" setting.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={features} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
