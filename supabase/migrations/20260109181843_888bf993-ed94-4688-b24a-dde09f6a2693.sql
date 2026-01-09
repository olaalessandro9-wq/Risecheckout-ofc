-- ============================================================================
-- RPC: get_dashboard_metrics
-- Retorna métricas agregadas do dashboard sem limite de paginação
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  p_vendor_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Contadores
    'paid_count', COUNT(*) FILTER (WHERE status = 'paid'),
    'pending_count', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_count', COUNT(*),
    
    -- Receitas em centavos
    'paid_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0),
    'pending_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE status = 'pending'), 0),
    'total_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE status IN ('paid', 'pending')), 0),
    
    -- Por método de pagamento (apenas pagos)
    'pix_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid' AND payment_method = 'pix'), 0),
    'credit_card_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid' AND payment_method = 'credit_card'), 0),
    
    -- Taxas estimadas (3.99% + R$ 0.39 por transação paga)
    'fees_cents', COALESCE(
      SUM(
        ROUND(amount_cents * 0.0399) + 39
      ) FILTER (WHERE status = 'paid'),
      0
    )
  ) INTO result
  FROM orders
  WHERE vendor_id = p_vendor_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date;
  
  RETURN result;
END;
$$;

-- Garantir que a função pode ser chamada via RPC
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;