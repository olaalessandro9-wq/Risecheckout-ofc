-- ============================================================================
-- FINAL FIX V3: Corrigir últimos 15 warnings do Performance Advisor
-- ============================================================================
-- Usando DROP CONSTRAINT para os que são UNIQUE constraints
-- ============================================================================

-- ============================================================================
-- BLOCO 1: Corrigir RLS da tabela orders (1 warning)
-- ============================================================================

DROP POLICY IF EXISTS "orders_select_v2" ON orders;

CREATE POLICY "orders_select_v2" ON orders FOR SELECT USING (
  vendor_id = (SELECT auth.uid())
  OR has_role((SELECT auth.uid()), 'admin')
);

-- ============================================================================
-- BLOCO 2: Corrigir checkout_visits (2 warnings - conflito FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "checkout_visits_admin_all_v2" ON checkout_visits;
DROP POLICY IF EXISTS "checkout_visits_update_v2" ON checkout_visits;
DROP POLICY IF EXISTS "checkout_visits_delete_v2" ON checkout_visits;

CREATE POLICY "checkout_visits_update_v2" ON checkout_visits 
  FOR UPDATE USING (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "checkout_visits_delete_v2" ON checkout_visits 
  FOR DELETE USING (has_role((SELECT auth.uid()), 'admin'));

-- ============================================================================
-- BLOCO 3: Corrigir marketplace_categories (1 warning - conflito FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "marketplace_categories_admin_v2" ON marketplace_categories;
DROP POLICY IF EXISTS "marketplace_categories_insert_v2" ON marketplace_categories;
DROP POLICY IF EXISTS "marketplace_categories_update_v2" ON marketplace_categories;
DROP POLICY IF EXISTS "marketplace_categories_delete_v2" ON marketplace_categories;

CREATE POLICY "marketplace_categories_insert_v2" ON marketplace_categories 
  FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "marketplace_categories_update_v2" ON marketplace_categories 
  FOR UPDATE USING (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "marketplace_categories_delete_v2" ON marketplace_categories 
  FOR DELETE USING (has_role((SELECT auth.uid()), 'admin'));

-- ============================================================================
-- BLOCO 4: Corrigir user_roles (4 warnings - conflito FOR ALL)
-- ============================================================================

DROP POLICY IF EXISTS "user_roles_admin_all_v2" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_v2" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_v2" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_v2" ON user_roles;

CREATE POLICY "user_roles_insert_v2" ON user_roles 
  FOR INSERT WITH CHECK (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "user_roles_update_v2" ON user_roles 
  FOR UPDATE USING (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "user_roles_delete_v2" ON user_roles 
  FOR DELETE USING (has_role((SELECT auth.uid()), 'admin'));

-- ============================================================================
-- BLOCO 5: Remover índices duplicados (7 warnings)
-- Alguns são índices normais, outros são UNIQUE CONSTRAINTS
-- ============================================================================

-- checkout_links: índice normal
DROP INDEX IF EXISTS idx_checkout_links_checkout_id;

-- checkouts: índices normais
DROP INDEX IF EXISTS idx_checkouts_slug_unique;
DROP INDEX IF EXISTS ux_checkouts_slug;

-- oauth_states: é uma UNIQUE CONSTRAINT
ALTER TABLE oauth_states DROP CONSTRAINT IF EXISTS oauth_states_state_key;

-- order_bumps: índice normal
DROP INDEX IF EXISTS idx_order_bumps_product;

-- payment_links: índice normal
DROP INDEX IF EXISTS ux_payment_links_slug;

-- products: índice normal
DROP INDEX IF EXISTS idx_products_default_payment;

-- vendor_integrations: é uma UNIQUE CONSTRAINT
ALTER TABLE vendor_integrations DROP CONSTRAINT IF EXISTS vendor_integrations_vendor_integration_unique;

-- ============================================================================
-- NOTIFY POSTGREST
-- ============================================================================
NOTIFY pgrst, 'reload schema';