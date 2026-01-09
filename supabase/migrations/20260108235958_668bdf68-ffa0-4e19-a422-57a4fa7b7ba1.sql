-- ============================================
-- FASE 1.3: Correção de Políticas RLS Permissivas
-- ============================================

-- 1. affiliate_audit_log: Apenas service_role pode inserir (logs de auditoria)
DROP POLICY IF EXISTS "affiliate_audit_log_insert_service" ON public.affiliate_audit_log;
CREATE POLICY "affiliate_audit_log_insert_service" 
ON public.affiliate_audit_log 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 2. checkout_visits: Qualquer um pode inserir visitas, mas precisa de checkout_id válido
DROP POLICY IF EXISTS "checkout_visits_insert_v2" ON public.checkout_visits;
CREATE POLICY "checkout_visits_insert_public" 
ON public.checkout_visits 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Verifica se o checkout_id existe e está ativo
  EXISTS (
    SELECT 1 FROM public.checkouts c 
    WHERE c.id = checkout_id 
    AND c.status = 'active'
  )
);

-- 3. notifications: Apenas o próprio usuário ou service_role pode inserir
DROP POLICY IF EXISTS "notifications_insert_v2" ON public.notifications;
CREATE POLICY "notifications_insert_authenticated" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Usuário só pode criar notificações para si mesmo
  auth.uid() = user_id
);

-- Política separada para service_role (sistema pode notificar qualquer usuário)
CREATE POLICY "notifications_insert_service" 
ON public.notifications 
FOR INSERT 
TO service_role
WITH CHECK (true);