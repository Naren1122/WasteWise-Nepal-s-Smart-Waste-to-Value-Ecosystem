'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useAuthStore } from '../shared/stores/auth.store';
import { toast } from '@/shared/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // Avoid toast storms on background query fetches; only alert if critical
            if (process.env.NODE_ENV === 'development') {
              console.error('[QueryCache Error]:', error);
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // If the mutation already has its own custom onError handler, skip the global fallback
            if (mutation?.options?.onError) return;
            const message = error instanceof Error ? error.message : 'Operation failed';
            toast.error(message);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

