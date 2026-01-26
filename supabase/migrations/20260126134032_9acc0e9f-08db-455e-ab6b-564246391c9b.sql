-- RISE V3: Fase 2 - Nullificar colunas de cor HSL corrompidas
-- Esta migração completa a limpeza de dados para 100% dos checkouts

UPDATE checkouts
SET 
  primary_color = NULL,
  text_color = NULL
WHERE 
  primary_color IS NOT NULL 
  AND primary_color LIKE 'hsl%';