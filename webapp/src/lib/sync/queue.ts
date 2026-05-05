import { getDB, SyncAction, SyncActionType } from './db';

// uuid is not in package.json, I'll use crypto.randomUUID() which is available in modern browsers
export async function enqueueAction(type: SyncActionType, payload: Record<string, unknown>) {
  const db = await getDB();
  const action: SyncAction = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };

  await db.add('actionQueue', action);
  
  // Trigger a custom event so the sync engine knows there's new work
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-queue-updated'));
  }
  
  return action;
}

export async function getPendingActions(): Promise<SyncAction[]> {
  const db = await getDB();
  const tx = db.transaction('actionQueue', 'readonly');
  const index = tx.store.index('by-timestamp');
  const actions = await index.getAll();
  return actions.filter(a => a.status === 'pending');
}

export async function removeAction(id: string) {
  const db = await getDB();
  await db.delete('actionQueue', id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-queue-updated'));
  }
}

export async function markFailed(id: string) {
  const db = await getDB();
  const action = await db.get('actionQueue', id);
  if (action) {
    action.status = 'failed';
    await db.put('actionQueue', action);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-queue-updated'));
    }
  }
}

export async function getFailedActions(): Promise<SyncAction[]> {
  const db = await getDB();
  const actions = await db.getAll('actionQueue');
  return actions.filter(a => a.status === 'failed');
}

export async function clearFailedActions() {
  const db = await getDB();
  const actions = await db.getAll('actionQueue');
  const failedIds = actions.filter(a => a.status === 'failed').map(a => a.id);
  const tx = db.transaction('actionQueue', 'readwrite');
  await Promise.all([...failedIds.map(id => tx.store.delete(id)), tx.done]);
}
