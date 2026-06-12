
-- Add 'distributor' to user_type enum (must be in its own transaction)
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'distributor';
