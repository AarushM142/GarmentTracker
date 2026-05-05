import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type SyncActionType = 'UPDATE_STAGE' | 'UPDATE_QUANTITY' | 'ADD_NOTE';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'failed';
  /**
   * Retry metadata (best-effort client-side reliability).
   * Note: IndexedDB objects are schemaless; older records simply won't have these fields.
   */
  attempts?: number;
  nextRetryAt?: number; // epoch ms
  lastError?: string;
}

interface GarmentTrackerDB extends DBSchema {
  actionQueue: {
    key: string;
    value: SyncAction;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'garment-tracker-db';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase<GarmentTrackerDB>> {
  return openDB<GarmentTrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('actionQueue', {
        keyPath: 'id',
      });
      store.createIndex('by-timestamp', 'timestamp');
    },
  });
}
