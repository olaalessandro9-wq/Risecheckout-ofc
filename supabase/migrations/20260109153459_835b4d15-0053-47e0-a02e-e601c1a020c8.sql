-- View: Resumo de saúde do sistema por hora (últimas 24h)
CREATE OR REPLACE VIEW v_system_health_summary AS
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

-- View: Erros não resolvidos de edge functions
CREATE OR REPLACE VIEW v_unresolved_errors AS
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

-- Garantir RLS para as views (herdada das tabelas base)
-- Views herdam as políticas das tabelas que referenciam