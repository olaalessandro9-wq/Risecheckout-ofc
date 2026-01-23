-- =============================================
-- RESET COMPLETO ÁREA DE MEMBROS - RISE V3
-- =============================================

-- FASE 1: Buyers (respeitando foreign keys)
DELETE FROM buyer_content_progress;
DELETE FROM buyer_content_access;
DELETE FROM buyer_groups;
DELETE FROM buyer_product_access;

-- FASE 2: Estrutura de conteúdo
DELETE FROM product_member_group_permissions;
DELETE FROM product_member_content;
DELETE FROM product_member_modules;
DELETE FROM product_member_groups;

-- FASE 3: Builder (seções visuais)
DELETE FROM product_members_sections;

-- FASE 3.1: Resetar settings mantendo enabled
UPDATE products 
SET members_area_settings = NULL 
WHERE members_area_enabled = true;