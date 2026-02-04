-- RISE V3: Add idempotency_key column to orders table
-- This enables proper per-attempt deduplication instead of email-based heuristic

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS idempotency_key uuid;

-- Unique partial index: only enforce uniqueness when key is present
-- This allows legacy orders (null) while preventing duplicate attempts
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uq
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.orders.idempotency_key IS
  'Idempotency key generated per checkout submission attempt. Prevents accidental duplicate order creation; must NOT dedupe by email.';