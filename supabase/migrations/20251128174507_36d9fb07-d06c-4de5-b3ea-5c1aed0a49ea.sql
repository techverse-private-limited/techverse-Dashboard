-- Add profile_photo column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;