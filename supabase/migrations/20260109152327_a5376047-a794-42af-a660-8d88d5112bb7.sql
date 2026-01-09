-- =====================================================
-- SECURITY ALERTS & IP BLOCKLIST SYSTEM
-- =====================================================
-- Fase 2 & 3: Sistema de Alertas de Segurança + IP Blocklist
-- =====================================================

-- 1. Tabela de Alertas de Segurança
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address TEXT,
  user_id UUID,
  buyer_id UUID,
  details JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON public.security_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_security_alerts_ip ON public.security_alerts(ip_address);

-- RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver alertas (usando user_roles)
CREATE POLICY "Admins can view security alerts"
ON public.security_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Apenas admins podem atualizar alertas (acknowledge)
CREATE POLICY "Admins can update security alerts"
ON public.security_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Service role pode inserir (via edge functions)
CREATE POLICY "Service role can insert security alerts"
ON public.security_alerts
FOR INSERT
WITH CHECK (true);

-- 2. Tabela de IP Blocklist
CREATE TABLE IF NOT EXISTS public.ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  block_count INTEGER DEFAULT 1,
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ip_address)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_ip ON public.ip_blocklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_active ON public.ip_blocklist(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_expires ON public.ip_blocklist(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar blocklist
CREATE POLICY "Admins can manage ip blocklist"
ON public.ip_blocklist
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Service role pode ler/inserir/atualizar (via edge functions)
CREATE POLICY "Service role can manage ip blocklist"
ON public.ip_blocklist
FOR ALL
USING (true);

-- 3. Função para criar alertas de segurança
CREATE OR REPLACE FUNCTION public.create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_buyer_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    alert_type,
    severity,
    ip_address,
    user_id,
    buyer_id,
    details
  ) VALUES (
    p_alert_type,
    p_severity,
    p_ip_address,
    p_user_id,
    p_buyer_id,
    p_details
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- 4. Função para verificar se IP está bloqueado
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address TEXT)
RETURNS TABLE(
  blocked BOOLEAN,
  reason TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS blocked,
    b.reason,
    b.expires_at
  FROM public.ip_blocklist b
  WHERE b.ip_address = p_ip_address
    AND b.is_active = true
    AND (b.expires_at IS NULL OR b.expires_at > now())
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- 5. Função para auto-bloquear IP após múltiplos rate limits
CREATE OR REPLACE FUNCTION public.auto_block_ip_on_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_block_count INTEGER;
  v_existing_block_id UUID;
BEGIN
  IF NEW.blocked_until IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT COUNT(*)
  INTO v_block_count
  FROM public.buyer_rate_limits
  WHERE identifier = NEW.identifier
    AND blocked_until IS NOT NULL
    AND blocked_until > (now() - interval '24 hours');
  
  IF v_block_count >= 3 THEN
    SELECT id INTO v_existing_block_id
    FROM public.ip_blocklist
    WHERE ip_address = NEW.identifier;
    
    IF v_existing_block_id IS NOT NULL THEN
      UPDATE public.ip_blocklist
      SET 
        block_count = block_count + 1,
        expires_at = now() + interval '7 days',
        is_active = true,
        reason = 'Auto-blocked: Rate limit exceeded ' || (block_count + 1) || ' times',
        updated_at = now()
      WHERE id = v_existing_block_id;
    ELSE
      INSERT INTO public.ip_blocklist (
        ip_address,
        reason,
        expires_at,
        metadata
      ) VALUES (
        NEW.identifier,
        'Auto-blocked: Rate limit exceeded 3+ times in 24h',
        now() + interval '7 days',
        jsonb_build_object(
          'action', NEW.action,
          'trigger_time', now(),
          'block_count_at_trigger', v_block_count
        )
      );
    END IF;
    
    PERFORM public.create_security_alert(
      'ip_blocked',
      'high',
      NEW.identifier,
      NULL,
      NULL,
      jsonb_build_object(
        'reason', 'Auto-blocked due to repeated rate limit violations',
        'action', NEW.action,
        'block_count', v_block_count,
        'blocked_for', '7 days'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Trigger para auto-block
DROP TRIGGER IF EXISTS trigger_auto_block_ip ON public.buyer_rate_limits;
CREATE TRIGGER trigger_auto_block_ip
AFTER UPDATE OF blocked_until ON public.buyer_rate_limits
FOR EACH ROW
WHEN (NEW.blocked_until IS NOT NULL AND (OLD.blocked_until IS NULL OR NEW.blocked_until != OLD.blocked_until))
EXECUTE FUNCTION public.auto_block_ip_on_rate_limit();

-- 7. Trigger para criar alertas em falhas de login repetidas
CREATE OR REPLACE FUNCTION public.alert_on_login_failures()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.action LIKE '%login%' AND NEW.attempts >= 5 AND NEW.blocked_until IS NOT NULL THEN
    PERFORM public.create_security_alert(
      'brute_force',
      CASE 
        WHEN NEW.attempts >= 10 THEN 'critical'
        WHEN NEW.attempts >= 7 THEN 'high'
        ELSE 'medium'
      END,
      NEW.identifier,
      NULL,
      NULL,
      jsonb_build_object(
        'attempts', NEW.attempts,
        'action', NEW.action,
        'blocked_until', NEW.blocked_until
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_alert_login_failures ON public.buyer_rate_limits;
CREATE TRIGGER trigger_alert_login_failures
AFTER UPDATE ON public.buyer_rate_limits
FOR EACH ROW
WHEN (NEW.blocked_until IS NOT NULL)
EXECUTE FUNCTION public.alert_on_login_failures();

-- 8. Função para limpar bloqueios expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_blocks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.ip_blocklist
  SET is_active = false, updated_at = now()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- 9. Grant para funções
GRANT EXECUTE ON FUNCTION public.create_security_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_ip_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_blocks TO authenticated;