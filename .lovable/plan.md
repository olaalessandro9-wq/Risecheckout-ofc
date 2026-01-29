
# Plano: Correção de Foreign Keys Legadas - Migração para `users` SSOT

## Diagnóstico Completo

### O Problema Identificado

O sistema de autenticação foi migrado para usar a tabela `users` como **Single Source of Truth (SSOT)**, mas **19+ tabelas** ainda mantêm Foreign Keys para:
- `auth.users(id)` - 17 tabelas
- `profiles(id)` - 3 tabelas

Isso causa erros de FK quando usuários criados pelo sistema unificado tentam:
- Criar produtos (FK para `auth.users`)
- Conectar Mercado Pago (FK para `profiles`)
- Criar webhooks, orders, etc.

### Usuários Afetados

```text
Usuários com BUG (criados apos 22/01/2026):
┌───────────────────────────────────┬───────────────┬───────────────┐
│ Email                             │ auth.users    │ profiles      │
├───────────────────────────────────┼───────────────┼───────────────┤
│ sandro099@gmail.com               │ ❌ MISSING    │ ❌ MISSING    │
│ sandro098@gmail.com               │ ❌ MISSING    │ ❌ MISSING    │
│ maiconmiranda1528@gmail.com       │ ❌ MISSING    │ ❌ MISSING    │
│ olaalessandro9@gmail.com          │ ❌ MISSING    │ ❌ MISSING    │
└───────────────────────────────────┴───────────────┴───────────────┘

Usuarios OK (criados antes da migracao):
┌───────────────────────────────────┬───────────────┬───────────────┐
│ rdgsandro1@gmail.com              │ ✓ EXISTS      │ ✓ EXISTS      │
│ alessanderlaem@gmail.com          │ ✓ EXISTS      │ ✓ EXISTS      │
└───────────────────────────────────┴───────────────┴───────────────┘
```

### Tabelas com FKs Legadas para `auth.users`

| Tabela | Coluna | Impacto |
|--------|--------|---------|
| `products` | `user_id` | **Criacao de produtos** |
| `orders` | `vendor_id` | Vendas |
| `vendor_integrations` | `vendor_id` | Integracoes |
| `affiliates` | `user_id` | Afiliados |
| `checkout_sessions` | `vendor_id` | Checkout |
| `outbound_webhooks` | `vendor_id` | Webhooks |
| `payment_gateway_settings` | `user_id` | Config pagamento |
| `mercadopago_split_config` | `vendor_id` | Split MP |
| `vendor_profiles` | `user_id` | Perfil vendedor |
| `order_events` | `vendor_id` | Eventos |
| `security_audit_log` | `user_id` | Auditoria |
| `vendor_pixels` | `vendor_id` | Pixels |
| `profiles` | `id` | Tabela legada |

### Tabelas com FKs Legadas para `profiles`

| Tabela | Coluna | Impacto |
|--------|--------|---------|
| `oauth_states` | `vendor_id` | **Conexao Mercado Pago** |
| `notifications` | `user_id` | Notificacoes |
| `producer_audit_log` | `producer_id` | Auditoria |

---

## Analise de Solucoes (RISE V3 Secao 4.4)

### Solucao A: Migrar FKs para tabela `users`
- Manutenibilidade: 10/10 (elimina duplicidade, SSOT verdadeiro)
- Zero DT: 10/10 (resolve causa raiz permanentemente)
- Arquitetura: 10/10 (alinha com decisao de usar `users` como SSOT)
- Escalabilidade: 10/10 (novos usuarios funcionam imediatamente)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 horas

### Solucao B: Criar registros em `auth.users` e `profiles` durante registro
- Manutenibilidade: 4/10 (mantem 3 tabelas de identidade)
- Zero DT: 3/10 (nao resolve problema arquitetural)
- Arquitetura: 2/10 (viola decisao de SSOT em `users`)
- Escalabilidade: 3/10 (mantem complexidade desnecessaria)
- Seguranca: 8/10 (funcional, mas complexo)
- **NOTA FINAL: 4.0/10**
- Tempo estimado: 2 horas

### Solucao C: Correcao pontual apenas para usuarios afetados
- Manutenibilidade: 2/10 (nao resolve causa raiz)
- Zero DT: 1/10 (problema volta para proximos usuarios)
- Arquitetura: 1/10 (gambiarra)
- Escalabilidade: 0/10 (cada novo usuario tera o problema)
- Seguranca: 10/10 (sem impacto)
- **NOTA FINAL: 2.8/10**
- Tempo estimado: 30 minutos

### DECISAO: Solucao A (Nota 10.0/10)

