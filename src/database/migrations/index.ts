export interface Migration { version: number; name: string; sql: string }

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_offline_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
        password_hash TEXT, password_salt TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '', priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'todo', due_date TEXT, due_time TEXT,
        category_id TEXT, project_id TEXT, created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, completed_at TEXT, archived INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0, deleted_at TEXT, sync_status TEXT NOT NULL DEFAULT 'pending',
        version INTEGER NOT NULL DEFAULT 1,
        CHECK(length(trim(title)) > 0),
        CHECK(priority IN ('low','medium','high','urgent')),
        CHECK(status IN ('todo','in_progress','completed'))
      );
      CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY, task_id TEXT NOT NULL, title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '', color TEXT NOT NULL, icon TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending', version INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
        color TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending', version INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
        UNIQUE(user_id, name)
      );
      CREATE TABLE IF NOT EXISTS task_tags (
        task_id TEXT NOT NULL, tag_id TEXT NOT NULL,
        PRIMARY KEY(task_id, tag_id),
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL,
        remind_at TEXT NOT NULL, notification_id TEXT, created_at TEXT NOT NULL,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY, entity TEXT NOT NULL, entity_id TEXT NOT NULL,
        operation TEXT NOT NULL, payload TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TEXT NOT NULL, created_at TEXT NOT NULL,
        UNIQUE(entity, entity_id)
      );
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    name: 'query_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON tasks(user_id, deleted_at, archived);
      CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(user_id, due_date, status);
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id, deleted_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id, deleted_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(user_id, updated_at);
      CREATE INDEX IF NOT EXISTS idx_sync_ready ON sync_queue(next_attempt_at, attempts);
      CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(remind_at);
    `,
  },
];
