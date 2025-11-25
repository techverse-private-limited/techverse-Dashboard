-- Drop the incorrect foreign key constraint that references auth.users
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Optionally add a new foreign key that references the custom users table
-- (Uncomment if you want to enforce referential integrity with the users table)
-- ALTER TABLE public.messages
-- ADD CONSTRAINT messages_sender_id_fkey 
-- FOREIGN KEY (sender_id) 
-- REFERENCES public.users(id) 
-- ON DELETE CASCADE;