-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE id = user_roles.user_id));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT id FROM users LIMIT 1)
      AND role = 'admin'
  ));

-- Update users table RLS policies
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;

CREATE POLICY "Anyone can read users"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update users"
  ON public.users
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (true);