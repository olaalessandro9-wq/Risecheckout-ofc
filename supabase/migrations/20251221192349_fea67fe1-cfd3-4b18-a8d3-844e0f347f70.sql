
-- ============================================================================
-- MEGA-MIGRATION: RLS Performance Optimization V2
-- ============================================================================
-- Objetivo: Corrigir TODAS as políticas RLS para:
-- 1. Usar (SELECT auth.uid()) em vez de auth.uid() direto
-- 2. Consolidar múltiplas políticas SELECT em uma única
-- 3. Usar has_role((SELECT auth.uid()), 'admin') em vez de has_role(auth.uid(), 'admin')
-- ============================================================================

-- ############################################################################
-- BLOCO 1: AFFILIATES
-- ############################################################################

DROP POLICY IF EXISTS "Usuários autenticados podem solicitar afiliação" ON public.affiliates;
DROP POLICY IF EXISTS "Afiliados e Produtores podem ver afiliações" ON public.affiliates;
DROP POLICY IF EXISTS "Apenas Produtores editam afiliações" ON public.affiliates;
DROP POLICY IF EXISTS "Apenas Produtores removem afiliações" ON public.affiliates;

CREATE POLICY "affiliates_select_v2" ON public.affiliates FOR SELECT USING (
  (SELECT auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = affiliates.product_id 
    AND products.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "affiliates_insert_v2" ON public.affiliates FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "affiliates_update_v2" ON public.affiliates FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = affiliates.product_id 
    AND products.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "affiliates_delete_v2" ON public.affiliates FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = affiliates.product_id 
    AND products.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 2: CHECKOUT_COMPONENTS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all checkout_components" ON public.checkout_components;
DROP POLICY IF EXISTS "Deny all access to checkout_components by default" ON public.checkout_components;
DROP POLICY IF EXISTS "Deny anonymous access to checkout_components" ON public.checkout_components;
DROP POLICY IF EXISTS "Users can delete their own checkout_components" ON public.checkout_components;
DROP POLICY IF EXISTS "Users can insert their own checkout_components" ON public.checkout_components;
DROP POLICY IF EXISTS "Users can view their own checkout_components" ON public.checkout_components;
DROP POLICY IF EXISTS "Users can update their own checkout_components" ON public.checkout_components;

CREATE POLICY "checkout_components_select_v2" ON public.checkout_components FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR row_id IN (
    SELECT cr.id FROM public.checkout_rows cr
    JOIN public.checkouts c ON c.id = cr.checkout_id
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_components_insert_v2" ON public.checkout_components FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR row_id IN (
    SELECT cr.id FROM public.checkout_rows cr
    JOIN public.checkouts c ON c.id = cr.checkout_id
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_components_update_v2" ON public.checkout_components FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR row_id IN (
    SELECT cr.id FROM public.checkout_rows cr
    JOIN public.checkouts c ON c.id = cr.checkout_id
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_components_delete_v2" ON public.checkout_components FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR row_id IN (
    SELECT cr.id FROM public.checkout_rows cr
    JOIN public.checkouts c ON c.id = cr.checkout_id
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 3: CHECKOUT_LINKS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all checkout_links" ON public.checkout_links;
DROP POLICY IF EXISTS "Users can delete their own checkout_links" ON public.checkout_links;
DROP POLICY IF EXISTS "Users can insert their own checkout_links" ON public.checkout_links;
DROP POLICY IF EXISTS "Users can view their own checkout_links" ON public.checkout_links;
DROP POLICY IF EXISTS "anon_select_active_checkout_links" ON public.checkout_links;

CREATE POLICY "checkout_links_select_v2" ON public.checkout_links FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
  OR checkout_id IN (
    SELECT id FROM public.checkouts WHERE status = 'active'
  )
);

CREATE POLICY "checkout_links_insert_v2" ON public.checkout_links FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_links_update_v2" ON public.checkout_links FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_links_delete_v2" ON public.checkout_links FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 4: CHECKOUT_ROWS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all checkout_rows" ON public.checkout_rows;
DROP POLICY IF EXISTS "Deny all access to checkout_rows by default" ON public.checkout_rows;
DROP POLICY IF EXISTS "Deny anonymous access to checkout_rows" ON public.checkout_rows;
DROP POLICY IF EXISTS "Users can delete their own checkout_rows" ON public.checkout_rows;
DROP POLICY IF EXISTS "Users can insert their own checkout_rows" ON public.checkout_rows;
DROP POLICY IF EXISTS "Users can view their own checkout_rows" ON public.checkout_rows;
DROP POLICY IF EXISTS "Users can update their own checkout_rows" ON public.checkout_rows;

CREATE POLICY "checkout_rows_select_v2" ON public.checkout_rows FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_rows_insert_v2" ON public.checkout_rows FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_rows_update_v2" ON public.checkout_rows FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_rows_delete_v2" ON public.checkout_rows FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 5: CHECKOUT_SESSIONS
-- ############################################################################

DROP POLICY IF EXISTS "Vendors see own checkout sessions" ON public.checkout_sessions;

CREATE POLICY "checkout_sessions_select_v2" ON public.checkout_sessions FOR SELECT 
TO authenticated
USING (vendor_id = (SELECT auth.uid()));

-- ############################################################################
-- BLOCO 6: CHECKOUT_VISITS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all checkout visits" ON public.checkout_visits;
DROP POLICY IF EXISTS "Allow anonymous insert for visit tracking" ON public.checkout_visits;
DROP POLICY IF EXISTS "Users can view visits for their checkouts" ON public.checkout_visits;

CREATE POLICY "checkout_visits_select_v2" ON public.checkout_visits FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.id = checkout_visits.checkout_id 
    AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "checkout_visits_insert_v2" ON public.checkout_visits FOR INSERT 
WITH CHECK (true);

CREATE POLICY "checkout_visits_admin_all_v2" ON public.checkout_visits FOR ALL 
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'));

-- ############################################################################
-- BLOCO 7: CHECKOUTS
-- ############################################################################

DROP POLICY IF EXISTS "admin_manage_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Users can delete their own checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Users can insert their own checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "owner_read_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "public_view_active_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Users can update their own checkouts" ON public.checkouts;

CREATE POLICY "checkouts_select_v2" ON public.checkouts FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
  OR status = 'active'
);

CREATE POLICY "checkouts_insert_v2" ON public.checkouts FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "checkouts_update_v2" ON public.checkouts FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "checkouts_delete_v2" ON public.checkouts FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

-- ############################################################################
-- BLOCO 8: COUPON_PRODUCTS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all coupon_products" ON public.coupon_products;
DROP POLICY IF EXISTS "Users can delete coupon_products for their products" ON public.coupon_products;
DROP POLICY IF EXISTS "Users can insert coupon_products for their products" ON public.coupon_products;
DROP POLICY IF EXISTS "Users can view coupon_products for their products" ON public.coupon_products;
DROP POLICY IF EXISTS "Users can update coupon_products for their products" ON public.coupon_products;

CREATE POLICY "coupon_products_select_v2" ON public.coupon_products FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "coupon_products_insert_v2" ON public.coupon_products FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "coupon_products_update_v2" ON public.coupon_products FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "coupon_products_delete_v2" ON public.coupon_products FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

-- ############################################################################
-- BLOCO 9: COUPONS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can delete coupons for their products" ON public.coupons;
DROP POLICY IF EXISTS "Users can insert coupons for their products" ON public.coupons;
DROP POLICY IF EXISTS "Users can view coupons for their products" ON public.coupons;
DROP POLICY IF EXISTS "Users can update coupons for their products" ON public.coupons;

CREATE POLICY "coupons_select_v2" ON public.coupons FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.coupon_products cp
    JOIN public.products p ON p.id = cp.product_id
    WHERE cp.coupon_id = coupons.id 
    AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "coupons_insert_v2" ON public.coupons FOR INSERT 
WITH CHECK (true);

CREATE POLICY "coupons_update_v2" ON public.coupons FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.coupon_products cp
    JOIN public.products p ON p.id = cp.product_id
    WHERE cp.coupon_id = coupons.id 
    AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "coupons_delete_v2" ON public.coupons FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.coupon_products cp
    JOIN public.products p ON p.id = cp.product_id
    WHERE cp.coupon_id = coupons.id 
    AND p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 10: DOWNSELLS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all downsells" ON public.downsells;
DROP POLICY IF EXISTS "Deny all access to downsells by default" ON public.downsells;
DROP POLICY IF EXISTS "Deny anonymous access to downsells" ON public.downsells;
DROP POLICY IF EXISTS "Users can delete their own downsells" ON public.downsells;
DROP POLICY IF EXISTS "Users can insert their own downsells" ON public.downsells;
DROP POLICY IF EXISTS "Users can view their own downsells" ON public.downsells;
DROP POLICY IF EXISTS "Users can update their own downsells" ON public.downsells;

CREATE POLICY "downsells_select_v2" ON public.downsells FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "downsells_insert_v2" ON public.downsells FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "downsells_update_v2" ON public.downsells FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "downsells_delete_v2" ON public.downsells FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 11: MARKETPLACE_CATEGORIES
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage marketplace categories" ON public.marketplace_categories;
DROP POLICY IF EXISTS "Public can read marketplace categories" ON public.marketplace_categories;

CREATE POLICY "marketplace_categories_select_v2" ON public.marketplace_categories FOR SELECT 
USING (true);

CREATE POLICY "marketplace_categories_admin_v2" ON public.marketplace_categories FOR ALL 
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'));

-- ############################################################################
-- BLOCO 12: MERCADOPAGO_SPLIT_CONFIG
-- ############################################################################

DROP POLICY IF EXISTS "Vendors can insert own split config" ON public.mercadopago_split_config;
DROP POLICY IF EXISTS "Vendors can view own split config" ON public.mercadopago_split_config;
DROP POLICY IF EXISTS "Vendors can update own split config" ON public.mercadopago_split_config;

CREATE POLICY "mercadopago_split_config_select_v2" ON public.mercadopago_split_config FOR SELECT 
USING ((SELECT auth.uid()) = vendor_id);

CREATE POLICY "mercadopago_split_config_insert_v2" ON public.mercadopago_split_config FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = vendor_id);

