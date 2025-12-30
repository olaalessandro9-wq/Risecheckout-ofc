-- Adiciona campo para marcar entrega externa (sistema próprio do vendedor)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS external_delivery boolean DEFAULT false;

COMMENT ON COLUMN products.external_delivery IS 'Quando true, a entrega é feita por sistema externo (webhook/N8N) e o Rise NÃO envia email de acesso';