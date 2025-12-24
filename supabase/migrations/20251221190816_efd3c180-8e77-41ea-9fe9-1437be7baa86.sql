-- ============================================================================
-- CORREÇÃO: Funções SECURITY DEFINER com search_path = public
-- ============================================================================

-- 1. Recriar clone_checkout_deep com search_path seguro
CREATE OR REPLACE FUNCTION public.clone_checkout_deep(src_checkout_id uuid, dst_checkout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Copiar checkout_rows
  INSERT INTO public.checkout_rows (checkout_id, layout, row_order)
  SELECT dst_checkout_id, layout, row_order
  FROM public.checkout_rows
  WHERE checkout_id = src_checkout_id;

  -- Copiar checkout_components (usando os novos row_ids)
  INSERT INTO public.checkout_components (row_id, type, content, component_order)
  SELECT 
    dr.id,
    sc.type,
    sc.content,
    sc.component_order
  FROM public.checkout_rows sr
  JOIN public.checkout_components sc ON sc.row_id = sr.id
  JOIN public.checkout_rows dr ON dr.checkout_id = dst_checkout_id AND dr.row_order = sr.row_order
  WHERE sr.checkout_id = src_checkout_id;
END;
$$;

-- 2. Recriar create_payment_link_for_offer com search_path seguro
CREATE OR REPLACE FUNCTION public.create_payment_link_for_offer(p_offer_id uuid, p_slug text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
  v_slug text;
  v_url text;
BEGIN
  -- Gerar slug se não fornecido
  IF p_slug IS NULL THEN
    v_slug := public.generate_unique_payment_slug(p_offer_id);
  ELSE
    v_slug := p_slug;
  END IF;
  
  -- Construir URL
  v_url := '/pay/' || v_slug;
  
  -- Inserir payment_link
  INSERT INTO public.payment_links (offer_id, slug, url, status, is_original)
  VALUES (p_offer_id, v_slug, v_url, 'active', true)
  RETURNING id INTO v_link_id;
  
  RETURN v_link_id;
END;
$$;

-- Notificar PostgREST
NOTIFY pgrst, 'reload schema';