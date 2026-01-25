-- ============================================================================
-- MIGRAÇÃO: Adicionar delivery_type ENUM para tipos de entrega
-- ============================================================================
-- 
-- Substitui o campo boolean external_delivery por um ENUM extensível
-- que suporta 3 tipos de entrega:
-- - standard: Link customizado (delivery_url)
-- - members_area: Link automático para área de membros
-- - external: Sistema próprio do vendedor (webhook/N8N)
--
-- ============================================================================

-- 1. Criar ENUM para tipos de entrega
CREATE TYPE delivery_type_enum AS ENUM (
  'standard',        -- Entrega Interna (link customizado em delivery_url)
  'members_area',    -- Área de Membros (link automático /minha-conta/produtos/{id})
  'external'         -- Entrega Externa (sistema próprio do vendedor)
);

-- 2. Adicionar coluna delivery_type na tabela products
ALTER TABLE products 
ADD COLUMN delivery_type delivery_type_enum DEFAULT 'standard';

-- 3. Migrar dados existentes baseado no campo external_delivery
UPDATE products SET delivery_type = 
  CASE 
    WHEN external_delivery = true THEN 'external'::delivery_type_enum
    ELSE 'standard'::delivery_type_enum
  END;

-- 4. Comentário para documentação
COMMENT ON COLUMN products.delivery_type IS 
'Tipo de entrega do produto: standard (link customizado), members_area (link automático para área de membros), external (sistema próprio do vendedor)';