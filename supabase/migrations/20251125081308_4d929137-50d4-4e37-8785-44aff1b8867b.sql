-- Update github_links table to make user_id nullable
ALTER TABLE public.github_links ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own github links" ON public.github_links;
DROP POLICY IF EXISTS "Users can create their own github links" ON public.github_links;
DROP POLICY IF EXISTS "Users can update their own github links" ON public.github_links;
DROP POLICY IF EXISTS "Users can delete their own github links" ON public.github_links;

-- Create simpler RLS policies allowing anyone to manage links
CREATE POLICY "Anyone can view github links"
  ON public.github_links
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create github links"
  ON public.github_links
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update github links"
  ON public.github_links
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete github links"
  ON public.github_links
  FOR DELETE
  USING (true);