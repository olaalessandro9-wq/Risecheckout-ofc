-- ============================================================================
-- FASE 5: SISTEMA DE IDEMPOTÊNCIA DE PAGAMENTOS
-- ============================================================================
-- 
-- RISE Protocol V3 - 10.0/10 Security
-- 
-- Previne cobranças duplicadas através de:
-- 1. Tabela payment_attempts com chave de idempotência única
-- 2. Detecção de requisições duplicadas
-- 3. Cache de respostas para retorno idempotente
-- ============================================================================

-- Tabela de tentativas de pagamento (idempotência)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Chave de idempotência (única por requisição)
  idempotency_key TEXT NOT NULL,
  
  -- Referências
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Gateway e método
  gateway TEXT NOT NULL CHECK (gateway IN ('mercadopago', 'stripe', 'asaas', 'pushinpay')),
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  
  -- Status da tentativa
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Hash da requisição para detectar payloads diferentes com mesma chave
  request_hash TEXT NOT NULL,
  
  -- Resposta cached para retorno idempotente
  response_data JSONB,
  error_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadados
  client_ip TEXT,
  user_agent TEXT,
  
  -- Constraint única para idempotência
  CONSTRAINT unique_idempotency_key UNIQUE(idempotency_key)
);

-- Comentários de documentação
COMMENT ON TABLE public.payment_attempts IS 'Registro de tentativas de pagamento para idempotência - RISE Protocol V3';
COMMENT ON COLUMN public.payment_attempts.idempotency_key IS 'Chave única gerada pelo frontend (orderId + timestamp + random)';
COMMENT ON COLUMN public.payment_attempts.request_hash IS 'SHA256 do payload para detectar requisições inconsistentes';
COMMENT ON COLUMN public.payment_attempts.response_data IS 'Resposta da tentativa bem-sucedida para retorno idempotente';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_attempts_key ON public.payment_attempts(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order ON public.payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts(status) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_payment_attempts_created ON public.payment_attempts(created_at DESC);

-- Índice para limpeza de registros antigos
CREATE INDEX IF NOT EXISTS idx_payment_attempts_cleanup ON public.payment_attempts(created_at) 
WHERE completed_at IS NOT NULL;

-- RLS: Apenas service_role pode acessar (Edge Functions)
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy para usuários normais - somente service_role via Edge Functions
CREATE POLICY "Service role only" ON public.payment_attempts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- FASE 4: ÍNDICES DE PERFORMANCE
-- ============================================================================

-- Índice composto para dashboard queries (vendor + status + date)
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status_created 
ON public.orders(vendor_id, status, created_at DESC);

-- Índice para busca por gateway_payment_id (reconciliação)
CREATE INDEX IF NOT EXISTS idx_orders_gateway_payment 
ON public.orders(gateway_payment_id) 
WHERE gateway_payment_id IS NOT NULL;

-- Índice para busca de checkout por slug
CREATE INDEX IF NOT EXISTS idx_checkouts_slug 
ON public.checkouts(slug) 
WHERE status != 'deleted';

-- Índice para busca de afiliados ativos
CREATE INDEX IF NOT EXISTS idx_affiliates_code_product 
ON public.affiliates(affiliate_code, product_id) 
WHERE status = 'active';

-- Índice para security_events por identifier (IP - anti-fraude)
CREATE INDEX IF NOT EXISTS idx_security_events_identifier 
ON public.security_events(identifier);

-- Índice para security_events por user_id + tipo
CREATE INDEX IF NOT EXISTS idx_security_events_user_type 
ON public.security_events(user_id, event_type, created_at DESC);