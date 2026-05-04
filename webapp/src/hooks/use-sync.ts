'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingActions, removeAction, markFailed } from '@/lib/sync/queue';
import { SyncAction } from '@/lib/sync/db';

export type SyncStatus = 'synced' | 'offline' | 'syncing' | 'failed';

export function useSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);

  const updateStatus = useCallback(async () => {
    const pending = await getPendingActions();
    setPendingCount(pending.length);
    
    if (!isOnline) {
      setSyncStatus('offline');
    } else if (pending.some(a => a.status === 'failed')) {
      setSyncStatus('failed');
    } else if (pending.length > 0) {
      // If we are online and have pending, we should be syncing or about to sync
      // The actual sync process will update this to 'syncing'
    } else {
      setSyncStatus('synced');
    }
  }, [isOnline]);

  const processQueue = useCallback(async () => {
    if (!isOnline || syncStatus === 'syncing') return;

    const pending = await getPendingActions();
    if (pending.length === 0) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');

    for (const action of pending) {
      try {
        let endpoint = '';
        switch (action.type) {
          case 'UPDATE_STAGE': endpoint = '/api/sync/update-stage'; break;
          case 'UPDATE_QUANTITY': endpoint = '/api/sync/update-quantity'; break;
          case 'ADD_NOTE': endpoint = '/api/sync/add-note'; break;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });

        if (response.ok) {
          await removeAction(action.id);
        } else if (response.status === 409) {
          // Version conflict - stop processing and mark as failed
          await markFailed(action.id);
          setSyncStatus('failed');
          console.error('Sync conflict for action:', action.id);
          break; // Stop FIFO processing on conflict
        } else {
          // Other error - maybe transient
          console.error('Sync error for action:', action.id, await response.text());
          setSyncStatus('failed');
          break;
        }
      } catch (error) {
        console.error('Sync network error:', error);
        setSyncStatus('failed');
        break;
      }
    }

    await updateStatus();
  }, [isOnline, syncStatus, updateStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);
    const handleQueueUpdate = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-queue-updated', handleQueueUpdate);

    // Initial check
    updateStatus();
    if (isOnline) processQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-queue-updated', handleQueueUpdate);
    };
  }, [isOnline, processQueue, updateStatus]);

  return { isOnline, syncStatus, pendingCount, processQueue };
}
