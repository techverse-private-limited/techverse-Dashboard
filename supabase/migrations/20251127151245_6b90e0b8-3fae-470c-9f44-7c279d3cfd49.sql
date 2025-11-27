-- Enable REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.github_links REPLICA IDENTITY FULL;
ALTER TABLE public.supabase_accounts REPLICA IDENTITY FULL;
ALTER TABLE public.project_credentials REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication (only those not already added)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'github_links') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.github_links;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_credentials') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_credentials;
  END IF;
END $$;