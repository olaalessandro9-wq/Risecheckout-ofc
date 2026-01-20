# Correções de Segurança - RiseCheckout

**Data:** 29 de Dezembro de 2024  
**Versão:** 2.0.0  
**Status:** Pronto para Deploy

---

## Resumo Executivo

Este documento descreve as correções de segurança implementadas no projeto RiseCheckout para prepará-lo para produção. As mudanças foram divididas em 3 fases conforme o plano consolidado.

---

## Fase 1: Contenção Imediata (Vault)

### 1.1 Migration SQL - Permissões do Vault

**Arquivo:** `supabase/migrations/20251229_security_vault_permissions_rls.sql`

**Mudanças:**
- Revogação de permissões `EXECUTE` para roles `anon` e `authenticated` em TODAS as funções do Vault:
  - `get_vault_secret`
  - `save_vault_secret`
  - `vault_get_secret`
  - `vault_upsert_secret`
- Ativação de Row-Level Security (RLS) na tabela `vault.secrets`
- Criação de política RLS que bloqueia acesso direto

**Impacto:** Apenas Edge Functions com `service_role` podem acessar o Vault.

### 1.2 Edge Function - vault-migration

**Arquivo:** `supabase/functions/vault-migration/index.ts`

**Mudanças:**
- Suporte a TODAS as integrações: MERCADOPAGO, STRIPE, ASAAS, PUSHINPAY, UTMIFY, FACEBOOK_PIXEL
- Processamento de registros ativos E inativos
- Uso de `vault_upsert_secret` para idempotência
- Remoção de credenciais do campo `config` após migração
- Relatório detalhado de migração

**Uso:**
```bash
# Dry run (apenas verifica)
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' \
  https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/vault-migration

# Execução real
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "includeInactive": true}' \
  https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/vault-migration
```

### 1.3 Edge Function - vault-save

**Arquivo:** `supabase/functions/vault-save/index.ts`

**Mudanças:**
- Separação automática de dados sensíveis vs públicos
- Uso de `vault_upsert_secret` para salvar tokens
- Validação de `vendor_id` contra usuário autenticado
- Suporte a todas as integrações

---

## Fase 2: Correção Frontend

### 2.1 UTMifyConfig.tsx

**Arquivo:** `src/components/integrations/UTMifyConfig.tsx`

**Mudanças:**
- Remoção de salvamento direto de `api_token` na tabela
- Integração com Edge Function `vault-save`
- Campo de input com `type="password"` para mascarar token
- Indicador visual quando token já está configurado
- Flag `has_token` no config para indicar existência de token no Vault

### 2.2 FacebookPixelConfig.tsx

**Arquivo:** `src/components/integrations/FacebookPixelConfig.tsx`

**Mudanças:**
- Remoção de salvamento direto de `access_token` na tabela
- Integração com Edge Function `vault-save`
- Campo de input com `type="password"` para mascarar token
- Indicador visual quando token já está configurado
- Flag `has_token` no config para indicar existência de token no Vault

---

## Fase 3: Boas Práticas (CORS)

### 3.1 Helper CORS Compartilhado

> **ATUALIZADO 2026-01-20:** O arquivo `cors.ts` foi migrado para `cors-v2.ts` com 
> validação dinâmica de origens via Supabase Secrets (`CORS_ALLOWED_ORIGINS`).

**Arquivo:** `supabase/functions/_shared/cors-v2.ts`

**Funcionalidades:**
- Origens permitidas gerenciadas via Supabase Secrets (não hardcoded)
- Função `handleCorsV2(req)` que valida origem dinamicamente
- Constante `PUBLIC_CORS_HEADERS` para webhooks públicos

**Configuração de Origens (via Supabase Secrets):**

Os domínios permitidos são configurados via secrets do Supabase:
- `CORS_ALLOWED_ORIGINS` - Domínios de produção (comma-separated)
- `CORS_ALLOWED_ORIGINS_DEV` - Domínios de desenvolvimento (localhost, etc.)

Exemplo de configuração:
```
CORS_ALLOWED_ORIGINS=https://risecheckout.com,https://www.risecheckout.com
CORS_ALLOWED_ORIGINS_DEV=http://localhost:5173,http://localhost:3000
```

### 3.2 Edge Functions Atualizadas

| Função | Antes | Depois |
|--------|-------|--------|
| `get-users-with-emails` | `*` | CORS restrito |
| `manage-user-role` | `*` | CORS restrito |
| `manage-user-status` | `*` | CORS restrito |

---

## Arquivos Criados/Modificados

```
supabase/
├── migrations/
│   └── 20251229_security_vault_permissions_rls.sql  [NOVO]
└── functions/
    ├── _shared/
    │   └── cors-v2.ts  [NOVO → Migrado de cors.ts em 2026-01-20]
    ├── vault-migration/
    │   └── index.ts  [ATUALIZADO]
    ├── vault-save/
    │   └── index.ts  [ATUALIZADO]
    ├── get-users-with-emails/
    │   └── index.ts  [ATUALIZADO]
    ├── manage-user-role/
    │   └── index.ts  [ATUALIZADO]
    └── manage-user-status/
        └── index.ts  [ATUALIZADO]

src/
└── components/
    └── integrations/
        ├── UTMifyConfig.tsx  [ATUALIZADO]
        └── FacebookPixelConfig.tsx  [ATUALIZADO]
```

---

## Instruções de Deploy

### Passo 1: Executar Migration SQL

Execute a migration no Supabase Dashboard ou via CLI:

```bash
supabase db push
```

Ou execute manualmente no SQL Editor do Supabase Dashboard.

### Passo 2: Deploy das Edge Functions

```bash
# Deploy de todas as funções modificadas
supabase functions deploy vault-migration
supabase functions deploy vault-save
supabase functions deploy get-users-with-emails
supabase functions deploy manage-user-role
supabase functions deploy manage-user-status
```

### Passo 3: Executar Migração de Credenciais

Após o deploy, execute a migração para mover os 9 tokens expostos para o Vault:

```bash
# Primeiro, faça um dry run
curl -X POST \
  -H "Authorization: Bearer <SEU_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' \
  https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/vault-migration

# Se tudo estiver OK, execute a migração real
curl -X POST \
  -H "Authorization: Bearer <SEU_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}' \
  https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/vault-migration
```

### Passo 4: Deploy do Frontend

```bash
# Via Lovable ou manualmente
git add .
git commit -m "fix(security): implement vault permissions, RLS, and CORS restrictions"
git push origin main
```

---

## Verificação Pós-Deploy

### Checklist de Segurança

- [ ] Migration SQL executada com sucesso
- [ ] Funções RPC do Vault não acessíveis para `anon`
- [ ] RLS ativado na tabela `vault.secrets`
- [ ] Edge Functions deployadas
- [ ] Migração de credenciais executada (9 tokens)
- [ ] Frontend atualizado
- [ ] Testes de integração passando

### Comandos de Verificação

```sql
-- Verificar permissões do Vault
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name IN ('get_vault_secret', 'vault_get_secret');

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'vault';

-- Verificar tokens migrados
SELECT vendor_id, integration_type, 
       config->>'has_token' as has_token,
       config->>'access_token' IS NOT NULL as token_exposed
FROM vendor_integrations;
```

---

## Contato

Para dúvidas sobre esta implementação, consulte a documentação de arquitetura em `docs/ARCHITECTURE.md` ou entre em contato com a equipe de desenvolvimento.
