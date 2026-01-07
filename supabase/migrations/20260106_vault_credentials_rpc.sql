-- ============================================================================
-- VAULT CREDENTIALS RPC FUNCTIONS
-- ============================================================================
-- 
-- Funções para gerenciar credenciais OAuth no Supabase Vault de forma segura.
-- 
-- Naming Convention: gateway_{integration_type}_{vendor_id}
-- Exemplo: gateway_mercadopago_abc-123-def
-- 
-- ============================================================================

-- ========================================================================
-- FUNÇÃO: save_gateway_credentials
-- ========================================================================
-- Salva ou atualiza credenciais OAuth no Vault
--
-- Parâmetros:
--   p_vendor_id: UUID do vendedor
--   p_gateway: Tipo de gateway (mercadopago, stripe, etc.)
--   p_credentials: JSONB com as credenciais (access_token, refresh_token, etc.)
--
-- Retorna:
--   JSONB com { success: boolean, secret_name: string }
-- ========================================================================

CREATE OR REPLACE FUNCTION save_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT,
  p_credentials JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_result JSONB;
BEGIN
  -- Construir nome do secret
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Log da operação
  RAISE NOTICE '[save_gateway_credentials] Salvando credenciais: %', v_secret_name;
  
  -- Inserir ou atualizar no Vault
  -- O Vault usa a tabela vault.secrets
  INSERT INTO vault.secrets (name, secret)
  VALUES (v_secret_name, p_credentials::text)
  ON CONFLICT (name) 
  DO UPDATE SET 
    secret = p_credentials::text,
    updated_at = NOW();
  
  -- Retornar sucesso
  v_result := jsonb_build_object(
    'success', true,
    'secret_name', v_secret_name
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[save_gateway_credentials] Erro: % %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ========================================================================
-- FUNÇÃO: get_gateway_credentials
-- ========================================================================
-- Busca credenciais OAuth do Vault
--
-- Parâmetros:
--   p_vendor_id: UUID do vendedor
--   p_gateway: Tipo de gateway (mercadopago, stripe, etc.)
--
-- Retorna:
--   JSONB com { success: boolean, credentials?: object, error?: string }
-- ========================================================================

CREATE OR REPLACE FUNCTION get_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_secret TEXT;
  v_credentials JSONB;
BEGIN
  -- Construir nome do secret
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Log da operação
  RAISE NOTICE '[get_gateway_credentials] Buscando credenciais: %', v_secret_name;
  
  -- Buscar secret descriptografado do Vault
  -- O Vault expõe uma view vault.decrypted_secrets
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = v_secret_name;
  
  -- Verificar se encontrou
  IF v_secret IS NULL THEN
    RAISE NOTICE '[get_gateway_credentials] Credenciais não encontradas: %', v_secret_name;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credentials not found in Vault'
    );
  END IF;
  
  -- Converter secret (TEXT) para JSONB
  BEGIN
    v_credentials := v_secret::JSONB;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[get_gateway_credentials] Erro ao parsear JSON: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid JSON in Vault secret'
      );
  END;
  
  -- Retornar credenciais
  RETURN jsonb_build_object(
    'success', true,
    'credentials', v_credentials
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[get_gateway_credentials] Erro: % %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ========================================================================
-- FUNÇÃO: delete_gateway_credentials
-- ========================================================================
-- Remove credenciais OAuth do Vault
--
-- Parâmetros:
--   p_vendor_id: UUID do vendedor
--   p_gateway: Tipo de gateway (mercadopago, stripe, etc.)
--
-- Retorna:
--   JSONB com { success: boolean, error?: string }
-- ========================================================================

CREATE OR REPLACE FUNCTION delete_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_deleted_count INTEGER;
BEGIN
  -- Construir nome do secret
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Log da operação
  RAISE NOTICE '[delete_gateway_credentials] Removendo credenciais: %', v_secret_name;
  
  -- Deletar do Vault
  DELETE FROM vault.secrets
  WHERE name = v_secret_name;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    RAISE NOTICE '[delete_gateway_credentials] Nenhuma credencial encontrada para deletar';
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credentials not found'
    );
  END IF;
  
  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[delete_gateway_credentials] Erro: % %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ========================================================================
-- COMENTÁRIOS E PERMISSÕES
-- ========================================================================

COMMENT ON FUNCTION save_gateway_credentials IS 'Salva credenciais OAuth no Supabase Vault de forma segura';
COMMENT ON FUNCTION get_gateway_credentials IS 'Busca credenciais OAuth do Supabase Vault';
COMMENT ON FUNCTION delete_gateway_credentials IS 'Remove credenciais OAuth do Supabase Vault';

-- Garantir que as funções podem ser chamadas por service_role
GRANT EXECUTE ON FUNCTION save_gateway_credentials TO service_role;
GRANT EXECUTE ON FUNCTION get_gateway_credentials TO service_role;
GRANT EXECUTE ON FUNCTION delete_gateway_credentials TO service_role;
