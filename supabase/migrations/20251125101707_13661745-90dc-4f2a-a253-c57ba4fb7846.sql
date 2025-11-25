-- Drop existing restrictive policies on projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies that allow admins to manage all projects
CREATE POLICY "Admins can view all projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id IN (SELECT id FROM users)
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can create projects"
ON projects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id IN (SELECT id FROM users)
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update projects"
ON projects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id IN (SELECT id FROM users)
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete projects"
ON projects FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id IN (SELECT id FROM users)
    AND user_roles.role = 'admin'
  )
);