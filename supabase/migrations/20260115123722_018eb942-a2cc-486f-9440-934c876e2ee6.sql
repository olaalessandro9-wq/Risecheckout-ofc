-- ===========================================
-- FASE 1: Trigger para logging automático de PIX
-- ===========================================

-- Função que loga criação de PIX automaticamente
CREATE OR REPLACE FUNCTION log_pix_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Só loga se pix_created_at foi preenchido pela primeira vez
  IF NEW.pix_created_at IS NOT NULL AND (OLD.pix_created_at IS NULL OR OLD.pix_created_at IS DISTINCT FROM NEW.pix_created_at) THEN
    INSERT INTO system_health_logs (
      timestamp,
      metric_type,
      metric_value,
      severity,
      metadata
    ) VALUES (
      NOW(),
      'pix_created',
      NEW.amount_cents,
      'info',
      jsonb_build_object(
        'order_id', NEW.id,
        'gateway', COALESCE(NEW.gateway, 'unknown'),
        'vendor_id', NEW.vendor_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger se existir, então criar
DROP TRIGGER IF EXISTS trigger_log_pix_created ON orders;

CREATE TRIGGER trigger_log_pix_created
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.pix_created_at IS NOT NULL)
EXECUTE FUNCTION log_pix_created();

-- ===========================================
-- FASE 2: Corrigir get_system_health_summary (sem parâmetros)
-- ===========================================

DROP FUNCTION IF EXISTS get_system_health_summary(interval);

CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE (
  hour timestamptz,
  metric_type text,
  event_count bigint,
  error_count bigint,
  avg_value numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    date_trunc('hour', created_at) AS hour,
    shl.metric_type,
    count(*)::bigint AS event_count,
    count(*) FILTER (WHERE shl.severity = 'error')::bigint AS error_count,
    avg(shl.metric_value) AS avg_value
  FROM system_health_logs shl
  WHERE shl.created_at >= (now() - interval '24 hours')
  GROUP BY date_trunc('hour', shl.created_at), shl.metric_type
  ORDER BY date_trunc('hour', shl.created_at) DESC;
$$;

-- ===========================================
-- FASE 3: RPC para Webhook Stats (bypass RLS)
-- ===========================================

CREATE OR REPLACE FUNCTION get_webhook_stats_24h()
RETURNS TABLE (
  total bigint,
  delivered bigint,
  failed bigint,
  pending bigint,
  avg_attempts numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint AS total,
    count(*) FILTER (WHERE status = 'success' OR status = 'delivered')::bigint AS delivered,
    count(*) FILTER (WHERE status = 'failed')::bigint AS failed,
    count(*) FILTER (WHERE status = 'pending_retry')::bigint AS pending,
    COALESCE(avg(attempts), 1) AS avg_attempts
  FROM webhook_deliveries
  WHERE created_at >= now() - interval '24 hours';
$$;