-- Fix: ensure the partial unique index exists (may have been missed in initial schema run)
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_per_table
  ON sessions (table_id)
  WHERE status = 'active';
