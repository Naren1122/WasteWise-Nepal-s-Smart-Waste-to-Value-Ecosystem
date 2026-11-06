'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import type { OfflineStopSyncItem } from '../types/routes.types';
import { useBatchOfflineSync } from './useRoutes';

const STORAGE_KEY = 'WW_OFFLINE_STOPS_QUEUE';

export function useOfflineSync(onSyncSuccess?: () => void) {
  const [queue, setQueue] = useState<OfflineStopSyncItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, startSyncTransition] = useTransition();
  const batchSyncMutation = useBatchOfflineSync();

  // Load queued items from localStorage on mount
  useEffect(() => {
    setIsOnline(navigator.onLine);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored) as OfflineStopSyncItem[]);
      }
    } catch {
      // localStorage parse fallback
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveQueue = useCallback((items: OfflineStopSyncItem[]) => {
    setQueue(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage write error handler
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (queue.length === 0 || !navigator.onLine) return;

    startSyncTransition(async () => {
      try {
        await batchSyncMutation.mutateAsync(queue);
        saveQueue([]);
        onSyncSuccess?.();
      } catch {
        // Retain queue if backend request fails
      }
    });
  }, [queue, batchSyncMutation, saveQueue, onSyncSuccess]);

  // Auto-sync when coming back online if queue has items
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      void syncNow();
    }
  }, [isOnline, queue.length, syncNow]);

  const queueOfflineStop = useCallback(
    (item: OfflineStopSyncItem) => {
      const updated = [...queue.filter((q) => q.stopId !== item.stopId), item];
      saveQueue(updated);

      if (navigator.onLine) {
        startSyncTransition(async () => {
          try {
            await batchSyncMutation.mutateAsync([item]);
            saveQueue(queue.filter((q) => q.stopId !== item.stopId));
            onSyncSuccess?.();
          } catch {
            // Keep in queue for future retry
          }
        });
      }
    },
    [queue, saveQueue, batchSyncMutation, onSyncSuccess]
  );

  return {
    isOnline,
    isSyncing,
    pendingCount: queue.length,
    queueOfflineStop,
    syncNow,
  };
}

