'use client';

import { useEffect } from 'react';
import { rehydrateSetup } from '@/store/useSetup';

/** Loads the saved setup from localStorage after the first client render. */
export function SetupHydrator() {
  useEffect(() => {
    rehydrateSetup();
  }, []);
  return null;
}