CREATE POLICY "mercadopago_split_config_update_v2" ON public.mercadopago_split_config FOR UPDATE 
USING ((SELECT auth.uid()) = vendor_id);

-- ############################################################################
-- BLOCO 13: NOTIFICATIONS
-- ############################################################################

DROP POLICY IF EXISTS "system_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;

CREATE POLICY "notifications_select_v2" ON public.notifications FOR SELECT 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_insert_v2" ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "notifications_update_v2" ON public.notifications FOR UPDATE 
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ############################################################################
-- BLOCO 14: OAUTH_STATES
-- ############################################################################

DROP POLICY IF EXISTS "Users can insert own oauth_states" ON public.oauth_states;

CREATE POLICY "oauth_states_insert_v2" ON public.oauth_states FOR INSERT 
TO authenticated
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- ############################################################################
-- BLOCO 15: OFFERS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all offers" ON public.offers;
DROP POLICY IF EXISTS "Users can delete their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can insert their own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can view their own offers" ON public.offers;
DROP POLICY IF EXISTS "anon_select_active_offers" ON public.offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.offers;

CREATE POLICY "offers_select_v2" ON public.offers FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
  OR status = 'active'
);

CREATE POLICY "offers_insert_v2" ON public.offers FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "offers_update_v2" ON public.offers FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "offers_delete_v2" ON public.offers FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR product_id IN (SELECT id FROM public.products WHERE user_id = (SELECT auth.uid()))
);

