-- Corrigir views para usar SECURITY INVOKER (padrão seguro)
-- Isso garante que as RLS policies das tabelas base sejam respeitadas

-- Recriar v_system_health_summary com SECURITY INVOKER explícito
DROP VIEW IF EXISTS v_system_health_summary;
CREATE VIEW v_system_health_summary 
WITH (security_invoker = on) AS
SELECT 
  date_trunc('hour', created_at) as hour,
  metric_type,
  COUNT(*) as event_count,
  COUNT(*) FILTER (WHERE severity = 'error') as error_count,
  AVG(metric_value) as avg_value
FROM system_health_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at), metric_type
ORDER BY hour DESC;

-- Recriar v_unresolved_errors com SECURITY INVOKER explícito
DROP VIEW IF EXISTS v_unresolved_errors;
CREATE VIEW v_unresolved_errors 
WITH (security_invoker = on) AS
SELECT 
  id,
  function_name,
  error_message,
  error_stack,
  timestamp,
  user_id,
  order_id,
  request_payload,
  notes
FROM edge_function_errors
WHERE resolved = false OR resolved IS NULL
ORDER BY timestamp DESC;

-- Adicionar comentários para documentação
COMMENT ON VIEW v_system_health_summary IS 'Resumo de métricas de saúde do sistema agrupado por hora (últimas 24h)';
COMMENT ON VIEW v_unresolved_errors IS 'Lista de erros de edge functions não resolvidos';