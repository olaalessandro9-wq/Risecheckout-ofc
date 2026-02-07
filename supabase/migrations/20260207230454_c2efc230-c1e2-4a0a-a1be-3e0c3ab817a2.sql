
-- ============================================================================
-- ULTRA TRACKING: Add Facebook identity columns to orders table
-- ============================================================================
-- These columns store browser-side identity data captured at checkout time,
-- enabling the Facebook CAPI dispatcher to send high-quality user data
-- for maximum Event Match Quality (EMQ 8.0+).
-- ============================================================================

-- Facebook Browser ID (set by fbevents.js cookie _fbp)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fbp TEXT;

-- Facebook Click ID (set by fbclid URL param → _fbc cookie)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fbc TEXT;

-- Client User-Agent string (captured from browser at checkout)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_user_agent TEXT;

-- Full URL of the checkout page where the order was created
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS event_source_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.fbp IS 'Facebook Browser ID (_fbp cookie) - captured at checkout for CAPI EMQ';
COMMENT ON COLUMN public.orders.fbc IS 'Facebook Click ID (_fbc cookie from fbclid) - captured at checkout for CAPI EMQ';
COMMENT ON COLUMN public.orders.customer_user_agent IS 'Client browser User-Agent string - captured at checkout for CAPI EMQ';
COMMENT ON COLUMN public.orders.event_source_url IS 'Full checkout page URL where order was created - for CAPI event_source_url';
