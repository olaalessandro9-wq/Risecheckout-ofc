-- ============================================
-- MIGRATION 007: RLS (Row Level Security) para marketplace
-- Descrição: Política de acesso público ao marketplace
-- Data: 20/12/2025
-- Autor: Manus AI
-- CORREÇÃO: NÃO duplica user_id = auth.uid() (feedback Lovable 2.0)
-- ============================================

-- Política ESPECÍFICA para marketplace público
-- Nota: A política "owner_read_products" já cobre user_id = auth.uid()
-- O Supabase usa OR implícito entre políticas, então não precisamos duplicar

CREATE POLICY "marketplace_public_access"
ON products FOR SELECT
USING (
  show_in_marketplace = true 
  AND status = 'active'
  AND (affiliate_settings->>'enabled')::boolean = true
);

-- Comentário
COMMENT ON POLICY "marketplace_public_access" ON products IS 
'Permite acesso público aos produtos exibidos no marketplace (não duplica owner check)';

-- Nota técnica:
-- Políticas existentes no banco:
-- 1. owner_read_products: (user_id = auth.uid())
-- 2. authenticated_view_products_with_affiliate_program: affiliate_settings->>'enabled' = true
-- 3. anon_select_products: status = 'active'
-- 
-- Esta nova política marketplace_public_access é ADITIVA e específica para marketplace.
-- O Supabase combina todas as políticas com OR, então:
-- - Donos veem seus produtos (via owner_read_products)
-- - Público vê produtos no marketplace (via marketplace_public_access)
