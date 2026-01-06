-- Adicionar coluna para vincular oferta a grupo de acesso
ALTER TABLE public.offers
ADD COLUMN member_group_id UUID REFERENCES public.product_member_groups(id) ON DELETE SET NULL;

-- Índice para performance em queries
CREATE INDEX IF NOT EXISTS idx_offers_member_group_id 
ON public.offers(member_group_id);

-- Comentário para documentação
COMMENT ON COLUMN public.offers.member_group_id IS 
'Grupo de acesso que compradores desta oferta receberão automaticamente. Se NULL, usa grupo padrão do produto.';