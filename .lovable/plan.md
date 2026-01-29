
# Plano: Fase 3 - Migração Completa de `.from("profiles")` para `.from("users")`

## Diagnóstico Técnico

### Situação Atual

A auditoria identificou **160 ocorrências** de `.from("profiles")` em **20 arquivos** de Edge Functions. Estas queries precisam ser migradas para usar a tabela `users` como SSOT.

### Arquivos a Modificar

| # | Arquivo | Ocorrências | Campos Usados |
|---|---------|-------------|---------------|
| 1 | `_shared/integration-profile-handlers.ts` | 3 | asaas_wallet_id, name, cpf_cnpj, phone |
| 2 | `_shared/fee-calculator.ts` | 1 | custom_fee_percent |
| 3 | `_shared/user-sync.ts` | 3 | id, email, name, password_hash |
| 4 | `_shared/asaas-split-calculator.ts` | 2 | asaas_wallet_id |
| 5 | `admin-data/handlers/users.ts` | 5 | id, name, registration_source, status, custom_fee_percent |
| 6 | `admin-data/handlers/products.ts` | 2 | id, name |
| 7 | `admin-data/handlers/products-detail.ts` | 2 | asaas_wallet_id, mercadopago_collector_id, stripe_account_id, name |
| 8 | `admin-data/handlers/analytics.ts` | 1 | id, name |
| 9 | `manage-user-status/index.ts` | 2 | status, custom_fee_percent |
| 10 | `producer-profile/index.ts` | 2 | name, cpf_cnpj, phone, asaas_wallet_id, mercadopago_collector_id, stripe_account_id |
| 11 | `rpc-proxy/index.ts` | 1 | timezone |
| 12 | `students-invite/handlers/invite.ts` | 1 | name |
| 13 | `students-list/handlers/get_producer_info.ts` | 1 | id, name |
| 14 | `request-affiliation/index.ts` | 1 | asaas_wallet_id, mercadopago_collector_id, stripe_account_id |
| 15 | `mercadopago-oauth-callback/handlers/integration-saver.ts` | 1 | mercadopago_collector_id, mercadopago_email |
| 16 | `stripe-create-payment/handlers/post-payment.ts` | 1 | stripe_account_id |
| 17 | `owner-settings/index.ts` | 1 | role (OBSOLETO - usar user_roles) |
| 18 | `utmify-conversion/index.ts` | 1 | utmify_token |
| 19 | `unified-auth/handlers/ensure-producer-access.ts` | 1 | name |

### Verificação de Compatibilidade

A tabela `users` já possui TODAS as colunas necessárias:

```text
✅ id, email, name, phone, cpf_cnpj
✅ asaas_wallet_id, mercadopago_collector_id, stripe_account_id
✅ mercadopago_email, mercadopago_connected_at
✅ custom_fee_percent, timezone, status
✅ registration_source, account_status
✅ created_at, updated_at, last_login_at
✅ password_hash, password_hash_version
```

Colunas que NÃO existem em `users` (precisam ser adicionadas):

```text
⚠️ utmify_token (usado em utmify-conversion)
⚠️ status_reason, status_changed_at, status_changed_by (moderação)
```

---

## Análise de Soluções (RISE V3 Seção 4.4)

### Solução A: Migração Parcial (apenas campos existentes)

- Manutenibilidade: 7/10 (deixa alguns campos em profiles)
- Zero DT: 5/10 (mantém dependência dupla)
- Arquitetura: 6/10 (SSOT parcial)
- Escalabilidade: 7/10 (funciona mas não ideal)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 7.0/10**
- Tempo estimado: 2 horas

### Solução B: Migração Completa com Schema Extension

- Manutenibilidade: 10/10 (elimina dependência de profiles)
- Zero DT: 10/10 (SSOT absoluto)
- Arquitetura: 10/10 (Clean Architecture)
- Escalabilidade: 10/10 (suporta crescimento)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 horas

### DECISÃO: Solução B (Nota 10.0/10)

Conforme RISE V3 Seção 4.6, devemos adicionar as colunas faltantes na tabela `users` e migrar 100% das queries.

---

## Implementação Técnica

### Fase 3.1: Schema Extension (Migração SQL)

```sql
-- Adicionar colunas faltantes na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS utmify_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES users(id);

-- Sincronizar dados de profiles para users (onde existir)
UPDATE users u
SET 
  utmify_token = COALESCE(u.utmify_token, p.utmify_token),
  status_reason = COALESCE(u.status_reason, p.status_reason),
  status_changed_at = COALESCE(u.status_changed_at, p.status_changed_at),
  status_changed_by = COALESCE(u.status_changed_by, p.status_changed_by)
FROM profiles p
WHERE u.id = p.id;
```

### Fase 3.2: Atualização de Edge Functions

#### 1. `_shared/integration-profile-handlers.ts` (3 ocorrências)

```typescript
// ANTES
.from("profiles")
.update({ asaas_wallet_id: walletId })

// DEPOIS
.from("users")
.update({ asaas_wallet_id: walletId })
```

#### 2. `_shared/fee-calculator.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("custom_fee_percent")

