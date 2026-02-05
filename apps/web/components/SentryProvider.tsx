'use client';

import { useEffect } from 'react';
import { initializeSentry } from '@/lib/sentry';

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeSentry();
  }, []);

  return <>{children}</>;
}
