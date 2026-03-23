-- Add item badge/tag columns to menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_spicy       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vegetarian  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recommended boolean NOT NULL DEFAULT false;
