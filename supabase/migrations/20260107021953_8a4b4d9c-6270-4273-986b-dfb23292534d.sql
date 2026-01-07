-- FASE 0: Corrigir pedido 762aff7f-54d3-489c-bf9e-52d8f6116b91
-- Status: PENDING -> PAID (agora deve funcionar com trigger corrigido)

-- 1. Atualizar status do pedido
UPDATE orders
SET 
  status = 'PAID',
  pix_status = 'approved',
  paid_at = NOW(),
  updated_at = NOW()
WHERE id = '762aff7f-54d3-489c-bf9e-52d8f6116b91';

-- 2. Registrar evento de pagamento aprovado
INSERT INTO order_events (
  order_id,
  vendor_id,
  type,
  occurred_at,
  data
) VALUES (
  '762aff7f-54d3-489c-bf9e-52d8f6116b91',
  'ccff612c-93e6-4acc-85d9-7c9d978a7e4e',
  'purchase_approved',
  NOW(),
  jsonb_build_object(
    'source', 'manual_reconciliation',
    'reason', 'Pedido corrigido manualmente - webhook falhou durante processamento',
    'corrected_at', NOW()
  )
);