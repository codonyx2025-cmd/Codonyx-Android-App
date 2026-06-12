
ALTER TABLE public.deals
  ADD CONSTRAINT deals_target_amount_positive CHECK (target_amount > 0),
  ADD CONSTRAINT deals_raised_amount_non_negative CHECK (raised_amount >= 0);

ALTER TABLE public.deal_bids
  ADD CONSTRAINT bids_amount_positive CHECK (bid_amount > 0);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_founded_year_realistic
    CHECK (founded_year IS NULL OR (founded_year BETWEEN 1800 AND 2100)),
  ADD CONSTRAINT profiles_experience_realistic
    CHECK (years_of_experience IS NULL OR (years_of_experience BETWEEN 0 AND 100));
