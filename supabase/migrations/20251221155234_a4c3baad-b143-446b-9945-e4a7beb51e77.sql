-- =====================================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS: HABILITAR RLS
-- =====================================================

-- 1. WEBHOOK_DELIVERIES - Expõe dados sensíveis de clientes
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on webhook_deliveries" ON webhook_deliveries;
CREATE POLICY "Service role full access on webhook_deliveries"
ON webhook_deliveries FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Vendors can view their webhook deliveries" ON webhook_deliveries;
CREATE POLICY "Vendors can view their webhook deliveries"
ON webhook_deliveries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = webhook_deliveries.order_id
    AND o.vendor_id = auth.uid()
  )
);

-- 2. SECURITY_EVENTS - Apenas admins podem ver
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on security_events" ON security_events;
CREATE POLICY "Service role full access on security_events"
ON security_events FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view security events" ON security_events;
CREATE POLICY "Admins can view security events"
ON security_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert security events" ON security_events;
CREATE POLICY "System can insert security events"
ON security_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. MARKETPLACE_CATEGORIES - Leitura pública, escrita admin
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read marketplace categories" ON marketplace_categories;
CREATE POLICY "Public can read marketplace categories"
ON marketplace_categories FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage marketplace categories" ON marketplace_categories;
CREATE POLICY "Admins can manage marketplace categories"
ON marketplace_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. RATE_LIMIT_ATTEMPTS - Apenas service role
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on rate_limit_attempts" ON rate_limit_attempts;
CREATE POLICY "Service role full access on rate_limit_attempts"
ON rate_limit_attempts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. _BACKUP_WEBHOOK_FUNCTIONS - Apenas service role (backup interno)
ALTER TABLE _backup_webhook_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only on _backup_webhook_functions" ON _backup_webhook_functions;
CREATE POLICY "Service role only on _backup_webhook_functions"
ON _backup_webhook_functions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);