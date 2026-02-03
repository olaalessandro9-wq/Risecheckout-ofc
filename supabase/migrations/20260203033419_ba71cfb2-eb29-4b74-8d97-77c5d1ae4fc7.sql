-- ============================================================================
-- RISE V3 MIGRATION: Triggers SSOT para tabela users
-- ============================================================================
-- Esta migração reescreve 5 triggers críticas para usar a tabela users
-- como Single Source of Truth (SSOT), eliminando dependências de:
-- - profiles (legado)
-- - buyer_profiles (legado)
-- ============================================================================

-- ============================================================================
-- 1. handle_new_user - Criar usuário na tabela users (não mais em profiles)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- RISE V3: Criar registro na tabela users (SSOT)
  -- NÃO mais cria em profiles (tabela legada)
  INSERT INTO public.users (id, email, name, phone, cpf_cnpj, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf_cnpj', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), users.phone),
    cpf_cnpj = COALESCE(NULLIF(EXCLUDED.cpf_cnpj, ''), users.cpf_cnpj),
    updated_at = NOW();
  
  -- Atribuir role 'seller' por padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'seller')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 2. link_order_to_buyer - Usar users em vez de buyer_profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.link_order_to_buyer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_id UUID;
BEGIN
  -- Só executa quando status muda para PAID
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    -- Verifica se tem email do cliente
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      
      -- RISE V3: Buscar buyer existente na tabela users (SSOT)
      SELECT id INTO v_buyer_id 
      FROM users 
      WHERE LOWER(email) = LOWER(NEW.customer_email);
      
      -- Se não existe, criar na tabela users
      IF v_buyer_id IS NULL THEN
        INSERT INTO users (email, name, phone, user_type, created_at, updated_at)
        VALUES (
          LOWER(NEW.customer_email), 
          COALESCE(NEW.customer_name, 'Cliente'), 
          NEW.customer_phone,
          'buyer',
          NOW(),
          NOW()
        )
        RETURNING id INTO v_buyer_id;
        
        -- Atribuir role de buyer
        INSERT INTO user_roles (user_id, role)
        VALUES (v_buyer_id, 'buyer')
        ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
      
      -- Vincular order ao buyer
      NEW.buyer_id := v_buyer_id;
      
      -- Criar acesso ao produto principal
      INSERT INTO buyer_product_access (buyer_id, product_id, order_id, granted_at, is_active)
      VALUES (v_buyer_id, NEW.product_id, NEW.id, NOW(), true)
      ON CONFLICT (buyer_id, product_id) DO UPDATE SET 
        order_id = EXCLUDED.order_id,
        is_active = true;
      
      -- Criar acesso aos bumps (via order_items)
      INSERT INTO buyer_product_access (buyer_id, product_id, order_id, granted_at, is_active)
      SELECT v_buyer_id, oi.product_id, NEW.id, NOW(), true
      FROM order_items oi
      WHERE oi.order_id = NEW.id AND oi.is_bump = true
      ON CONFLICT (buyer_id, product_id) DO UPDATE SET 
        order_id = EXCLUDED.order_id,
        is_active = true;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 3. notify_producer_new_affiliate - Ler de users em vez de profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_producer_new_affiliate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product_name TEXT;
  v_affiliate_name TEXT;
  v_producer_id UUID;
