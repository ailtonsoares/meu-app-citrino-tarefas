/**
 * SQLITE / HIVE EMULATED OFFLINE SYNC ENGINE - Citrino Task App
 * 
 * Simulated SQLite Schema:
 * CREATE TABLE SyncQueue (
 *   id TEXT PRIMARY KEY,
 *   taskId TEXT NOT NULL,
 *   action TEXT NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
 *   payload TEXT NOT NULL, -- Serialized Task state
 *   timestamp TEXT NOT NULL
 * );
 */

import { Task } from '../types';

export interface SyncQueueEntry {
  id: string; // Unique primary key 
  taskId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Task;
  timestamp: string;
  attempts: number; // Number of failed sync attempts
  nextAttemptAfter: string | null; // ISO timestamp of when it can be retried
  lastError?: string; // Optional error log
}

const LOCAL_STORAGE_KEY_QUEUE = 'citrino_sqlite_syncqueue';

export const SyncQueueDB = {
  /**
   * Safe getter for all rows in the SyncQueue table, with automatic backward-compatibility migration
   */
  getEntries(): SyncQueueEntry[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY_QUEUE);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      // Auto-migrate old schemas to support robust retry fields
      return parsed.map((e: any) => ({
        id: e.id || `sys_q_${Math.random().toString(36).substring(2, 9)}`,
        taskId: e.taskId,
        action: e.action,
        payload: e.payload,
        timestamp: e.timestamp || new Date().toISOString(),
        attempts: typeof e.attempts === 'number' ? e.attempts : 0,
        nextAttemptAfter: e.nextAttemptAfter !== undefined ? e.nextAttemptAfter : null,
        lastError: e.lastError || ''
      }));
    } catch (e) {
      console.error('[SyncQueue] Fila corrompida, reiniciando...', e);
      return [];
    }
  },

  /**
   * Persists rows into SQLite-simulated local storage
   */
  saveEntries(entries: SyncQueueEntry[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY_QUEUE, JSON.stringify(entries));
  },

  /**
   * Returns only elements whose retry cooldown has elapsed
   */
  getEligibleEntries(): SyncQueueEntry[] {
    const now = Date.now();
    return this.getEntries().filter(e => {
      if (!e.nextAttemptAfter) return true;
      return new Date(e.nextAttemptAfter).getTime() <= now;
    });
  },

  /**
   * Increments the retry counter and schedules the next run using an exponential backoff formula with random jitter
   */
  recordFailure(taskId: string, errorMessage: string): SyncQueueEntry | null {
    const entries = this.getEntries();
    const index = entries.findIndex(e => e.taskId === taskId);
    if (index === -1) return null;

    const entry = entries[index];
    const newAttempts = entry.attempts + 1;
    
    // Formula: delay = base_delay * (2 ^ attempts) + random_jitter
    // Base delay of 3 seconds. Max out at 5 minutes (300000ms)
    const baseDelay = 3000; 
    const maxDelay = 300000;
    const exponentialMultiplier = Math.pow(2, newAttempts - 1);
    const jitter = Math.random() * 1000; // 0-1s random jitter to avoid thundering herd problem
    const calculatedDelay = Math.min(baseDelay * exponentialMultiplier + jitter, maxDelay);

    const nextAttemptDate = new Date(Date.now() + calculatedDelay);
    
    const updatedEntry: SyncQueueEntry = {
      ...entry,
      attempts: newAttempts,
      nextAttemptAfter: nextAttemptDate.toISOString(),
      lastError: errorMessage,
      timestamp: new Date().toISOString()
    };

    entries[index] = updatedEntry;
    this.saveEntries(entries);

    console.warn(`[SyncQueue DB] Regravando Falha para tarefa ${taskId}. Tentativa #${newAttempts}. Próximo retry em: ${nextAttemptDate.toLocaleTimeString()} (+${Math.round(calculatedDelay / 1000)}s - Backoff Exponencial)`);
    return updatedEntry;
  },

  /**
   * UPSERT / COLLAPSE ACTION CONSOLIDATION
   * Merges multiple redundant edits made while offline into a single, high-efficiency API delta payload.
   * Also resets retry metrics to allow immediate dispatch.
   */
  upsert(taskId: string, action: 'INSERT' | 'UPDATE' | 'DELETE', taskData: Task): void {
    const entries = this.getEntries();
    const existingIndex = entries.findIndex(e => e.taskId === taskId);

    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      const existing = entries[existingIndex];
      let finalAction = action;

      // Consolidation Rules Strategy:
      // 1. If originally queued as INSERT and we edit again offline, it remains an INSERT
      if (existing.action === 'INSERT' && action === 'UPDATE') {
        finalAction = 'INSERT';
      }
      // 2. If originally queued as UPDATE and we update again, it remains UPDATE with the latest payload
      else if (existing.action === 'UPDATE' && action === 'UPDATE') {
        finalAction = 'UPDATE';
      }
      // 3. If originally queued as INSERT and we decide to DELETE offline, we can optimize by discarding the queue row entirely
      else if (existing.action === 'INSERT' && action === 'DELETE') {
        const filtered = entries.filter(e => e.taskId !== taskId);
        this.saveEntries(filtered);
        console.log(`[SyncQueue IDB] Task ${taskId} was INSERT then DELETED local-first. Row removed from SQLite Queue entirely!`);
        return;
      }
      // 4. Any other edge case is resolved with the latest action
      else {
        finalAction = action;
      }

      entries[existingIndex] = {
        ...existing,
        action: finalAction,
        payload: { ...taskData },
        timestamp: now,
        // Reset failures on active modification to try immediately again
        attempts: 0,
        nextAttemptAfter: null,
        lastError: undefined
      };
      
      this.saveEntries(entries);
      console.log(`[SyncQueue DB] CONSOLIDATED / UPSERTED task ${taskId}. Result action: [${finalAction}]. Resetting retries.`);
    } else {
      // Create new clean table row
      const newRow: SyncQueueEntry = {
        id: `sys_q_${Math.random().toString(36).substring(2, 9)}`,
        taskId,
        action,
        payload: { ...taskData },
        timestamp: now,
        attempts: 0,
        nextAttemptAfter: null
      };
      entries.push(newRow);
      this.saveEntries(entries);
      console.log(`[SyncQueue DB] INSERTED new change row for task ${taskId}. Action: [${action}]`);
    }
  },

  /**
   * Removes a single row after successful background integration sync
   */
  remove(taskId: string): void {
    const entries = this.getEntries();
    const filtered = entries.filter(e => e.taskId !== taskId);
    this.saveEntries(filtered);
    console.log(`[SyncQueue DB] DELETED row for task ${taskId} from table.`);
  },

  /**
   * Clear all pending synced rows
   */
  clear(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY_QUEUE);
    console.log('[SyncQueue DB] Purged all rows successfully.');
  }
};
