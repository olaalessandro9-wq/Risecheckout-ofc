-- FASE 15: Eliminação Final de Resíduos Legados
-- RISE V3 Protocol - Pureza Absoluta

-- DROP das tabelas de sessões legadas (já migradas para sessions SSOT)
DROP TABLE IF EXISTS producer_sessions CASCADE;
DROP TABLE IF EXISTS buyer_sessions CASCADE;

-- DROP das funções de cleanup legadas (não mais necessárias)
DROP FUNCTION IF EXISTS cleanup_expired_producer_sessions();
DROP FUNCTION IF EXISTS cleanup_expired_buyer_sessions();