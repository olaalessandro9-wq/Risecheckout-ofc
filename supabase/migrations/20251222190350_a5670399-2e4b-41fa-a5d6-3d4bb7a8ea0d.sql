-- ============================================================================
-- RBAC SYSTEM - PARTE 2: Tabela de Auditoria e Funções
-- ============================================================================

-- 1. Criar tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_action ON public.security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON public.security_audit_log(created_at DESC);

-- RLS para security_audit_log (apenas admins podem ler)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read audit logs"
ON public.security_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 2. Função para obter o role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role::TEXT
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'user' THEN 3
      WHEN 'seller' THEN 4
      ELSE 5
    END
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'user');
END;
$$;

-- 3. Função para verificar se usuário pode ter afiliados
CREATE OR REPLACE FUNCTION public.can_have_affiliates(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role::TEXT
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN v_role IN ('owner', 'admin');
END;
$$;

-- 4. Função para verificar se é admin (owner ou admin)
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role::TEXT
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN v_role IN ('owner', 'admin');
END;
$$;

-- 5. Função para registrar eventos de segurança (para Edge Functions)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource, resource_id, 
    success, ip_address, user_agent, metadata
  )
  VALUES (
    p_user_id, p_action, p_resource, p_resource_id,
    p_success, p_ip_address, p_user_agent, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 6. Comentários para documentação
COMMENT ON FUNCTION public.get_user_role IS 'Retorna o role mais alto do usuário (owner > admin > user > seller)';
COMMENT ON FUNCTION public.can_have_affiliates IS 'Verifica se o usuário pode ter programa de afiliados (owner/admin)';
COMMENT ON FUNCTION public.is_admin IS 'Verifica se o usuário é administrador (owner ou admin)';
COMMENT ON TABLE public.security_audit_log IS 'Log de eventos de segurança para auditoria';