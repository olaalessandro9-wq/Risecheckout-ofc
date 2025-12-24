-- ============================================
-- MIGRATION 005: Funções de tracking do marketplace
-- Descrição: Funções para incrementar views e clicks
-- Data: 20/12/2025
-- Autor: Manus AI
-- ============================================

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION increment_marketplace_view(p_product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET marketplace_views = COALESCE(marketplace_views, 0) + 1
  WHERE id = p_product_id 
    AND show_in_marketplace = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar cliques
CREATE OR REPLACE FUNCTION increment_marketplace_click(p_product_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET marketplace_clicks = COALESCE(marketplace_clicks, 0) + 1
  WHERE id = p_product_id 
    AND show_in_marketplace = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões (usuários autenticados e anônimos podem chamar)
GRANT EXECUTE ON FUNCTION increment_marketplace_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_marketplace_click TO authenticated, anon;

-- Comentários
COMMENT ON FUNCTION increment_marketplace_view IS 'Incrementa contador de visualizações de um produto no marketplace';
COMMENT ON FUNCTION increment_marketplace_click IS 'Incrementa contador de cliques no botão de afiliação';
