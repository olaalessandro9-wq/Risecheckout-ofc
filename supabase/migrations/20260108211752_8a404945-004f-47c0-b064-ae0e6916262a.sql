-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: RLS Área de Membros
-- =====================================================
-- Bug identificado: bpa.product_id = bpa.product_id (compara consigo mesmo!)
-- Vulnerabilidade: Public policies permitem acesso anônimo

-- =====================================================
-- 1. CORRIGIR product_members_sections (BUG CRÍTICO)
-- =====================================================
DROP POLICY IF EXISTS "Buyers can view active sections of accessible products" ON product_members_sections;

CREATE POLICY "Buyers can view active sections of accessible products"
ON product_members_sections
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM buyer_product_access bpa
    WHERE bpa.product_id = product_members_sections.product_id
    AND bpa.is_active = true
  )
);

-- =====================================================
-- 2. RESTRINGIR product_member_modules
-- =====================================================
DROP POLICY IF EXISTS "Public can view active modules" ON product_member_modules;

CREATE POLICY "Buyers can view active modules of accessible products"
ON product_member_modules
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM buyer_product_access bpa
    WHERE bpa.product_id = product_member_modules.product_id
    AND bpa.is_active = true
  )
);

-- =====================================================
-- 3. RESTRINGIR product_member_content
-- =====================================================
DROP POLICY IF EXISTS "Public can view active content" ON product_member_content;

CREATE POLICY "Buyers can view active content of accessible products"
ON product_member_content
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM product_member_modules m
    JOIN buyer_product_access bpa ON bpa.product_id = m.product_id
    WHERE m.id = product_member_content.module_id
    AND bpa.is_active = true
  )
);