-- SECURITY FIX: Corrigir política permissiva em security_events
-- Antes: WITH CHECK (true) permitia inserir com qualquer user_id
-- Depois: WITH CHECK (auth.uid() = user_id) garante que só pode inserir eventos próprios

DROP POLICY IF EXISTS "security_events_insert_v2" ON public.security_events;

CREATE POLICY "security_events_insert_authenticated" 
ON public.security_events 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Garantir que service_role mantém acesso total
DROP POLICY IF EXISTS "security_events_service_role" ON public.security_events;

CREATE POLICY "security_events_service_role" 
ON public.security_events 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

COMMENT ON POLICY "security_events_insert_authenticated" ON public.security_events IS 
'SECURITY: Users can only insert security events for themselves';