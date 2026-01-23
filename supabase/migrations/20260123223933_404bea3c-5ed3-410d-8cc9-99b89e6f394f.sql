-- ============================================================================
-- RISE V3: Migração para Idempotência de Webhooks
-- ============================================================================
-- Adiciona colunas necessárias para o middleware de idempotência funcionar

-- 1. Adicionar colunas faltantes em order_events
ALTER TABLE order_events 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS gateway TEXT,
ADD COLUMN IF NOT EXISTS processed_successfully BOOLEAN DEFAULT TRUE;

-- 2. Criar índice para busca de duplicatas (idempotência)
CREATE INDEX IF NOT EXISTS idx_order_events_idempotency 
ON order_events(external_id, gateway) 
WHERE external_id IS NOT NULL;

-- 3. Criar índice para performance de webhook lookup
CREATE INDEX IF NOT EXISTS idx_order_events_gateway_event 
ON order_events(gateway_event_id, gateway) 
WHERE gateway_event_id IS NOT NULL;

-- 4. Comentários para documentação
COMMENT ON COLUMN order_events.external_id IS 'ID único do evento no gateway (para idempotência)';
COMMENT ON COLUMN order_events.gateway IS 'Nome do gateway (mercadopago, asaas, stripe, pushinpay)';
COMMENT ON COLUMN order_events.processed_successfully IS 'Se o evento foi processado com sucesso';