-- =====================================================
-- RLS DOCUMENTATION GENERATOR
-- =====================================================
-- RISE Protocol V3 Compliant (10.0/10)
-- 
-- Função que gera documentação automática de todas as
-- políticas RLS do schema public em formato Markdown.
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO PRINCIPAL: generate_rls_documentation
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_rls_documentation()
RETURNS TABLE (
  section TEXT,
  content TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table_name TEXT;
  v_policy_record RECORD;
  v_current_table TEXT := '';
  v_table_content TEXT := '';
  v_summary_content TEXT := '';
  v_tables_with_rls INTEGER := 0;
  v_tables_without_rls INTEGER := 0;
  v_total_policies INTEGER := 0;
BEGIN
  -- Header do documento
  RETURN QUERY SELECT 
    'header'::TEXT,
    E'# RLS Permissions Matrix\n\n' ||
    E'> **Auto-generated documentation of Row Level Security policies**\n' ||
    E'> **Generated at:** ' || NOW()::TEXT || E'\n' ||
    E'> **Schema:** public\n\n' ||
    E'---\n\n';

  -- Sumário de tabelas
  v_summary_content := E'## Summary\n\n';
  v_summary_content := v_summary_content || E'| Table | RLS Enabled | Policies Count |\n';
  v_summary_content := v_summary_content || E'|-------|-------------|----------------|\n';

  -- Iterar sobre todas as tabelas do schema public
  FOR v_table_name IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  ) LOOP
    DECLARE
      v_rls_enabled BOOLEAN;
      v_policy_count INTEGER;
    BEGIN
      -- Verificar se RLS está habilitado
      SELECT relrowsecurity INTO v_rls_enabled
      FROM pg_class
      WHERE relname = v_table_name AND relnamespace = 'public'::regnamespace;

      -- Contar políticas
      SELECT COUNT(*) INTO v_policy_count
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table_name;

      -- Atualizar contadores
      IF v_rls_enabled THEN
        v_tables_with_rls := v_tables_with_rls + 1;
      ELSE
        v_tables_without_rls := v_tables_without_rls + 1;
      END IF;
      v_total_policies := v_total_policies + v_policy_count;

      -- Adicionar ao sumário
      v_summary_content := v_summary_content || 
        '| `' || v_table_name || '` | ' ||
        CASE WHEN v_rls_enabled THEN '✅ Yes' ELSE '❌ No' END || ' | ' ||
        v_policy_count::TEXT || E' |\n';
    END;
  END LOOP;

  -- Adicionar estatísticas ao sumário
  v_summary_content := v_summary_content || E'\n### Statistics\n\n';
  v_summary_content := v_summary_content || '- **Tables with RLS:** ' || v_tables_with_rls::TEXT || E'\n';
  v_summary_content := v_summary_content || '- **Tables without RLS:** ' || v_tables_without_rls::TEXT || E'\n';
  v_summary_content := v_summary_content || '- **Total Policies:** ' || v_total_policies::TEXT || E'\n\n';
  v_summary_content := v_summary_content || E'---\n\n';

  RETURN QUERY SELECT 'summary'::TEXT, v_summary_content;

  -- Seção de detalhes por tabela
  RETURN QUERY SELECT 
    'details_header'::TEXT,
    E'## Policy Details\n\n';

  -- Iterar sobre cada política
  FOR v_policy_record IN (
    SELECT 
      p.tablename,
      p.policyname,
      p.permissive,
      p.roles,
      p.cmd,
      p.qual,
      p.with_check,
      d.description as policy_comment
    FROM pg_policies p
    LEFT JOIN pg_policy pol ON pol.polname = p.policyname
    LEFT JOIN pg_description d ON d.objoid = pol.oid
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname
  ) LOOP
    -- Se mudou de tabela, adicionar header
    IF v_current_table != v_policy_record.tablename THEN
      IF v_current_table != '' AND v_table_content != '' THEN
        RETURN QUERY SELECT 'table_' || v_current_table, v_table_content;
      END IF;
      
      v_current_table := v_policy_record.tablename;
      v_table_content := E'### `' || v_current_table || E'`\n\n';
      v_table_content := v_table_content || E'| Policy | Type | Command | Roles | Condition |\n';
      v_table_content := v_table_content || E'|--------|------|---------|-------|----------|\n';
    END IF;

    -- Adicionar linha da política
    v_table_content := v_table_content ||
      '| `' || v_policy_record.policyname || '` | ' ||
      CASE WHEN v_policy_record.permissive = 'PERMISSIVE' THEN '🟢 Permissive' ELSE '🔴 Restrictive' END || ' | ' ||
      v_policy_record.cmd || ' | ' ||
      array_to_string(v_policy_record.roles, ', ') || ' | ' ||
      COALESCE(LEFT(v_policy_record.qual::TEXT, 50), '-') || 
      CASE WHEN LENGTH(v_policy_record.qual::TEXT) > 50 THEN '...' ELSE '' END ||
      E' |\n';
  END LOOP;

  -- Última tabela
  IF v_table_content != '' THEN
    RETURN QUERY SELECT 'table_' || v_current_table, v_table_content || E'\n';
  END IF;

  -- Footer
  RETURN QUERY SELECT 
    'footer'::TEXT,
    E'---\n\n' ||
    E'## Legend\n\n' ||
    E'- 🟢 **Permissive**: Policy allows access (OR logic with other permissive policies)\n' ||
    E'- 🔴 **Restrictive**: Policy restricts access (AND logic, must pass all)\n' ||
    E'- **Commands**: SELECT, INSERT, UPDATE, DELETE, ALL\n\n' ||
    E'---\n\n' ||
    E'*This document is auto-generated by `generate_rls_documentation()`. Do not edit manually.*\n';

END;
$$;

-- Grant para service_role
GRANT EXECUTE ON FUNCTION public.generate_rls_documentation() TO service_role;

COMMENT ON FUNCTION public.generate_rls_documentation IS 
'Gera documentação Markdown de todas as políticas RLS do schema public.
Retorna seções do documento para montagem. RISE Protocol V3 Compliant.';