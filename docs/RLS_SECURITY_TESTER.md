# RLS Security Test Framework

> **Versão:** 2.0.0  
> **Status:** RISE Protocol V3 Compliant (10.0/10)  
> **Última Atualização:** 2026-01-23

## Visão Geral

Framework automatizado de testes de segurança que valida a integridade das Row Level Security (RLS) policies em todas as tabelas do banco de dados.

## Arquitetura

```
supabase/functions/rls-security-tester/
├── index.ts              # Router principal (actions: run-all, list-suites)
├── types.ts              # Tipos, configurações, listas de tabelas
├── runner.ts             # Orquestrador de execução de testes
└── tests/
    ├── rls-enabled.ts        # Suite: Verifica RLS habilitado
    ├── policy-coverage.ts    # Suite: Cobertura de policies
    ├── idor-simulation.ts    # Suite: Testa IDOR vulnerabilities
    └── service-role-only.ts  # Suite: Tabelas service_role
```

## Endpoints

### POST /rls-security-tester

**Auth:** Cookie `__Host-rise_access` (requer autenticação via unified-auth)

| Action | Payload | Descrição |
|--------|---------|-----------|
| `run-all` | `{ action: "run-all" }` | Executa todos os testes |
| `list-suites` | `{ action: "list-suites" }` | Lista suites disponíveis |

## Tabelas Críticas (RISE V3)

### Authentication & Sessions

```typescript
export const CRITICAL_TABLES = [
  // RISE V3: Using unified sessions table
  'sessions',      // Tabela unificada de sessões
  'users',         // Tabela unificada de usuários
  
  // Financial & Orders
  'orders',
  'order_items',
  'order_bumps',
  
  // ...
];
```

### User-Scoped Tables (IDOR Test)

```typescript
const USER_SCOPED_TABLES = [
  { table: 'orders', userColumn: 'customer_email' },
  { table: 'sessions', userColumn: 'user_id' },  // RISE V3 unified
  { table: 'affiliates', userColumn: 'user_id' },
  // ...
];
```

## Exemplo de Execução

### Request

```bash
# Via cookie httpOnly (gerenciado automaticamente pelo frontend)
curl -X POST https://[project].supabase.co/functions/v1/rls-security-tester \
  -H "Content-Type: application/json" \
  -H "Cookie: __Host-rise_access=[token]" \
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
  }
}
```

## RISE V3 Compliance

| Critério | Status |
|----------|--------|
| Unified sessions table | ✅ |
| Cookie-based auth | ✅ |
| Zero legacy references | ✅ |
| Documentation updated | ✅ |