// DEPOIS
.from("users")
.select("custom_fee_percent")
```

#### 3. `_shared/user-sync.ts` (3 ocorrências)

Este arquivo precisa ser REFATORADO completamente pois sincroniza entre `auth.users` e `profiles`. Com o novo sistema, deve sincronizar apenas com `users`.

```typescript
// Refatorar para usar apenas tabela users
// Remover referências a profiles
```

#### 4. `_shared/asaas-split-calculator.ts` (2 ocorrências)

```typescript
// ANTES
.from('profiles')
.select('asaas_wallet_id')

// DEPOIS
.from('users')
.select('asaas_wallet_id')
```

#### 5. `admin-data/handlers/users.ts` (5 ocorrências)

```typescript
// ANTES
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, name, registration_source, status");

// DEPOIS
const { data: usersData } = await supabase
  .from("users")
  .select("id, name, registration_source, account_status");

// NOTA: Renomear variável e ajustar campo status -> account_status
```

#### 6. `admin-data/handlers/products.ts` (2 ocorrências)

```typescript
// ANTES
supabase.from("profiles").select("id, name")

// DEPOIS
supabase.from("users").select("id, name")
```

#### 7. `admin-data/handlers/products-detail.ts` (2 ocorrências)

```typescript
// ANTES
.from("profiles")
.select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")

// DEPOIS
.from("users")
.select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
```

#### 8. `admin-data/handlers/analytics.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("id, name")

// DEPOIS
.from("users")
.select("id, name")
```

#### 9. `manage-user-status/index.ts` (2 ocorrências)

```typescript
// ANTES
.from("profiles")
.update({ status, status_reason, ... })

// DEPOIS
.from("users")
.update({ account_status: status, status_reason, ... })

// NOTA: Mapear status -> account_status
```

#### 10. `producer-profile/index.ts` (2 ocorrências)

```typescript
// ANTES
.from("profiles")
.select("name, cpf_cnpj, phone")

// DEPOIS
.from("users")
.select("name, cpf_cnpj, phone")
```

#### 11. `rpc-proxy/index.ts` (1 ocorrência)

```typescript
// ANTES
.from('profiles')
.select('timezone')

// DEPOIS
.from('users')
.select('timezone')
```

#### 12. `students-invite/handlers/invite.ts` (1 ocorrência)

```typescript
// ANTES
await supabase.from("profiles").select("name").eq("id", producerId).single();

// DEPOIS
await supabase.from("users").select("name").eq("id", producerId).single();
```

#### 13. `students-list/handlers/get_producer_info.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("id, name")

// DEPOIS
.from("users")
.select("id, name")
```

#### 14. `request-affiliation/index.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")

// DEPOIS
.from("users")
.select("asaas_wallet_id, mercadopago_collector_id, stripe_account_id")
```

#### 15. `mercadopago-oauth-callback/handlers/integration-saver.ts` (1 ocorrência)

```typescript
// ANTES
.from('profiles')
.update({ mercadopago_collector_id, mercadopago_email, ... })

// DEPOIS
.from('users')
.update({ mercadopago_collector_id, mercadopago_email, ... })
```

#### 16. `stripe-create-payment/handlers/post-payment.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("stripe_account_id")

// DEPOIS
.from("users")
.select("stripe_account_id")
```

#### 17. `owner-settings/index.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("role")

// DEPOIS (usar user_roles como SSOT de roles)
.from("user_roles")
.select("role")
```

#### 18. `utmify-conversion/index.ts` (1 ocorrência)

```typescript
// ANTES
.from('profiles')
.select('utmify_token')

// DEPOIS
.from('users')
.select('utmify_token')
```

#### 19. `unified-auth/handlers/ensure-producer-access.ts` (1 ocorrência)

```typescript
// ANTES
.from("profiles")
.select("name")

// DEPOIS
.from("users")
.select("name")
```

---

## Mapeamento de Campos

| Campo em `profiles` | Campo em `users` | Notas |
|---------------------|------------------|-------|
| `status` | `account_status` | Enum, precisa ajustar lógica |
| `role` | N/A | Usar `user_roles.role` |
| Demais campos | Mesmo nome | Compatível 1:1 |

---

## Verificação Pós-Migração

```sql
-- Verificar que NÃO há mais queries para profiles nas Edge Functions
-- (verificação manual via grep/search)

-- Verificar integridade dos dados
SELECT 
  (SELECT COUNT(*) FROM users WHERE asaas_wallet_id IS NOT NULL) as users_with_asaas,
  (SELECT COUNT(*) FROM profiles WHERE asaas_wallet_id IS NOT NULL) as profiles_with_asaas;
```

---

## Resumo de Alterações

| Categoria | Quantidade |
|-----------|------------|
| Arquivos a modificar | 19 |
| Ocorrências `.from("profiles")` | ~30 |
| Colunas a adicionar em `users` | 4 |
| Migrações SQL | 1 |

---

## Conformidade RISE V3

| Critério | Nota |
|----------|------|
| Manutenibilidade Infinita | 10/10 |
| Zero Dívida Técnica | 10/10 |
| Arquitetura Correta | 10/10 |
| Escalabilidade | 10/10 |
| Segurança | 10/10 |
| **NOTA FINAL** | **10.0/10** |
