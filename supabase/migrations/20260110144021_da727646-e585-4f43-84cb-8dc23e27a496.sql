-- =====================================================
-- Producer Custom Auth - Adicionar suporte a autenticação personalizada
-- Similar ao buyer_profiles para padronização
-- =====================================================

-- Adicionar colunas de autenticação em profiles (se não existirem)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS password_hash_version INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON public.profiles(reset_token) WHERE reset_token IS NOT NULL;

-- Sincronizar emails existentes do auth.users para profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- =====================================================
-- Tabela de Sessões de Produtor (espelhando buyer_sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.producer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  ip_address TEXT,
  user_agent TEXT,
  is_valid BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_producer_sessions_token ON public.producer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_producer_sessions_producer_id ON public.producer_sessions(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_sessions_valid ON public.producer_sessions(is_valid) WHERE is_valid = true;

-- Habilitar RLS
ALTER TABLE public.producer_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para producer_sessions (apenas service role pode acessar)
DROP POLICY IF EXISTS "Service role can manage producer_sessions" ON public.producer_sessions;
CREATE POLICY "Service role can manage producer_sessions"
ON public.producer_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- Tabela de Audit Log para Produtores (opcional mas recomendado)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.producer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas
CREATE INDEX IF NOT EXISTS idx_producer_audit_log_producer_id ON public.producer_audit_log(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_audit_log_created_at ON public.producer_audit_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.producer_audit_log ENABLE ROW LEVEL SECURITY;

-- Política RLS para audit log
DROP POLICY IF EXISTS "Service role can manage producer_audit_log" ON public.producer_audit_log;
CREATE POLICY "Service role can manage producer_audit_log"
ON public.producer_audit_log
FOR ALL
USING (true)
WITH CHECK (true);