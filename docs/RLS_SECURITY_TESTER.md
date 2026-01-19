# RLS Security Test Framework

> **Versão:** 1.0.0  
> **Status:** RISE Protocol V3 Compliant (10.0/10)  
> **Última Atualização:** 2026-01-19

## Visão Geral

Framework automatizado de testes de segurança que valida a integridade das Row Level Security (RLS) policies em todas as 75 tabelas do banco de dados. Executa 107 testes com 0 falhas críticas permitidas.

## Arquitetura

```
supabase/functions/rls-security-tester/
├── index.ts              # Router principal (actions: run-all, list-suites)
├── types.ts              # Tipos, configurações, listas de tabelas
├── runner.ts             # Orquestrador de execução de testes
└── tests/
    ├── rls-enabled.ts        # Suite: Verifica RLS habilitado
    ├── policy-coverage.ts    # Suite: Cobertura de policies
    └── service-role-only.ts  # Suite: Tabelas service_role
```

## Endpoints

### POST /rls-security-tester

**Headers:** `X-Producer-Session-Token` (requer autenticação de producer)

| Action | Payload | Descrição |
|--------|---------|-----------|
| `run-all` | `{ action: "run-all" }` | Executa todos os 107 testes |
| `list-suites` | `{ action: "list-suites" }` | Lista suites disponíveis |

## Suites de Teste

### 1. RLS Enabled Test

Verifica se TODAS as tabelas do schema `public` têm RLS habilitado.

**O que testa:**
- Query em `pg_tables` + `pg_class` para verificar `relrowsecurity`
- Falha se qualquer tabela tiver `relrowsecurity = false`

**Resultado esperado:** 75 tabelas com RLS habilitado

### 2. Policy Coverage Test

Verifica se todas as tabelas com RLS têm ao menos uma policy definida.

**O que testa:**
- Query em `pg_policies` para cada tabela
- Falha se uma tabela tiver RLS mas zero policies

**Categorias verificadas:**
- Tabelas de usuário (profiles, buyer_profiles)
- Tabelas de negócio (products, orders, checkouts)
- Tabelas de segurança (audit logs, sessions)

### 3. Service Role Only Test

Verifica que tabelas sensíveis são acessíveis APENAS via `service_role`.

**O que testa:**
- Policies devem bloquear `anon` e `authenticated`
- Detecta policies PERMISSIVE com acesso público
- Valida pattern "DENY-ALL" (`qual: false`)

**Tabelas protegidas:**
- `gateway_webhook_dlq`
- `gdpr_audit_log`
- `gdpr_requests`
- `edge_function_errors`
- `data_retention_log`

## Configuração de Tabelas

### Tabelas Conhecidas (KNOWN_TABLES)

Lista exaustiva de todas as 75 tabelas que DEVEM ter RLS:

```typescript
export const KNOWN_TABLES = [
  // Auth & Sessions
  'profiles', 'buyer_profiles', 'producer_sessions', 'buyer_sessions',
  
  // Products
  'products', 'offers', 'checkouts', 'checkout_rows', 'checkout_components',
  
  // Orders & Payments
  'orders', 'order_items', 'order_events', 'order_bumps',
  
  // Security
  'security_audit_log', 'vault_access_log', 'ip_blocklist',
  
  // ... (75 tabelas total)
];
```

### Tabelas Excluídas (EXCLUDED_TABLES)

Tabelas que NÃO devem ter RLS verificado:

```typescript
export const EXCLUDED_TABLES = [
  'marketplace_categories',  // Público, sem dados sensíveis
  'app_settings',           // Configurações globais
  '_backup_webhook_functions', // Backup interno
];
```

### Tabelas Service-Role Only

```typescript
export const SERVICE_ROLE_ONLY_TABLES = [
  'gateway_webhook_dlq',
  'gdpr_audit_log',
  'gdpr_requests',
  'edge_function_errors',
  'data_retention_log',
];
```

## Exemplo de Execução

### Request

```bash
curl -X POST https://[project].supabase.co/functions/v1/rls-security-tester \
  -H "Content-Type: application/json" \
  -H "X-Producer-Session-Token: [token]" \
  -d '{"action": "run-all"}'
```

### Response (Sucesso)

```json
{
  "success": true,
  "summary": {
    "total": 107,
    "passed": 107,
    "failed": 0,
    "critical": 0
  },
  "suites": [
    {
      "name": "RLS Enabled Test",
      "passed": true,
      "tests": 75,
      "failures": []
    },
    {
      "name": "Policy Coverage Test",
      "passed": true,
      "tests": 27,
      "failures": []
    },
    {
      "name": "Service Role Only Test",
      "passed": true,
      "tests": 5,
      "failures": []
    }
  ],
  "executionTime": "2847ms"
}
```

### Response (Falha Crítica)

```json
{
  "success": false,
  "summary": {
    "total": 107,
    "passed": 105,
    "failed": 2,
    "critical": 2
  },
  "suites": [
    {
      "name": "RLS Enabled Test",
      "passed": false,
      "tests": 75,
      "failures": [
        {
          "table": "new_sensitive_table",
          "error": "RLS not enabled",
          "critical": true
        }
      ]
    }
  ]
}
```

## Lógica de Detecção

### Pattern: DENY-ALL Policy

Policies que usam `qual: false` ou `with_check: false` são reconhecidas como "DENY-ALL" e são consideradas seguras para tabelas service-role-only:

```sql
-- Exemplo de policy DENY-ALL
CREATE POLICY "Block all for anon"
ON vault_access_log
FOR SELECT
TO public
USING (false);
```

### Pattern: Service Role Bypass

Service role (`service_role`) sempre bypassa RLS, então não precisa de policies explícitas:

```sql
-- Acesso via service role
SET ROLE service_role;
SELECT * FROM vault_access_log; -- Funciona (bypassa RLS)
```

## Integração com CI/CD

### Sugestão de Pipeline

```yaml
# .github/workflows/security-tests.yml
name: Security Tests
on: [push, pull_request]

jobs:
  rls-security:
    runs-on: ubuntu-latest
    steps:
      - name: Run RLS Security Tests
        run: |
          response=$(curl -s -X POST $SUPABASE_URL/functions/v1/rls-security-tester \
            -H "Content-Type: application/json" \
            -H "X-Producer-Session-Token: $PRODUCER_TOKEN" \
            -d '{"action": "run-all"}')
          
          critical=$(echo $response | jq '.summary.critical')
          if [ "$critical" != "0" ]; then
            echo "Critical security failures detected!"
            exit 1
          fi
```

## Troubleshooting

### Erro: "Table not found in KNOWN_TABLES"

**Causa:** Nova tabela foi criada mas não adicionada à lista.

**Solução:** Adicionar tabela em `types.ts`:

```typescript
export const KNOWN_TABLES = [
  // ... existing tables
  'new_table_name', // Adicionar aqui
];
```

### Erro: "Service role access allowed for sensitive table"

**Causa:** Policy permite acesso a `authenticated` ou `anon`.

**Solução:** Criar policy DENY-ALL:

```sql
CREATE POLICY "Block all non-service"
ON sensitive_table
FOR ALL
TO public
USING (false);
```

## Métricas Atuais

| Métrica | Valor |
|---------|-------|
| Total de Testes | 107 |
| Testes Passando | 107 |
| Falhas Críticas | 0 |
| Tabelas Verificadas | 75 |
| Tabelas Service-Role Only | 5 |
| Tempo de Execução | ~2-3 segundos |

## Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 2026-01-19 | 1.0.0 | Documento inicial |
| 2026-01-19 | 1.0.1 | Ajuste na detecção de DENY-ALL policies |
