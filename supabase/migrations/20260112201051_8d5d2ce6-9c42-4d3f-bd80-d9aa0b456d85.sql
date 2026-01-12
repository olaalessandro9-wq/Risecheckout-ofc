-- ============================================================================
-- MIGRATION: Criar VIEW segura para profiles
-- Objetivo: Impedir que campos sensíveis (password_hash, reset_token, 
--           test_access_token) sejam acessíveis pelo frontend
-- ============================================================================

-- Criar VIEW segura que exclui campos sensíveis
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  name,
  phone,
  email,
  cpf_cnpj,
  test_mode_enabled,
  test_public_key,
  -- test_access_token EXCLUÍDO (sensível)
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
  -- password_hash EXCLUÍDO (sensível)
  -- password_hash_version EXCLUÍDO (sensível)
  -- reset_token EXCLUÍDO (sensível)
  -- reset_token_expires_at EXCLUÍDO (sensível)
  last_login_at,
  is_active,
  registration_source,
  created_at,
  updated_at
FROM public.profiles;

-- Comentário explicativo
COMMENT ON VIEW public.profiles_secure IS 
'VIEW segura de profiles que exclui campos sensíveis (password_hash, reset_token, test_access_token). 
Use esta VIEW para leituras no frontend. O backend (Edge Functions) continua usando a tabela profiles diretamente com service_role para operações de autenticação.';

-- ============================================================================
-- Limpar tokens legados de payment_gateway_settings
-- Os tokens já foram migrados para vendor_integrations + Vault
-- ============================================================================

-- Limpar campos legados (tokens já migrados para vendor_integrations)
UPDATE public.payment_gateway_settings
SET 
  token_encrypted = NULL,
  pushinpay_token = NULL
WHERE token_encrypted IS NOT NULL OR pushinpay_token IS NOT NULL;

-- Comentário explicativo
COMMENT ON TABLE public.payment_gateway_settings IS 
'Configurações de gateway de pagamento. IMPORTANTE: Tokens de API foram migrados para vendor_integrations + Supabase Vault. As colunas token_encrypted e pushinpay_token são legadas e devem permanecer NULL. Novas credenciais devem ser armazenadas EXCLUSIVAMENTE no Vault.';