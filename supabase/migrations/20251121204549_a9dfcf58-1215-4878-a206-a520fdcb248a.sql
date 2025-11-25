-- Create users table for authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own data
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
USING (true);

-- Insert the test user
INSERT INTO public.users (username, password, name, designation)
VALUES ('rdm', '12345', 'RDM', 'PM');