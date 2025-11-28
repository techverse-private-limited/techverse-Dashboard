-- Create a dedicated bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow anyone to upload profile photos
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Allow anyone to update their profile photos
CREATE POLICY "Anyone can update profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos');

-- Allow anyone to delete profile photos
CREATE POLICY "Anyone can delete profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos');