-- Adicionar configurações de ambiente dos gateways para o Owner
-- Permite alternar entre sandbox e production via UI

INSERT INTO platform_settings (key, value, description) VALUES
  ('gateway_environment_asaas', 'production', 'Ambiente do gateway Asaas: sandbox ou production'),
  ('gateway_environment_mercadopago', 'production', 'Ambiente do gateway Mercado Pago: sandbox ou production'),
  ('gateway_environment_pushinpay', 'production', 'Ambiente do gateway PushinPay: sandbox ou production'),
  ('gateway_environment_stripe', 'production', 'Ambiente do gateway Stripe: sandbox ou production')
ON CONFLICT (key) DO NOTHING;