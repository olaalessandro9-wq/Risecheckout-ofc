-- ============================================================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS - RISECHECKOUT (CORRIGIDO)
-- Mantém apenas: Owner (alessanderlaem@gmail.com) e 7 pedidos reais
-- ============================================================================

-- ============================================================================
-- FASE 1: Excluir dados dependentes de pedidos de teste
-- ============================================================================

-- 1.1 Excluir order_events de pedidos de teste
DELETE FROM order_events 
WHERE order_id NOT IN (
  '2184bc92-aa1a-4101-9163-97f1026200da',
  'cb7a7816-9f54-4d23-842b-c3f707f262d9',
  '1c8aaafa-6ab3-4352-84e3-f829c003c826',
  '9e867864-71fd-4a29-b3fa-8c2837455226',
  '82da8424-20c6-4f7e-8aa4-4d17d8dcaea1',
  '37dac21c-30da-4cee-85ba-3be357a4128f',
  'aa702e65-fef4-4ad8-9823-4f41065fbbbc'
);

-- 1.2 Excluir order_items de pedidos de teste
DELETE FROM order_items 
WHERE order_id NOT IN (
  '2184bc92-aa1a-4101-9163-97f1026200da',
  'cb7a7816-9f54-4d23-842b-c3f707f262d9',
  '1c8aaafa-6ab3-4352-84e3-f829c003c826',
  '9e867864-71fd-4a29-b3fa-8c2837455226',
  '82da8424-20c6-4f7e-8aa4-4d17d8dcaea1',
  '37dac21c-30da-4cee-85ba-3be357a4128f',
  'aa702e65-fef4-4ad8-9823-4f41065fbbbc'
);

-- 1.3 Excluir pedidos de teste
DELETE FROM orders 
WHERE id NOT IN (
  '2184bc92-aa1a-4101-9163-97f1026200da',
  'cb7a7816-9f54-4d23-842b-c3f707f262d9',
  '1c8aaafa-6ab3-4352-84e3-f829c003c826',
  '9e867864-71fd-4a29-b3fa-8c2837455226',
  '82da8424-20c6-4f7e-8aa4-4d17d8dcaea1',
  '37dac21c-30da-4cee-85ba-3be357a4128f',
  'aa702e65-fef4-4ad8-9823-4f41065fbbbc'
);

-- ============================================================================
-- FASE 2: Excluir dados de usuarios de teste
-- ============================================================================

-- 2.1 Excluir checkout_visits de usuarios de teste
DELETE FROM checkout_visits 
WHERE checkout_id IN (
  SELECT id FROM checkouts 
  WHERE product_id IN (
    SELECT id FROM products 
    WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
  )
);

-- 2.2 Excluir checkout_sessions de usuarios de teste
DELETE FROM checkout_sessions 
WHERE vendor_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.3 Excluir checkout_components de usuarios de teste
DELETE FROM checkout_components 
WHERE row_id IN (
  SELECT cr.id FROM checkout_rows cr
  JOIN checkouts c ON cr.checkout_id = c.id
  JOIN products p ON c.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.4 Excluir checkout_rows de usuarios de teste
DELETE FROM checkout_rows 
WHERE checkout_id IN (
  SELECT c.id FROM checkouts c
  JOIN products p ON c.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.5 Excluir checkout_links de usuarios de teste (via offers)
DELETE FROM checkout_links 
WHERE link_id IN (
  SELECT pl.id FROM payment_links pl
  JOIN offers o ON pl.offer_id = o.id
  JOIN products p ON o.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.6 Excluir order_bumps de usuarios de teste
DELETE FROM order_bumps 
WHERE checkout_id IN (
  SELECT c.id FROM checkouts c
  JOIN products p ON c.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.7 Excluir upsells de usuarios de teste
DELETE FROM upsells 
WHERE checkout_id IN (
  SELECT c.id FROM checkouts c
  JOIN products p ON c.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.8 Excluir downsells de usuarios de teste
DELETE FROM downsells 
WHERE checkout_id IN (
  SELECT c.id FROM checkouts c
  JOIN products p ON c.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.9 Excluir checkouts de usuarios de teste
DELETE FROM checkouts 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.10 Excluir payment_links de usuarios de teste (via offers)
DELETE FROM payment_links 
WHERE offer_id IN (
  SELECT o.id FROM offers o
  JOIN products p ON o.product_id = p.id
  WHERE p.user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.11 Excluir offers de usuarios de teste
DELETE FROM offers 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.12 Excluir coupon_products de usuarios de teste
DELETE FROM coupon_products 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.13 Excluir affiliate_pixels de usuarios de teste
DELETE FROM affiliate_pixels 
WHERE affiliate_id IN (
  SELECT id FROM affiliates 
  WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.14 Excluir affiliates de usuarios de teste
DELETE FROM affiliates 
WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.15 Excluir product_member_content de usuarios de teste
DELETE FROM product_member_content 
WHERE module_id IN (
  SELECT id FROM product_member_modules 
  WHERE product_id IN (
    SELECT id FROM products 
    WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
  )
);

-- 2.16 Excluir product_member_modules de usuarios de teste
DELETE FROM product_member_modules 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e'
);

-- 2.17 Excluir products de usuarios de teste
DELETE FROM products 
WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.18 Excluir outbound_webhooks de usuarios de teste
DELETE FROM outbound_webhooks 
WHERE vendor_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.19 Excluir vendor_integrations de usuarios de teste
DELETE FROM vendor_integrations 
WHERE vendor_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.20 Excluir vendor_integrations_public de usuarios de teste
DELETE FROM vendor_integrations_public 
WHERE vendor_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.21 Excluir vendor_profiles de usuarios de teste
DELETE FROM vendor_profiles 
WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.22 Excluir notifications de usuarios de teste
DELETE FROM notifications 
WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.23 Excluir oauth_states de usuarios de teste
DELETE FROM oauth_states 
WHERE vendor_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.24 Excluir user_roles de usuarios de teste
DELETE FROM user_roles 
WHERE user_id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- 2.25 Excluir profiles de usuarios de teste
DELETE FROM profiles 
WHERE id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';

-- ============================================================================
-- FASE 3: Excluir usuarios de teste do auth.users
-- ============================================================================

DELETE FROM auth.users 
WHERE id != 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';