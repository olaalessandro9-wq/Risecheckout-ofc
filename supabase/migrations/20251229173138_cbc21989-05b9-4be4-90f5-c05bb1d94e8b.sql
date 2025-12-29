-- ============================================================
-- FIX: Permitir acesso público a produtos com checkout ativo
-- ============================================================
-- PROBLEMA: Produtos com show_in_marketplace=false mas com 
-- checkout público ativo estavam bloqueados para clientes.
-- 
-- SOLUÇÃO: Adicionar condição que permite SELECT em produtos
-- vinculados a checkouts públicos ativos.
-- ============================================================

-- Dropar política antiga
DROP POLICY IF EXISTS products_select_public_marketplace ON products;

-- Criar nova política mais abrangente
CREATE POLICY products_select_public_v2 ON products
FOR SELECT USING (
  -- Caso 1: Admin pode ver tudo
  has_role((SELECT auth.uid()), 'admin'::app_role)
  
  -- Caso 2: Dono do produto
  OR auth.uid() = user_id
  
  -- Caso 3: Produto ativo no marketplace
  OR (status = 'active' AND show_in_marketplace = true)
  
  -- Caso 4: Produto vinculado a checkout público ativo
  OR (
    status = 'active' 
    AND id IN (
      SELECT c.product_id 
      FROM checkouts c
      JOIN checkout_links cl ON cl.checkout_id = c.id
      JOIN payment_links pl ON pl.id = cl.link_id
      WHERE c.status = 'active' 
        AND pl.status = 'active'
    )
  )
);