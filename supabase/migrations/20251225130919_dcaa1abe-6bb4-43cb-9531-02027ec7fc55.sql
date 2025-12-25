-- ============================================================
-- Migração de Segurança: Remover trigger com Stripe key hardcoded
-- ============================================================
-- Esta migração remove funções e triggers que continham
-- chaves de API hardcoded nas migrações anteriores.
-- ============================================================

-- Remover trigger que auto-preenchia stripe_public_key
DROP TRIGGER IF EXISTS trg_auto_fill_stripe_public_key ON checkouts;

-- Remover função que continha a chave hardcoded
DROP FUNCTION IF EXISTS auto_fill_stripe_public_key();