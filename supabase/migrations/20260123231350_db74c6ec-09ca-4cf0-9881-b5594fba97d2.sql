-- =============================================
-- RESET TOTAL + DESATIVAR ÁREA DE MEMBROS
-- =============================================

-- Desabilitar área de membros em TODOS os produtos
UPDATE products 
SET members_area_enabled = false,
    members_area_settings = NULL;