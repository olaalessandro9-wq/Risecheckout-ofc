-- =====================================================
-- Criação de RPCs para Health Dashboard
-- =====================================================

-- 1. Função: get_system_health_summary
CREATE OR REPLACE FUNCTION public.get_system_health_summary(
  time_range interval DEFAULT '24 hours'::interval
)
RETURNS TABLE (
  hour timestamptz,
  metric_type text,
  event_count bigint,
  error_count bigint,
  avg_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', shl.created_at) AS hour,
    shl.metric_type,
    count(*)::bigint AS event_count,
    count(*) FILTER (WHERE shl.severity = 'error')::bigint AS error_count,
    avg(shl.metric_value) AS avg_value
  FROM system_health_logs shl
  WHERE shl.created_at >= (now() - time_range)
  GROUP BY date_trunc('hour', shl.created_at), shl.metric_type
  ORDER BY date_trunc('hour', shl.created_at) DESC;
END;
$$;

-- 2. Função: get_unresolved_errors (timestamp renomeado para error_timestamp)
CREATE OR REPLACE FUNCTION public.get_unresolved_errors(
  limit_count int DEFAULT 100,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  function_name text,
  error_message text,
  error_stack text,
  error_timestamp timestamptz,
  user_id uuid,
  order_id uuid,
  request_payload jsonb,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    efe.id,
    efe.function_name,
    efe.error_message,
    efe.error_stack,
    efe."timestamp" AS error_timestamp,
    efe.user_id,
    efe.order_id,
    efe.request_payload,
    efe.notes
  FROM edge_function_errors efe
  WHERE efe.resolved = false OR efe.resolved IS NULL
  ORDER BY efe."timestamp" DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

COMMENT ON FUNCTION public.get_system_health_summary IS 
'Retorna métricas de saúde do sistema agrupadas por hora';

COMMENT ON FUNCTION public.get_unresolved_errors IS 
'Retorna erros de edge functions não resolvidos com paginação';