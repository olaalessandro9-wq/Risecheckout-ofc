-- =====================================================
-- MEMBERS AREA BUILDER: Tabela de Seções
-- Permite configurar seções visuais da área de membros
-- =====================================================

-- Tabela de seções da área de membros
CREATE TABLE public.product_members_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer')),
  title TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários para documentação
COMMENT ON TABLE public.product_members_sections IS 'Seções visuais configuráveis da área de membros (Builder)';
COMMENT ON COLUMN public.product_members_sections.type IS 'Tipo de seção: banner, modules, courses, continue_watching, text, spacer';
COMMENT ON COLUMN public.product_members_sections.settings IS 'Configurações específicas do tipo de seção em JSONB';

-- Índices para performance
CREATE INDEX idx_members_sections_product ON public.product_members_sections(product_id);
CREATE INDEX idx_members_sections_position ON public.product_members_sections(product_id, position);
CREATE INDEX idx_members_sections_active ON public.product_members_sections(product_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.product_members_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Produtor pode gerenciar seções dos seus produtos
CREATE POLICY "Producers can view their product sections"
ON public.product_members_sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Producers can insert sections for their products"
ON public.product_members_sections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Producers can update their product sections"
ON public.product_members_sections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Producers can delete their product sections"
ON public.product_members_sections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = product_id
    AND p.user_id = auth.uid()
  )
);

-- Buyers com acesso ao produto podem visualizar seções ativas
CREATE POLICY "Buyers can view active sections of accessible products"
ON public.product_members_sections
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM buyer_product_access bpa
    WHERE bpa.product_id = product_id
    AND bpa.is_active = true
    -- Buyer auth será via session token, não auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_members_sections_updated_at
BEFORE UPDATE ON public.product_members_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();