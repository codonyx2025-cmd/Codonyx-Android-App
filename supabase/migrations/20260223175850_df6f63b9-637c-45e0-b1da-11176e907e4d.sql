
-- Function to check if email exists in profiles (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = lower(check_email));
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;

-- Add withdrawn_at column for tracking connection withdrawal cooldown
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS withdrawn_at timestamp with time zone DEFAULT NULL;
