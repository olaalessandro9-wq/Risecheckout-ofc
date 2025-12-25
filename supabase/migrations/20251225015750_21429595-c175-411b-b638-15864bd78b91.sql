-- Fase 3: Criar índice em profiles.asaas_wallet_id para escalabilidade
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_wallet 
ON profiles(asaas_wallet_id) 
WHERE asaas_wallet_id IS NOT NULL;

-- Fase 4: Remover coluna morta affiliates.asaas_wallet_id
ALTER TABLE affiliates DROP COLUMN IF EXISTS asaas_wallet_id;