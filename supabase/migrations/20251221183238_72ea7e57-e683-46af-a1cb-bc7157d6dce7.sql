-- ============================================================================
-- MIGRAÇÃO FINAL v2: Consolidar políticas webhook_products
-- ============================================================================

-- Dropar TODAS as políticas de webhook_products (incluindo a que já existe)
DROP POLICY IF EXISTS "Service role full access on webhook_products" ON public.webhook_products;
DROP POLICY IF EXISTS "Vendors can manage their own webhook_products" ON public.webhook_products;
DROP POLICY IF EXISTS "webhook_products_vendor_access" ON public.webhook_products;
DROP POLICY IF EXISTS "Vendors manage own webhook_products" ON public.webhook_products;

-- Criar política única otimizada com nome definitivo
CREATE POLICY "vendor_webhook_products_access"
ON public.webhook_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.outbound_webhooks ow
    WHERE ow.id = webhook_products.webhook_id
      AND ow.vendor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.outbound_webhooks ow
    WHERE ow.id = webhook_products.webhook_id
      AND ow.vendor_id = auth.uid()
  )
);

-- Notificar PostgREST
NOTIFY pgrst, 'reload schema';