-- LIMPEZA TOTAL - RISE V3 (VERSÃO CORRETA FINAL)
DO $$
DECLARE
  v_owner_id UUID := 'ccff612c-93e6-4acc-85d9-7c9d978a7e4e';
  v_real_buyer_id UUID := '9f2df488-85ed-42b8-9c5c-8ea4669e1730';
BEGIN
  -- Affiliates
  DELETE FROM affiliate_pixels;
  DELETE FROM affiliate_audit_log;
  DELETE FROM affiliates;

  -- Buyer data (manter buyer real)
  DELETE FROM buyer_sessions WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_groups WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_content_access WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_content_progress WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_product_access WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_quiz_attempts WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_saved_cards WHERE buyer_id != v_real_buyer_id;
  DELETE FROM certificates WHERE buyer_id != v_real_buyer_id;
  DELETE FROM buyer_audit_log WHERE buyer_id != v_real_buyer_id;

  -- Producer (manter owner)
  DELETE FROM producer_sessions WHERE producer_id != v_owner_id;
  DELETE FROM producer_audit_log WHERE producer_id != v_owner_id;

  -- Orders
  DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE vendor_id != v_owner_id);
  DELETE FROM order_events WHERE vendor_id != v_owner_id;
  DELETE FROM orders WHERE vendor_id != v_owner_id;

  -- User/Buyer profiles
  DELETE FROM user_roles WHERE user_id != v_owner_id;
  DELETE FROM buyer_profiles WHERE id != v_real_buyer_id;

  -- Product dependencies
  DELETE FROM order_bumps WHERE checkout_id IN (SELECT c.id FROM checkouts c JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM downsells WHERE checkout_id IN (SELECT c.id FROM checkouts c JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM upsells WHERE checkout_id IN (SELECT c.id FROM checkouts c JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM checkout_visits WHERE checkout_id IN (SELECT c.id FROM checkouts c JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM checkout_components WHERE row_id IN (SELECT cr.id FROM checkout_rows cr JOIN checkouts c ON cr.checkout_id = c.id JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM checkout_rows WHERE checkout_id IN (SELECT c.id FROM checkouts c JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM checkout_links WHERE checkout_id IN (SELECT c.id FROM checkouts c JOIN products p ON c.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM offers WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  DELETE FROM coupon_products WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  DELETE FROM certificate_templates WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  DELETE FROM product_pixels WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  
  -- Member area
  DELETE FROM content_attachments WHERE content_id IN (SELECT pmc.id FROM product_member_content pmc JOIN product_member_modules pmm ON pmc.module_id = pmm.id JOIN products p ON pmm.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM content_release_settings WHERE content_id IN (SELECT pmc.id FROM product_member_content pmc JOIN product_member_modules pmm ON pmc.module_id = pmm.id JOIN products p ON pmm.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM product_member_content WHERE module_id IN (SELECT pmm.id FROM product_member_modules pmm JOIN products p ON pmm.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM product_member_modules WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  DELETE FROM product_member_group_permissions WHERE group_id IN (SELECT pmg.id FROM product_member_groups pmg JOIN products p ON pmg.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM product_member_groups WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  DELETE FROM product_members_sections WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);

  -- Webhooks
  DELETE FROM webhook_products WHERE webhook_id IN (SELECT ow.id FROM outbound_webhooks ow JOIN products p ON ow.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM webhook_deliveries WHERE webhook_id IN (SELECT ow.id FROM outbound_webhooks ow JOIN products p ON ow.product_id = p.id WHERE p.user_id != v_owner_id);
  DELETE FROM outbound_webhooks WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);

  -- Checkouts and Products
  DELETE FROM checkouts WHERE product_id IN (SELECT id FROM products WHERE user_id != v_owner_id);
  DELETE FROM products WHERE user_id != v_owner_id;

  -- Vendor settings (colunas corretas verificadas)
  DELETE FROM notifications WHERE user_id != v_owner_id;
  DELETE FROM vendor_pixels WHERE vendor_id != v_owner_id;
  DELETE FROM payment_provider_credentials WHERE owner_id != v_owner_id;
  DELETE FROM payment_gateway_settings WHERE user_id != v_owner_id;
  DELETE FROM vendor_integrations WHERE vendor_id != v_owner_id;
  DELETE FROM oauth_states WHERE vendor_id != v_owner_id;
  DELETE FROM mercadopago_split_config WHERE vendor_id != v_owner_id;
  DELETE FROM checkout_sessions WHERE vendor_id != v_owner_id;

  -- Profiles (LAST)
  DELETE FROM profiles WHERE id != v_owner_id;

  RAISE NOTICE 'LIMPEZA CONCLUÍDA COM SUCESSO!';
END $$;