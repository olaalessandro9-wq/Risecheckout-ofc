-- ============================================================================
-- RISE V3 FASE 2: MIGRAÇÃO DE FOREIGN KEYS PARA USERS (SSOT)
-- ============================================================================
-- Este script migra todas as FKs que apontavam para buyer_profiles
-- para apontar para a tabela users (Single Source of Truth)
-- ============================================================================

-- ============================================================================
-- 1. ORDERS.BUYER_ID → USERS(ID)
-- ============================================================================
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.users(id) 
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT orders_buyer_id_fkey ON public.orders IS 
  'RISE V3: FK migrada de buyer_profiles para users (SSOT)';

-- ============================================================================
-- 2. BUYER_AUDIT_LOG.BUYER_ID → USERS(ID)
-- ============================================================================
ALTER TABLE public.buyer_audit_log 
  DROP CONSTRAINT IF EXISTS buyer_audit_log_buyer_id_fkey;

ALTER TABLE public.buyer_audit_log
  ADD CONSTRAINT buyer_audit_log_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.users(id) 
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT buyer_audit_log_buyer_id_fkey ON public.buyer_audit_log IS 
  'RISE V3: FK migrada de buyer_profiles para users (SSOT)';

-- ============================================================================
-- 3. BUYER_CONTENT_ACCESS.BUYER_ID → USERS(ID)
-- ============================================================================
ALTER TABLE public.buyer_content_access 
  DROP CONSTRAINT IF EXISTS buyer_content_access_buyer_id_fkey;

ALTER TABLE public.buyer_content_access
  ADD CONSTRAINT buyer_content_access_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT buyer_content_access_buyer_id_fkey ON public.buyer_content_access IS 
  'RISE V3: FK migrada de buyer_profiles para users (SSOT)';

-- ============================================================================
-- 4. BUYER_SAVED_CARDS.BUYER_ID → USERS(ID)
-- ============================================================================
ALTER TABLE public.buyer_saved_cards 
  DROP CONSTRAINT IF EXISTS buyer_saved_cards_buyer_id_fkey;

ALTER TABLE public.buyer_saved_cards
  ADD CONSTRAINT buyer_saved_cards_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT buyer_saved_cards_buyer_id_fkey ON public.buyer_saved_cards IS 
  'RISE V3: FK migrada de buyer_profiles para users (SSOT)';

-- ============================================================================
-- 5. BUYER_QUIZ_ATTEMPTS.BUYER_ID → USERS(ID)
-- ============================================================================
ALTER TABLE public.buyer_quiz_attempts 
  DROP CONSTRAINT IF EXISTS buyer_quiz_attempts_buyer_id_fkey;

ALTER TABLE public.buyer_quiz_attempts
  ADD CONSTRAINT buyer_quiz_attempts_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT buyer_quiz_attempts_buyer_id_fkey ON public.buyer_quiz_attempts IS 
  'RISE V3: FK migrada de buyer_profiles para users (SSOT)';

-- ============================================================================
-- 6. CERTIFICATES.BUYER_ID → USERS(ID)
-- ============================================================================
ALTER TABLE public.certificates 
  DROP CONSTRAINT IF EXISTS certificates_buyer_id_fkey;

ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT certificates_buyer_id_fkey ON public.certificates IS 
  'RISE V3: FK migrada de buyer_profiles para users (SSOT)';