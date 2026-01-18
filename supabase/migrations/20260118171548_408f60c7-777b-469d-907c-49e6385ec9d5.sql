-- Migration: Deprecate affiliates.gateway_credentials
-- RISE V3 Solution D: Single Source of Truth for Credentials
-- Credentials now live in profiles table (asaas_wallet_id, mercadopago_collector_id, stripe_account_id)

-- 1. Create audit view to check for any existing data before removal
CREATE OR REPLACE VIEW _audit_affiliates_with_gateway_credentials AS
SELECT 
  a.id as affiliate_id,
  a.user_id,
  a.gateway_credentials,
  p.asaas_wallet_id as profile_asaas,
  p.mercadopago_collector_id as profile_mp,
  p.stripe_account_id as profile_stripe
FROM affiliates a
JOIN profiles p ON p.id = a.user_id
WHERE a.gateway_credentials IS NOT NULL 
  AND a.gateway_credentials != '{}'::jsonb;

-- 2. Add DEPRECATED comment to column (column will be removed in future migration)
COMMENT ON COLUMN affiliates.gateway_credentials IS 
  'DEPRECATED: Use profiles.asaas_wallet_id, profiles.mercadopago_collector_id, profiles.stripe_account_id instead. 
   Afiliados agora herdam credenciais do próprio profile. 
   Esta coluna será removida em versão futura após validação.
   @deprecated v2.0.0 - RISE V3 Solution D';