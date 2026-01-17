-- ============================================================================
-- Migration: Modelo de Status Padrão de Mercado (Hotmart/Kiwify)
-- ============================================================================
-- Adiciona campos para rastreabilidade técnica sem mudar o status público
-- Uma venda PENDENTE nunca vira CANCELADA - fica pendente ou vira paga
-- ============================================================================

-- 1. Adicionar novos campos para rastreabilidade técnica
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS technical_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- 2. Criar índice para consultas de recuperação de vendas
CREATE INDEX IF NOT EXISTS idx_orders_technical_status 
ON public.orders(technical_status) 
WHERE technical_status != 'active';

-- 3. Criar índice para vendas expiradas
CREATE INDEX IF NOT EXISTS idx_orders_expired_at 
ON public.orders(expired_at) 
WHERE expired_at IS NOT NULL;

-- 4. Migrar dados históricos: cancelled → pending + technical_status = 'expired'
UPDATE public.orders 
SET 
  technical_status = 'expired',
  expired_at = updated_at
WHERE status = 'cancelled';

-- 5. Atualizar status de cancelled para pending (padrão de mercado)
UPDATE public.orders 
SET status = 'pending'
WHERE status = 'cancelled';

-- 6. Migrar dados históricos: failed → pending + technical_status = 'gateway_error'
UPDATE public.orders 
SET 
  technical_status = 'gateway_error',
  expired_at = updated_at
WHERE status = 'failed';

-- 7. Atualizar status de failed para pending
UPDATE public.orders 
SET status = 'pending'
WHERE status = 'failed';

-- 8. Adicionar comentários de documentação
COMMENT ON COLUMN public.orders.technical_status IS 
'Status técnico interno para rastreabilidade. Valores: active, expired, gateway_cancelled, gateway_timeout, abandoned, gateway_error. O status público (status) segue padrão de mercado: pending nunca vira cancelled.';

COMMENT ON COLUMN public.orders.expired_at IS 
'Timestamp de quando a venda expirou tecnicamente (PIX/Boleto expirou). Usado para relatórios de recuperação de vendas.';