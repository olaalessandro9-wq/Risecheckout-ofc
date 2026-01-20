-- Limpar rate limit para o IP 177.11.27.39 (usuário rdgsandro1@gmail.com)
DELETE FROM rate_limit_attempts WHERE identifier LIKE '%ip:177.11.27.39%';

-- Garantir que não há bloqueio ativo na ip_blocklist
UPDATE ip_blocklist SET is_active = false WHERE ip_address = '177.11.27.39' AND is_active = true;

-- Invalidar sessões antigas e permitir novo login
UPDATE producer_sessions 
SET is_valid = false 
WHERE producer_id = '63f041b6-8890-4625-bac9-5f7bb7dd410a' 
  AND is_valid = true;