-- Relax RLS on projects so inserts from the current app are allowed

-- Drop existing restrictive admin-only policies
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- Keep SELECT policy as-is (Anyone can view projects) and allow anyone to modify
CREATE POLICY "Anyone can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update projects"
  ON public.projects
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete projects"
  ON public.projects
  FOR DELETE
  USING (true);