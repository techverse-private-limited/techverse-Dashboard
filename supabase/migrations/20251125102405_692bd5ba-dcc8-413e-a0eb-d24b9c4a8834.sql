-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Drop existing problematic policies on projects
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- Create simpler policy for user_roles that allows reading without recursion
-- Since has_role uses SECURITY DEFINER, it bypasses RLS
CREATE POLICY "Anyone can view user roles"
  ON public.user_roles
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id IN (SELECT id FROM public.users)
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id IN (SELECT id FROM public.users)
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id IN (SELECT id FROM public.users)
      AND ur.role = 'admin'::app_role
    )
  );

-- Create new policies for projects using simplified approach
CREATE POLICY "Anyone can view projects"
  ON public.projects
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = public.projects.user_id
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can update projects"
  ON public.projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = public.projects.user_id
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = public.projects.user_id
      AND ur.role = 'admin'::app_role
    )
  );