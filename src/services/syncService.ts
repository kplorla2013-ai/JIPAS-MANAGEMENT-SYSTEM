import { 
  db, 
  doc, 
  setDoc, 
  deleteDoc, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { CloudSyncStatus } from '../types';

export interface UnsyncedDraft {
  id: string;
  collectionName: string;
  docId: string;
  action: 'set' | 'delete';
  data?: any;
  error: string;
  timestamp: string;
  title: string;
}

const STORAGE_KEY_SYNC_STATUS = 'jipas_cloud_sync_status';
const STORAGE_KEY_UNSYNCED_DRAFTS = 'jipas_unsynced_drafts';

export class FirebaseSyncError extends Error {
  public isCloudError = true;
  public originalError: any;
  public collectionName: string;
  public docId: string;
  public draftSaved: boolean;

  constructor(
    message: string, 
    originalError: any, 
    collectionName: string, 
    docId: string, 
    draftSaved = true
  ) {
    super(message);
    this.name = 'FirebaseSyncError';
    this.originalError = originalError;
    this.collectionName = collectionName;
    this.docId = docId;
    this.draftSaved = draftSaved;
  }
}

// -------------------------------------------------------------
// Unsynced Drafts Storage & Management
// -------------------------------------------------------------

export function getUnsyncedDrafts(): UnsyncedDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_UNSYNCED_DRAFTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[syncService] Error reading unsynced drafts:', e);
  }
  return [];
}

export function saveUnsyncedDrafts(drafts: UnsyncedDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_UNSYNCED_DRAFTS, JSON.stringify(drafts));
    updateCloudSyncStatus({ unsyncedDraftsCount: drafts.length });
  } catch (e) {
    console.warn('[syncService] Error saving unsynced drafts:', e);
  }
}

export function recordUnsyncedDraft(
  draft: Omit<UnsyncedDraft, 'id' | 'timestamp'>
): UnsyncedDraft {
  const current = getUnsyncedDrafts();
  const existingIdx = current.findIndex(
    d => d.collectionName === draft.collectionName && d.docId === draft.docId
  );

  const newDraft: UnsyncedDraft = {
    ...draft,
    id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  const updated = existingIdx >= 0
    ? current.map((d, i) => i === existingIdx ? newDraft : d)
    : [newDraft, ...current];

  saveUnsyncedDrafts(updated);
  return newDraft;
}

export function removeUnsyncedDraft(draftId: string): void {
  const current = getUnsyncedDrafts();
  const updated = current.filter(d => d.id !== draftId);
  saveUnsyncedDrafts(updated);
}

export function removeUnsyncedDraftByDoc(collectionName: string, docId: string): void {
  const current = getUnsyncedDrafts();
  const updated = current.filter(
    d => !(d.collectionName === collectionName && d.docId === docId)
  );
  if (updated.length !== current.length) {
    saveUnsyncedDrafts(updated);
  }
}

export function clearAllUnsyncedDrafts(): void {
  saveUnsyncedDrafts([]);
}

// -------------------------------------------------------------
// Cloud Sync Status Tracking & Listeners
// -------------------------------------------------------------

let currentSyncStatus: CloudSyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncedAt: null,
  pendingWritesCount: 0,
  lastError: null,
  unsyncedDraftsCount: getUnsyncedDrafts().length
};

const listeners = new Set<(status: CloudSyncStatus) => void>();

export function getCloudSyncStatus(): CloudSyncStatus {
  return { ...currentSyncStatus };
}

export function subscribeCloudSyncStatus(
  listener: (status: CloudSyncStatus) => void
): () => void {
  listeners.add(listener);
  listener(getCloudSyncStatus());
  return () => {
    listeners.delete(listener);
  };
}

export function updateCloudSyncStatus(partial: Partial<CloudSyncStatus>): void {
  currentSyncStatus = {
    ...currentSyncStatus,
    ...partial,
    unsyncedDraftsCount: partial.unsyncedDraftsCount !== undefined 
      ? partial.unsyncedDraftsCount 
      : getUnsyncedDrafts().length
  };

  listeners.forEach(cb => {
    try {
      cb(getCloudSyncStatus());
    } catch (e) {
      console.warn('[syncService] Error in sync status listener:', e);
    }
  });
}

// Window online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    updateCloudSyncStatus({ isOnline: true });
    // Automatically trigger background replay of unsynced drafts
    retryAllUnsyncedDrafts().catch(console.warn);
  });
  window.addEventListener('offline', () => {
    updateCloudSyncStatus({ isOnline: false });
  });
}

// -------------------------------------------------------------
// Core Authoritative Cloud Execution Engine
// -------------------------------------------------------------

/**
 * Recursively sanitizes objects before saving to Firestore.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirestore(val);
    }
  }
  return cleanObj as T;
}

/**
 * Authoritative write executor:
 * 1. Validates input
 * 2. Attempts atomic Firestore Cloud write
 * 3. ONLY after Firestore succeeds, invokes the local cache callback
 * 4. In case of failure, registers an unsynced draft and throws FirebaseSyncError
 */
