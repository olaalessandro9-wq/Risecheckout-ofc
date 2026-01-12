-- ============================================================================
-- CORREÇÃO: Recriar VIEW profiles_secure com SECURITY INVOKER
-- Isso garante que a VIEW use as permissões do usuário que faz a query,
-- não do criador da VIEW (comportamento mais seguro para RLS)
-- ============================================================================

-- Remover VIEW anterior
DROP VIEW IF EXISTS public.profiles_secure;

-- Recriar VIEW com SECURITY INVOKER explícito
CREATE VIEW public.profiles_secure 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  phone,
  email,
  cpf_cnpj,
  test_mode_enabled,
  test_public_key,
  mercadopago_collector_id,
  mercadopago_email,
  mercadopago_connected_at,
  stripe_account_id,
  stripe_connected_at,
  status,
  custom_fee_percent,
  status_reason,
  status_changed_at,
  status_changed_by,
  asaas_wallet_id,
  last_login_at,
  is_active,
  registration_source,
  created_at,
  updated_at
FROM public.profiles;

-- Comentário explicativo
COMMENT ON VIEW public.profiles_secure IS 
'VIEW segura de profiles (SECURITY INVOKER) que exclui campos sensíveis: password_hash, reset_token, test_access_token. Use esta VIEW para leituras no frontend. O backend usa a tabela profiles diretamente com service_role.';