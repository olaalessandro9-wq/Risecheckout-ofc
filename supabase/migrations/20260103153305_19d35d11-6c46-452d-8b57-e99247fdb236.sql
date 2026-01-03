-- ============================================
-- FASE 1: Estrutura de Banco de Dados para Área de Membros
-- ============================================

-- 1.1 Adicionar buyer_id na tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES buyer_profiles(id);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);

-- 1.2 Adicionar configurações de área de membros na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS members_area_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS members_area_settings jsonb DEFAULT '{}'::jsonb;

-- 1.3 Criar tabela de módulos de conteúdo
CREATE TABLE IF NOT EXISTS product_member_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_member_modules_product ON product_member_modules(product_id);

-- 1.4 Criar tabela de conteúdo da área de membros
CREATE TABLE IF NOT EXISTS product_member_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES product_member_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL CHECK (content_type IN ('video', 'pdf', 'link', 'text', 'download')),
  content_url text,
  content_data jsonb DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_member_content_module ON product_member_content(module_id);

-- 1.5 Criar tabela de acesso do buyer aos produtos
CREATE TABLE IF NOT EXISTS buyer_product_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  access_type text DEFAULT 'lifetime' CHECK (access_type IN ('lifetime', 'subscription', 'limited')),
  
  UNIQUE(buyer_id, product_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_buyer_product_access_buyer ON buyer_product_access(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_product_access_product ON buyer_product_access(product_id);

-- ============================================
-- 1.6 RLS Policies
-- ============================================

-- buyer_product_access RLS
ALTER TABLE buyer_product_access ENABLE ROW LEVEL SECURITY;

-- Vendedores podem ver acessos dos seus produtos
CREATE POLICY "Vendors can view access to their products" ON buyer_product_access
  FOR SELECT USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

-- Vendedores podem gerenciar acessos dos seus produtos
CREATE POLICY "Vendors can manage access to their products" ON buyer_product_access
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

-- product_member_modules RLS
ALTER TABLE product_member_modules ENABLE ROW LEVEL SECURITY;

-- Vendedores podem gerenciar módulos dos seus produtos
CREATE POLICY "Vendors can manage own product modules" ON product_member_modules
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

-- Leitura pública para módulos ativos (buyers acessam via edge function com validação)
CREATE POLICY "Public can view active modules" ON product_member_modules
  FOR SELECT USING (is_active = true);

-- product_member_content RLS
ALTER TABLE product_member_content ENABLE ROW LEVEL SECURITY;

-- Vendedores podem gerenciar conteúdo dos seus produtos
CREATE POLICY "Vendors can manage own product content" ON product_member_content
  FOR ALL USING (
    module_id IN (
      SELECT m.id FROM product_member_modules m 
      JOIN products p ON p.id = m.product_id 
      WHERE p.user_id = auth.uid()
    )
  );

-- Leitura pública para conteúdo ativo (buyers acessam via edge function com validação)
CREATE POLICY "Public can view active content" ON product_member_content
  FOR SELECT USING (is_active = true);

-- ============================================
-- 1.7 Trigger para vincular orders a buyer_profiles automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION link_order_to_buyer()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_id uuid;
BEGIN
  -- Só executa quando status muda para PAID
  IF NEW.status = 'PAID' AND (OLD.status IS NULL OR OLD.status != 'PAID') THEN
    
    -- Verifica se tem email do cliente
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      
      -- Buscar buyer existente pelo email
      SELECT id INTO v_buyer_id 
      FROM buyer_profiles 
      WHERE LOWER(email) = LOWER(NEW.customer_email);
      
      -- Se não existe, criar buyer (sem senha - precisará definir depois)
      IF v_buyer_id IS NULL THEN
        INSERT INTO buyer_profiles (email, name, phone, password_hash)
        VALUES (
          LOWER(NEW.customer_email), 
          COALESCE(NEW.customer_name, 'Cliente'), 
          NEW.customer_phone,
          'PENDING_PASSWORD_SETUP'
        )
        RETURNING id INTO v_buyer_id;
      END IF;
      
      -- Vincular order ao buyer
      NEW.buyer_id := v_buyer_id;
      
      -- Criar acesso ao produto principal
      INSERT INTO buyer_product_access (buyer_id, product_id, order_id)
      VALUES (v_buyer_id, NEW.product_id, NEW.id)
      ON CONFLICT (buyer_id, product_id, order_id) DO NOTHING;
      
      -- Criar acesso aos bumps (via order_items)
      INSERT INTO buyer_product_access (buyer_id, product_id, order_id)
      SELECT v_buyer_id, oi.product_id, NEW.id
      FROM order_items oi
      WHERE oi.order_id = NEW.id AND oi.is_bump = true
      ON CONFLICT (buyer_id, product_id, order_id) DO NOTHING;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_link_order_to_buyer ON orders;
CREATE TRIGGER trigger_link_order_to_buyer
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION link_order_to_buyer();

-- ============================================
-- 1.8 Trigger para updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_member_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_member_modules_updated_at ON product_member_modules;
CREATE TRIGGER trigger_update_member_modules_updated_at
  BEFORE UPDATE ON product_member_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_member_content_updated_at();

DROP TRIGGER IF EXISTS trigger_update_member_content_updated_at ON product_member_content;
CREATE TRIGGER trigger_update_member_content_updated_at
  BEFORE UPDATE ON product_member_content
  FOR EACH ROW
  EXECUTE FUNCTION update_member_content_updated_at();