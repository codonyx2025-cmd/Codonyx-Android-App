
-- Fix: Replace overly permissive "Anyone can validate tokens" policy
-- with admin-only full access and a restricted public lookup policy

DROP POLICY IF EXISTS "Anyone can validate tokens" ON public.invite_tokens;

-- Admins already have ALL access via existing policy, so we just need
-- a restricted SELECT for registration token validation (by exact token match)
-- Using a security definer function to safely validate tokens without exposing all data

CREATE OR REPLACE FUNCTION public.validate_invite_token_lookup(_token text)
RETURNS TABLE(id uuid, is_active boolean, expires_at timestamptz, used_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, is_active, expires_at, used_at
  FROM public.invite_tokens
  WHERE token = _token
  LIMIT 1;
$$;
