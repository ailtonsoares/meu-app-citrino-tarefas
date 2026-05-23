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
}

const LOCAL_STORAGE_KEY_QUEUE = 'citrino_sqlite_syncqueue';

export const SyncQueueDB = {
  /**
   * Safe getter for all rows in the SyncQueue table
   */
  getEntries(): SyncQueueEntry[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY_QUEUE);
      return data ? JSON.parse(data) : [];
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
   * UPSERT / COLLAPSE ACTION CONSOLIDATION
   * Merges multiple redundant edits made while offline into a single, high-efficiency API delta payload
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
        timestamp: now
      };
      
      this.saveEntries(entries);
      console.log(`[SyncQueue DB] CONSOLIDATED / UPSERTED task ${taskId}. Result action: [${finalAction}]`);
    } else {
      // Create new clean table row
      const newRow: SyncQueueEntry = {
        id: `sys_q_${Math.random().toString(36).substring(2, 9)}`,
        taskId,
        action,
        payload: { ...taskData },
        timestamp: now
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
