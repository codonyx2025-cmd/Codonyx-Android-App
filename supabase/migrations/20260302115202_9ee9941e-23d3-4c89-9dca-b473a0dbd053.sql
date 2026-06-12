
-- Add document_url column to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS document_url text;

-- Add verification_document_url column to profiles table  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_document_url text;

-- Create storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public) VALUES ('deal-documents', 'deal-documents', true) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', true) ON CONFLICT (id) DO NOTHING;

-- RLS for deal-documents bucket
CREATE POLICY "Admins can upload deal documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deal-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone authenticated can view deal documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deal-documents');
CREATE POLICY "Admins can delete deal documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deal-documents' AND public.has_role(auth.uid(), 'admin'));

-- RLS for verification-documents bucket
CREATE POLICY "Anyone can upload verification documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verification-documents');
CREATE POLICY "Admins can view verification documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own verification documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow distributors to see closed deals they have bids on
CREATE POLICY "Distributors can view deals they bid on" ON public.deals FOR SELECT TO authenticated USING (
  id IN (
    SELECT deal_id FROM public.deal_bids 
    WHERE distributor_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
