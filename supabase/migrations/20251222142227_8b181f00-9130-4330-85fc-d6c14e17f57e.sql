-- ============================================
-- CORREÇÃO 1: Migrar códigos legados para formato seguro AFF-xxx-xxx
-- ============================================
-- Gera códigos criptograficamente seguros para substituir padrões previsíveis

UPDATE affiliates 
SET 
  affiliate_code = 'AFF-' || upper(encode(gen_random_bytes(4), 'hex')) || '-' || upper(encode(gen_random_bytes(4), 'hex')),
  updated_at = now()
WHERE affiliate_code NOT LIKE 'AFF-%';

-- ============================================
-- CORREÇÃO 5: Criar tabela de auditoria de afiliados
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approve', 'reject', 'block', 'unblock', 'request'
  performed_by UUID, -- user_id do produtor que executou a ação (NULL se automático)
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT, -- Para rastreamento de segurança
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance de consultas
CREATE INDEX IF NOT EXISTS idx_affiliate_audit_log_affiliate_id ON affiliate_audit_log(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_audit_log_action ON affiliate_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_affiliate_audit_log_performed_by ON affiliate_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_affiliate_audit_log_created_at ON affiliate_audit_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE affiliate_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Apenas produtor dono do produto pode ver logs
CREATE POLICY "affiliate_audit_log_select_v1" ON affiliate_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM affiliates a
    JOIN products p ON p.id = a.product_id
    WHERE a.id = affiliate_audit_log.affiliate_id
    AND p.user_id = (SELECT auth.uid())
  )
);

-- Service role pode inserir (para Edge Functions)
CREATE POLICY "affiliate_audit_log_insert_service" ON affiliate_audit_log
FOR INSERT WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE affiliate_audit_log IS 'Registro de auditoria de todas as ações de afiliação para segurança e compliance';
COMMENT ON COLUMN affiliate_audit_log.action IS 'Ação executada: approve, reject, block, unblock, request';
COMMENT ON COLUMN affiliate_audit_log.performed_by IS 'UUID do usuário que executou a ação, NULL se automático';
COMMENT ON COLUMN affiliate_audit_log.ip_address IS 'Endereço IP do requisitante para rastreamento de segurança';