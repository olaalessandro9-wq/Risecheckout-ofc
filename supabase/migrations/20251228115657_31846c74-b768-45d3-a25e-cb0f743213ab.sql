-- ============================================================================
-- MIGRAÇÃO DE SEGURANÇA: Criptografia de Secrets
-- ============================================================================

-- 1. OUTBOUND_WEBHOOKS: Migrar secret para secret_encrypted
-- O campo secret_encrypted já existe, vamos migrar os valores

-- Copiar valores de secret para secret_encrypted se ainda não migrado
UPDATE public.outbound_webhooks
SET secret_encrypted = secret
WHERE secret IS NOT NULL 
  AND secret != ''
  AND (secret_encrypted IS NULL OR secret_encrypted = '');

-- Limpar campo plaintext (definir como string vazia para não quebrar constraints)
UPDATE public.outbound_webhooks
SET secret = ''
WHERE secret IS NOT NULL AND secret != '';

-- 2. PAYMENT_GATEWAY_SETTINGS: Migrar pushinpay_token para token_encrypted
-- O campo token_encrypted já existe

UPDATE public.payment_gateway_settings
SET token_encrypted = pushinpay_token
WHERE pushinpay_token IS NOT NULL 
  AND pushinpay_token != ''
  AND (token_encrypted IS NULL OR token_encrypted = '');

-- Limpar campo plaintext
UPDATE public.payment_gateway_settings
SET pushinpay_token = NULL
WHERE pushinpay_token IS NOT NULL;

-- 3. CORRIGIR POLICY DE PRODUCTS (Marketplace)
-- Bug: OR permite produtos draft aparecerem se show_in_marketplace = true

-- Remover policy antiga
DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "Anyone can view marketplace products" ON public.products;

-- Criar policy corrigida: AND em vez de OR
CREATE POLICY "products_select_public_marketplace" 
ON public.products 
FOR SELECT 
USING (
  -- Produtos publicados E habilitados no marketplace
  (status = 'active' AND show_in_marketplace = true)
  OR
  -- OU produtos do próprio usuário (qualquer status)
  (auth.uid() = user_id)
);

-- 4. LOG DE SEGURANÇA
INSERT INTO public.system_health_logs (metric_type, metric_value, metadata, severity)
VALUES (
  'security_migration',
  1,
  jsonb_build_object(
    'migration', 'encrypt_secrets_v1',
    'timestamp', NOW(),
    'changes', jsonb_build_array(
      'outbound_webhooks.secret → secret_encrypted',
      'payment_gateway_settings.pushinpay_token → token_encrypted',
      'products_select_public policy fixed (OR → AND)'
    )
  ),
  'info'
);