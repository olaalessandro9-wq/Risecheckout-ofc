-- ============================================================================
-- MIGRATION: Affiliate Gateway System
-- Adiciona campos para controle de gateways por afiliado
-- ============================================================================

-- 1. Adicionar campo affiliate_gateway_settings em products (controle do Owner)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS affiliate_gateway_settings JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.affiliate_gateway_settings IS 'Configurações de gateways permitidos para afiliados: {pix_allowed: ["asaas","mercadopago"], credit_card_allowed: ["mercadopago","stripe"], require_gateway_connection: true}';

-- 2. Adicionar campos de gateway escolhido em affiliates
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS pix_gateway TEXT,
ADD COLUMN IF NOT EXISTS credit_card_gateway TEXT;

COMMENT ON COLUMN affiliates.pix_gateway IS 'Gateway PIX escolhido pelo afiliado (asaas, mercadopago, pushinpay)';
COMMENT ON COLUMN affiliates.credit_card_gateway IS 'Gateway de cartão escolhido pelo afiliado (mercadopago, stripe)';

-- 3. Adicionar campo para armazenar credenciais/IDs de gateways do afiliado
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS gateway_credentials JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN affiliates.gateway_credentials IS 'Credenciais de gateway do afiliado: {mercadopago_collector_id: "...", stripe_account_id: "..."}';

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliates_pix_gateway ON affiliates(pix_gateway) WHERE pix_gateway IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliates_credit_card_gateway ON affiliates(credit_card_gateway) WHERE credit_card_gateway IS NOT NULL;