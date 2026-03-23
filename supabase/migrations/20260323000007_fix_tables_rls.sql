-- Fix: allow authenticated staff to insert new tables
DO $$ BEGIN
  CREATE POLICY "staff insert tables" ON tables FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
