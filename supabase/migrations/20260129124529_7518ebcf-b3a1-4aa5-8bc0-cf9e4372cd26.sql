-- ============================================================================
-- FASE 2: Migrar FKs de profiles para users
-- ============================================================================

-- 1. oauth_states.vendor_id (CRÍTICO para Mercado Pago)
ALTER TABLE oauth_states DROP CONSTRAINT IF EXISTS oauth_states_vendor_id_fkey;
ALTER TABLE oauth_states ADD CONSTRAINT oauth_states_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. notifications.user_id
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. producer_audit_log.producer_id
ALTER TABLE producer_audit_log DROP CONSTRAINT IF EXISTS producer_audit_log_producer_id_fkey;
ALTER TABLE producer_audit_log ADD CONSTRAINT producer_audit_log_producer_id_fkey 
  FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE SET NULL;

-- Documentação
COMMENT ON TABLE profiles IS 'DEPRECATED: Tabela legada de auth.users. Use public.users como SSOT de identidade.';