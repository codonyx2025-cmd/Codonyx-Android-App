
CREATE TABLE public.password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_password_reset_otps_email ON public.password_reset_otps (email, used, expires_at);

-- RLS: only edge functions (service role) access this table
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no client access (only service role can read/write)
