-- ============================================================================
-- FASE 3: SCHEMA EXTENSION - RISE V3 10.0/10
-- Adicionar colunas faltantes na tabela users para eliminar dependência de profiles
-- ============================================================================

-- 1. Adicionar colunas faltantes na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utmify_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES public.users(id);

-- 2. Adicionar comentários de documentação
COMMENT ON COLUMN public.users.utmify_token IS 'Token de integração UTMify para tracking de conversões';
COMMENT ON COLUMN public.users.status_reason IS 'Motivo da última mudança de status (moderação)';
COMMENT ON COLUMN public.users.status_changed_at IS 'Timestamp da última mudança de status';
COMMENT ON COLUMN public.users.status_changed_by IS 'ID do admin que alterou o status';

-- 3. Criar índice para busca por utmify_token se necessário
CREATE INDEX IF NOT EXISTS idx_users_utmify_token ON public.users(utmify_token) WHERE utmify_token IS NOT NULL;