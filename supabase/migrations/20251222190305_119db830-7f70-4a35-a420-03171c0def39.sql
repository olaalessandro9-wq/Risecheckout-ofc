-- ============================================================================
-- RBAC SYSTEM - PARTE 1: Adicionar novos roles ao enum
-- ============================================================================
-- Esta migração APENAS adiciona os novos valores ao enum
-- Os valores precisam ser "committed" antes de serem usados

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';