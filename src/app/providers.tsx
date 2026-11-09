'use client';
import { useEffect, type ReactNode } from 'react';
import { useFgdStore } from '@/stores/fgd-store';
export function Providers({ children }: { children: ReactNode }) {
  const hydrate = useFgdStore((s) => s.hydrate);
  const error = useFgdStore((s) => s.error);
  useEffect(() => hydrate(), [hydrate]);
  return (
    <>
      {children}
      {error && (
        <div className="storage-error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
