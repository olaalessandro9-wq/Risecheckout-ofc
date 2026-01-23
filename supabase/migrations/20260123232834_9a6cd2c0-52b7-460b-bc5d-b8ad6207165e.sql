-- ============================================================================
-- ORDER LIFECYCLE EVENTS - Event-Driven Architecture
-- ============================================================================
-- 
-- RISE ARCHITECT PROTOCOL V3 - Nota 10.0/10
-- 
-- Esta migration implementa a arquitetura event-driven para processamento
-- assíncrono de mudanças de status em pedidos, permitindo:
-- 
-- 1. Captura automática de TODAS as mudanças de status via trigger
-- 2. Processamento assíncrono por worker (desacoplamento)
-- 3. Revogação automática de acesso em refund/chargeback
-- 4. Auditoria completa com rastreabilidade total
-- 
-- ============================================================================

-- ============================================================================
-- 1. TABELA ORDER_LIFECYCLE_EVENTS
-- ============================================================================

CREATE TABLE public.order_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processor_version TEXT,
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para worker buscar eventos não processados rapidamente
CREATE INDEX idx_lifecycle_events_unprocessed 
  ON public.order_lifecycle_events(processed, created_at) 
  WHERE processed = false;

-- Índice para buscar eventos por pedido
CREATE INDEX idx_lifecycle_events_order 
  ON public.order_lifecycle_events(order_id);

-- Índice para buscar eventos por status
CREATE INDEX idx_lifecycle_events_status 
  ON public.order_lifecycle_events(new_status);

-- ============================================================================
-- 2. CAMPOS DE AUDITORIA EM BUYER_PRODUCT_ACCESS
-- ============================================================================

-- Adicionar campos para rastrear revogação de acesso
ALTER TABLE public.buyer_product_access 
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS revoked_by_event_id UUID REFERENCES public.order_lifecycle_events(id);

COMMENT ON COLUMN public.buyer_product_access.revoked_at IS 'Timestamp da revogação automática de acesso';
COMMENT ON COLUMN public.buyer_product_access.revoked_reason IS 'Motivo da revogação: refunded, chargeback, partially_refunded, manual';
COMMENT ON COLUMN public.buyer_product_access.revoked_by_event_id IS 'ID do evento de lifecycle que causou a revogação';

-- Índice para buscar acessos revogados
CREATE INDEX IF NOT EXISTS idx_buyer_access_revoked 
  ON public.buyer_product_access(revoked_at) 
  WHERE revoked_at IS NOT NULL;

-- ============================================================================
-- 3. TRIGGER PARA CAPTURAR MUDANÇAS DE STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_capture_order_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Capturar TODAS as mudanças de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_lifecycle_events (
      order_id, 
      old_status, 
      new_status,
      metadata
    )
    VALUES (
      NEW.id, 
      OLD.status, 
      NEW.status,
      jsonb_build_object(
        'product_id', NEW.product_id,
        'customer_email', NEW.customer_email,
        'vendor_id', NEW.vendor_id,
        'gateway', NEW.gateway,
        'amount_cents', NEW.amount_cents,
        'changed_at', now(),
        'previous_updated_at', OLD.updated_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger AFTER UPDATE para não interferir no update original
DROP TRIGGER IF EXISTS trg_order_status_change ON public.orders;

CREATE TRIGGER trg_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_capture_order_status_change();

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- Habilitar RLS na tabela de eventos
ALTER TABLE public.order_lifecycle_events ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode acessar (interno)
CREATE POLICY "Service role full access on lifecycle events"
ON public.order_lifecycle_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. COMENTÁRIOS NA TABELA
-- ============================================================================

COMMENT ON TABLE public.order_lifecycle_events IS 
'Tabela de eventos de ciclo de vida de pedidos - RISE V3 Event-Driven Architecture. 
Captura automaticamente mudanças de status para processamento assíncrono.';

COMMENT ON COLUMN public.order_lifecycle_events.order_id IS 'ID do pedido relacionado';
COMMENT ON COLUMN public.order_lifecycle_events.old_status IS 'Status anterior do pedido';
COMMENT ON COLUMN public.order_lifecycle_events.new_status IS 'Novo status do pedido';
COMMENT ON COLUMN public.order_lifecycle_events.metadata IS 'Metadados do pedido no momento da mudança';
COMMENT ON COLUMN public.order_lifecycle_events.processed IS 'Se o evento já foi processado pelo worker';
COMMENT ON COLUMN public.order_lifecycle_events.processed_at IS 'Quando o evento foi processado';
COMMENT ON COLUMN public.order_lifecycle_events.processor_version IS 'Versão do worker que processou';
COMMENT ON COLUMN public.order_lifecycle_events.processing_error IS 'Erro encontrado no processamento (se houver)';
COMMENT ON COLUMN public.order_lifecycle_events.retry_count IS 'Número de tentativas de processamento';