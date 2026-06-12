DROP POLICY IF EXISTS "Admins can manage keyword suggestions" ON public.keyword_suggestions;

CREATE POLICY "Admins can insert keyword suggestions"
ON public.keyword_suggestions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update keyword suggestions"
ON public.keyword_suggestions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete keyword suggestions"
ON public.keyword_suggestions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));