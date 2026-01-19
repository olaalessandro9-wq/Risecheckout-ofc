-- =====================================================
-- ENCRYPTION KEY VERSIONS - Key Management System
-- =====================================================
-- RISE Protocol V3 Compliant (10.0/10)
-- 
-- Sistema de versionamento de chaves de criptografia
-- para suportar rotação segura de BUYER_ENCRYPTION_KEY.
-- 
-- Formato de dados criptografados:
-- - Legacy: base64(iv:ciphertext:tag)
-- - V2+:    ENC_V{version}:{base64(iv:ciphertext:tag)}
-- =====================================================

-- =====================================================
-- 1. TABELA DE VERSÕES DE CHAVES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.encryption_key_versions (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  key_identifier TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'deprecated', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_encryption_key_versions_status 
  ON public.encryption_key_versions(status);

CREATE INDEX IF NOT EXISTS idx_encryption_key_versions_version 
  ON public.encryption_key_versions(version DESC);

-- =====================================================
-- 2. RLS - APENAS SERVICE_ROLE
-- =====================================================
ALTER TABLE public.encryption_key_versions ENABLE ROW LEVEL SECURITY;

-- Policies explícitas de negação
CREATE POLICY "encryption_key_versions_no_select" ON public.encryption_key_versions
  FOR SELECT USING (false);

CREATE POLICY "encryption_key_versions_no_insert" ON public.encryption_key_versions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "encryption_key_versions_no_update" ON public.encryption_key_versions
  FOR UPDATE USING (false);

CREATE POLICY "encryption_key_versions_no_delete" ON public.encryption_key_versions
  FOR DELETE USING (false);

COMMENT ON TABLE public.encryption_key_versions IS 
'Versionamento de chaves de criptografia. Apenas service_role acessa.
Suporta rotação segura de BUYER_ENCRYPTION_KEY. RISE Protocol V3.';

-- =====================================================
-- 3. TABELA DE LOG DE ROTAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.key_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version INTEGER,
  to_version INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'activate', 'rotate', 'deprecate', 'revoke')),
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_key_rotation_log_status 
  ON public.key_rotation_log(status);

CREATE INDEX IF NOT EXISTS idx_key_rotation_log_started_at 
  ON public.key_rotation_log(started_at DESC);

-- RLS
ALTER TABLE public.key_rotation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "key_rotation_log_no_select" ON public.key_rotation_log
  FOR SELECT USING (false);

CREATE POLICY "key_rotation_log_no_insert" ON public.key_rotation_log
  FOR INSERT WITH CHECK (false);

CREATE POLICY "key_rotation_log_no_update" ON public.key_rotation_log
  FOR UPDATE USING (false);

CREATE POLICY "key_rotation_log_no_delete" ON public.key_rotation_log
  FOR DELETE USING (false);

COMMENT ON TABLE public.key_rotation_log IS 
'Log de operações de rotação de chaves. Apenas service_role acessa.
Rastreia progresso e erros durante rotação. RISE Protocol V3.';

-- =====================================================
-- 4. FUNÇÕES AUXILIARES
-- =====================================================

-- Obter versão ativa atual
CREATE OR REPLACE FUNCTION public.get_active_key_version()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version INTEGER;
BEGIN
  SELECT version INTO v_version
  FROM public.encryption_key_versions
  WHERE status = 'active'
  ORDER BY version DESC
  LIMIT 1;
  
  -- Se não há versão, retornar 1 (legacy)
  RETURN COALESCE(v_version, 1);
END;
$$;

-- Registrar nova versão de chave
CREATE OR REPLACE FUNCTION public.register_key_version(
  p_version INTEGER,
  p_key_identifier TEXT,
  p_algorithm TEXT DEFAULT 'AES-256-GCM'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id INTEGER;
BEGIN
  -- Verificar se versão já existe
  IF EXISTS (SELECT 1 FROM encryption_key_versions WHERE version = p_version) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Version already exists'
    );
  END IF;
  
  -- Inserir nova versão (inicialmente como 'rotating')
  INSERT INTO encryption_key_versions (version, key_identifier, algorithm, status)
  VALUES (p_version, p_key_identifier, p_algorithm, 'rotating')
  RETURNING id INTO v_id;
  
  -- Log
  INSERT INTO key_rotation_log (to_version, action, status)
  VALUES (p_version, 'create', 'completed');
  
  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'version', p_version
  );
END;
$$;

-- Ativar versão de chave (e depreciar anteriores)
CREATE OR REPLACE FUNCTION public.activate_key_version(p_version INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_version INTEGER;
BEGIN
  -- Obter versão ativa atual
  SELECT version INTO v_old_version
  FROM encryption_key_versions
  WHERE status = 'active'
  ORDER BY version DESC
  LIMIT 1;
  
  -- Verificar se versão existe e está em 'rotating'
  IF NOT EXISTS (SELECT 1 FROM encryption_key_versions WHERE version = p_version AND status = 'rotating') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Version not found or not in rotating status'
    );
  END IF;
  
  -- Depreciar versão anterior (se existir)
  IF v_old_version IS NOT NULL THEN
    UPDATE encryption_key_versions
    SET status = 'deprecated', deprecated_at = now()
    WHERE version = v_old_version AND status = 'active';
  END IF;
  
  -- Ativar nova versão
  UPDATE encryption_key_versions
  SET status = 'active', activated_at = now()
  WHERE version = p_version;
  
  -- Log
  INSERT INTO key_rotation_log (from_version, to_version, action, status)
  VALUES (v_old_version, p_version, 'activate', 'completed');
  
  RETURN jsonb_build_object(
    'success', true,
    'activated_version', p_version,
    'deprecated_version', v_old_version
  );
END;
$$;

-- Iniciar log de rotação
CREATE OR REPLACE FUNCTION public.start_key_rotation_log(
  p_from_version INTEGER,
  p_to_version INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO key_rotation_log (from_version, to_version, action, status)
  VALUES (p_from_version, p_to_version, 'rotate', 'running')
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Atualizar progresso de rotação
CREATE OR REPLACE FUNCTION public.update_key_rotation_progress(
  p_log_id UUID,
  p_processed INTEGER,
  p_failed INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE key_rotation_log
  SET 
    records_processed = p_processed,
    records_failed = p_failed,
    metadata = metadata || jsonb_build_object('last_update', now())
  WHERE id = p_log_id;
END;
$$;

-- Completar rotação
CREATE OR REPLACE FUNCTION public.complete_key_rotation(
  p_log_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE key_rotation_log
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    completed_at = now(),
    error_message = p_error
  WHERE id = p_log_id;
END;
$$;

-- =====================================================
-- 5. GRANTS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_active_key_version() TO service_role;
GRANT EXECUTE ON FUNCTION public.register_key_version(INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_key_version(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_key_rotation_log(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_key_rotation_progress(UUID, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_key_rotation(UUID, BOOLEAN, TEXT) TO service_role;

-- =====================================================
-- 6. SEED VERSÃO INICIAL (Legacy = v1)
-- =====================================================
INSERT INTO encryption_key_versions (version, key_identifier, algorithm, status, activated_at)
VALUES (1, 'BUYER_ENCRYPTION_KEY', 'AES-256-GCM', 'active', now())
ON CONFLICT (version) DO NOTHING;