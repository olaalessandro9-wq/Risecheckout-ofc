
-- =====================================================
-- LIMPEZA COMPLETA: ÁREAS DE MEMBROS DE TESTE
-- RISE ARCHITECT PROTOCOL V3
-- =====================================================

-- NÍVEL 4: Tabelas folha (sem dependentes)
DELETE FROM buyer_content_progress;
DELETE FROM buyer_groups;
DELETE FROM content_attachments;
DELETE FROM content_release_settings;
DELETE FROM product_member_group_permissions;

-- NÍVEL 3: Conteúdos
DELETE FROM product_member_content;

-- NÍVEL 2: Grupos e Seções do Builder
DELETE FROM product_member_groups;
DELETE FROM product_members_sections;

-- NÍVEL 1: Módulos (raiz da estrutura)
DELETE FROM product_member_modules;

-- NÍVEL 0: Resetar configuração nos produtos (mantém os produtos)
UPDATE products 
SET 
  members_area_enabled = false,
  members_area_settings = null
WHERE members_area_enabled = true;
