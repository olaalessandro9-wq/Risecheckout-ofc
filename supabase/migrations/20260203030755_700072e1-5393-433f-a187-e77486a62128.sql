-- =====================================================
-- RISE V3: Eliminar referências legadas a auth.users
-- =====================================================

-- 1. Reescrever get_user_id_by_email para usar tabela 'users' (SSOT)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  SELECT id INTO found_user_id
  FROM users
  WHERE lower(email) = lower(user_email);
  
  RETURN found_user_id;
END;
$$;

-- 2. Reescrever get_producer_affiliates para usar tabela 'users' (SSOT)
-- Remove dependência de auth.users e profiles
CREATE OR REPLACE FUNCTION public.get_producer_affiliates(producer_id uuid)
RETURNS TABLE(
  affiliate_id uuid,
  affiliate_code text,
  product_id uuid,
  product_name text,
  commission_rate numeric,
  status text,
  created_at timestamptz,
  user_id uuid,
  user_email text,
  user_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as affiliate_id,
    a.affiliate_code,
    a.product_id,
    p.name as product_name,
    a.commission_rate,
    a.status,
    a.created_at,
    a.user_id,
    u.email as user_email,
    u.name as user_name
  FROM affiliates a
  JOIN products p ON p.id = a.product_id
  JOIN users u ON u.id = a.user_id
  WHERE p.user_id = producer_id;
END;
$$;