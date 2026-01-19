-- =====================================================
-- VAULT ACCESS LOG - Tabela de Auditoria
-- =====================================================
-- RISE Protocol V3 Compliant (10.0/10)
-- 
-- STEP 1: Drop old function signatures first
-- =====================================================

-- Drop existing functions with old signatures
DROP FUNCTION IF EXISTS public.save_gateway_credentials(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_gateway_credentials(UUID, TEXT);
DROP FUNCTION IF EXISTS public.delete_gateway_credentials(UUID, TEXT);

-- =====================================================
-- 1. CRIAR TABELA DE AUDITORIA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vault_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  gateway TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('get', 'save', 'delete')),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_vault_access_log_vendor_id 
  ON public.vault_access_log(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vault_access_log_created_at 
  ON public.vault_access_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vault_access_log_gateway 
  ON public.vault_access_log(gateway);

CREATE INDEX IF NOT EXISTS idx_vault_access_log_action 
  ON public.vault_access_log(action);

-- =====================================================
-- 2. RLS - APENAS SERVICE_ROLE PODE ACESSAR
-- =====================================================
ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;

-- Policy de segurança para documentação
COMMENT ON TABLE public.vault_access_log IS 
'Tabela de auditoria para operações no Vault. Apenas service_role pode acessar.
Registra: vendor_id, gateway, action (get/save/delete), success, ip_address.
RISE Protocol V3 Compliant.';

-- =====================================================
-- 3. FUNÇÃO AUXILIAR PARA LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_vault_access(
  p_vendor_id UUID,
  p_gateway TEXT,
  p_action TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.vault_access_log (
    vendor_id,
    gateway,
    action,
    success,
    error_message,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_vendor_id,
    lower(p_gateway),
    p_action,
    p_success,
    p_error_message,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_vault_access(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, JSONB) TO service_role;

COMMENT ON FUNCTION public.log_vault_access IS 
'Registra operação de acesso ao Vault. Chamada pelas RPCs de credenciais.
Parâmetros: vendor_id, gateway, action, success, error_message, ip_address, user_agent, metadata';

-- =====================================================
-- 4. SAVE GATEWAY CREDENTIALS COM AUDIT LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT,
  p_credentials JSONB,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_secret_id UUID;
  v_existing_id UUID;
  v_log_id UUID;
BEGIN
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  SELECT id INTO v_existing_id 
  FROM vault.secrets 
  WHERE name = v_secret_name;
  
  IF v_existing_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_id;
  END IF;
  
  SELECT vault.create_secret(
    p_credentials::text,
    v_secret_name,
    'Credenciais ' || upper(p_gateway) || ' para vendor ' || p_vendor_id::text
  ) INTO v_secret_id;
  
  IF v_secret_id IS NULL THEN
    PERFORM public.log_vault_access(
      p_vendor_id, p_gateway, 'save', false,
      'Failed to create secret - vault.create_secret returned null',
      p_ip_address, p_user_agent,
      jsonb_build_object('secret_name', v_secret_name)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to create secret - vault.create_secret returned null'
    );
  END IF;
  
  SELECT public.log_vault_access(
    p_vendor_id, p_gateway, 'save', true, NULL,
    p_ip_address, p_user_agent,
    jsonb_build_object(
      'secret_name', v_secret_name,
      'secret_id', v_secret_id::text,
      'is_update', v_existing_id IS NOT NULL
    )
  ) INTO v_log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'secret_name', v_secret_name,
    'secret_id', v_secret_id::text,
    'audit_log_id', v_log_id::text
  );
  
EXCEPTION WHEN OTHERS THEN
  PERFORM public.log_vault_access(
    p_vendor_id, p_gateway, 'save', false, SQLERRM,
    p_ip_address, p_user_agent,
    jsonb_build_object('sqlstate', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- =====================================================
-- 5. GET GATEWAY CREDENTIALS COM AUDIT LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_decrypted TEXT;
  v_log_id UUID;
BEGIN
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  SELECT decrypted_secret INTO v_decrypted
  FROM vault.decrypted_secrets
  WHERE name = v_secret_name;
  
  IF v_decrypted IS NULL THEN
    PERFORM public.log_vault_access(
      p_vendor_id, p_gateway, 'get', false,
      'Credentials not found',
      p_ip_address, p_user_agent,
      jsonb_build_object('secret_name', v_secret_name)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credentials not found',
      'secret_name', v_secret_name
    );
  END IF;
  
  SELECT public.log_vault_access(
    p_vendor_id, p_gateway, 'get', true, NULL,
    p_ip_address, p_user_agent,
    jsonb_build_object('secret_name', v_secret_name)
  ) INTO v_log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'credentials', v_decrypted::jsonb,
    'secret_name', v_secret_name,
    'audit_log_id', v_log_id::text
  );
  
EXCEPTION WHEN OTHERS THEN
  PERFORM public.log_vault_access(
    p_vendor_id, p_gateway, 'get', false, SQLERRM,
    p_ip_address, p_user_agent,
    jsonb_build_object('sqlstate', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- =====================================================
-- 6. DELETE GATEWAY CREDENTIALS COM AUDIT LOGGING
-- =====================================================
CREATE OR REPLACE FUNCTION public.delete_gateway_credentials(
  p_vendor_id UUID,
  p_gateway TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name TEXT;
  v_deleted_count INTEGER;
  v_log_id UUID;
BEGIN
  v_secret_name := 'gateway_' || lower(p_gateway) || '_' || p_vendor_id::text;
  
  DELETE FROM vault.secrets
  WHERE name = v_secret_name;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    PERFORM public.log_vault_access(
      p_vendor_id, p_gateway, 'delete', false,
      'Secret not found for deletion',
      p_ip_address, p_user_agent,
      jsonb_build_object('secret_name', v_secret_name)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credentials not found in Vault',
      'secret_name', v_secret_name
    );
  END IF;
  
  SELECT public.log_vault_access(
    p_vendor_id, p_gateway, 'delete', true, NULL,
    p_ip_address, p_user_agent,
    jsonb_build_object(
      'secret_name', v_secret_name,
      'deleted_count', v_deleted_count
    )
  ) INTO v_log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'secret_name', v_secret_name,
    'audit_log_id', v_log_id::text
  );
  
EXCEPTION WHEN OTHERS THEN
  PERFORM public.log_vault_access(
    p_vendor_id, p_gateway, 'delete', false, SQLERRM,
    p_ip_address, p_user_agent,
    jsonb_build_object('sqlstate', SQLSTATE)
  );
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- =====================================================
-- 7. GRANTS E COMMENTS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.save_gateway_credentials(UUID, TEXT, JSONB, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_gateway_credentials(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_gateway_credentials(UUID, TEXT, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.save_gateway_credentials IS 
'Salva credenciais de gateway no Vault. Registra em vault_access_log. RISE V3.';

COMMENT ON FUNCTION public.get_gateway_credentials IS 
'Recupera credenciais de gateway do Vault. Registra em vault_access_log. RISE V3.';

COMMENT ON FUNCTION public.delete_gateway_credentials IS 
'Remove credenciais de gateway do Vault. Registra em vault_access_log. RISE V3.';