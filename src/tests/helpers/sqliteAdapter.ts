import { DatabaseSync } from 'node:sqlite';
import type { DatabaseAdapter } from '../../database/sqlite';
import { migrations } from '../../database/migrations';

export function createTestDatabase(): DatabaseAdapter & { raw: DatabaseSync } {
  const raw = new DatabaseSync(':memory:');
  let transactionDepth = 0;
  const adapter: DatabaseAdapter & { raw: DatabaseSync } = {
    raw,
    execAsync: async (sql) => { raw.exec(sql); },
    runAsync: async (sql, params = []) => {
      const result = raw.prepare(sql).run(...params as never[]);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    getAllAsync: async <T,>(sql: string, params = []) => raw.prepare(sql).all(...params as never[]) as T[],
    getFirstAsync: async <T,>(sql: string, params = []) => (raw.prepare(sql).get(...params as never[]) as T | undefined) ?? null,
    withTransactionAsync: async <T,>(fn: () => Promise<T>) => {
      if (transactionDepth) return fn();
      raw.exec('BEGIN'); transactionDepth++;
      try { const value = await fn(); raw.exec('COMMIT'); return value; }
      catch (error) { raw.exec('ROLLBACK'); throw error; }
      finally { transactionDepth--; }
    },
    closeAsync: async () => { raw.close(); },
  };
  return adapter;
}

export async function migrateTestDatabase(db: DatabaseAdapter): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys=ON; CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL)');
  for (const migration of migrations) await db.withTransactionAsync(async () => {
    await db.execAsync(migration.sql);
    await db.runAsync('INSERT INTO schema_migrations VALUES(?,?,?)', [migration.version, migration.name, new Date().toISOString()]);
  });
}
export const fixedIds = (ids: string[]) => { let index = 0; return () => { const id = ids[index++]; if (!id) throw new Error('No test UUIDs left'); return id; }; };
export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const TASK_ID = '22222222-2222-4222-8222-222222222222';
export const OTHER_ID = '33333333-3333-4333-8333-333333333333';
