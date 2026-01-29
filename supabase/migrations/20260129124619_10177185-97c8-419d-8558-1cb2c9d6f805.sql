-- ============================================================================
-- FASE 1: Migrar FKs de auth.users para users (REAPLICAÇÃO)
-- ============================================================================

-- 1. products.user_id
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_user_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. orders.vendor_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_vendor_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. order_events.vendor_id
ALTER TABLE order_events DROP CONSTRAINT IF EXISTS order_events_vendor_id_fkey;
ALTER TABLE order_events ADD CONSTRAINT order_events_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. checkout_sessions.vendor_id
ALTER TABLE checkout_sessions DROP CONSTRAINT IF EXISTS checkout_sessions_vendor_id_fkey;
ALTER TABLE checkout_sessions ADD CONSTRAINT checkout_sessions_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. outbound_webhooks.vendor_id
ALTER TABLE outbound_webhooks DROP CONSTRAINT IF EXISTS outbound_webhooks_vendor_id_fkey;
ALTER TABLE outbound_webhooks ADD CONSTRAINT outbound_webhooks_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 6. vendor_integrations.vendor_id
ALTER TABLE vendor_integrations DROP CONSTRAINT IF EXISTS vendor_integrations_vendor_id_fkey;
ALTER TABLE vendor_integrations ADD CONSTRAINT vendor_integrations_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. payment_gateway_settings.user_id
ALTER TABLE payment_gateway_settings DROP CONSTRAINT IF EXISTS payment_gateway_settings_user_id_fkey;
ALTER TABLE payment_gateway_settings ADD CONSTRAINT payment_gateway_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 8. mercadopago_split_config.vendor_id
ALTER TABLE mercadopago_split_config DROP CONSTRAINT IF EXISTS mercadopago_split_config_vendor_id_fkey;
ALTER TABLE mercadopago_split_config ADD CONSTRAINT mercadopago_split_config_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 9. affiliates.user_id
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_user_id_fkey;
ALTER TABLE affiliates ADD CONSTRAINT affiliates_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 10. vendor_profiles.user_id
ALTER TABLE vendor_profiles DROP CONSTRAINT IF EXISTS vendor_profiles_user_id_fkey;
ALTER TABLE vendor_profiles ADD CONSTRAINT vendor_profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 11. security_audit_log.user_id
ALTER TABLE security_audit_log DROP CONSTRAINT IF EXISTS security_audit_log_user_id_fkey;
ALTER TABLE security_audit_log ADD CONSTRAINT security_audit_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 12. vendor_pixels.vendor_id
ALTER TABLE vendor_pixels DROP CONSTRAINT IF EXISTS vendor_pixels_vendor_id_fkey;
ALTER TABLE vendor_pixels ADD CONSTRAINT vendor_pixels_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;