BEGIN
  IF NEW.status = 'pending' THEN
    -- Buscar produto e produtor
    SELECT p.name, p.user_id INTO v_product_name, v_producer_id
    FROM products p WHERE p.id = NEW.product_id;
    
    -- RISE V3: Buscar nome do afiliado na tabela users (SSOT)
    SELECT u.name INTO v_affiliate_name
    FROM users u WHERE u.id = NEW.user_id;
    
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_producer_id,
      'new_affiliate_request',
      'Nova solicitação de afiliação',
      COALESCE(v_affiliate_name, 'Usuário') || ' solicitou promover "' || v_product_name || '"',
      jsonb_build_object(
        'affiliate_id', NEW.id,
        'product_id', NEW.product_id,
        'affiliate_user_id', NEW.user_id,
        'product_name', v_product_name,
        'affiliate_name', v_affiliate_name
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 4. set_admin_zero_fee - Atualizar users em vez de profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_admin_zero_fee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Quando um usuário recebe role 'admin', define taxa 0%
  IF NEW.role = 'admin' THEN
    -- RISE V3: Atualizar na tabela users (SSOT)
    UPDATE users 
    SET custom_fee_percent = 0,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RAISE NOTICE '[set_admin_zero_fee] Admin % definido com taxa 0%%', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 5. get_vendor_public_key - Ler de users em vez de profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_vendor_public_key(p_vendor_id uuid)
RETURNS TABLE(public_key text, test_mode_enabled boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ 
BEGIN 
  -- RISE V3: Buscar test keys da tabela users (SSOT)
  RETURN QUERY 
  SELECT u.test_public_key::TEXT as public_key, u.test_mode_enabled as test_mode_enabled 
  FROM users u 
  WHERE u.id = p_vendor_id 
    AND u.test_mode_enabled = true 
    AND u.test_public_key IS NOT NULL 
  LIMIT 1; 
  
  -- Fallback para vendor_integrations se não tem test mode
  IF NOT FOUND THEN 
    RETURN QUERY 
    SELECT (vi.config->>'public_key')::TEXT as public_key, false as test_mode_enabled 
    FROM vendor_integrations vi 
    WHERE vi.vendor_id = p_vendor_id 
      AND vi.integration_type = 'MERCADOPAGO' 
      AND vi.active = true 
      AND vi.config->>'public_key' IS NOT NULL 
    LIMIT 1; 
  END IF; 
END; 
$function$;

-- ============================================================================
-- 6. sync_checkout_payment_keys - Atualizar para usar users se necessário
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_checkout_payment_keys()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ 
BEGIN 
  -- Buscar MercadoPago public key do vendor
  SELECT vi.config->>'public_key' INTO NEW.mercadopago_public_key 
  FROM vendor_integrations vi 
  INNER JOIN products p ON p.user_id = vi.vendor_id 
  WHERE p.id = NEW.product_id 
    AND vi.integration_type = 'MERCADOPAGO' 
    AND vi.active = true 
  LIMIT 1; 
  
  -- Buscar Stripe publishable key do vendor
  SELECT vi.config->>'publishable_key' INTO NEW.stripe_public_key 
  FROM vendor_integrations vi 
  INNER JOIN products p ON p.user_id = vi.vendor_id 
  WHERE p.id = NEW.product_id 
    AND vi.integration_type = 'STRIPE' 
    AND vi.active = true 
  LIMIT 1; 
  
  RETURN NEW; 
END; 
$function$;

-- ============================================================================
-- 7. Garantir que tabela users tenha os campos necessários
-- ============================================================================
DO $$
BEGIN
  -- Adicionar user_type se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE public.users ADD COLUMN user_type TEXT DEFAULT 'vendor';
  END IF;
  
  -- Adicionar custom_fee_percent se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'custom_fee_percent'
  ) THEN
    ALTER TABLE public.users ADD COLUMN custom_fee_percent NUMERIC(5,2) DEFAULT NULL;
  END IF;
  
  -- Adicionar test_mode_enabled se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'test_mode_enabled'
  ) THEN
    ALTER TABLE public.users ADD COLUMN test_mode_enabled BOOLEAN DEFAULT false;
  END IF;
  
  -- Adicionar test_public_key se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'test_public_key'
  ) THEN
    ALTER TABLE public.users ADD COLUMN test_public_key TEXT DEFAULT NULL;
  END IF;
  
  -- Adicionar cpf_cnpj se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'cpf_cnpj'
  ) THEN
    ALTER TABLE public.users ADD COLUMN cpf_cnpj TEXT DEFAULT NULL;
  END IF;
END $$;

-- ============================================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================
COMMENT ON FUNCTION public.handle_new_user() IS 
'RISE V3: Cria novo usuário na tabela users (SSOT). Não usa mais profiles.';

COMMENT ON FUNCTION public.link_order_to_buyer() IS 
'RISE V3: Vincula orders a buyers na tabela users (SSOT). Não usa mais buyer_profiles.';

COMMENT ON FUNCTION public.notify_producer_new_affiliate() IS 
'RISE V3: Notifica produtor sobre novo afiliado. Lê de users (SSOT).';

COMMENT ON FUNCTION public.set_admin_zero_fee() IS 
'RISE V3: Define taxa 0% para admins na tabela users (SSOT).';

COMMENT ON FUNCTION public.get_vendor_public_key(uuid) IS 
'RISE V3: Busca public key do vendor na tabela users (SSOT).';