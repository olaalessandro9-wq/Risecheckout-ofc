-- =====================================================
-- FIX: buyer_product_access para suportar convites sem order_id
-- =====================================================

-- 1) Tornar order_id NULLABLE
ALTER TABLE public.buyer_product_access 
ALTER COLUMN order_id DROP NOT NULL;

-- 2) Remover FK antiga e recriar com ON DELETE SET NULL
ALTER TABLE public.buyer_product_access 
DROP CONSTRAINT IF EXISTS buyer_product_access_order_id_fkey;

ALTER TABLE public.buyer_product_access 
ADD CONSTRAINT buyer_product_access_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- 3) Deduplicar registros (manter o mais recente por buyer+product)
DELETE FROM public.buyer_product_access a
USING public.buyer_product_access b
WHERE a.buyer_id = b.buyer_id 
  AND a.product_id = b.product_id 
  AND a.granted_at < b.granted_at;

-- 4) Remover constraint única antiga (buyer_id, product_id, order_id)
ALTER TABLE public.buyer_product_access 
DROP CONSTRAINT IF EXISTS buyer_product_access_buyer_id_product_id_order_id_key;

-- 5) Criar nova constraint única (buyer_id, product_id)
ALTER TABLE public.buyer_product_access 
ADD CONSTRAINT buyer_product_access_buyer_id_product_id_key 
UNIQUE (buyer_id, product_id);

-- 6) Expandir CHECK de access_type para incluir todos os tipos válidos
ALTER TABLE public.buyer_product_access 
DROP CONSTRAINT IF EXISTS buyer_product_access_access_type_check;

ALTER TABLE public.buyer_product_access 
ADD CONSTRAINT buyer_product_access_access_type_check 
CHECK (access_type IN ('purchase', 'invite', 'lifetime', 'subscription', 'limited'));