-- ============================================
-- FASE 1: Corrigir RLS de pix_transactions
-- VULNERABILIDADE: INSERT e UPDATE permitem qualquer um
-- SOLUÇÃO: Apenas service_role pode INSERT/UPDATE (via Edge Functions)
-- ============================================

-- Remover policies permissivas
DROP POLICY IF EXISTS "pix_transactions_public_insert_v2" ON pix_transactions;
DROP POLICY IF EXISTS "pix_transactions_public_update_v2" ON pix_transactions;
DROP POLICY IF EXISTS "pix_transactions_insert_v2" ON pix_transactions;
DROP POLICY IF EXISTS "pix_transactions_update_v2" ON pix_transactions;

-- SELECT: usuário vê apenas seus próprios workspace_id
DROP POLICY IF EXISTS "pix_transactions_select_v2" ON pix_transactions;
CREATE POLICY "pix_transactions_select_v2" ON pix_transactions
FOR SELECT TO public
USING (workspace_id = (SELECT auth.uid()));

-- INSERT: BLOQUEADO para usuários normais (apenas service_role via Edge Functions)
CREATE POLICY "pix_transactions_insert_service_only" ON pix_transactions
FOR INSERT TO public
WITH CHECK (false);

-- UPDATE: BLOQUEADO para usuários normais (apenas service_role via Edge Functions)
CREATE POLICY "pix_transactions_update_service_only" ON pix_transactions
FOR UPDATE TO public
USING (false);

-- DELETE: BLOQUEADO 
DROP POLICY IF EXISTS "pix_transactions_delete_v2" ON pix_transactions;
CREATE POLICY "pix_transactions_delete_blocked" ON pix_transactions
FOR DELETE TO public
USING (false);

-- ============================================
-- FASE 2: Corrigir RLS de coupons
-- VULNERABILIDADE: INSERT permite qualquer usuário autenticado
-- SOLUÇÃO: Apenas quem tem produtos pode criar cupons
-- ============================================

-- Remover policy permissiva de INSERT
DROP POLICY IF EXISTS "coupons_insert_v2" ON coupons;

-- INSERT: apenas usuários que possuem pelo menos um produto
CREATE POLICY "coupons_insert_v2" ON coupons
FOR INSERT TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.user_id = (SELECT auth.uid())
  )
);

-- ============================================
-- COMENTÁRIO DE SEGURANÇA
-- ============================================
COMMENT ON POLICY "pix_transactions_insert_service_only" ON pix_transactions IS 
'Transações PIX só podem ser criadas via Edge Functions (service_role). Usuários não podem inserir diretamente.';

COMMENT ON POLICY "pix_transactions_update_service_only" ON pix_transactions IS 
'Transações PIX só podem ser atualizadas via Edge Functions (service_role). Usuários não podem modificar diretamente.';

COMMENT ON POLICY "coupons_insert_v2" ON coupons IS 
'Apenas usuários que possuem produtos podem criar cupons.';