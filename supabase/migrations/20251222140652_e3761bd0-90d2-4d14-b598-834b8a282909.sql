-- Adicionar coluna pushinpay_account_id para afiliados receberem split automático
ALTER TABLE payment_gateway_settings 
ADD COLUMN IF NOT EXISTS pushinpay_account_id TEXT;

COMMENT ON COLUMN payment_gateway_settings.pushinpay_account_id IS 
'Account ID do usuário na PushinPay para receber splits de comissão';