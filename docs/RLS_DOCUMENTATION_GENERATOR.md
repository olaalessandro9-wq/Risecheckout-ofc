# RLS Documentation Generator

> **RISE Protocol V3 Compliant (10.0/10)**  
> **Implementado em:** Janeiro 2026  
> **Status:** ATIVO

## Visão Geral

O sistema RLS Documentation Generator gera automaticamente documentação Markdown de todas as políticas de Row Level Security (RLS) do schema `public`. Isso garante que a documentação de segurança esteja sempre sincronizada com o banco de dados real.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│            RLS DOCUMENTATION GENERATOR                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Edge Function: rls-documentation-generator                  │
│  └── GET / → Retorna Markdown da documentação               │
│                                                              │
│         ↓                                                    │
│                                                              │
│  SQL Function: generate_rls_documentation()                  │
│  ├── Lê pg_tables para listar tabelas                       │
│  ├── Verifica pg_class.relrowsecurity                       │
│  ├── Lê pg_policies para detalhes das policies              │
│  └── Gera seções Markdown estruturadas                      │
│                                                              │
│         ↓                                                    │
│                                                              │
│  Output: RLS_PERMISSIONS_MATRIX.md                           │
│  ├── Summary (tabelas + contagem)                           │
│  ├── Statistics (totais)                                    │
│  ├── Policy Details (por tabela)                            │
│  └── Legend                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Uso

### Via Edge Function (JSON)

```bash
curl -X GET \
  "https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/rls-documentation-generator" \
  -H "Accept: application/json" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

**Resposta:**
```json
{
  "success": true,
  "generatedAt": "2026-01-19T20:20:59.863Z",
  "sections": 15,
  "markdown": "# RLS Permissions Matrix\n\n..."
}
```

### Via Edge Function (Markdown puro)

```bash
curl -X GET \
  "https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/rls-documentation-generator" \
  -H "Accept: text/markdown" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

### Via SQL direto

```sql
SELECT * FROM generate_rls_documentation();
```

## Documento Gerado

O documento inclui:

### 1. Summary Table

| Table | RLS Enabled | Policies Count |
|-------|-------------|----------------|
| `orders` | ✅ Yes | 4 |
| `products` | ✅ Yes | 6 |
| ... | ... | ... |

### 2. Statistics

- **Tables with RLS:** X
- **Tables without RLS:** Y
- **Total Policies:** Z

### 3. Policy Details (por tabela)

| Policy | Type | Command | Roles | Condition |
|--------|------|---------|-------|-----------|
| `policy_name` | 🟢 Permissive | SELECT | authenticated | `(user_id = auth.uid())` |

## Automação (Cron)

Para gerar a documentação automaticamente, configure um cron job:

```sql
-- Criar tabela para armazenar última geração
CREATE TABLE IF NOT EXISTS rls_documentation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  markdown TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função para snapshot
CREATE OR REPLACE FUNCTION save_rls_documentation_snapshot()
RETURNS void AS $$
  INSERT INTO rls_documentation_snapshots (markdown)
  SELECT string_agg(content, '') 
  FROM generate_rls_documentation();
$$ LANGUAGE SQL;
```

## Integração com CI/CD

Para integrar com pipelines de CI/CD:

1. Chamar a Edge Function após cada deploy
2. Commitar o Markdown gerado no repositório
3. Comparar com versão anterior para detectar mudanças

```bash
# Exemplo de script CI
curl -s "$SUPABASE_URL/functions/v1/rls-documentation-generator" \
  -H "Accept: text/markdown" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  > docs/RLS_PERMISSIONS_MATRIX.md

git diff docs/RLS_PERMISSIONS_MATRIX.md
```

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01-19 | Implementação inicial com SQL function e Edge Function |

---

**RISE Protocol V3 Compliant** - Documentação automatizada, sempre atualizada.
