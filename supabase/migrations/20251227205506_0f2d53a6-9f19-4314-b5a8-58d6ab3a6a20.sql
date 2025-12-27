-- Função SECURITY DEFINER para retornar info do afiliado para checkout público
-- Isso contorna o problema de RLS que bloqueia acesso anônimo às tabelas affiliates e vendor_integrations

CREATE OR REPLACE FUNCTION public.get_affiliate_checkout_info(
  p_affiliate_code TEXT, 
  p_product_id UUID
)
RETURNS TABLE (
  pix_gateway TEXT,
  credit_card_gateway TEXT,
  mercadopago_public_key TEXT,
  stripe_public_key TEXT
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.pix_gateway::TEXT,
    a.credit_card_gateway::TEXT,
    (
      SELECT (vi.config->>'public_key')::TEXT
      FROM vendor_integrations vi
      WHERE vi.vendor_id = a.user_id 
        AND vi.integration_type = 'MERCADOPAGO' 
        AND vi.active = true
      LIMIT 1
    ) as mercadopago_public_key,
    (
      SELECT (vi.config->>'public_key')::TEXT
      FROM vendor_integrations vi
      WHERE vi.vendor_id = a.user_id 
        AND vi.integration_type = 'STRIPE' 
        AND vi.active = true
      LIMIT 1
    ) as stripe_public_key
  FROM affiliates a
  WHERE a.affiliate_code = p_affiliate_code
    AND a.product_id = p_product_id
    AND a.status = 'active'
  LIMIT 1;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_affiliate_checkout_info IS 'Retorna gateways e public keys do afiliado para uso no checkout público. SECURITY DEFINER para contornar RLS.';