-- =====================================================
-- FIX VAULT RPC PERMISSIONS
-- Corrige as funções para usar a API oficial do Vault
-- =====================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.save_gateway_credentials(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_gateway_credentials(UUID, TEXT);

-- =====================================================
-- SAVE GATEWAY CREDENTIALS
-- Usa vault.create_secret() ao invés de INSERT direto
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT,
  p_credentials JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_secret_id UUID;
  v_existing_id UUID;
BEGIN
  -- Padronizar nome do secret
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Verificar se já existe e deletar
  SELECT id INTO v_existing_id 
  FROM vault.secrets 
  WHERE name = v_secret_name;
  
  IF v_existing_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_id;
  END IF;
  
  -- Usar vault.create_secret() - a API oficial
  SELECT vault.create_secret(
    p_credentials::text,
    v_secret_name,
    'Credenciais ' || upper(p_gateway) || ' para vendor ' || p_vendor_id::text
  ) INTO v_secret_id;
  
  -- Verificar se foi criado
  IF v_secret_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create secret - vault.create_secret returned null'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'secret_name', v_secret_name,
    'secret_id', v_secret_id::text
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- =====================================================
-- GET GATEWAY CREDENTIALS
-- Usa vault.decrypted_secrets view para leitura
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_decrypted TEXT;
BEGIN
  -- Padronizar nome do secret
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Buscar secret descriptografado
  SELECT decrypted_secret INTO v_decrypted
  FROM vault.decrypted_secrets
  WHERE name = v_secret_name;
  
  -- Verificar se encontrou
  IF v_decrypted IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credentials not found',
      'secret_name', v_secret_name
    );
  END IF;
  
  -- Retornar credenciais como JSONB
  RETURN jsonb_build_object(
    'success', true,
    'credentials', v_decrypted::jsonb,
    'secret_name', v_secret_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.save_gateway_credentials(UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_gateway_credentials(UUID, TEXT) TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.save_gateway_credentials IS 
'Salva credenciais de gateway no Vault usando convenção gateway_{type}_{vendor_id}. 
Usa vault.create_secret() para criptografia adequada.';

COMMENT ON FUNCTION public.get_gateway_credentials IS 
'Recupera credenciais de gateway do Vault usando convenção gateway_{type}_{vendor_id}. 
Usa vault.decrypted_secrets para descriptografia.';
