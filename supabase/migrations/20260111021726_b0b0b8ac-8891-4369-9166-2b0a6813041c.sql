-- ============================================================================
-- SPRINT 1: DLQ, DATA RETENTION & AUDIT
-- ============================================================================

-- 1. Dead Letter Queue para Webhooks de Gateway
CREATE TABLE public.gateway_webhook_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,                    -- 'mercadopago', 'pushinpay', 'asaas', 'stripe'
  event_type TEXT NOT NULL,                 -- 'payment', 'refund', etc.
  payload JSONB NOT NULL,                   -- Payload original do webhook
  headers JSONB,                            -- Headers relevantes (mascarados)
  error_code TEXT NOT NULL,                 -- Código do erro
  error_message TEXT NOT NULL,              -- Mensagem completa
  order_id UUID,                            -- Se conseguiu identificar
  attempts INTEGER DEFAULT 0,               -- Tentativas de reprocessamento
  status TEXT DEFAULT 'pending',            -- 'pending', 'processing', 'resolved', 'abandoned'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_attempt_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,                         -- Admin que resolveu
  resolution_notes TEXT
);

-- Índices para consultas frequentes
CREATE INDEX idx_dlq_status ON public.gateway_webhook_dlq(status);
CREATE INDEX idx_dlq_gateway ON public.gateway_webhook_dlq(gateway);
CREATE INDEX idx_dlq_created_at ON public.gateway_webhook_dlq(created_at);
CREATE INDEX idx_dlq_order_id ON public.gateway_webhook_dlq(order_id);

-- RLS para DLQ
ALTER TABLE public.gateway_webhook_dlq ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar a DLQ (via service role)
CREATE POLICY "DLQ only accessible via service role"
  ON public.gateway_webhook_dlq
  FOR ALL
  USING (false);

-- 2. Tabela de Log de Retenção de Dados
CREATE TABLE public.data_retention_log (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMPTZ DEFAULT now(),
  trigger_debug_logs_deleted BIGINT DEFAULT 0,
  security_audit_log_deleted BIGINT DEFAULT 0,
  checkout_visits_deleted BIGINT DEFAULT 0,
  webhook_deliveries_deleted BIGINT DEFAULT 0,
  gateway_webhook_dlq_deleted BIGINT DEFAULT 0,
  order_events_deleted BIGINT DEFAULT 0,
  execution_time_ms INTEGER
);

-- RLS para log de retenção
ALTER TABLE public.data_retention_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retention log only accessible via service role"
  ON public.data_retention_log
  FOR ALL
  USING (false);

-- 3. Função de Limpeza de Dados (LGPD Compliance)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS TABLE(
  table_name TEXT,
  rows_deleted BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trigger_logs BIGINT := 0;
  v_audit_logs BIGINT := 0;
  v_visits BIGINT := 0;
  v_deliveries BIGINT := 0;
  v_dlq BIGINT := 0;
  v_order_events BIGINT := 0;
BEGIN
  -- 1. trigger_debug_logs: Manter 7 dias (dados de debug)
  DELETE FROM trigger_debug_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_trigger_logs = ROW_COUNT;

  -- 2. security_audit_log: Manter 90 dias (compliance)
  DELETE FROM security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_audit_logs = ROW_COUNT;

  -- 3. checkout_visits: Manter 365 dias (analytics)
  DELETE FROM checkout_visits
  WHERE visited_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_visits = ROW_COUNT;

  -- 4. webhook_deliveries: Manter 30 dias (sucesso) ou 90 dias (falha)
  DELETE FROM webhook_deliveries
  WHERE (status = 'success' AND created_at < NOW() - INTERVAL '30 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '90 days');
  GET DIAGNOSTICS v_deliveries = ROW_COUNT;

  -- 5. gateway_webhook_dlq: Manter 90 dias (resolved/abandoned)
  DELETE FROM gateway_webhook_dlq
  WHERE status IN ('resolved', 'abandoned')
    AND resolved_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_dlq = ROW_COUNT;

  -- 6. order_events: Manter 180 dias (histórico de transações)
  DELETE FROM order_events
  WHERE occurred_at < NOW() - INTERVAL '180 days';
  GET DIAGNOSTICS v_order_events = ROW_COUNT;

  -- Retornar resumo
  RETURN QUERY 
  SELECT 'trigger_debug_logs'::TEXT, v_trigger_logs
  UNION ALL
  SELECT 'security_audit_log'::TEXT, v_audit_logs
  UNION ALL
  SELECT 'checkout_visits'::TEXT, v_visits
  UNION ALL
  SELECT 'webhook_deliveries'::TEXT, v_deliveries
  UNION ALL
  SELECT 'gateway_webhook_dlq'::TEXT, v_dlq
  UNION ALL
  SELECT 'order_events'::TEXT, v_order_events;
END;
$$;

-- 4. Função de Limpeza com Logging
CREATE OR REPLACE FUNCTION public.cleanup_old_data_with_log()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_results RECORD;
  v_trigger BIGINT := 0;
  v_audit BIGINT := 0;
  v_visits BIGINT := 0;
  v_deliveries BIGINT := 0;
  v_dlq BIGINT := 0;
  v_events BIGINT := 0;
BEGIN
  FOR v_results IN SELECT * FROM cleanup_old_data() LOOP
    CASE v_results.table_name
      WHEN 'trigger_debug_logs' THEN v_trigger := v_results.rows_deleted;
      WHEN 'security_audit_log' THEN v_audit := v_results.rows_deleted;
      WHEN 'checkout_visits' THEN v_visits := v_results.rows_deleted;
      WHEN 'webhook_deliveries' THEN v_deliveries := v_results.rows_deleted;
      WHEN 'gateway_webhook_dlq' THEN v_dlq := v_results.rows_deleted;
      WHEN 'order_events' THEN v_events := v_results.rows_deleted;
      ELSE NULL;
    END CASE;
  END LOOP;

  INSERT INTO data_retention_log (
    trigger_debug_logs_deleted,
    security_audit_log_deleted,
    checkout_visits_deleted,
    webhook_deliveries_deleted,
    gateway_webhook_dlq_deleted,
    order_events_deleted,
    execution_time_ms
  ) VALUES (
    v_trigger,
    v_audit,
    v_visits,
    v_deliveries,
    v_dlq,
    v_events,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER
  );
END;
$$;

-- Comentário com política de retenção
COMMENT ON FUNCTION public.cleanup_old_data IS 
'Política de Retenção de Dados (LGPD):
- trigger_debug_logs: 7 dias
- security_audit_log: 90 dias
- checkout_visits: 365 dias
- webhook_deliveries: 30d (success) / 90d (failed)
- gateway_webhook_dlq: 90 dias após resolução
- order_events: 180 dias

Executar via cron: SELECT * FROM cleanup_old_data();';

COMMENT ON FUNCTION public.cleanup_old_data_with_log IS 
'Executa cleanup_old_data() e registra resultado em data_retention_log.
Usar esta função no pg_cron para auditoria completa.';