-- ############################################################################
-- BLOCO 16: ORDER_BUMPS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all order_bumps" ON public.order_bumps;
DROP POLICY IF EXISTS "Users can delete their own order_bumps" ON public.order_bumps;
DROP POLICY IF EXISTS "insert_order_bumps_by_product_owner" ON public.order_bumps;
DROP POLICY IF EXISTS "Public view order_bumps via active checkout link" ON public.order_bumps;
DROP POLICY IF EXISTS "Users can update their own order_bumps" ON public.order_bumps;

CREATE POLICY "order_bumps_select_v2" ON public.order_bumps FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
  OR (
    active = true 
    AND checkout_id IN (
      SELECT c.id FROM public.checkouts c
      JOIN public.checkout_links cl ON cl.checkout_id = c.id
      JOIN public.payment_links pl ON pl.id = cl.link_id
      WHERE pl.status = 'active' AND c.status = 'active'
    )
  )
);

CREATE POLICY "order_bumps_insert_v2" ON public.order_bumps FOR INSERT 
TO authenticated
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.id = order_bumps.checkout_id 
    AND p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "order_bumps_update_v2" ON public.order_bumps FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "order_bumps_delete_v2" ON public.order_bumps FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 17: ORDER_EVENTS
-- ############################################################################

DROP POLICY IF EXISTS "Vendors see own order events" ON public.order_events;

