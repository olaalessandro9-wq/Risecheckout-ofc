-- ============================================
-- FIX: get_producer_affiliates RPC
-- ============================================
-- Problem: This RPC was using auth.uid() which returns NULL when called via service_role
-- Solution: Accept p_user_id as parameter (injected by rpc-proxy from validated session)

CREATE OR REPLACE FUNCTION public.get_producer_affiliates(
  p_user_id UUID,
  search_term TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  product_id UUID,
  product_name TEXT,
  product_settings JSONB,
  affiliate_name TEXT,
  affiliate_email TEXT,
  status TEXT,
  commission_rate INTEGER,
  affiliate_code TEXT,
  total_sales_count INTEGER,
  total_sales_amount INTEGER,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.product_id,
    p.name as product_name,
    p.affiliate_settings as product_settings,
    COALESCE(pr.name, 'Nome não informado') as affiliate_name,
    COALESCE(pr.email, 'Email não disponível')::text as affiliate_email,
    a.status,
    a.commission_rate,
    a.affiliate_code,
    a.total_sales_count,
    a.total_sales_amount,
    a.created_at
  FROM
    affiliates a
  JOIN
    products p ON a.product_id = p.id
  LEFT JOIN
    profiles pr ON a.user_id = pr.id
  WHERE
    p.user_id = p_user_id
    AND (
      search_term = '' OR
      pr.name ILIKE '%' || search_term || '%' OR
      pr.email ILIKE '%' || search_term || '%' OR
      p.name ILIKE '%' || search_term || '%' OR
      a.affiliate_code ILIKE '%' || search_term || '%'
    )
  ORDER BY
    a.created_at DESC;
END;
$$;

-- Grant execute to authenticated and anon (will be called via service_role anyway)
GRANT EXECUTE ON FUNCTION public.get_producer_affiliates(UUID, TEXT) TO authenticated, anon;