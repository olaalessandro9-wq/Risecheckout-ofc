-- ============================================================
-- FIX: Resolver recursão infinita em RLS de products/checkouts
-- ============================================================
-- PROBLEMA: Policy products_select_public_v2 fazia SELECT em 
-- checkouts, que por sua vez tinha policy que fazia SELECT em 
-- products → loop infinito → erro 500.
--
-- SOLUÇÃO: Usar função SECURITY DEFINER que bypassa RLS.
-- ============================================================

-- 1) Criar função SECURITY DEFINER para verificar checkout público
CREATE OR REPLACE FUNCTION public.is_product_in_active_public_checkout(_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM checkouts c
    JOIN checkout_links cl ON cl.checkout_id = c.id
    JOIN payment_links pl ON pl.id = cl.link_id
    WHERE c.product_id = _product_id
      AND c.status = 'active'
      AND pl.status = 'active'
  );
$$;

-- 2) Garantir permissão de execução para anon e authenticated
GRANT EXECUTE ON FUNCTION public.is_product_in_active_public_checkout(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_product_in_active_public_checkout(uuid) TO authenticated;

-- 3) Dropar policy problemática que causa recursão
DROP POLICY IF EXISTS products_select_public_v2 ON products;

-- 4) Criar nova policy usando a função (sem recursão)
CREATE POLICY products_select_public_v3 ON products
FOR SELECT USING (
  -- Caso 1: Admin pode ver tudo
  has_role((SELECT auth.uid()), 'admin'::app_role)
  
  -- Caso 2: Dono do produto
  OR auth.uid() = user_id
  
  -- Caso 3: Produto ativo no marketplace
  OR (status = 'active' AND show_in_marketplace = true)
  
  -- Caso 4: Produto vinculado a checkout público ativo (via função SECURITY DEFINER)
  OR (status = 'active' AND public.is_product_in_active_public_checkout(id))
);