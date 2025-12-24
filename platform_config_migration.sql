-- Criar tabela para configurações da plataforma
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração do Mercado Pago Split
INSERT INTO platform_config (key, value, description)
VALUES (
  'mercadopago_platform',
  '{"collector_id": "3002802852", "split_percentage": 5, "enabled": true}'::jsonb,
  'Configurações da plataforma para split do Mercado Pago'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

-- Comentário explicativo
COMMENT ON TABLE platform_config IS 'Configurações globais da plataforma RiseCheckout';
COMMENT ON COLUMN platform_config.key IS 'Chave única de identificação da configuração';
COMMENT ON COLUMN platform_config.value IS 'Valor da configuração em formato JSON';
