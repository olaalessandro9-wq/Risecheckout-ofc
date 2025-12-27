-- Remover política antiga de UPDATE (se existir)
DROP POLICY IF EXISTS "affiliates_update_v2" ON affiliates;
DROP POLICY IF EXISTS "affiliates_update" ON affiliates;

-- Nova política: permite producer OU o próprio afiliado fazer UPDATE
CREATE POLICY "affiliates_update_v3" ON affiliates
FOR UPDATE USING (
  -- Condição 1: Produtor pode atualizar afiliados do seu produto
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = affiliates.product_id 
    AND products.user_id = auth.uid()
  )
  OR 
  -- Condição 2: Afiliado pode atualizar seus próprios dados
  auth.uid() = user_id
);