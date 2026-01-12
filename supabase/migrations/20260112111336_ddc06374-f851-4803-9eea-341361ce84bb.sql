-- Corrigir a função get_dashboard_metrics para usar comparações case-insensitive
-- Isso garante que 'paid', 'PAID', 'Paid' sejam todos contados corretamente

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  p_vendor_id uuid, 
  p_start_date timestamp with time zone, 
  p_end_date timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    -- Contadores (case-insensitive)
    'paid_count', COUNT(*) FILTER (WHERE LOWER(status) = 'paid'),
    'pending_count', COUNT(*) FILTER (WHERE LOWER(status) = 'pending'),
    'total_count', COUNT(*),
    
    -- Receitas em centavos (case-insensitive)
    'paid_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'paid'), 0),
    'pending_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'pending'), 0),
    'total_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) IN ('paid', 'pending')), 0),
    
    -- Por método de pagamento (case-insensitive)
    'pix_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'paid' AND LOWER(payment_method) = 'pix'), 0),
    'credit_card_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'paid' AND LOWER(payment_method) IN ('credit_card', 'creditcard')), 0),
    
    -- Taxas estimadas (3.99% + R$0.39 por transação paga)
    'fees_cents', COALESCE(
      SUM(
        ROUND(amount_cents * 0.0399) + 39
      ) FILTER (WHERE LOWER(status) = 'paid'),
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

-- Normalizar todos os status existentes para lowercase
UPDATE orders SET status = LOWER(status) WHERE status != LOWER(status);

-- Normalizar payment_method para lowercase também
UPDATE orders SET payment_method = LOWER(payment_method) WHERE payment_method IS NOT NULL AND payment_method != LOWER(payment_method);