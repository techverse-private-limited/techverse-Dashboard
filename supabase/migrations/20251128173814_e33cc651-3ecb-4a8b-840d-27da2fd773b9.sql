-- Drop the existing foreign key constraint that references auth.users
ALTER TABLE public.message_reads 
DROP CONSTRAINT IF EXISTS message_reads_user_id_fkey;

-- Add a new foreign key constraint that references the public.users table
ALTER TABLE public.message_reads
ADD CONSTRAINT message_reads_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;