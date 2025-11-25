-- Remove foreign key constraints that reference non-existent users
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Make created_by nullable since we're using custom auth
ALTER TABLE groups ALTER COLUMN created_by DROP NOT NULL;