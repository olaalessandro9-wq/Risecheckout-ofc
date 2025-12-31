-- ============================================================================
-- SISTEMA DE CONTAS DE COMPRADORES - FASE 1: DATABASE SCHEMA
-- ============================================================================
-- Implementa sistema de contas de compradores com sessões seguras (HttpOnly cookies)
-- Similar a Kiwify/Hotmart para máxima segurança e 1-Click Checkout
-- ============================================================================

-- 1. TABELA: buyer_profiles
-- Armazena dados dos compradores com CPF criptografado
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  phone TEXT,
  -- CPF hasheado (SHA-256) para busca rápida sem expor dado
  document_hash TEXT,
  -- CPF criptografado (AES-256-GCM) para exibição mascarada
  document_encrypted TEXT,
  -- Senha hasheada com bcrypt (cost 12)
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_email ON public.buyer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_document_hash ON public.buyer_profiles(document_hash);

-- 2. TABELA: buyer_sessions
-- Gerencia sessões seguras com tokens HttpOnly
CREATE TABLE IF NOT EXISTS public.buyer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  -- Token de sessão aleatório (32 bytes hex)
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Expira em 30 dias por padrão
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  is_valid BOOLEAN DEFAULT TRUE
);

-- Índice para busca rápida de sessão
CREATE INDEX IF NOT EXISTS idx_buyer_sessions_token ON public.buyer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_buyer_sessions_buyer_id ON public.buyer_sessions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_sessions_expires ON public.buyer_sessions(expires_at);

-- 3. TABELA: buyer_saved_cards
-- Tokens de cartões salvos para 1-Click Checkout (nunca armazena número do cartão)
CREATE TABLE IF NOT EXISTS public.buyer_saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  -- Gateway de pagamento (mercadopago, stripe, asaas)
  gateway TEXT NOT NULL,
  -- Token do cartão fornecido pelo gateway (não é o número do cartão!)
  gateway_card_id TEXT NOT NULL,
  -- Últimos 4 dígitos para display
  last_four TEXT,
  -- Bandeira (visa, mastercard, elo, etc)
  brand TEXT,
  -- Nome no cartão (para identificação)
  card_holder_name TEXT,
  -- Mês/ano de expiração
  exp_month INTEGER,
  exp_year INTEGER,
  -- Cartão padrão para 1-click
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca de cartões do buyer
CREATE INDEX IF NOT EXISTS idx_buyer_saved_cards_buyer ON public.buyer_saved_cards(buyer_id);

-- 4. TABELA: buyer_audit_log
-- Log de auditoria para segurança e compliance
CREATE TABLE IF NOT EXISTS public.buyer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.buyer_profiles(id) ON DELETE SET NULL,
  -- Tipo de ação: login, logout, password_change, profile_update, etc
  action TEXT NOT NULL,
  -- Detalhes da ação
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  -- Se a ação foi bem sucedida
  success BOOLEAN DEFAULT TRUE,
  -- Motivo de falha (se aplicável)
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca por buyer e ação
CREATE INDEX IF NOT EXISTS idx_buyer_audit_log_buyer ON public.buyer_audit_log(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_audit_log_action ON public.buyer_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_buyer_audit_log_created ON public.buyer_audit_log(created_at DESC);

-- 5. TABELA: buyer_rate_limits
-- Controle de rate limiting para segurança
CREATE TABLE IF NOT EXISTS public.buyer_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificador (IP, email, ou combinação)
  identifier TEXT NOT NULL,
  -- Tipo de ação sendo limitada
  action TEXT NOT NULL,
  -- Contador de tentativas
  attempts INTEGER DEFAULT 1,
  -- Primeira tentativa
  first_attempt_at TIMESTAMPTZ DEFAULT now(),
  -- Última tentativa
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  -- Bloqueado até (se excedeu limite)
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida de rate limit
CREATE UNIQUE INDEX IF NOT EXISTS idx_buyer_rate_limits_unique ON public.buyer_rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_buyer_rate_limits_blocked ON public.buyer_rate_limits(blocked_until);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_rate_limits ENABLE ROW LEVEL SECURITY;

-- buyer_profiles: Apenas Service Role pode acessar (Edge Functions)
CREATE POLICY "buyer_profiles_service_role_only" ON public.buyer_profiles
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "buyer_profiles_service_role_access" ON public.buyer_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- buyer_sessions: Apenas Service Role pode acessar
CREATE POLICY "buyer_sessions_service_role_only" ON public.buyer_sessions
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "buyer_sessions_service_role_access" ON public.buyer_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- buyer_saved_cards: Apenas Service Role pode acessar
CREATE POLICY "buyer_saved_cards_service_role_only" ON public.buyer_saved_cards
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "buyer_saved_cards_service_role_access" ON public.buyer_saved_cards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- buyer_audit_log: Apenas Service Role pode acessar
CREATE POLICY "buyer_audit_log_service_role_only" ON public.buyer_audit_log
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "buyer_audit_log_service_role_access" ON public.buyer_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- buyer_rate_limits: Apenas Service Role pode acessar
CREATE POLICY "buyer_rate_limits_service_role_only" ON public.buyer_rate_limits
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "buyer_rate_limits_service_role_access" ON public.buyer_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para limpar sessões expiradas (pode ser chamada por cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_buyer_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.buyer_sessions
  WHERE expires_at < now() OR is_valid = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Função para limpar rate limits antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove rate limits mais antigos que 24 horas
  DELETE FROM public.buyer_rate_limits
  WHERE last_attempt_at < (now() - interval '24 hours');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_buyer_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at em buyer_profiles
DROP TRIGGER IF EXISTS trigger_buyer_profile_updated_at ON public.buyer_profiles;
CREATE TRIGGER trigger_buyer_profile_updated_at
  BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_buyer_profile_updated_at();

-- Trigger para atualizar updated_at em buyer_saved_cards
DROP TRIGGER IF EXISTS trigger_buyer_saved_cards_updated_at ON public.buyer_saved_cards;
CREATE TRIGGER trigger_buyer_saved_cards_updated_at
  BEFORE UPDATE ON public.buyer_saved_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_buyer_profile_updated_at();