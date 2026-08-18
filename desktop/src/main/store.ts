import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import initSqlJs, { type Database } from 'sql.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export type OutboxRow = {
  id: string;
  collection: string;
  action: string;
  payload: string;
  updated_at: string;
};

export class LocalStore {
  private constructor(
    private db: Database,
    private filePath: string,
  ) {}

  static async open(): Promise<LocalStore> {
    const SQL = await initSqlJs({
      locateFile: (file: string) => require.resolve(`sql.js/dist/${file}`),
    });
    const dir = app.getPath('userData');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const filePath = join(dir, 'kilic-ops.sqlite');
    const buf = existsSync(filePath) ? readFileSync(filePath) : undefined;
    const db = buf ? new SQL.Database(buf) : new SQL.Database();
    const store = new LocalStore(db, filePath);
    store.migrate();
    store.persist();
    return store;
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_outbox (
        id TEXT PRIMARY KEY,
        collection TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cache_rows (
        collection TEXT NOT NULL,
        body TEXT NOT NULL,
        PRIMARY KEY (collection)
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  private persist(): void {
    writeFileSync(this.filePath, Buffer.from(this.db.export()));
  }

  listOutbox(): OutboxRow[] {
    const stmt = this.db.prepare('SELECT * FROM sync_outbox ORDER BY updated_at ASC');
    const rows: OutboxRow[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as OutboxRow);
    }
    stmt.free();
    return rows;
  }

  addOutbox(row: OutboxRow): void {
    this.db.run(
      'INSERT OR REPLACE INTO sync_outbox (id, collection, action, payload, updated_at) VALUES (?, ?, ?, ?, ?)',
      [row.id, row.collection, row.action, row.payload, row.updated_at],
    );
    this.persist();
  }

  clearOutbox(ids: string[]): void {
    for (const id of ids) {
      this.db.run('DELETE FROM sync_outbox WHERE id = ?', [id]);
    }
    this.persist();
  }

  getCache(collection: string): unknown[] {
    const stmt = this.db.prepare('SELECT body FROM cache_rows WHERE collection = ?');
    stmt.bind([collection]);
    if (!stmt.step()) {
      stmt.free();
      return [];
    }
    const body = String(stmt.getAsObject().body || '[]');
    stmt.free();
    try {
      const parsed = JSON.parse(body);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  setCache(collection: string, rows: unknown[]): void {
    this.db.run('INSERT OR REPLACE INTO cache_rows (collection, body) VALUES (?, ?)', [
      collection,
      JSON.stringify(rows),
    ]);
    this.persist();
  }

  getMeta(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM meta WHERE key = ?');
    stmt.bind([key]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const value = String(stmt.getAsObject().value || '');
    stmt.free();
    return value;
  }

  setMeta(key: string, value: string): void {
    this.db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, value]);
    this.persist();
  }
}
