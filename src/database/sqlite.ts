import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

export interface DatabaseAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SQLite.SQLiteBindParams): Promise<SQLite.SQLiteRunResult>;
  getAllAsync<T>(sql: string, params?: SQLite.SQLiteBindParams): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: SQLite.SQLiteBindParams): Promise<T | null>;
  withTransactionAsync<T>(fn: () => Promise<T>): Promise<T>;
  closeAsync?(): Promise<void>;
}

let database: DatabaseAdapter | null;
let initialization: Promise<DatabaseAdapter> | null = null;

async function initialize(adapter: DatabaseAdapter): Promise<DatabaseAdapter> {
  await adapter.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  await adapter.execAsync('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)');
  const row = await adapter.getFirstAsync<{ version: number }>('SELECT MAX(version) AS version FROM schema_migrations');
  const current = row?.version ?? 0;
  for (const migration of migrations) {
    if (migration.version <= current) continue;
    await adapter.withTransactionAsync(async () => {
      await adapter.execAsync(migration.sql);
      await adapter.runAsync('INSERT INTO schema_migrations(version, name, applied_at) VALUES(?,?,?)', [migration.version, migration.name, new Date().toISOString()]);
    });
  }
  return adapter;
}

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (database) return database;
  if (!initialization) {
    initialization = SQLite.openDatabaseAsync('taskpro.db').then((nativeDb) => initialize(nativeDb as unknown as DatabaseAdapter)).then((db) => (database = db)).catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export function setDatabaseForTesting(adapter: DatabaseAdapter | null): void {
  database = adapter;
  initialization = adapter ? Promise.resolve(adapter) : null;
}

export async function closeDatabase(): Promise<void> {
  await database?.closeAsync?.();
  database = null;
  initialization = null;
}
