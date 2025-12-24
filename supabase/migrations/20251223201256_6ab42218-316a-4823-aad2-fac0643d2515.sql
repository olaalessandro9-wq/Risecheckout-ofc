-- ============================================
-- MIGRATION: Add asaas_wallet_id columns for Split functionality
-- ============================================

-- Add asaas_wallet_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;

COMMENT ON COLUMN public.profiles.asaas_wallet_id IS 
'Wallet ID da conta Asaas do usuário para receber splits de pagamentos';

-- Add asaas_wallet_id to affiliates table (can be different from profile)
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;

COMMENT ON COLUMN public.affiliates.asaas_wallet_id IS 
'Wallet ID específico do afiliado para receber comissões via Asaas. Se null, usa o wallet_id do profile.';