CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sync_records (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity TEXT NOT NULL CHECK(entity IN ('task','project','category')),
  id UUID NOT NULL, payload JSONB NOT NULL, version INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL, deleted_at TIMESTAMPTZ,
  PRIMARY KEY(user_id,entity,id)
);
CREATE INDEX IF NOT EXISTS idx_sync_records_cursor ON sync_records(user_id,updated_at,id);
CREATE TABLE IF NOT EXISTS processed_operations (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response JSONB NOT NULL, processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
