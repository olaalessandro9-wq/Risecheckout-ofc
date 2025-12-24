-- Tabela para armazenar tentativas de rate limiting
-- Protege contra ataques de brute force e abuso de API
-- Baseado em OWASP Top 10 - Authentication Failures (#7)

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP, user_id, email, etc.
  action TEXT NOT NULL, -- login, create_order, etc.
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_rate_limit_identifier_action ON rate_limit_attempts(identifier, action),
  INDEX idx_rate_limit_created_at ON rate_limit_attempts(created_at)
);

-- Comentários para documentação
COMMENT ON TABLE rate_limit_attempts IS 'Armazena tentativas de ações para rate limiting';
COMMENT ON COLUMN rate_limit_attempts.identifier IS 'Identificador único (IP, user_id, email)';
COMMENT ON COLUMN rate_limit_attempts.action IS 'Tipo de ação (login, create_order, etc.)';
COMMENT ON COLUMN rate_limit_attempts.success IS 'Se a tentativa foi bem-sucedida';
COMMENT ON COLUMN rate_limit_attempts.created_at IS 'Timestamp da tentativa';

-- RLS: Apenas service_role pode acessar
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service_role pode inserir/ler
CREATE POLICY "Service role can manage rate_limit_attempts"
  ON rate_limit_attempts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Função para limpar tentativas antigas (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_attempts
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

COMMENT ON FUNCTION cleanup_old_rate_limit_attempts IS 'Remove tentativas de rate limit com mais de 24 horas';
