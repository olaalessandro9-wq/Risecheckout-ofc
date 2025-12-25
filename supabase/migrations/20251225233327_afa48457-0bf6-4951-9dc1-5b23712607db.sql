-- Adicionar coluna delivery_url para link do entregável
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.products.delivery_url IS 'Link do entregável enviado ao cliente após pagamento aprovado';