export async function executeCloudWrite<T extends { id?: string }>(
  collectionName: string,
  docId: string,
  data: T,
  localCacheUpdate: () => void,
  validationFn?: () => void,
  displayTitle?: string
): Promise<T> {
  // 1. Data validation
  if (validationFn) {
    validationFn();
  }

  // 2. Mark syncing in progress
  const currentCount = currentSyncStatus.pendingWritesCount;
  updateCloudSyncStatus({
    isSyncing: true,
    pendingWritesCount: currentCount + 1
  });

  try {
    // 3. Authoritative cloud write to Firebase Firestore
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, docId), sanitized);

    // 4. Confirm cloud success: update the local cache only NOW
    localCacheUpdate();

    // 5. Remove any previously pending draft for this document
    removeUnsyncedDraftByDoc(collectionName, docId);

    // 6. Update cloud status
    const remainingCount = Math.max(0, currentSyncStatus.pendingWritesCount - 1);
    updateCloudSyncStatus({
      isSyncing: remainingCount > 0,
      pendingWritesCount: remainingCount,
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
      isOnline: true
    });

    return data;
  } catch (err: any) {
    const errorMsg = err?.message || 'Firebase Cloud synchronization failed';
    const remainingCount = Math.max(0, currentSyncStatus.pendingWritesCount - 1);

    // Record draft locally with full metadata
    recordUnsyncedDraft({
      collectionName,
      docId,
      action: 'set',
      data,
      error: errorMsg,
      title: displayTitle || `${collectionName} #${docId}`
    });

    updateCloudSyncStatus({
      isSyncing: remainingCount > 0,
      pendingWritesCount: remainingCount,
      lastError: errorMsg,
      isOnline: !errorMsg.toLowerCase().includes('offline') && !errorMsg.toLowerCase().includes('network')
    });

    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }

    throw new FirebaseSyncError(
      `Cloud save failed for ${displayTitle || docId}: ${errorMsg}. Your changes have been preserved locally as an unsynced draft.`,
      err,
      collectionName,
      docId,
      true
    );
  }
}

/**
 * Authoritative delete executor:
 * 1. Attempts Firestore Cloud deletion
 * 2. ONLY after Firestore confirms deletion, invokes the local cache delete
 * 3. In case of failure, records an unsynced deletion draft and throws FirebaseSyncError
 */
export async function executeCloudDelete(
  collectionName: string,
  docId: string,
  localCacheDelete: () => void,
  displayTitle?: string
): Promise<void> {
  const currentCount = currentSyncStatus.pendingWritesCount;
  updateCloudSyncStatus({
    isSyncing: true,
    pendingWritesCount: currentCount + 1
  });

  try {
    await deleteDoc(doc(db, collectionName, docId));

    // Confirm cloud success: update local cache
    localCacheDelete();
    removeUnsyncedDraftByDoc(collectionName, docId);

    const remainingCount = Math.max(0, currentSyncStatus.pendingWritesCount - 1);
    updateCloudSyncStatus({
      isSyncing: remainingCount > 0,
      pendingWritesCount: remainingCount,
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
      isOnline: true
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Firebase Cloud deletion failed';
    const remainingCount = Math.max(0, currentSyncStatus.pendingWritesCount - 1);

    recordUnsyncedDraft({
      collectionName,
      docId,
      action: 'delete',
      error: errorMsg,
      title: displayTitle || `${collectionName} #${docId}`
    });

    updateCloudSyncStatus({
      isSyncing: remainingCount > 0,
      pendingWritesCount: remainingCount,
      lastError: errorMsg,
      isOnline: !errorMsg.toLowerCase().includes('offline') && !errorMsg.toLowerCase().includes('network')
    });

    if (err instanceof Error && err.message.includes('permission')) {
      handleFirestoreError(err, OperationType.DELETE, collectionName);
    }

    throw new FirebaseSyncError(
      `Cloud deletion failed for ${displayTitle || docId}: ${errorMsg}. Preserved in draft queue.`,
      err,
      collectionName,
      docId,
      true
    );
  }
}

/**
 * Replays all pending drafts to Firestore.
 * Automatically clears successfully synced drafts and updates the UI.
 */
export async function retryAllUnsyncedDrafts(): Promise<{
  total: number;
  synced: number;
  failed: number;
}> {
  const drafts = getUnsyncedDrafts();
  if (drafts.length === 0) {
    return { total: 0, synced: 0, failed: 0 };
  }

  updateCloudSyncStatus({ isSyncing: true });
  let synced = 0;
  let failed = 0;
  const remainingDrafts: UnsyncedDraft[] = [];

  for (const draft of drafts) {
    try {
      if (draft.action === 'set' && draft.data) {
        await setDoc(
          doc(db, draft.collectionName, draft.docId),
          sanitizeForFirestore(draft.data)
        );
      } else if (draft.action === 'delete') {
        await deleteDoc(doc(db, draft.collectionName, draft.docId));
      }
      synced++;
    } catch (err: any) {
      failed++;
      remainingDrafts.push({
        ...draft,
        error: err?.message || 'Retry failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  saveUnsyncedDrafts(remainingDrafts);

  updateCloudSyncStatus({
    isSyncing: false,
    lastSyncedAt: synced > 0 ? new Date().toISOString() : currentSyncStatus.lastSyncedAt,
    lastError: failed > 0 ? `${failed} unsynced draft(s) could not be uploaded` : null,
    isOnline: true
  });

  return { total: drafts.length, synced, failed };
}
