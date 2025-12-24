-- Tabela para logging de eventos de segurança
-- Registra tentativas de acesso, falhas de autenticação, e ações sensíveis
-- Baseado em OWASP Top 10 - Logging and Monitoring Failures (#9)

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- login_failed, unauthorized_access, config_changed, etc.
  user_id UUID, -- NULL para eventos anônimos
  identifier TEXT, -- IP, email, ou outro identificador
  resource TEXT, -- Recurso acessado (tabela, endpoint, etc.)
  action TEXT, -- Ação tentada (SELECT, INSERT, UPDATE, DELETE, etc.)
  success BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Dados adicionais (user_agent, request_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_success ON security_events(success);

-- Comentários para documentação
COMMENT ON TABLE security_events IS 'Registra eventos de segurança para auditoria e monitoramento';
COMMENT ON COLUMN security_events.event_type IS 'Tipo de evento (login_failed, unauthorized_access, etc.)';
COMMENT ON COLUMN security_events.user_id IS 'ID do usuário (NULL para eventos anônimos)';
COMMENT ON COLUMN security_events.identifier IS 'Identificador (IP, email, etc.)';
COMMENT ON COLUMN security_events.resource IS 'Recurso acessado';
COMMENT ON COLUMN security_events.action IS 'Ação tentada';
COMMENT ON COLUMN security_events.success IS 'Se a ação foi bem-sucedida';
COMMENT ON COLUMN security_events.metadata IS 'Dados adicionais em formato JSON';

-- RLS: Apenas service_role e admins podem acessar
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Política: Service role pode tudo
CREATE POLICY "Service role can manage security_events"
  ON security_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Política: Admins podem ler (se houver coluna is_admin em profiles)
-- CREATE POLICY "Admins can read security_events"
--   ON security_events
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.is_admin = true
--     )
--   );

-- Função para limpar eventos antigos (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Manter apenas últimos 90 dias
  DELETE FROM security_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_security_events IS 'Remove eventos de segurança com mais de 90 dias';

-- Função helper para registrar eventos de segurança
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_identifier TEXT DEFAULT NULL,
  p_resource TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT FALSE,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO security_events (
    event_type,
    user_id,
    identifier,
    resource,
    action,
    success,
    metadata
  ) VALUES (
    p_event_type,
    p_user_id,
    p_identifier,
    p_resource,
    p_action,
    p_success,
    p_metadata
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION log_security_event IS 'Helper para registrar eventos de segurança';

-- View para análise de eventos de segurança (últimos 7 dias)
CREATE OR REPLACE VIEW security_events_summary AS
SELECT 
  event_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE success = false) as failed_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT identifier) as unique_identifiers,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM security_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total_events DESC;

COMMENT ON VIEW security_events_summary IS 'Resumo de eventos de segurança dos últimos 7 dias';
