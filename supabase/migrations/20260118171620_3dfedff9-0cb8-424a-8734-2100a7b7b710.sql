-- Fix: Add SECURITY INVOKER to audit view
DROP VIEW IF EXISTS _audit_affiliates_with_gateway_credentials;

CREATE VIEW _audit_affiliates_with_gateway_credentials 
WITH (security_invoker = true) AS
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