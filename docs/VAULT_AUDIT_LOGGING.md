# Vault Audit Logging System

> **RISE Protocol V3 Compliant (10.0/10)**  
> **Implementado em:** Janeiro 2026  
> **Status:** ATIVO

## Visão Geral

O sistema de Vault Audit Logging registra **TODAS** as operações de acesso às credenciais OAuth armazenadas no Supabase Vault. Isso garante visibilidade total sobre quem acessou quais credenciais, quando e de onde.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    VAULT AUDIT SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Edge Function                                               │
│  ├── Chama vault-credentials.ts                             │
│  └── Passa Request para extractAuditContext()               │
│                                                              │
│         ↓                                                    │
│                                                              │
│  vault-credentials.ts                                        │
│  ├── Extrai IP e User-Agent                                 │
│  └── Chama RPC com parâmetros de auditoria                  │
│                                                              │
│         ↓                                                    │
│                                                              │
│  PostgreSQL RPC Functions                                    │
│  ├── save_gateway_credentials()                             │
│  ├── get_gateway_credentials()                              │
│  └── delete_gateway_credentials()                           │
│                                                              │
│         ↓                                                    │
│                                                              │
│  log_vault_access()                                          │
│  └── INSERT INTO vault_access_log                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tabela: vault_access_log

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Identificador único do log |
| `vendor_id` | UUID | ID do vendedor que possui as credenciais |
| `gateway` | TEXT | Gateway acessado (mercadopago, stripe, etc.) |
| `action` | TEXT | Ação executada: `get`, `save`, `delete` |
| `success` | BOOLEAN | Se a operação foi bem-sucedida |
| `error_message` | TEXT | Mensagem de erro (se aplicável) |
| `ip_address` | TEXT | IP do cliente que fez a requisição |
| `user_agent` | TEXT | User-Agent do navegador/cliente |
| `metadata` | JSONB | Metadados adicionais (secret_name, etc.) |
| `created_at` | TIMESTAMPTZ | Timestamp da operação |

## RLS (Row Level Security)

A tabela `vault_access_log` é protegida por RLS com políticas que **negam acesso a todos os roles**:

- `vault_access_log_no_select`: Bloqueia SELECT
- `vault_access_log_no_insert`: Bloqueia INSERT direto
- `vault_access_log_no_update`: Bloqueia UPDATE (logs são imutáveis)
- `vault_access_log_no_delete`: Bloqueia DELETE (logs não podem ser removidos)

**Apenas `service_role`** (que bypassa RLS) pode acessar a tabela via funções internas.

## Uso nas Edge Functions

### Padrão Recomendado

```typescript
import { 
  getVendorCredentials, 
  extractAuditContext 
} from "../_shared/vault-credentials.ts";

export async function handler(req: Request) {
  // Extrair contexto de auditoria da request
  const auditContext = extractAuditContext(req);
  
  // Buscar credenciais (audit log automático)
  const result = await getVendorCredentials(
    supabase,
    vendorId,
    "mercadopago",
    auditContext  // <-- Passa o contexto
  );
  
  // O auditLogId está disponível no resultado
  console.log("Audit Log ID:", result.auditLogId);
}
```

### Funções Disponíveis

| Função | Descrição |
|--------|-----------|
| `saveCredentialsToVault()` | Salva credenciais + log |
| `getVendorCredentials()` | Busca credenciais + log |
| `deleteCredentialsFromVault()` | Remove credenciais + log |
| `extractAuditContext()` | Helper para extrair IP/UA de Request |

## Consultas de Auditoria

### Visualizar logs recentes

```sql
SELECT 
  created_at,
  vendor_id,
  gateway,
  action,
  success,
  ip_address,
  error_message
FROM vault_access_log
ORDER BY created_at DESC
LIMIT 100;
```

### Logs por vendor

```sql
SELECT * FROM vault_access_log
WHERE vendor_id = 'uuid-do-vendor'
ORDER BY created_at DESC;
```

### Logs de falha

```sql
SELECT * FROM vault_access_log
WHERE success = false
ORDER BY created_at DESC;
```

### Acessos suspeitos (muitos GETs de IPs diferentes)

```sql
SELECT 
  vendor_id,
  gateway,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) as total_accesses
FROM vault_access_log
WHERE action = 'get'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY vendor_id, gateway
HAVING COUNT(DISTINCT ip_address) > 5
ORDER BY unique_ips DESC;
```

## Headers de IP Suportados

O sistema tenta extrair o IP do cliente dos seguintes headers (em ordem de prioridade):

1. `cf-connecting-ip` (Cloudflare)
2. `x-real-ip` (Nginx/proxies)
3. `x-forwarded-for` (primeiro IP da lista)

## Retenção de Dados

Os logs de auditoria são mantidos conforme política de retenção definida no Data Retention System. Por padrão, logs mais antigos que 90 dias podem ser arquivados ou removidos.

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01-19 | Implementação inicial com RLS e logging completo |

---

**RISE Protocol V3 Compliant** - Zero dívida técnica, auditoria completa.
