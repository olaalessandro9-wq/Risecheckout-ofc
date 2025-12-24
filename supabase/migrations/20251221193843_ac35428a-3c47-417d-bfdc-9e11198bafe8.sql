-- ============================================================================
-- FOREIGN KEY INDEXES: Performance para JOINs
-- ============================================================================

-- checkout_components.row_id
CREATE INDEX IF NOT EXISTS idx_checkout_components_row_id 
  ON checkout_components(row_id);

-- checkout_rows.checkout_id
CREATE INDEX IF NOT EXISTS idx_checkout_rows_checkout_id 
  ON checkout_rows(checkout_id);

-- coupon_products.coupon_id
CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon_id 
  ON coupon_products(coupon_id);

-- downsells.product_id (FK é checkout_id, não product_id - verificando schema)
CREATE INDEX IF NOT EXISTS idx_downsells_checkout_id 
  ON downsells(checkout_id);

-- order_bumps.product_id
CREATE INDEX IF NOT EXISTS idx_order_bumps_product_id 
  ON order_bumps(product_id);

-- orders.vendor_id (CRÍTICO para dashboards)
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id 
  ON orders(vendor_id);

-- orders.affiliate_id (CRÍTICO para sistema de afiliação)
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id 
  ON orders(affiliate_id);

-- outbound_webhooks.vendor_id
CREATE INDEX IF NOT EXISTS idx_outbound_webhooks_vendor_id 
  ON outbound_webhooks(vendor_id);

-- products.marketplace_category (a coluna correta é marketplace_category, não category_id)
CREATE INDEX IF NOT EXISTS idx_products_marketplace_category 
  ON products(marketplace_category);

-- upsells.checkout_id (FK é checkout_id, não product_id)
CREATE INDEX IF NOT EXISTS idx_upsells_checkout_id 
  ON upsells(checkout_id);

-- ============================================================================
-- NOTIFY POSTGREST
-- ============================================================================
NOTIFY pgrst, 'reload schema';