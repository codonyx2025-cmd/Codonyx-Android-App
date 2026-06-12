-- Deactivate old invite tokens that don't match the current year
UPDATE public.invite_tokens SET is_active = false WHERE token != 'codonyx-invite-2026';

-- Reactivate the current year token
UPDATE public.invite_tokens SET is_active = true WHERE token = 'codonyx-invite-2026';