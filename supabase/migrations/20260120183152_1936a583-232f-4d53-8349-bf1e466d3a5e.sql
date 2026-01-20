-- Limpar rate limit para permitir teste de recuperação de senha
-- IP: 177.11.27.39 | Ação: producer_password_reset

UPDATE buyer_rate_limits
SET 
  blocked_until = NULL,
  attempts = 0,
  first_attempt_at = NOW(),
  last_attempt_at = NOW()
WHERE identifier = 'ip:177.11.27.39'
  AND action = 'producer_password_reset';