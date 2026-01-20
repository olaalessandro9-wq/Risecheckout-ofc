-- ============================================================================
-- RPC: get_payment_link_with_checkout_slug
-- Propósito: Retorna dados do payment_link com checkout_slug via JOINs explícitos
-- Resolve o problema de relacionamento reverso que PostgREST não consegue fazer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_payment_link_with_checkout_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  status TEXT,
  offer_id UUID,
  checkout_slug TEXT,
  checkout_status TEXT,
  product_id UUID,
  product_status TEXT,
  product_support_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.slug,
    pl.status,
    pl.offer_id,
    c.slug AS checkout_slug,
    c.status AS checkout_status,
    o.product_id,
    p.status AS product_status,
    p.support_email AS product_support_email
  FROM payment_links pl
  LEFT JOIN checkout_links cl ON cl.link_id = pl.id
  LEFT JOIN checkouts c ON c.id = cl.checkout_id
  LEFT JOIN offers o ON o.id = pl.offer_id
  LEFT JOIN products p ON p.id = o.product_id
  WHERE pl.slug = p_slug
  LIMIT 1;
END;
$$;

-- Permissões: anon e authenticated podem chamar (é público para checkout)
GRANT EXECUTE ON FUNCTION public.get_payment_link_with_checkout_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_payment_link_with_checkout_slug(TEXT) TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_payment_link_with_checkout_slug(TEXT) IS 
'Retorna dados do payment_link incluindo checkout_slug via JOINs explícitos. 
Resolve o problema de relacionamento reverso (checkout_links → payment_links) 
que PostgREST não consegue resolver automaticamente.';