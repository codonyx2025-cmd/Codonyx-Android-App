
-- Fix deals table: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage deals" ON public.deals;
DROP POLICY IF EXISTS "Distributors can view published deals" ON public.deals;

CREATE POLICY "Admins can manage deals"
ON public.deals
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Distributors can view published deals"
ON public.deals
FOR SELECT
TO authenticated
USING ((deal_status = 'published'::text) AND is_user_approved(auth.uid()));

-- Fix deal_bids table: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage bids" ON public.deal_bids;
DROP POLICY IF EXISTS "Distributors can insert own bids" ON public.deal_bids;
DROP POLICY IF EXISTS "Distributors can update own bids" ON public.deal_bids;
DROP POLICY IF EXISTS "Distributors can view own bids" ON public.deal_bids;

CREATE POLICY "Admins can manage bids"
ON public.deal_bids
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Distributors can insert own bids"
ON public.deal_bids
FOR INSERT
TO authenticated
WITH CHECK (is_user_approved(auth.uid()) AND (distributor_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.user_type = 'distributor'::user_type)));

CREATE POLICY "Distributors can update own bids"
ON public.deal_bids
FOR UPDATE
TO authenticated
USING (distributor_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Distributors can view own bids"
ON public.deal_bids
FOR SELECT
TO authenticated
USING (distributor_profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));
