-- ============================================
-- MIGRAÇÃO V6: Adicionar search_path às funções SQL
-- 
-- Esta migração adiciona SET search_path TO 'public' às funções
-- que estavam sem esta configuração de segurança.
-- ============================================

-- 1. clone_checkout_deep_v5
CREATE OR REPLACE FUNCTION public.clone_checkout_deep_v5(p_src uuid, p_dst uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_cols_json   text;
  v_cols_style  text;
  v_sql         text;
  v_found_src   boolean;
BEGIN
  -- Verificar se checkout origem existe
  SELECT EXISTS (SELECT 1 FROM public.checkouts WHERE id = p_src) INTO v_found_src;
  IF NOT v_found_src THEN
    RAISE EXCEPTION 'checkout origem % não encontrado', p_src USING ERRCODE = 'P0001';
  END IF;

  -- Descobrir colunas JSON/JSONB existentes
  SELECT string_agg(quote_ident(column_name) || ' = COALESCE(d.' || quote_ident(column_name) || ', s.' || quote_ident(column_name) || ')', ', ')
  INTO v_cols_json
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'checkouts'
    AND data_type IN ('json', 'jsonb')
    AND column_name NOT IN ('id', 'product_id', 'created_at', 'updated_at', 'slug', 'visits_count', 'is_default');

  -- Descobrir colunas de estilo/cores
  SELECT string_agg(quote_ident(column_name) || ' = COALESCE(d.' || quote_ident(column_name) || ', s.' || quote_ident(column_name) || ')', ', ')
  INTO v_cols_style
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'checkouts'
    AND column_name IN ('primary_color','secondary_color','background_color','text_color','button_color','button_text_color','form_background_color','selected_payment_color','font','seller_name','name')
    AND column_name NOT IN ('id', 'product_id', 'created_at', 'updated_at', 'slug', 'visits_count', 'is_default');

  -- Construir SQL dinâmico
  v_sql := 'UPDATE public.checkouts d SET ' ||
    COALESCE(v_cols_json, '') ||
    CASE WHEN v_cols_json IS NOT NULL AND v_cols_style IS NOT NULL THEN ', ' ELSE '' END ||
    COALESCE(v_cols_style, '') ||
    ' FROM public.checkouts s WHERE s.id = $1 AND d.id = $2';

  -- Executar se houver colunas para copiar
  IF v_cols_json IS NOT NULL OR v_cols_style IS NOT NULL THEN
    EXECUTE v_sql USING p_src, p_dst;
  END IF;

  -- Clonar componentes se existirem
  IF EXISTS (SELECT 1 FROM public.checkout_components WHERE row_id = p_src) THEN
    INSERT INTO public.checkout_components (row_id, component_order, type, content)
    SELECT p_dst, component_order, type, content
    FROM public.checkout_components
    WHERE row_id = p_src
    ORDER BY component_order;
  END IF;

  RAISE LOG 'clone_checkout_deep_v5: copiado layout de % para %', p_src, p_dst;
END;
$function$;

-- 2. clone_checkout_layout
CREATE OR REPLACE FUNCTION public.clone_checkout_layout(p_source_checkout_id uuid, p_target_checkout_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  -- Copia, uma única vez cada coluna de layout (sem tocar em FK/contadores/flags)
  update public.checkouts t
     set name                   = coalesce(s.name || ' (Cópia)', t.name),
         primary_color          = s.primary_color,
         secondary_color        = s.secondary_color,
         background_color       = s.background_color,
         text_color             = s.text_color,
         button_color           = s.button_color,
         button_text_color      = s.button_text_color,
         form_background_color  = s.form_background_color,
         selected_payment_color = s.selected_payment_color,
         font                   = s.font,
         seller_name            = s.seller_name,
         design                 = coalesce(s.design, '{}'::jsonb),
         components             = coalesce(s.components, '[]'::jsonb),
         top_components         = coalesce(s.top_components, '[]'::jsonb),
         bottom_components      = coalesce(s.bottom_components, '[]'::jsonb),
         updated_at             = now()
    from public.checkouts s
   where s.id = p_source_checkout_id
     and t.id = p_target_checkout_id;
end;
$function$;

-- 3. create_order_with_items
CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order_data jsonb, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_total_cents INTEGER := 0;
BEGIN
    INSERT INTO orders (
        vendor_id,
        product_id,
        customer_name,
        customer_email,
        customer_ip,
        amount_cents,
        currency,
        status,
        gateway,
        payment_method
    ) VALUES (
        (p_order_data->>'vendor_id')::UUID,
        (p_order_data->>'product_id')::UUID,
        p_order_data->>'customer_name',
        p_order_data->>'customer_email',
        p_order_data->>'customer_ip',
        (p_order_data->>'amount_cents')::INTEGER,
        COALESCE(p_order_data->>'currency', 'BRL'),
        COALESCE(p_order_data->>'status', 'pending'),
        p_order_data->>'gateway',
        p_order_data->>'payment_method'
    )
    RETURNING id INTO v_order_id;

    RAISE NOTICE '[RPC] Pedido criado: %', v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            amount_cents,
            quantity,
            is_bump
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            (v_item->>'amount_cents')::INTEGER,
            COALESCE((v_item->>'quantity')::INTEGER, 1),
            COALESCE((v_item->>'is_bump')::BOOLEAN, false)
        );
        
        v_total_cents := v_total_cents + (v_item->>'amount_cents')::INTEGER;
        
        RAISE NOTICE '[RPC] Item inserido: % (is_bump: %)', 
            v_item->>'product_name', 
            COALESCE((v_item->>'is_bump')::BOOLEAN, false);
    END LOOP;

    UPDATE orders 
    SET amount_cents = v_total_cents 
    WHERE id = v_order_id;

    RAISE NOTICE '[RPC] Total atualizado: % centavos (R$ %)', 
        v_total_cents, 
        (v_total_cents::NUMERIC / 100);

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'amount_cents', v_total_cents,
        'items_count', jsonb_array_length(p_items)
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '[RPC] Erro na transação: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$function$;

-- 4. create_payment_link_for_offer (TRIGGER) - adicionar search_path
CREATE OR REPLACE FUNCTION public.create_payment_link_for_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  link_slug TEXT;
  link_url TEXT;
  link_id UUID;
BEGIN
  link_slug := public.generate_link_slug(NEW.name, NEW.price);
  link_url := 'https://risecheckout.com/c/' || link_slug;
  INSERT INTO public.payment_links (offer_id, slug, url)
  VALUES (NEW.id, link_slug, link_url);
  RETURN NEW;
END;
$function$;

-- 5. duplicate_checkout_shallow
CREATE OR REPLACE FUNCTION public.duplicate_checkout_shallow(p_source_checkout_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
declare
  v_src   public.checkouts%rowtype;
  v_newid uuid;
begin
  select * into v_src
    from public.checkouts
   where id = p_source_checkout_id;

  if not found then
    raise exception 'Checkout origem % não encontrado', p_source_checkout_id;
  end if;

  insert into public.checkouts(
    product_id,
    name,
    primary_color, secondary_color, background_color,
    text_color, button_color, button_text_color,
    form_background_color, selected_payment_color,
    font, seller_name,
    visits_count, is_default,
    design, components, top_components, bottom_components,
    created_at, updated_at
  )
  values(
    v_src.product_id,
    coalesce(v_src.name || ' (Cópia)', 'Checkout (Cópia)'),
    v_src.primary_color, v_src.secondary_color, v_src.background_color,
    v_src.text_color, v_src.button_color, v_src.button_text_color,
    v_src.form_background_color, v_src.selected_payment_color,
    v_src.font, v_src.seller_name,
    0, false,
    coalesce(v_src.design, '{}'::jsonb),
    coalesce(v_src.components, '[]'::jsonb),
    coalesce(v_src.top_components, '[]'::jsonb),
    coalesce(v_src.bottom_components, '[]'::jsonb),
    now(), now()
  )
  returning id into v_newid;

  return v_newid;
end;
$function$;

-- 6. generate_link_slug - já tem search_path, mas vou garantir
CREATE OR REPLACE FUNCTION public.generate_link_slug(offer_name text DEFAULT NULL::text, offer_price numeric DEFAULT NULL::numeric)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_slug text;
  slug_exists boolean;
  attempts integer := 0;
  max_attempts integer := 100;
BEGIN
  LOOP
    new_slug := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 7)) || 
                '_' || 
                lpad(floor(random() * 1000000)::text, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM payment_links WHERE slug = new_slug) INTO slug_exists;
    
    attempts := attempts + 1;
    
    EXIT WHEN NOT slug_exists OR attempts >= max_attempts;
  END LOOP;
  
  IF attempts >= max_attempts THEN
    RAISE EXCEPTION 'Não foi possível gerar slug único após % tentativas', max_attempts;
  END IF;
  
  RETURN new_slug;
END;
$function$;

-- 7. generate_unique_payment_slug
CREATE OR REPLACE FUNCTION public.generate_unique_payment_slug(p_offer_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_slug text;
  slug_exists boolean;
  attempts integer := 0;
  max_attempts integer := 100;
BEGIN
  LOOP
    new_slug := lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 7)) || 
                '_' || 
                lpad(floor(random() * 1000000)::text, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM payment_links WHERE slug = new_slug) INTO slug_exists;
    
    attempts := attempts + 1;
    
    EXIT WHEN NOT slug_exists OR attempts >= max_attempts;
  END LOOP;
  
  IF attempts >= max_attempts THEN
    RAISE EXCEPTION 'Não foi possível gerar slug único após % tentativas', max_attempts;
  END IF;
  
  RETURN new_slug;
END;
$function$;

-- 8. handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$ 
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$function$;

-- 9. slugify
CREATE OR REPLACE FUNCTION public.slugify(txt text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
declare
  s text := coalesce(txt,'');
begin
  s := lower(unaccent(s));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-|-$)', '', 'g');
  return s;
end;
$function$;