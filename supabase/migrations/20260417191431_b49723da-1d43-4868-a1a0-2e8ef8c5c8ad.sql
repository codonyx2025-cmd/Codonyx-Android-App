-- Banner images table for admin-managed home hero rotating images
CREATE TABLE public.banner_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) can view active banners
CREATE POLICY "Anyone can view active banners"
ON public.banner_images
FOR SELECT
USING (is_active = true);

-- Admins can do anything
CREATE POLICY "Admins can manage banners"
ON public.banner_images
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_banner_images_updated_at
BEFORE UPDATE ON public.banner_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for banner uploads (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Banner images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));