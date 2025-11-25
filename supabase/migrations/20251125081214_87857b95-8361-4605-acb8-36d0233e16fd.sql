-- Create github_links table
CREATE TABLE public.github_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.github_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for github_links
CREATE POLICY "Users can view their own github links"
  ON public.github_links
  FOR SELECT
  USING (user_id::text IN (SELECT id::text FROM users));

CREATE POLICY "Users can create their own github links"
  ON public.github_links
  FOR INSERT
  WITH CHECK (user_id::text IN (SELECT id::text FROM users));

CREATE POLICY "Users can update their own github links"
  ON public.github_links
  FOR UPDATE
  USING (user_id::text IN (SELECT id::text FROM users));

CREATE POLICY "Users can delete their own github links"
  ON public.github_links
  FOR DELETE
  USING (user_id::text IN (SELECT id::text FROM users));

-- Delete duplicate "kr" groups, keeping only the first one
DELETE FROM public.groups 
WHERE name = 'kr' 
AND id NOT IN (
  SELECT id 
  FROM public.groups 
  WHERE name = 'kr' 
  ORDER BY created_at ASC 
  LIMIT 1
);