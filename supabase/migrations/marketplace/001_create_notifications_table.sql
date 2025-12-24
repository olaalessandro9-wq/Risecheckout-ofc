-- ============================================
-- MIGRATION 001: Criar tabela notifications
-- Descrição: Tabela para notificações do sistema
-- Data: 20/12/2025
-- Autor: Manus AI
-- ============================================

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem suas próprias notificações
CREATE POLICY "users_view_own_notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Política: Usuários podem marcar como lida
CREATE POLICY "users_update_own_notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política: Sistema pode inserir (via trigger)
CREATE POLICY "system_insert_notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Comentário
COMMENT ON TABLE notifications IS 'Notificações do sistema para usuários (marketplace, afiliados, vendas)';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação: new_affiliate_request, affiliate_approved, new_sale, etc';
COMMENT ON COLUMN notifications.data IS 'Dados adicionais em JSON (IDs, valores, etc)';
