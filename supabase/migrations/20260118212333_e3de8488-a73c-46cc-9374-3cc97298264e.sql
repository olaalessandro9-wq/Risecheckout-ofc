-- ============================================================================
-- Função: is_ip_blocked (Recriação)
-- ============================================================================

-- Drop da função existente (tipo de retorno incompatível)
DROP FUNCTION IF EXISTS public.is_ip_blocked(TEXT);

-- Criar função com tipo correto
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM ip_blocklist 
    WHERE ip_address = check_ip 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.is_ip_blocked(TEXT) IS 
  'Verifica se um endereço IP está bloqueado na ip_blocklist. Retorna TRUE se bloqueado.';