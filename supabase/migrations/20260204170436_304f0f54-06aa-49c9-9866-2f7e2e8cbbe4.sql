-- RISE V3: Add UTM tracking columns to orders table
-- These columns are read by utmify-dispatcher.ts and order-handler.ts

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS src TEXT,
ADD COLUMN IF NOT EXISTS sck TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.utm_source IS 'UTM source for tracking (e.g., google, facebook)';
COMMENT ON COLUMN public.orders.utm_medium IS 'UTM medium for tracking (e.g., cpc, email)';
COMMENT ON COLUMN public.orders.utm_campaign IS 'UTM campaign name for tracking';
COMMENT ON COLUMN public.orders.utm_content IS 'UTM content for tracking (ad variation)';
COMMENT ON COLUMN public.orders.utm_term IS 'UTM term for tracking (keywords)';
COMMENT ON COLUMN public.orders.src IS 'Source tracking parameter';
COMMENT ON COLUMN public.orders.sck IS 'Session cookie tracking parameter';