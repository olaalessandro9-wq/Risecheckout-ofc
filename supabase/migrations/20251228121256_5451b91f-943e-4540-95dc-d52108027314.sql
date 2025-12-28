-- ============================================================================
-- SEC-04: REMOVER POLICY RLS CONFLITANTE
-- ============================================================================
-- A policy products_select_v2 tem lógica permissiva com OR (status = 'active')
-- que vaza todos os produtos ativos, conflitando com a nova policy correta.

DROP POLICY IF EXISTS "products_select_v2" ON products;

-- Registrar correção no log
INSERT INTO system_health_logs (metric_type, severity, metadata)
VALUES (
  'security_fix',
  'info',
  jsonb_build_object(
    'action', 'DROP_CONFLICTING_POLICY',
    'policy_name', 'products_select_v2',
    'table', 'products',
    'reason', 'SEC-04: Policy tinha lógica OR permissiva vazando produtos ativos',
    'fixed_at', NOW()
  )
);