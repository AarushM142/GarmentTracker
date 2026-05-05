'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllActions, getPendingActions, removeAction, markFailedWithError, scheduleRetry } from '@/lib/sync/queue';
import { useToast } from '@/components/ui/Toast';

export type SyncStatus = 'synced' | 'offline' | 'syncing' | 'failed';

export function useSync() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const updateStatus = useCallback(async () => {
    const actions = await getAllActions();
    const pending = actions.filter(a => a.status === 'pending');
    const failed = actions.filter(a => a.status === 'failed');
    setPendingCount(pending.length);
    setFailedCount(failed.length);
    
    if (!isOnline) {
      setSyncStatus('offline');
    } else if (failed.length > 0) {
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
        // Simple backoff handling: skip actions not ready to retry yet.
        if (action.nextRetryAt && Date.now() < action.nextRetryAt) {
          continue;
        }

        let endpoint = '';
        switch (action.type) {
          case 'UPDATE_STAGE': endpoint = '/api/sync/update-stage'; break;
          case 'UPDATE_QUANTITY': endpoint = '/api/sync/update-quantity'; break;
          case 'ADD_NOTE': endpoint = '/api/sync/add-note'; break;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Include an idempotency key for server-side dedupe (server should persist it).
          body: JSON.stringify({ ...action.payload, actionId: action.id }),
        });

        if (response.ok) {
          await removeAction(action.id);
        } else if (response.status === 409) {
          // Version conflict - stop processing and mark as failed
          const errorMsg = 'Conflict: server rejected due to version mismatch';
          await markFailedWithError(action.id, errorMsg);
          toast(errorMsg, 'error');
          setSyncStatus('failed');
          break; // Stop FIFO processing on conflict
        } else if (response.status >= 400 && response.status < 500) {
          // Non-retriable client error (bad payload / permissions / validation)
          const msg = await response.text().catch(() => '');
          const errorMsg = `Sync Error: ${msg || 'request rejected'}`;
          await markFailedWithError(action.id, errorMsg);
          toast(errorMsg, 'error');
          setSyncStatus('failed');
          break;
        } else {
          // Server error - retry with backoff, stop FIFO to avoid reordering
          const msg = await response.text().catch(() => '');
          await scheduleRetry(action.id, `Server error (${response.status}): ${msg || 'temporary failure'}`);
          setSyncStatus('failed');
          break;
        }
      } catch (error) {
        await scheduleRetry(action.id, 'Network error: failed to reach server');
        setSyncStatus('failed');
        break;
      }
    }

    await updateStatus();
  }, [isOnline, syncStatus, updateStatus]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueUpdate = () => {
      updateStatus();
      // If new work arrives while online, kick the sync loop.
      if (navigator.onLine) processQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-queue-updated', handleQueueUpdate);

    // Initial load - use setTimeout to avoid synchronous setState in effect body
    const timeout = setTimeout(() => {
      updateStatus();
    }, 0);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-queue-updated', handleQueueUpdate);
      clearTimeout(timeout);
    };
  }, [updateStatus]);

  // Separate effect for processing queue when online
  useEffect(() => {
    if (isOnline) {
      // Use setTimeout to avoid synchronous setState in effect body
      const timeout = setTimeout(() => {
        processQueue();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, processQueue]);

  return { isOnline, syncStatus, pendingCount, failedCount, processQueue };
}
