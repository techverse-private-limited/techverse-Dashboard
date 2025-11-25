-- Remove foreign key constraint from group_members table
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;