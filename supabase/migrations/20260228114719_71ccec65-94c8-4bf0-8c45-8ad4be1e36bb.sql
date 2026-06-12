
-- Add distributor-specific columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS distribution_capacity text,
  ADD COLUMN IF NOT EXISTS years_of_experience integer;

-- Create deals table (admin-managed)
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_amount numeric(15,2) NOT NULL DEFAULT 0,
  raised_amount numeric(15,2) NOT NULL DEFAULT 0,
  deal_status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deals" ON public.deals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Distributors can view published deals" ON public.deals
  FOR SELECT USING (
    deal_status = 'published' AND is_user_approved(auth.uid())
  );

-- Create deal_bids table
CREATE TABLE public.deal_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  distributor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bid_amount numeric(15,2) NOT NULL,
  bid_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bids" ON public.deal_bids
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Distributors can view own bids" ON public.deal_bids
  FOR SELECT USING (
    distributor_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Distributors can insert own bids" ON public.deal_bids
  FOR INSERT WITH CHECK (
    is_user_approved(auth.uid()) AND
    distributor_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() AND user_type = 'distributor'
    )
  );

CREATE POLICY "Distributors can update own bids" ON public.deal_bids
  FOR UPDATE USING (
    distributor_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create opportunity_submissions table
CREATE TABLE public.opportunity_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  estimated_value numeric(15,2),
  submission_status text NOT NULL DEFAULT 'pending',
  deal_id uuid REFERENCES public.deals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage submissions" ON public.opportunity_submissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own submissions" ON public.opportunity_submissions
  FOR SELECT USING (
    submitted_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert submissions" ON public.opportunity_submissions
  FOR INSERT WITH CHECK (
    is_user_approved(auth.uid()) AND
    submitted_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_bids_updated_at BEFORE UPDATE ON public.deal_bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_submissions_updated_at BEFORE UPDATE ON public.opportunity_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
