-- ============================================================================
-- RISE V3 FASE 4: CONSOLIDAÇÃO COM TRATAMENTO DE DUPLICATAS
-- ============================================================================

-- ============================================================================
-- 1. ATUALIZAR FKs QUE APONTAM PARA BUYER_PROFILES COM EMAIL DUPLICADO
-- ============================================================================
-- Mapeia registros de buyer_profiles para users existentes pelo email

-- Atualizar orders.buyer_id
UPDATE public.orders o
SET buyer_id = u.id
FROM public.buyer_profiles bp
JOIN public.users u ON u.email = bp.email AND u.id != bp.id
WHERE o.buyer_id = bp.id;

-- Atualizar buyer_audit_log.buyer_id
UPDATE public.buyer_audit_log bal
SET buyer_id = u.id
FROM public.buyer_profiles bp
JOIN public.users u ON u.email = bp.email AND u.id != bp.id
WHERE bal.buyer_id = bp.id;

-- Atualizar buyer_content_access.buyer_id
UPDATE public.buyer_content_access bca
SET buyer_id = u.id
FROM public.buyer_profiles bp
JOIN public.users u ON u.email = bp.email AND u.id != bp.id
WHERE bca.buyer_id = bp.id;

-- Atualizar buyer_saved_cards.buyer_id
UPDATE public.buyer_saved_cards bsc
SET buyer_id = u.id
FROM public.buyer_profiles bp
JOIN public.users u ON u.email = bp.email AND u.id != bp.id
WHERE bsc.buyer_id = bp.id;

-- Atualizar buyer_quiz_attempts.buyer_id
UPDATE public.buyer_quiz_attempts bqa
SET buyer_id = u.id
FROM public.buyer_profiles bp
JOIN public.users u ON u.email = bp.email AND u.id != bp.id
WHERE bqa.buyer_id = bp.id;

-- Atualizar certificates.buyer_id
UPDATE public.certificates c
SET buyer_id = u.id
FROM public.buyer_profiles bp
JOIN public.users u ON u.email = bp.email AND u.id != bp.id
WHERE c.buyer_id = bp.id;

-- ============================================================================
-- 2. MESCLAR DADOS DE BUYER_PROFILES DUPLICADOS PARA USERS
-- ============================================================================
UPDATE public.users u
SET 
  name = COALESCE(u.name, bp.name),
  phone = COALESCE(u.phone, bp.phone),
  document_hash = COALESCE(u.document_hash, bp.document_hash),
  document_encrypted = COALESCE(u.document_encrypted, bp.document_encrypted),
  updated_at = NOW()
FROM public.buyer_profiles bp
WHERE u.email = bp.email AND u.id != bp.id;

-- ============================================================================
-- 3. AGORA CONSOLIDAR REGISTROS NÃO-DUPLICADOS
-- ============================================================================
-- Atualiza registros existentes em users com dados de buyer_profiles (mesmo ID)
UPDATE public.users u
SET 
  name = COALESCE(u.name, bp.name),
  phone = COALESCE(u.phone, bp.phone),
  document_hash = COALESCE(u.document_hash, bp.document_hash),
  document_encrypted = COALESCE(u.document_encrypted, bp.document_encrypted),
  password_hash = COALESCE(u.password_hash, bp.password_hash),
  is_active = COALESCE(u.is_active, bp.is_active),
  updated_at = NOW()
FROM public.buyer_profiles bp
WHERE u.id = bp.id;

-- Insere registros de buyer_profiles que não existem em users (por ID ou email)
INSERT INTO public.users (
  id,
  email,
  name,
  phone,
  document_hash,
  document_encrypted,
  password_hash,
  is_active,
  user_type,
  created_at,
  updated_at
)
SELECT 
  bp.id,
  bp.email,
  bp.name,
  bp.phone,
  bp.document_hash,
  bp.document_encrypted,
  bp.password_hash,
  bp.is_active,
  'buyer',
  bp.created_at,
  NOW()
FROM public.buyer_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = bp.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = bp.email)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. MIGRAR DADOS DE PROFILES (SE EXISTIR)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    UPDATE public.users u
    SET 
      name = COALESCE(u.name, p.name),
      cpf_cnpj = COALESCE(u.cpf_cnpj, p.cpf_cnpj),
      custom_fee_percent = COALESCE(u.custom_fee_percent, p.custom_fee_percent),
      test_mode_enabled = COALESCE(u.test_mode_enabled, p.test_mode_enabled),
      test_public_key = COALESCE(u.test_public_key, p.test_public_key),
      updated_at = NOW()
    FROM public.profiles p
    WHERE u.id = p.id;
  END IF;
END $$;

-- ============================================================================
-- 5. LOG DE MIGRAÇÃO
-- ============================================================================
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'rise_v3_migration_phase4',
  jsonb_build_object(
    'executed_at', NOW(),
    'description', 'Consolidação de dados com tratamento de duplicatas',
    'status', 'completed'
  ),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

COMMENT ON TABLE public.users IS 'RISE V3 SSOT: Tabela única de identidade consolidada';