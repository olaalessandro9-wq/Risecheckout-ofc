-- ============================================================================
-- Migration: Fix Malformed Checkout Slugs
-- ============================================================================
-- Corrige slugs de checkout que contêm sufixos incrementais incorretos
-- Padrão incorreto: xxx-123-1-2-3 ou terminando com -N
-- Padrão correto: xxxxxxx_xxxxxx (7 chars hex + underscore + 6 digits)
-- ============================================================================

-- Atualizar slugs malformados para o padrão correto
UPDATE checkouts
SET 
  slug = CONCAT(
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 7),
    '_',
    LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
  ),
  updated_at = NOW()
WHERE 
  -- Slugs com múltiplos hífens seguidos de números (padrão malformado)
  slug ~ '^[a-f0-9]+-[0-9]+-[0-9]+'
  -- OU slugs que terminam com -N onde N é um número
  OR slug ~ '-[0-9]+$'
  -- OU slugs muito longos (mais de 20 caracteres - indica concatenação excessiva)
  OR LENGTH(slug) > 20;