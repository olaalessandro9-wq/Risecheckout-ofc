-- CORREÇÃO: Trigger link_order_to_buyer usa ON CONFLICT errado
-- A constraint é (buyer_id, product_id), não (buyer_id, product_id, order_id)

CREATE OR REPLACE FUNCTION public.link_order_to_buyer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_id uuid;
BEGIN
  -- Só executa quando status muda para PAID
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    -- Verifica se tem email do cliente
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      
      -- Buscar buyer existente pelo email
      SELECT id INTO v_buyer_id 
      FROM buyer_profiles 
      WHERE LOWER(email) = LOWER(NEW.customer_email);
      
      -- Se não existe, criar buyer (sem senha - precisará definir depois)
      IF v_buyer_id IS NULL THEN
        INSERT INTO buyer_profiles (email, name, phone, password_hash)
        VALUES (
          LOWER(NEW.customer_email), 
          COALESCE(NEW.customer_name, 'Cliente'), 
          NEW.customer_phone,
          'PENDING_PASSWORD_SETUP'
        )
        RETURNING id INTO v_buyer_id;
      END IF;
      
      -- Vincular order ao buyer
      NEW.buyer_id := v_buyer_id;
      
      -- Criar acesso ao produto principal (CORRIGIDO: constraint é buyer_id, product_id)
      INSERT INTO buyer_product_access (buyer_id, product_id, order_id)
      VALUES (v_buyer_id, NEW.product_id, NEW.id)
      ON CONFLICT (buyer_id, product_id) DO UPDATE SET order_id = EXCLUDED.order_id;
      
      -- Criar acesso aos bumps (via order_items)
      INSERT INTO buyer_product_access (buyer_id, product_id, order_id)
      SELECT v_buyer_id, oi.product_id, NEW.id
      FROM order_items oi
      WHERE oi.order_id = NEW.id AND oi.is_bump = true
      ON CONFLICT (buyer_id, product_id) DO UPDATE SET order_id = EXCLUDED.order_id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;