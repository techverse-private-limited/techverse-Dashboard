-- Add unique constraint on message_reads for proper upsert behavior
ALTER TABLE public.message_reads 
ADD CONSTRAINT message_reads_message_user_unique UNIQUE (message_id, user_id);