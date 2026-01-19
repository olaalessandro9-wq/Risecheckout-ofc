# Security Infrastructure Overview

> **Versão:** 1.0.0  
> **Status:** RISE Protocol V3 Compliant (10.0/10)  
> **Última Atualização:** 2026-01-19

## Visão Geral

O RiseCheckout implementa uma infraestrutura de segurança enterprise-grade composta por 5 módulos principais, todos desenvolvidos seguindo o RISE Protocol V3 com score máximo de 10.0/10.

## Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Vault     │  │    Key      │  │   Session   │  │    RLS      │    │
│  │   Audit     │  │ Management  │  │ Management  │  │   Tester    │    │
│  │  Logging    │  │   System    │  │   System    │  │  Framework  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
│                    ┌──────────────┴──────────────┐                      │
│                    │    Data Retention System    │                      │
│                    │      (Automated Cleanup)    │                      │
│                    └─────────────────────────────┘                      │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                         pg_cron AUTOMATION                               │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │  daily-data-cleanup-v2      │  │  hourly-oauth-cleanup       │      │
│  │  03:00 UTC                  │  │  Every hour                 │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Módulos de Segurança

| Módulo | Documento | Status | Descrição |
|--------|-----------|--------|-----------|
| Vault Audit Logging | [VAULT_AUDIT_LOGGING.md](./VAULT_AUDIT_LOGGING.md) | ✅ ATIVO | Auditoria de acessos ao Vault |
| Key Management System | [KEY_MANAGEMENT_SYSTEM.md](./KEY_MANAGEMENT_SYSTEM.md) | ✅ ATIVO | Rotação de chaves de criptografia |
| Session Management | [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) | ✅ ATIVO | Gestão de sessões multi-dispositivo |
| RLS Security Tester | [RLS_SECURITY_TESTER.md](./RLS_SECURITY_TESTER.md) | ✅ ATIVO | Framework de testes automatizados |
| Data Retention System | [DATA_RETENTION_SYSTEM.md](./DATA_RETENTION_SYSTEM.md) | ✅ ATIVO | Limpeza automatizada conforme LGPD |

## Edge Functions de Segurança

| Nome | Categoria | Descrição |
|------|-----------|-----------|
| `rls-documentation-generator` | Documentação | Gera documentação automática de todas as RLS policies |
| `key-rotation-executor` | Criptografia | Executa rotação de chaves AES-256-GCM |
| `rls-security-tester` | Testes | Framework com 107 testes de segurança RLS |
| `session-manager` | Autenticação | Gestão de sessões (list, revoke, revoke-all) |
| `data-retention-executor` | Compliance | Executa políticas de retenção de dados |

## Automação via pg_cron

| Job | Schedule | Função SQL | Descrição |
|-----|----------|------------|-----------|
| `daily-data-cleanup-v2` | `0 3 * * *` (03:00 UTC) | `cleanup_all_data_v2_with_log()` | Limpeza diária de dados expirados |
| `hourly-oauth-cleanup` | `0 * * * *` (Cada hora) | `cleanup_oauth_states()` | Limpeza de estados OAuth expirados |

## Métricas de Segurança

| Métrica | Valor |
|---------|-------|
| Tabelas com RLS | 75 |
| Testes de Segurança | 107 |
| Falhas Críticas | 0 |
| Políticas de Retenção | 17 |
| Funções de Cleanup | 19 |
| Edge Functions de Segurança | 5 |

## Conformidade

### RISE Protocol V3

| Requisito | Status |
|-----------|--------|
| Zero `any` types (exceto justificados) | ✅ |
| Limite de 300 linhas por arquivo | ✅ |
| SECURITY DEFINER em funções SQL críticas | ✅ |
| RLS em todas as tabelas | ✅ |
| Documentação completa | ✅ |
| **Score Final** | **10.0/10** |

### LGPD

| Requisito | Implementação |
|-----------|---------------|
| Direito ao Esquecimento | GDPR Requests + Anonymization |
| Minimização de Dados | Data Retention Policies |
| Auditoria | Vault Access Log + Security Audit Log |
| Consentimento | Buyer Profiles (email_verified) |

## Fluxos de Segurança

### 1. Autenticação Producer (Dashboard)

```
Request → Edge Function → X-Producer-Session-Token Header
                               ↓
                    unified-auth.ts (requireAuthenticatedProducer)
                               ↓
                    Validate Session → producer_sessions table
                               ↓
                    Return producer_id for RLS context
```

### 2. Autenticação Buyer (Área de Membros)

```
Request → Edge Function → __Host-buyer_access Cookie
                               ↓
                    session-reader.ts (getBuyerAccessToken)
                               ↓
                    Validate Session → buyer_sessions table
                               ↓
                    Return buyer_id for RLS context
```

### 3. Rotação de Chaves

```
key-rotation-executor (action: rotate)
         ↓
Generate new key version (AES-256-GCM)
         ↓
Insert into encryption_key_versions (status: pending)
         ↓
Activate key → Update status to 'active'
         ↓
Log in key_rotation_log
```

### 4. Limpeza Automatizada

```
pg_cron (03:00 UTC daily)
         ↓
cleanup_all_data_v2_with_log()
         ↓
Execute 17 retention policies
         ↓
Log results in data_retention_log
```

## Tabelas de Segurança

| Tabela | Propósito | RLS |
|--------|-----------|-----|
| `security_audit_log` | Log de eventos de segurança | ✅ |
| `vault_access_log` | Auditoria de acessos ao Vault | ✅ |
| `encryption_key_versions` | Versões de chaves de criptografia | ✅ |
| `key_rotation_log` | Log de rotações de chaves | ✅ |
| `data_retention_log` | Log de execuções de cleanup | ✅ |
| `ip_blocklist` | IPs bloqueados | ✅ |
| `gdpr_requests` | Requisições LGPD | ✅ |
| `gdpr_audit_log` | Auditoria LGPD | ✅ |

## Links Rápidos

- [Documentação de Autenticação](./AUTHENTICATION_SYSTEM.md)
- [Registry de Edge Functions](./EDGE_FUNCTIONS_REGISTRY.md)
- [Coding Standards](./CODING_STANDARDS.md)
- [Edge Functions Style Guide](./EDGE_FUNCTIONS_STYLE_GUIDE.md)

## Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 2026-01-19 | 1.0.0 | Documento inicial com todos os 5 módulos de segurança |
