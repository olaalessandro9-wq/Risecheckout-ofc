-- =====================================================
-- STRIPE CONNECT INTEGRATION - DATABASE SETUP
-- =====================================================

-- 1. Adicionar 'stripe' aos ENUMs de gateway (se não existirem)
DO $$ 
BEGIN
  -- Adicionar 'stripe' ao pix_gateway_type
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'stripe' 
    AND enumtypid = 'pix_gateway_type'::regtype
  ) THEN
    ALTER TYPE pix_gateway_type ADD VALUE 'stripe';
  END IF;
END $$;

-- 2. Adicionar coluna stripe_public_key na tabela checkouts (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checkouts' AND column_name = 'stripe_public_key'
  ) THEN
    ALTER TABLE public.checkouts ADD COLUMN stripe_public_key TEXT;
  END IF;
END $$;

-- 3. Criar índice para busca de integração Stripe
CREATE INDEX IF NOT EXISTS idx_vendor_integrations_stripe 
ON public.vendor_integrations (vendor_id, integration_type) 
WHERE integration_type = 'STRIPE';

-- 4. Garantir que oauth_states tem constraint única
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'oauth_states_state_key'
  ) THEN
    ALTER TABLE public.oauth_states ADD CONSTRAINT oauth_states_state_key UNIQUE (state);
  END IF;
END $$;

-- 5. Atualizar constraint única para vendor_integrations (vendor_id + integration_type)
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vendor_integrations_vendor_id_key'
  ) THEN
    ALTER TABLE public.vendor_integrations DROP CONSTRAINT vendor_integrations_vendor_id_key;
  END IF;
  
  -- Criar nova constraint única
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vendor_integrations_vendor_integration_unique'
  ) THEN
    ALTER TABLE public.vendor_integrations 
    ADD CONSTRAINT vendor_integrations_vendor_integration_unique 
    UNIQUE (vendor_id, integration_type);
  END IF;
END $$;