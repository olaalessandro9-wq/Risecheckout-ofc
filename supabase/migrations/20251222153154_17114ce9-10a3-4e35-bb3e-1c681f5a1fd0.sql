-- Tabela para armazenar pixels de rastreamento dos afiliados
CREATE TABLE public.affiliate_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'google_ads', 'tiktok', 'kwai')),
  pixel_id TEXT NOT NULL,
  domain TEXT,
  fire_on_pix BOOLEAN DEFAULT true,
  fire_on_boleto BOOLEAN DEFAULT true,
  fire_on_card BOOLEAN DEFAULT true,
  custom_value_pix INTEGER DEFAULT 100 CHECK (custom_value_pix >= 0 AND custom_value_pix <= 100),
  custom_value_boleto INTEGER DEFAULT 100 CHECK (custom_value_boleto >= 0 AND custom_value_boleto <= 100),
  custom_value_card INTEGER DEFAULT 100 CHECK (custom_value_card >= 0 AND custom_value_card <= 100),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(affiliate_id, platform, pixel_id)
);

-- Habilitar RLS
ALTER TABLE public.affiliate_pixels ENABLE ROW LEVEL SECURITY;

-- Política: Afiliado só pode gerenciar seus próprios pixels
CREATE POLICY "affiliate_pixels_select_own" ON public.affiliate_pixels
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "affiliate_pixels_insert_own" ON public.affiliate_pixels
  FOR INSERT WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "affiliate_pixels_update_own" ON public.affiliate_pixels
  FOR UPDATE USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "affiliate_pixels_delete_own" ON public.affiliate_pixels
  FOR DELETE USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_affiliate_pixels_affiliate_id ON public.affiliate_pixels(affiliate_id);
CREATE INDEX idx_affiliate_pixels_platform ON public.affiliate_pixels(platform);

-- Trigger para updated_at
CREATE TRIGGER set_affiliate_pixels_updated_at
  BEFORE UPDATE ON public.affiliate_pixels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();