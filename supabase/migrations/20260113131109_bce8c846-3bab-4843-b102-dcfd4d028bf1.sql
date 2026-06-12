-- Create connection status enum
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create connections table for the connection request system
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate connection requests
  UNIQUE(sender_id, receiver_id),
  
  -- Prevent self-connections
  CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Approved users can view their own connections (sent or received)
CREATE POLICY "Users can view own connections"
ON public.connections
FOR SELECT
USING (
  (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = sender_id))
  OR (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = receiver_id))
);

-- Approved users can send connection requests
CREATE POLICY "Approved users can send connection requests"
ON public.connections
FOR INSERT
WITH CHECK (
  is_user_approved(auth.uid())
  AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = sender_id)
);

-- Users can update connections they received (accept/reject)
CREATE POLICY "Users can update received connections"
ON public.connections
FOR UPDATE
USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = receiver_id)
);

-- Users can delete connections they sent or received
CREATE POLICY "Users can delete own connections"
ON public.connections
FOR DELETE
USING (
  (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = sender_id))
  OR (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = receiver_id))
);

-- Create trigger for updated_at
CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_connections_sender ON public.connections(sender_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);