CREATE POLICY "order_events_select_v2" ON public.order_events FOR SELECT 
TO authenticated
USING (vendor_id = (SELECT auth.uid()));

-- ############################################################################
-- BLOCO 18: ORDER_ITEMS
-- ############################################################################

DROP POLICY IF EXISTS "Vendors see own order items" ON public.order_items;

CREATE POLICY "order_items_select_v2" ON public.order_items FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.vendor_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 19: ORDERS
-- ############################################################################

DROP POLICY IF EXISTS "Access Order with Token" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view own orders" ON public.orders;

CREATE POLICY "orders_select_v2" ON public.orders FOR SELECT USING (
  vendor_id = (SELECT auth.uid())
  OR access_token = ((current_setting('request.headers'::text, true))::json ->> 'x-order-token')
);

-- ############################################################################
-- BLOCO 20: OUTBOUND_WEBHOOKS
-- ############################################################################

DROP POLICY IF EXISTS "Vendors manage own webhooks" ON public.outbound_webhooks;

CREATE POLICY "outbound_webhooks_all_v2" ON public.outbound_webhooks FOR ALL 
TO authenticated
USING (vendor_id = (SELECT auth.uid()))
WITH CHECK (vendor_id = (SELECT auth.uid()));

-- ############################################################################
-- BLOCO 21: PAYMENT_GATEWAY_SETTINGS
-- ############################################################################

DROP POLICY IF EXISTS "owners_can_read_write" ON public.payment_gateway_settings;

CREATE POLICY "payment_gateway_settings_all_v2" ON public.payment_gateway_settings FOR ALL 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ############################################################################
-- BLOCO 22: PAYMENT_LINKS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all payment_links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can delete their own payment_links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can insert their own payment_links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view active payment_links" ON public.payment_links;
DROP POLICY IF EXISTS "pl_read_active_anon" ON public.payment_links;
DROP POLICY IF EXISTS "public_access_active_links_only" ON public.payment_links;
DROP POLICY IF EXISTS "Users can update their own payment_links" ON public.payment_links;

