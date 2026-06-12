
CREATE OR REPLACE FUNCTION public.validate_invite_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate if an invite_token_id is provided
  IF NEW.invite_token_id IS NULL THEN
    RETURN NEW;
  END IF;

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
