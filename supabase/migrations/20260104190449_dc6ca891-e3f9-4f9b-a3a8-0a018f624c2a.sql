-- ============================================
-- FASE 1: Área de Membros Netflix-Style
-- Infraestrutura de Banco de Dados
-- ============================================

-- 1. Adicionar colunas faltantes em tabelas existentes
-- =====================================================

-- product_member_modules: cover image e dimensões
ALTER TABLE public.product_member_modules 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 0;

-- product_member_content: duração e corpo texto
ALTER TABLE public.product_member_content 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS body TEXT;

-- products: configurações visuais da área de membros
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS members_area_logo_url TEXT,
ADD COLUMN IF NOT EXISTS members_area_primary_color TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS members_area_slug TEXT;

-- Índice único para slug da área de membros
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_members_area_slug 
ON public.products(members_area_slug) 
WHERE members_area_slug IS NOT NULL;

-- 2. Criar tabela de Grupos/Planos de Acesso
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_member_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_member_groups_product 
ON public.product_member_groups(product_id);

-- RLS
ALTER TABLE public.product_member_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar grupos dos seus produtos"
ON public.product_member_groups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products p 
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access groups"
ON public.product_member_groups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Criar tabela de vínculo Buyer-Grupo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.buyer_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.product_member_groups(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(buyer_id, group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_buyer_groups_buyer ON public.buyer_groups(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_groups_group ON public.buyer_groups(group_id);

-- RLS
ALTER TABLE public.buyer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access buyer_groups"
ON public.buyer_groups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Criar tabela de Permissões de Módulos por Grupo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_member_group_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.product_member_groups(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.product_member_modules(id) ON DELETE CASCADE,
  has_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, module_id)
);

-- RLS
ALTER TABLE public.product_member_group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar permissões dos seus produtos"
ON public.product_member_group_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM product_member_groups g
    JOIN products p ON p.id = g.product_id
    WHERE g.id = group_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access permissions"
ON public.product_member_group_permissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Criar tabela de Configurações de Liberação Progressiva (Drip)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_release_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.product_member_content(id) ON DELETE CASCADE,
  release_type TEXT NOT NULL DEFAULT 'immediate' CHECK (release_type IN ('immediate', 'days_after_purchase', 'fixed_date', 'after_content')),
  days_after_purchase INTEGER,
  fixed_date TIMESTAMP WITH TIME ZONE,
  after_content_id UUID REFERENCES public.product_member_content(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(content_id)
);

-- RLS
ALTER TABLE public.content_release_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar liberação dos seus conteúdos"
ON public.content_release_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM product_member_content c
    JOIN product_member_modules m ON m.id = c.module_id
    JOIN products p ON p.id = m.product_id
    WHERE c.id = content_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access release_settings"
ON public.content_release_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Criar tabela de Acesso Individual a Conteúdo
-- =====================================================
CREATE TABLE IF NOT EXISTS public.buyer_content_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.product_member_content(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(buyer_id, content_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_buyer_content_access_buyer ON public.buyer_content_access(buyer_id);

-- RLS
ALTER TABLE public.buyer_content_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access buyer_content_access"
ON public.buyer_content_access
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Criar tabela de Progresso do Aluno
-- =====================================================
CREATE TABLE IF NOT EXISTS public.buyer_content_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.product_member_content(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  watch_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(buyer_id, content_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_buyer_content_progress_buyer ON public.buyer_content_progress(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_content_progress_content ON public.buyer_content_progress(content_id);

-- RLS
ALTER TABLE public.buyer_content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access progress"
ON public.buyer_content_progress
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. Criar tabela de Quizzes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.product_member_content(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts INTEGER DEFAULT 0,
  time_limit_minutes INTEGER,
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quizzes_product ON public.quizzes(product_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_content ON public.quizzes(content_id);

-- RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar quizzes dos seus produtos"
ON public.quizzes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products p WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access quizzes"
ON public.quizzes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. Criar tabela de Perguntas do Quiz
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  points INTEGER DEFAULT 1,
  position INTEGER DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

-- RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar perguntas dos seus quizzes"
ON public.quiz_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    JOIN products p ON p.id = q.product_id
    WHERE q.id = quiz_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access questions"
ON public.quiz_questions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 10. Criar tabela de Opções de Resposta
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question ON public.quiz_answers(question_id);

-- RLS
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar respostas dos seus quizzes"
ON public.quiz_answers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions qq
    JOIN quizzes q ON q.id = qq.quiz_id
    JOIN products p ON p.id = q.product_id
    WHERE qq.id = question_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access answers"
ON public.quiz_answers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 11. Criar tabela de Tentativas do Aluno
-- =====================================================
CREATE TABLE IF NOT EXISTS public.buyer_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_buyer_quiz_attempts_buyer ON public.buyer_quiz_attempts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_quiz_attempts_quiz ON public.buyer_quiz_attempts(quiz_id);

-- RLS
ALTER TABLE public.buyer_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access attempts"
ON public.buyer_quiz_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 12. Criar tabela de Templates de Certificado (ANTES de certificates)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_html TEXT,
  background_image_url TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#10B981',
  secondary_color TEXT DEFAULT '#1F2937',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_certificate_templates_product ON public.certificate_templates(product_id);

-- RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors podem gerenciar templates dos seus produtos"
ON public.certificate_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM products p WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Service role full access templates"
ON public.certificate_templates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 13. Criar tabela de Certificados Emitidos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  verification_code TEXT NOT NULL UNIQUE,
  buyer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_certificates_buyer ON public.certificates(buyer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_product ON public.certificates(product_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON public.certificates(verification_code);

-- RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access certificates"
ON public.certificates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 14. Triggers para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_members_area_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_product_member_groups_updated_at
BEFORE UPDATE ON public.product_member_groups
FOR EACH ROW EXECUTE FUNCTION public.update_members_area_updated_at();

CREATE TRIGGER update_content_release_settings_updated_at
BEFORE UPDATE ON public.content_release_settings
FOR EACH ROW EXECUTE FUNCTION public.update_members_area_updated_at();

CREATE TRIGGER update_buyer_content_progress_updated_at
BEFORE UPDATE ON public.buyer_content_progress
FOR EACH ROW EXECUTE FUNCTION public.update_members_area_updated_at();

CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.update_members_area_updated_at();

CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW EXECUTE FUNCTION public.update_members_area_updated_at();