CREATE POLICY "payment_links_select_v2" ON public.payment_links FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR status = 'active'
  OR offer_id IN (
    SELECT o.id FROM public.offers o
    JOIN public.products p ON p.id = o.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "payment_links_insert_v2" ON public.payment_links FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR offer_id IN (
    SELECT o.id FROM public.offers o
    JOIN public.products p ON p.id = o.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "payment_links_update_v2" ON public.payment_links FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR offer_id IN (
    SELECT o.id FROM public.offers o
    JOIN public.products p ON p.id = o.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "payment_links_delete_v2" ON public.payment_links FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR offer_id IN (
    SELECT o.id FROM public.offers o
    JOIN public.products p ON p.id = o.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 23: PAYMENT_PROVIDER_CREDENTIALS
-- ############################################################################

DROP POLICY IF EXISTS "owner_can_manage_own_pushinpay_creds" ON public.payment_provider_credentials;

CREATE POLICY "payment_provider_credentials_all_v2" ON public.payment_provider_credentials FOR ALL 
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

-- ############################################################################
-- BLOCO 24: PIX_TRANSACTIONS
-- ############################################################################

DROP POLICY IF EXISTS "workspace_scoped_transactions" ON public.pix_transactions;
DROP POLICY IF EXISTS "Vendors see own pix transactions" ON public.pix_transactions;

CREATE POLICY "pix_transactions_select_v2" ON public.pix_transactions FOR SELECT 
TO authenticated
USING (workspace_id = (SELECT auth.uid()));

CREATE POLICY "pix_transactions_public_insert_v2" ON public.pix_transactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "pix_transactions_public_update_v2" ON public.pix_transactions FOR UPDATE 
USING (true);

-- ############################################################################
-- BLOCO 25: PRODUCTS
-- ############################################################################

DROP POLICY IF EXISTS "admin_manage_products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "anon_select_products" ON public.products;
DROP POLICY IF EXISTS "authenticated_view_products_with_affiliate_program" ON public.products;
DROP POLICY IF EXISTS "marketplace_public_access" ON public.products;
DROP POLICY IF EXISTS "owner_read_products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;

CREATE POLICY "products_select_v2" ON public.products FOR SELECT USING (
  user_id = (SELECT auth.uid())
  OR has_role((SELECT auth.uid()), 'admin')
  OR status = 'active'
  OR (show_in_marketplace = true AND status = 'active' AND ((affiliate_settings->>'enabled')::boolean = true))
  OR ((affiliate_settings->>'enabled')::boolean = true)
);

CREATE POLICY "products_insert_v2" ON public.products FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "products_update_v2" ON public.products FOR UPDATE USING (
  (SELECT auth.uid()) = user_id
  OR has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "products_delete_v2" ON public.products FOR DELETE USING (
  (SELECT auth.uid()) = user_id
  OR has_role((SELECT auth.uid()), 'admin')
);

-- ############################################################################
-- BLOCO 26: PROFILES
-- ############################################################################

DROP POLICY IF EXISTS "Deny all anonymous operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update test mode settings" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "profiles_select_v2" ON public.profiles FOR SELECT USING (
  (SELECT auth.uid()) = id
  OR has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "profiles_insert_v2" ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_v2" ON public.profiles FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- ############################################################################
-- BLOCO 27: SECURITY_EVENTS
-- ############################################################################

DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "Admins can view security events" ON public.security_events;

CREATE POLICY "security_events_select_v2" ON public.security_events FOR SELECT 
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "security_events_insert_v2" ON public.security_events FOR INSERT 
TO authenticated
WITH CHECK (true);

-- ############################################################################
-- BLOCO 28: UPSELLS
-- ############################################################################

DROP POLICY IF EXISTS "Admins can manage all upsells" ON public.upsells;
DROP POLICY IF EXISTS "Deny all access to upsells by default" ON public.upsells;
DROP POLICY IF EXISTS "Deny anonymous access to upsells" ON public.upsells;
DROP POLICY IF EXISTS "Users can delete their own upsells" ON public.upsells;
DROP POLICY IF EXISTS "Users can insert their own upsells" ON public.upsells;
DROP POLICY IF EXISTS "Users can view their own upsells" ON public.upsells;
DROP POLICY IF EXISTS "Users can update their own upsells" ON public.upsells;

CREATE POLICY "upsells_select_v2" ON public.upsells FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "upsells_insert_v2" ON public.upsells FOR INSERT 
WITH CHECK (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "upsells_update_v2" ON public.upsells FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "upsells_delete_v2" ON public.upsells FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin')
  OR checkout_id IN (
    SELECT c.id FROM public.checkouts c
    JOIN public.products p ON p.id = c.product_id
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 29: USER_ROLES
-- ############################################################################

DROP POLICY IF EXISTS "Deny all access to user_roles by default" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "user_roles_select_v2" ON public.user_roles FOR SELECT USING (
  (SELECT auth.uid()) = user_id
  OR has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "user_roles_admin_all_v2" ON public.user_roles FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (has_role((SELECT auth.uid()), 'admin'));

-- ############################################################################
-- BLOCO 30: VENDOR_INTEGRATIONS
-- ############################################################################

DROP POLICY IF EXISTS "Vendors can delete own integrations" ON public.vendor_integrations;
DROP POLICY IF EXISTS "Vendors can insert own integrations" ON public.vendor_integrations;
DROP POLICY IF EXISTS "Vendors can read own integrations" ON public.vendor_integrations;
DROP POLICY IF EXISTS "Vendors can view own integrations" ON public.vendor_integrations;
DROP POLICY IF EXISTS "Vendors can update own integrations" ON public.vendor_integrations;

CREATE POLICY "vendor_integrations_select_v2" ON public.vendor_integrations FOR SELECT 
USING ((SELECT auth.uid()) = vendor_id);

CREATE POLICY "vendor_integrations_insert_v2" ON public.vendor_integrations FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = vendor_id);

CREATE POLICY "vendor_integrations_update_v2" ON public.vendor_integrations FOR UPDATE 
USING ((SELECT auth.uid()) = vendor_id);

CREATE POLICY "vendor_integrations_delete_v2" ON public.vendor_integrations FOR DELETE 
USING ((SELECT auth.uid()) = vendor_id);

-- ############################################################################
-- BLOCO 31: VENDOR_PROFILES
-- ############################################################################

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.vendor_profiles;

CREATE POLICY "vendor_profiles_select_v2" ON public.vendor_profiles FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "vendor_profiles_insert_v2" ON public.vendor_profiles FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "vendor_profiles_update_v2" ON public.vendor_profiles FOR UPDATE 
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- ############################################################################
-- BLOCO 32: WEBHOOK_DELIVERIES
-- ############################################################################

DROP POLICY IF EXISTS "Service Role full access" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Service role full access on webhook_deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Service role only on webhook_deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Vendors can view their webhook deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Vendors can view their webhook logs" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Vendors view own webhook_deliveries" ON public.webhook_deliveries;

CREATE POLICY "webhook_deliveries_select_v2" ON public.webhook_deliveries FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = webhook_deliveries.order_id 
    AND o.vendor_id = (SELECT auth.uid())
  )
  OR webhook_id IN (
    SELECT id FROM public.outbound_webhooks 
    WHERE vendor_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- BLOCO 33: WEBHOOK_PRODUCTS
-- ############################################################################

DROP POLICY IF EXISTS "Vendors manage own webhook products" ON public.webhook_products;
DROP POLICY IF EXISTS "vendor_webhook_products_access" ON public.webhook_products;

CREATE POLICY "webhook_products_all_v2" ON public.webhook_products FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.outbound_webhooks w 
    WHERE w.id = webhook_products.webhook_id 
    AND w.vendor_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.outbound_webhooks w 
    WHERE w.id = webhook_products.webhook_id 
    AND w.vendor_id = (SELECT auth.uid())
  )
);

-- ############################################################################
-- FINALIZAÇÃO
-- ############################################################################

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';
