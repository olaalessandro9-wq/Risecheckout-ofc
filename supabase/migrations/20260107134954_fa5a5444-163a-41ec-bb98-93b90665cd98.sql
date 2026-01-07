-- 1. Dropar política atual incompleta
DROP POLICY IF EXISTS "Vendors podem gerenciar liberação dos seus conteúdos" 
ON public.content_release_settings;

-- 2. Criar política completa com USING e WITH CHECK
CREATE POLICY "Vendors podem gerenciar liberação dos seus conteúdos"
ON public.content_release_settings
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM product_member_content c
    JOIN product_member_modules m ON m.id = c.module_id
    JOIN products p ON p.id = m.product_id
    WHERE c.id = content_release_settings.content_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM product_member_content c
    JOIN product_member_modules m ON m.id = c.module_id
    JOIN products p ON p.id = m.product_id
    WHERE c.id = content_id
      AND p.user_id = auth.uid()
  )
);