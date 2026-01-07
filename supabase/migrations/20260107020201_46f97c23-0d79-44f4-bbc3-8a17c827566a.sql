-- ============================================================================
-- RPC Functions para Gerenciamento de Credenciais OAuth no Vault
-- ============================================================================

-- Função para salvar credenciais no Vault
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
  v_existing_id UUID;
BEGIN
  -- Construir nome do secret: gateway_{tipo}_{vendor_id}
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Verificar se já existe e deletar (upsert)
  SELECT id INTO v_existing_id 
  FROM vault.secrets 
  WHERE name = v_secret_name;
  
  IF v_existing_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_id;
  END IF;
  
  -- Inserir novo secret
  INSERT INTO vault.secrets (name, secret)
  VALUES (v_secret_name, p_credentials::text);
  
  RETURN jsonb_build_object(
    'success', true, 
    'secret_name', v_secret_name,
    'action', CASE WHEN v_existing_id IS NOT NULL THEN 'updated' ELSE 'created' END
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- Função para buscar credenciais do Vault
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
  v_secret TEXT;
  v_credentials JSONB;
BEGIN
  -- Construir nome do secret
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  -- Buscar do vault.decrypted_secrets (view que descriptografa automaticamente)
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = v_secret_name;
  
  IF v_secret IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Credentials not found for: ' || v_secret_name
    );
  END IF;
  
  -- Parse JSON
  BEGIN
    v_credentials := v_secret::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid JSON in vault secret'
    );
  END;
  
  RETURN jsonb_build_object(
    'success', true, 
    'credentials', v_credentials
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- Função para deletar credenciais do Vault
CREATE OR REPLACE FUNCTION public.delete_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT
) RETURNS JSONB
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
  
  -- Deletar do vault
  DELETE FROM vault.secrets WHERE name = v_secret_name;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Secret not found: ' || v_secret_name
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'deleted', v_secret_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- Comentários para documentação
COMMENT ON FUNCTION public.save_gateway_credentials IS 'Salva credenciais OAuth no Supabase Vault de forma segura';
COMMENT ON FUNCTION public.get_gateway_credentials IS 'Busca credenciais OAuth do Supabase Vault';
COMMENT ON FUNCTION public.delete_gateway_credentials IS 'Remove credenciais OAuth do Supabase Vault';