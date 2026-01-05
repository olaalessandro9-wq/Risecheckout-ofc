-- 1. Adicionar colunas na tabela products (se não existirem)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS pix_gateway TEXT DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS credit_card_gateway TEXT DEFAULT 'mercadopago';

-- 2. Migrar dados do checkout default para o produto
UPDATE products p
SET 
  pix_gateway = COALESCE(c.pix_gateway::TEXT, 'mercadopago'),
  credit_card_gateway = COALESCE(c.credit_card_gateway::TEXT, 'mercadopago')
FROM checkouts c
WHERE c.product_id = p.id
  AND c.is_default = true;

-- 3. Comentar colunas antigas (deprecar sem remover)
COMMENT ON COLUMN checkouts.pix_gateway IS 'DEPRECATED: Usar products.pix_gateway';
COMMENT ON COLUMN checkouts.credit_card_gateway IS 'DEPRECATED: Usar products.credit_card_gateway';