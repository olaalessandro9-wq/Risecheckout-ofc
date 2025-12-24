-- ============================================================================
-- MIGRAÇÃO: Sistema de Afiliados (Split de Pagamentos)
-- Data: 2025-12-13
-- Objetivo: Evoluir a tabela affiliates para suportar o novo sistema
-- ============================================================================

-- PASSO 1: Remover a tabela antiga (está vazia, sem dados)
-- Como confirmado, a tabela atual tem 0 registros, então é seguro recriar
DROP TABLE IF EXISTS public.affiliates CASCADE;

-- PASSO 2: Criar a nova estrutura otimizada
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- active, pending, rejected, banned
  commission_rate INTEGER NOT NULL CHECK (commission_rate > 0 AND commission_rate <= 100),
  affiliate_code TEXT NOT NULL, -- Slug único para URL (ex: 'joao-iphone15')
  total_sales_count INTEGER DEFAULT 0,
  total_sales_amount INTEGER DEFAULT 0, -- Em centavos (arquitetura "Integer First")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints de unicidade
  CONSTRAINT affiliates_pkey PRIMARY KEY (id),
  CONSTRAINT affiliates_product_user_key UNIQUE (product_id, user_id),
  CONSTRAINT affiliates_code_key UNIQUE (affiliate_code)
);

-- PASSO 3: Criar índices para performance
-- Estes índices otimizam as queries mais comuns do sistema
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliates_user ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_product ON public.affiliates(product_id);
CREATE INDEX idx_affiliates_status ON public.affiliates(status) WHERE status = 'active';

-- PASSO 4: Habilitar Row Level Security (RLS)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Criar políticas de segurança

-- Política de SELECT: Afiliados veem seus próprios registros, Produtores veem afiliados de seus produtos
CREATE POLICY "Afiliados e Produtores podem ver afiliações"
ON public.affiliates
FOR SELECT
USING (
  auth.uid() = user_id -- Sou o afiliado
  OR 
  EXISTS ( -- Ou sou o dono do produto
    SELECT 1 FROM public.products
    WHERE products.id = affiliates.product_id
    AND products.user_id = auth.uid()
  )
);

-- Política de INSERT: Usuários autenticados podem solicitar afiliação
CREATE POLICY "Usuários autenticados podem solicitar afiliação"
ON public.affiliates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: Apenas Produtores podem editar (aprovar, mudar comissão)
-- O afiliado NUNCA pode editar sua própria comissão (segurança crítica)
CREATE POLICY "Apenas Produtores editam afiliações"
ON public.affiliates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = affiliates.product_id
    AND products.user_id = auth.uid()
  )
);

-- Política de DELETE: Apenas Produtores podem remover afiliados
CREATE POLICY "Apenas Produtores removem afiliações"
ON public.affiliates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = affiliates.product_id
    AND products.user_id = auth.uid()
  )
);

-- PASSO 6: Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 7: Criar trigger para atualizar updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- PASSO 8: Adicionar comentários para documentação
COMMENT ON TABLE public.affiliates IS 'Sistema de Afiliados - Relacionamento entre produtos e afiliados com comissões';
COMMENT ON COLUMN public.affiliates.commission_rate IS 'Taxa de comissão em porcentagem (1-100). Ex: 50 = 50%';
COMMENT ON COLUMN public.affiliates.affiliate_code IS 'Código único usado na URL (?ref=codigo). Deve ser único globalmente.';
COMMENT ON COLUMN public.affiliates.total_sales_amount IS 'Total acumulado de vendas em centavos (Integer First)';
COMMENT ON COLUMN public.affiliates.status IS 'Status da afiliação: pending (aguardando aprovação), active (ativo), rejected (rejeitado), banned (banido)';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
