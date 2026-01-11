-- =====================================================
-- LGPD Sprint 2: Direito ao Esquecimento
-- Tabela para gerenciar solicitações de anonimização
-- =====================================================

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_gdpr_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Tabela de solicitações LGPD
CREATE TABLE public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do solicitante
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED,
  
  -- Token de verificação
  verification_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  
  -- Status do processamento
  status TEXT NOT NULL DEFAULT 'pending' 
    CONSTRAINT valid_status CHECK (status IN ('pending', 'verified', 'processing', 'completed', 'rejected', 'expired')),
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Resultado do processamento
  tables_affected JSONB DEFAULT '[]'::jsonb,
  records_anonymized INTEGER DEFAULT 0,
  
  -- Auditoria
  ip_address TEXT,
  user_agent TEXT,
  rejection_reason TEXT,
  
  -- Controle
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_gdpr_requests_email_normalized ON public.gdpr_requests(email_normalized);
CREATE INDEX idx_gdpr_requests_status ON public.gdpr_requests(status);
CREATE INDEX idx_gdpr_requests_token ON public.gdpr_requests(verification_token);
CREATE INDEX idx_gdpr_requests_created_at ON public.gdpr_requests(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gdpr_requests_updated_at
  BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_gdpr_updated_at();

-- RLS: Apenas service_role pode acessar (dados sensíveis)
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.gdpr_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Tabela de auditoria específica para LGPD
CREATE TABLE public.gdpr_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência à solicitação
  gdpr_request_id UUID REFERENCES public.gdpr_requests(id) ON DELETE SET NULL,
  
  -- Detalhes da ação
  action TEXT NOT NULL,
  table_name TEXT,
  records_affected INTEGER DEFAULT 0,
  
  -- Dados originais (hash para verificação, nunca o valor real)
  original_email_hash TEXT,
  anonymized_email TEXT,
  
  -- Auditoria
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executed_by TEXT DEFAULT 'system',
  ip_address TEXT,
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_gdpr_audit_log_request_id ON public.gdpr_audit_log(gdpr_request_id);
CREATE INDEX idx_gdpr_audit_log_action ON public.gdpr_audit_log(action);
CREATE INDEX idx_gdpr_audit_log_executed_at ON public.gdpr_audit_log(executed_at);

-- RLS: Apenas service_role pode acessar
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.gdpr_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Função para gerar hash de email (para auditoria sem expor dados)
CREATE OR REPLACE FUNCTION public.hash_email(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(sha256(LOWER(TRIM(p_email))::bytea), 'hex');
END;
$$;

-- Função para verificar se email já tem solicitação pendente/recente
CREATE OR REPLACE FUNCTION public.check_gdpr_request_limit(p_email TEXT)
RETURNS TABLE(
  can_request BOOLEAN,
  reason TEXT,
  last_request_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_normalized TEXT := LOWER(TRIM(p_email));
  v_recent_request RECORD;
  v_pending_count INTEGER;
BEGIN
  -- Verificar solicitações pendentes
  SELECT COUNT(*) INTO v_pending_count
  FROM gdpr_requests
  WHERE email_normalized = v_email_normalized
    AND status IN ('pending', 'verified', 'processing');
  
  IF v_pending_count > 0 THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Já existe uma solicitação em andamento para este email'::TEXT,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Verificar solicitações nas últimas 24h
  SELECT * INTO v_recent_request
  FROM gdpr_requests
  WHERE email_normalized = v_email_normalized
    AND created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_recent_request IS NOT NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Aguarde 24 horas desde a última solicitação'::TEXT,
      v_recent_request.created_at;
    RETURN;
  END IF;
  
  -- Pode solicitar
  RETURN QUERY SELECT 
    TRUE, 
    NULL::TEXT,
    NULL::TIMESTAMPTZ;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.gdpr_requests IS 'Solicitações de direito ao esquecimento (LGPD Art. 18)';
COMMENT ON TABLE public.gdpr_audit_log IS 'Log de auditoria para ações de anonimização LGPD';
COMMENT ON FUNCTION public.hash_email IS 'Gera hash SHA-256 de email para auditoria sem expor dados';
COMMENT ON FUNCTION public.check_gdpr_request_limit IS 'Verifica se email pode criar nova solicitação GDPR';