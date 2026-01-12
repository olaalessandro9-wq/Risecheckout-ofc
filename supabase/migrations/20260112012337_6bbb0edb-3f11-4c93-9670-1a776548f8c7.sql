-- ============================================================================
-- FASE 1: Biblioteca de Pixels - Tabelas vendor_pixels e product_pixels
-- ============================================================================

-- Tabela: vendor_pixels
-- Armazena os pixels cadastrados pelo vendedor (biblioteca reutilizável)
CREATE TABLE public.vendor_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google_ads', 'kwai')),
  name TEXT NOT NULL,
  pixel_id TEXT NOT NULL,
  access_token TEXT, -- Para Conversions API (será criptografado via Vault)
  conversion_label TEXT, -- Específico para Google Ads
  domain TEXT, -- Específico para Facebook (verificação de domínio)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Evita duplicatas: mesmo vendor não pode ter pixel_id repetido na mesma plataforma
  UNIQUE(vendor_id, platform, pixel_id)
);

-- Índices para performance
CREATE INDEX idx_vendor_pixels_vendor_id ON public.vendor_pixels(vendor_id);
CREATE INDEX idx_vendor_pixels_platform ON public.vendor_pixels(platform);
CREATE INDEX idx_vendor_pixels_active ON public.vendor_pixels(is_active) WHERE is_active = true;

-- Tabela: product_pixels
-- Vincula pixels aos produtos com configurações granulares
CREATE TABLE public.product_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pixel_id UUID NOT NULL REFERENCES public.vendor_pixels(id) ON DELETE CASCADE,
  fire_on_initiate_checkout BOOLEAN NOT NULL DEFAULT true,
  fire_on_purchase BOOLEAN NOT NULL DEFAULT true,
  fire_on_pix BOOLEAN NOT NULL DEFAULT true,
  fire_on_card BOOLEAN NOT NULL DEFAULT true,
  fire_on_boleto BOOLEAN NOT NULL DEFAULT true,
  custom_value_percent INTEGER NOT NULL DEFAULT 100 CHECK (custom_value_percent >= 0 AND custom_value_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Cada pixel só pode ser vinculado uma vez por produto
  UNIQUE(product_id, pixel_id)
);

-- Índices para performance
CREATE INDEX idx_product_pixels_product_id ON public.product_pixels(product_id);
CREATE INDEX idx_product_pixels_pixel_id ON public.product_pixels(pixel_id);

-- ============================================================================
-- RLS Policies - vendor_pixels
-- ============================================================================

ALTER TABLE public.vendor_pixels ENABLE ROW LEVEL SECURITY;

-- Vendedor pode ver apenas seus próprios pixels
CREATE POLICY "vendor_pixels_select_own"
ON public.vendor_pixels
FOR SELECT
USING (auth.uid() = vendor_id);

-- Vendedor pode inserir apenas seus próprios pixels
CREATE POLICY "vendor_pixels_insert_own"
ON public.vendor_pixels
FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- Vendedor pode atualizar apenas seus próprios pixels
CREATE POLICY "vendor_pixels_update_own"
ON public.vendor_pixels
FOR UPDATE
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- Vendedor pode deletar apenas seus próprios pixels
CREATE POLICY "vendor_pixels_delete_own"
ON public.vendor_pixels
FOR DELETE
USING (auth.uid() = vendor_id);

-- ============================================================================
-- RLS Policies - product_pixels
-- ============================================================================

ALTER TABLE public.product_pixels ENABLE ROW LEVEL SECURITY;

-- Vendedor pode ver pixels vinculados aos seus produtos
CREATE POLICY "product_pixels_select_own"
ON public.product_pixels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_pixels.product_id AND p.user_id = auth.uid()
  )
);

-- Vendedor pode vincular pixels aos seus produtos
CREATE POLICY "product_pixels_insert_own"
ON public.product_pixels
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_pixels.product_id AND p.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.vendor_pixels vp
    WHERE vp.id = product_pixels.pixel_id AND vp.vendor_id = auth.uid()
  )
);

-- Vendedor pode atualizar vínculos dos seus produtos
CREATE POLICY "product_pixels_update_own"
ON public.product_pixels
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_pixels.product_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_pixels.product_id AND p.user_id = auth.uid()
  )
);

-- Vendedor pode remover vínculos dos seus produtos
CREATE POLICY "product_pixels_delete_own"
ON public.product_pixels
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_pixels.product_id AND p.user_id = auth.uid()
  )
);

-- ============================================================================
-- Policy para leitura pública no checkout (anon users)
-- ============================================================================

-- Permitir leitura de product_pixels no checkout público
CREATE POLICY "product_pixels_anon_select"
ON public.product_pixels
FOR SELECT
TO anon
USING (true);

-- Permitir leitura de vendor_pixels no checkout público (apenas pixels ativos)
CREATE POLICY "vendor_pixels_anon_select"
ON public.vendor_pixels
FOR SELECT
TO anon
USING (is_active = true);

-- ============================================================================
-- Trigger para atualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_vendor_pixels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_vendor_pixels_updated_at
BEFORE UPDATE ON public.vendor_pixels
FOR EACH ROW
EXECUTE FUNCTION public.update_vendor_pixels_updated_at();