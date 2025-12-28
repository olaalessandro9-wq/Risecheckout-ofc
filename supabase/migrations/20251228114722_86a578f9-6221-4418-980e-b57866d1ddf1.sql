-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Restringir UPDATE em affiliates
-- =====================================================
-- PROBLEMA: Policy "affiliates_update_v3" permite que afiliado 
-- atualize QUALQUER campo (commission_rate, status, etc.)
-- SOLUÇÃO: Apenas produtor pode fazer UPDATE via RLS
--          Afiliado usa Edge Function com validações
-- =====================================================

-- 1. Remover policies de UPDATE existentes (vulneráveis)
DROP POLICY IF EXISTS "affiliates_update_v3" ON affiliates;
DROP POLICY IF EXISTS "affiliates_update_own" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update their own gateway settings" ON affiliates;

-- 2. Nova policy: APENAS produtor pode fazer UPDATE direto
-- Afiliado deve usar Edge Function (update-affiliate-settings)
CREATE POLICY "affiliates_update_producer_only" ON affiliates
FOR UPDATE USING (
  -- Apenas o dono do produto pode atualizar registros de afiliados
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = affiliates.product_id 
    AND products.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = affiliates.product_id 
    AND products.user_id = auth.uid()
  )
);

-- 3. Adicionar comentário explicativo na tabela
COMMENT ON POLICY "affiliates_update_producer_only" ON affiliates IS 
'Apenas produtores podem atualizar afiliados via RLS. Afiliados usam Edge Function update-affiliate-settings para atualizar gateways/cancelar.';

-- 4. Garantir que políticas de SELECT continuam funcionando
-- (Afiliado pode VER seus próprios dados)
DROP POLICY IF EXISTS "affiliates_select_v3" ON affiliates;

CREATE POLICY "affiliates_select_own_or_producer" ON affiliates
FOR SELECT USING (
  -- Afiliado pode ver seus próprios registros
  user_id = auth.uid()
  OR
  -- Produtor pode ver afiliados de seus produtos
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = affiliates.product_id 
    AND products.user_id = auth.uid()
  )
);