A migracao completa das FKs para `users` e a unica solucao que:
1. Elimina o problema permanentemente
2. Alinha a arquitetura com a decisao de SSOT
3. Permite que novos usuarios funcionem sem intervencao manual

---

## Implementacao Tecnica

### Fase 1: Migracao de FKs de `auth.users` para `users`

```sql
-- 1. products.user_id
ALTER TABLE products DROP CONSTRAINT products_user_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. orders.vendor_id
ALTER TABLE orders DROP CONSTRAINT orders_vendor_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. vendor_integrations.vendor_id
ALTER TABLE vendor_integrations DROP CONSTRAINT vendor_integrations_vendor_id_fkey;
ALTER TABLE vendor_integrations ADD CONSTRAINT vendor_integrations_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- ... (14+ tabelas adicionais)
```

### Fase 2: Migracao de FKs de `profiles` para `users`

```sql
-- 1. oauth_states.vendor_id
ALTER TABLE oauth_states DROP CONSTRAINT oauth_states_vendor_id_fkey;
ALTER TABLE oauth_states ADD CONSTRAINT oauth_states_vendor_id_fkey 
  FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. notifications.user_id
ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. producer_audit_log.producer_id
ALTER TABLE producer_audit_log DROP CONSTRAINT producer_audit_log_producer_id_fkey;
ALTER TABLE producer_audit_log ADD CONSTRAINT producer_audit_log_producer_id_fkey 
  FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE SET NULL;
```

### Fase 3: Atualizar Documentacao

Atualizar `docs/DATABASE_SCHEMA.md` e `docs/UNIFIED_AUTH_SYSTEM.md` para refletir que `users` e o unico SSOT de identidade.

### Fase 4: Deprecar Tabelas Legadas

Adicionar comentarios nas tabelas `profiles` e `auth.users` indicando que sao legadas e nao devem ser usadas diretamente.

---

## Lista Completa de Alteracoes de FK

### FKs para `auth.users` que precisam migrar para `users`

| # | Tabela | Constraint | Nova Referencia |
|---|--------|------------|-----------------|
| 1 | `products` | `products_user_id_fkey` | `users(id)` |
| 2 | `orders` | `orders_vendor_id_fkey` | `users(id)` |
| 3 | `order_events` | `order_events_vendor_id_fkey` | `users(id)` |
| 4 | `checkout_sessions` | `checkout_sessions_vendor_id_fkey` | `users(id)` |
| 5 | `outbound_webhooks` | `outbound_webhooks_vendor_id_fkey` | `users(id)` |
| 6 | `vendor_integrations` | `vendor_integrations_vendor_id_fkey` | `users(id)` |
| 7 | `payment_gateway_settings` | `payment_gateway_settings_user_id_fkey` | `users(id)` |
| 8 | `mercadopago_split_config` | `mercadopago_split_config_vendor_id_fkey` | `users(id)` |
| 9 | `affiliates` | `affiliates_user_id_fkey` | `users(id)` |
| 10 | `vendor_profiles` | `vendor_profiles_user_id_fkey` | `users(id)` |
| 11 | `security_audit_log` | `security_audit_log_user_id_fkey` | `users(id)` |
| 12 | `vendor_pixels` | `vendor_pixels_vendor_id_fkey` | `users(id)` |

### FKs para `profiles` que precisam migrar para `users`

| # | Tabela | Constraint | Nova Referencia |
|---|--------|------------|-----------------|
| 1 | `oauth_states` | `oauth_states_vendor_id_fkey` | `users(id)` |
| 2 | `notifications` | `notifications_user_id_fkey` | `users(id)` |
| 3 | `producer_audit_log` | `producer_audit_log_producer_id_fkey` | `users(id)` |

---

## Verificacao Pos-Migracao

Apos a migracao, executar:

```sql
-- Verificar que todas as FKs agora apontam para users
SELECT 
    cl.relname as table_name,
    c.conname as constraint_name,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
WHERE (pg_get_constraintdef(c.oid) LIKE '%auth.users%'
   OR pg_get_constraintdef(c.oid) LIKE '%profiles%')
AND c.contype = 'f'
AND cl.relnamespace = 'public'::regnamespace;

-- Deve retornar ZERO linhas apos a migracao
```

---

## Conformidade RISE V3

| Criterio | Nota | Justificativa |
|----------|------|---------------|
| Manutenibilidade Infinita | 10/10 | SSOT verdadeiro em `users` |
| Zero Divida Tecnica | 10/10 | Elimina referencias legadas |
| Arquitetura Correta | 10/10 | Alinha com decisao documentada |
| Escalabilidade | 10/10 | Novos usuarios funcionam automaticamente |
| Seguranca | 10/10 | Sem impacto |
| **NOTA FINAL** | **10.0/10** | |
