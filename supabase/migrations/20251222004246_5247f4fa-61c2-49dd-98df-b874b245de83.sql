-- Função RPC para buscar pedido validando access_token
-- Permite acesso público à página de pagamento PIX sem expor dados sensíveis
CREATE OR REPLACE FUNCTION get_order_for_payment(p_order_id uuid, p_access_token text)
RETURNS TABLE (
  id uuid,
  amount_cents integer,
  product_id uuid,
  vendor_id uuid,
  pix_qr_code text,
  pix_status text,
  status text,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_document text,
  created_at timestamptz,
  tracking_parameters jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.amount_cents,
    o.product_id,
    o.vendor_id,
    o.pix_qr_code,
    o.pix_status,
    o.status,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.customer_document,
    o.created_at,
    NULL::jsonb as tracking_parameters
  FROM orders o
  WHERE o.id = p_order_id 
    AND o.access_token = p_access_token;
$$;