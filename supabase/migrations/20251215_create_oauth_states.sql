-- ============================================================================
-- Migration: Create oauth_states table
-- Description: Table for storing OAuth nonce/state for MercadoPago flow
-- Author: Manus AI
-- Date: 2025-12-15
-- ============================================================================

-- Create the oauth_states table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state TEXT PRIMARY KEY,
  vendor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes'),
  used_at TIMESTAMPTZ NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_vendor ON public.oauth_states (vendor_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states (expires_at);

-- Add comment to the table
COMMENT ON TABLE public.oauth_states IS 'Table for storing OAuth nonce/state for MercadoPago flow. States expire after 10 minutes and can only be used once.';

-- Enable Row Level Security
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for Edge Functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'oauth_states' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON public.oauth_states
      FOR ALL
      USING (true);
  END IF;
END $$;

-- Policy: Users can insert their own oauth_states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'oauth_states' AND policyname = 'Users can insert own oauth_states'
  ) THEN
    CREATE POLICY "Users can insert own oauth_states" ON public.oauth_states
      FOR INSERT
      WITH CHECK (vendor_id = auth.uid());
  END IF;
END $$;
