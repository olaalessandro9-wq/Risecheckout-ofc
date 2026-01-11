
-- Etapa 1: Criar Order de Teste para Simulação PIX
INSERT INTO orders (
  id, status, payment_method, gateway, pix_id,
  customer_email, customer_name, product_id, product_name,
  vendor_id, amount_cents, created_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'PENDING', 'PIX', 'PUSHINPAY', 
  'test-pix-simulation-001',
  'teste-simulacao@risecheckout.com', 'Cliente Simulação',
  '4afe4889-e7ea-495f-a60b-84f1345865e9', 'RISE METODOS',
  'ccff612c-93e6-4acc-85d9-7c9d978a7e4e', 600, NOW()
);
