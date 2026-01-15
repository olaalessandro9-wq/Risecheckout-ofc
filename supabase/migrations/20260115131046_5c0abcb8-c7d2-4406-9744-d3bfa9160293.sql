-- ============================================
-- FASE 3: Corrigir get_system_health_summary() 
-- Precisa fazer DROP primeiro porque a assinatura mudou
-- ============================================

DROP FUNCTION IF EXISTS public.get_system_health_summary();

CREATE OR REPLACE FUNCTION public.get_system_health_summary()
RETURNS TABLE (
  hour timestamptz,
  metric_type text,
  event_count bigint,
  error_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', COALESCE(shl.timestamp, shl.created_at)) AS hour,
    shl.metric_type::text,
    COUNT(*)::bigint AS event_count,
    COUNT(*) FILTER (WHERE shl.metadata->>'error' IS NOT NULL)::bigint AS error_count
  FROM system_health_logs shl
  WHERE COALESCE(shl.timestamp, shl.created_at) >= now() - interval '24 hours'
  GROUP BY 1, 2
  ORDER BY 1 DESC;
END;
$$;

-- ============================================
-- FASE 4: Corrigir get_webhook_stats_24h() para retornar JSONB
-- Precisa fazer DROP primeiro porque a assinatura mudou
-- ============================================

DROP FUNCTION IF EXISTS public.get_webhook_stats_24h();

CREATE OR REPLACE FUNCTION public.get_webhook_stats_24h()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', COALESCE(COUNT(*), 0),
    'delivered', COALESCE(COUNT(*) FILTER (WHERE status = 'delivered'), 0),
    'failed', COALESCE(COUNT(*) FILTER (WHERE status = 'failed'), 0),
    'pending', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0),
    'avg_attempts', COALESCE(AVG(attempts), 1)
  ) INTO result
  FROM webhook_deliveries
  WHERE created_at >= now() - interval '24 hours';
  
  RETURN COALESCE(result, '{"total":0,"delivered":0,"failed":0,"pending":0,"avg_attempts":1}'::jsonb);
END;
$$;