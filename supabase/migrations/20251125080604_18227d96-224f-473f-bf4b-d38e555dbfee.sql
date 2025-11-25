-- Enable RLS on supabase_accounts table
ALTER TABLE public.supabase_accounts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for supabase_accounts
CREATE POLICY "Users can view their own supabase accounts"
  ON public.supabase_accounts
  FOR SELECT
  USING (user_id::text IN (SELECT id::text FROM users));

CREATE POLICY "Users can create their own supabase accounts"
  ON public.supabase_accounts
  FOR INSERT
  WITH CHECK (user_id::text IN (SELECT id::text FROM users));

CREATE POLICY "Users can update their own supabase accounts"
  ON public.supabase_accounts
  FOR UPDATE
  USING (user_id::text IN (SELECT id::text FROM users));

CREATE POLICY "Users can delete their own supabase accounts"
  ON public.supabase_accounts
  FOR DELETE
  USING (user_id::text IN (SELECT id::text FROM users));