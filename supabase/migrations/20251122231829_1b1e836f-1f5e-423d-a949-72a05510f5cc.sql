-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.supabase_accounts;
DROP POLICY IF EXISTS "Users can create their own accounts" ON public.supabase_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.supabase_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.supabase_accounts;

-- Disable RLS since we're using custom authentication
ALTER TABLE public.supabase_accounts DISABLE ROW LEVEL SECURITY;