-- ============================================
-- MIGRATION 004: Criar tabela marketplace_categories
-- Descrição: Categorias predefinidas para o marketplace
-- Data: 20/12/2025
-- Autor: Manus AI
-- ============================================

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir categorias padrão
INSERT INTO marketplace_categories (id, name, icon, description, display_order) VALUES
  ('digital', 'Produtos Digitais', '📱', 'E-books, templates, arquivos digitais', 1),
  ('courses', 'Cursos Online', '🎓', 'Cursos, treinamentos, workshops', 2),
  ('ebooks', 'E-books', '📚', 'Livros digitais, guias, manuais', 3),
  ('software', 'Software/SaaS', '💻', 'Aplicativos, ferramentas, plataformas', 4),
  ('services', 'Serviços', '🛠️', 'Consultorias, mentorias, serviços', 5),
  ('physical', 'Produtos Físicos', '📦', 'Produtos físicos com envio', 6),
  ('membership', 'Assinaturas', '🔑', 'Clubes, memberships, recorrências', 7),
  ('events', 'Eventos', '🎫', 'Eventos presenciais ou online', 8)
ON CONFLICT (id) DO NOTHING;

-- Índice
CREATE INDEX idx_marketplace_categories_active ON marketplace_categories(active, display_order);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_marketplace_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER marketplace_categories_updated_at
  BEFORE UPDATE ON marketplace_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_categories_updated_at();

-- Comentário
COMMENT ON TABLE marketplace_categories IS 'Categorias predefinidas para classificação de produtos no marketplace';
