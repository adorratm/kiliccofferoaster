import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

type OutboxRow = {
  id: string;
  collection: string;
  action: string;
  payload: string;
  updated_at: string;
};

const memory: OutboxRow[] = [];
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('kilic-ops.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_outbox (
          id TEXT PRIMARY KEY,
          collection TEXT NOT NULL,
          action TEXT NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function enqueue(row: {
  id: string;
  collection: string;
  action: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const payload = JSON.stringify(row.payload);
  const updated_at = new Date().toISOString();
  const db = await getDb();
  if (!db) {
    const i = memory.findIndex((r) => r.id === row.id);
    const next = { ...row, payload, updated_at };
    if (i >= 0) memory[i] = next;
    else memory.push(next);
    return;
  }
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_outbox (id, collection, action, payload, updated_at) VALUES (?, ?, ?, ?, ?)',
    [row.id, row.collection, row.action, payload, updated_at],
  );
}

export async function listOutbox(): Promise<OutboxRow[]> {
  const db = await getDb();
  if (!db) return [...memory];
  return db.getAllAsync('SELECT * FROM sync_outbox ORDER BY updated_at ASC');
}

export async function clearOutbox(ids: string[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    for (const id of ids) {
      const i = memory.findIndex((r) => r.id === id);
      if (i >= 0) memory.splice(i, 1);
    }
    return;
  }
  for (const id of ids) {
    await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', [id]);
  }
}

export async function pendingCount(): Promise<number> {
  const db = await getDb();
  if (!db) return memory.length;
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM sync_outbox');
  return row?.c ?? 0;
}
