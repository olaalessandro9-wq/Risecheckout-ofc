-- Migration: Criar VIEW segura sem tokens (P0-4)
-- Data: 2025-12-14
-- Objetivo: Expor apenas public_key e collector_id, nunca access_token/refresh_token

-- 1) Habilitar RLS na tabela base (defesa em profundidade)
ALTER TABLE vendor_integrations ENABLE ROW LEVEL SECURITY;

-- 2) Criar policy para vendors lerem apenas suas integrações
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vendor_integrations'
      AND policyname = 'Vendors can read own integrations'
  ) THEN
    CREATE POLICY "Vendors can read own integrations"
      ON vendor_integrations
      FOR SELECT
      USING (auth.uid() = vendor_id);
  END IF;
END $$;

-- 3) Criar VIEW segura (Opção B - filtro direto, compatível com qualquer versão)
CREATE OR REPLACE VIEW vendor_integrations_public AS
SELECT
  id,
  vendor_id,
  integration_type,
  active,
  jsonb_build_object(
    'public_key', config->>'public_key',
    'collector_id', config->>'collector_id'
  ) as config,
  created_at,
  updated_at
FROM vendor_integrations
WHERE vendor_id = auth.uid(); -- ✅ Filtro direto na VIEW!

-- 4) Conceder acesso à VIEW
GRANT SELECT ON vendor_integrations_public TO authenticated;

-- 5) Comentário
COMMENT ON VIEW vendor_integrations_public IS 'View pública de integrações SEM tokens secretos (filtrada por auth.uid())';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'VIEW vendor_integrations_public criada com sucesso (sem tokens)';
END $$;
