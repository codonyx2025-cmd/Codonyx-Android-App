
-- Drop the overly permissive policy and replace with authenticated-only
DROP POLICY IF EXISTS "Anyone can upload verification documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload verification documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification-documents');
