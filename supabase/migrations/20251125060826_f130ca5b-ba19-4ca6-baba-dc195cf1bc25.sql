-- Insert admin user
INSERT INTO public.users (username, password, name, designation)
VALUES ('admin@techverse.com', '123456', 'Admin', 'admin')
ON CONFLICT DO NOTHING;