
-- 1. Create registration_otps table for server-side email verification
CREATE TABLE public.registration_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_otps ENABLE ROW LEVEL SECURITY;

-- 2. Add invite token validation trigger for profile inserts
CREATE OR REPLACE FUNCTION public.validate_invite_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM invite_tokens
    WHERE id = NEW.invite_token_id
    AND is_active = true
    AND expires_at > now()
    AND used_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_invite_before_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_invite_token();

-- 3. Make verification-documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'verification-documents';
