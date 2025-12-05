'use client';

import { MetaMaskProvider } from '@hathor/snap-utils';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MetaMaskProvider>
      {children}
    </MetaMaskProvider>
  );
}
