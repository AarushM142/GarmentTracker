import { getDB, SyncAction, SyncActionType } from './db';

function uuidv4Fallback(): string {
  // RFC4122 v4 using crypto.getRandomValues (supported broadly)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = (typeof crypto !== 'undefined' ? crypto : undefined)
  if (!c?.getRandomValues) return Math.random().toString(36).substring(2, 15)
  const bytes = new Uint8Array(16)
  c.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function enqueueAction(type: SyncActionType, payload: Record<string, unknown>) {
  const db = await getDB();
  const action: SyncAction = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4Fallback(),
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    attempts: 0,
  };

  await db.add('actionQueue', action);
  
  // Trigger a custom event so the sync engine knows there's new work
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sync-queue-updated'));
  }
  
  return action;
}

export async function getAllActions(): Promise<SyncAction[]> {
  const db = await getDB();
  const tx = db.transaction('actionQueue', 'readonly');
  const index = tx.store.index('by-timestamp');
  return await index.getAll();
}

export async function getPendingActions(): Promise<SyncAction[]> {
  const actions = await getAllActions();
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
    action.nextRetryAt = undefined;
    await db.put('actionQueue', action);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-queue-updated'));
    }
  }
}

export async function markFailedWithError(id: string, message: string) {
  const db = await getDB();
  const action = await db.get('actionQueue', id);
  if (action) {
    action.status = 'failed';
    action.lastError = message.slice(0, 500);
    action.nextRetryAt = undefined;
    await db.put('actionQueue', action);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-queue-updated'));
    }
  }
}

export async function scheduleRetry(id: string, message: string) {
  const db = await getDB();
  const action = await db.get('actionQueue', id);
  if (action) {
    const attempts = (action.attempts ?? 0) + 1;
    action.attempts = attempts;
    action.lastError = message.slice(0, 500);
    const delayMs = Math.min(30_000 * Math.pow(2, Math.min(attempts, 5)), 5 * 60_000); // up to 5 min
    action.nextRetryAt = Date.now() + delayMs;
    await db.put('actionQueue', action);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-queue-updated'));
    }
  }
}

export async function getFailedActions(): Promise<SyncAction[]> {
  const actions = await getAllActions();
  return actions.filter(a => a.status === 'failed');
}

export async function clearFailedActions() {
  const db = await getDB();
  const actions = await db.getAll('actionQueue');
  const failedIds = actions.filter(a => a.status === 'failed').map(a => a.id);
  const tx = db.transaction('actionQueue', 'readwrite');
  await Promise.all([...failedIds.map(id => tx.store.delete(id)), tx.done]);
}
