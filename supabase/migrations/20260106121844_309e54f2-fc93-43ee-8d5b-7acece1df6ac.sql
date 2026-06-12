-- Add new profile fields for advisors
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS expertise text,
ADD COLUMN IF NOT EXISTS mentoring_areas text,
ADD COLUMN IF NOT EXISTS languages text,
ADD COLUMN IF NOT EXISTS industry_expertise text,
-- Laboratory/Company specific fields
ADD COLUMN IF NOT EXISTS company_type text,
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS founded_year integer,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS services text,
ADD COLUMN IF NOT EXISTS research_areas text;

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatar bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);