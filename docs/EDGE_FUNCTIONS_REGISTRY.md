# Rise Checkout - Edge Functions Registry

> **🔴 FONTE DA VERDADE MÁXIMA** - Este documento lista TODAS as Edge Functions deployadas no Supabase.  
> Última atualização: 2026-01-12  
> Mantenedor: AI Assistant + User

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Total de Funções** | 72 |
| **No código local** | 50 |
| **Apenas deployadas** | 22 |
| **Base URL** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/` |

---

## Índice por Categoria

1. [Payments - Asaas](#payments---asaas)
2. [Payments - PushinPay](#payments---pushinpay)
3. [Payments - MercadoPago](#payments---mercadopago)
4. [Payments - Stripe](#payments---stripe)
5. [Tracking & Analytics](#tracking--analytics)
6. [Orders](#orders)
7. [Webhooks](#webhooks)
8. [Buyer Portal](#buyer-portal)
9. [Members Area](#members-area)
10. [Email](#email)
11. [Security & Crypto](#security--crypto)
12. [User Management](#user-management)
13. [Affiliates](#affiliates)
14. [LGPD/GDPR](#lgpdgdpr)
15. [Vault & Credentials](#vault--credentials)
16. [Health & Diagnostics](#health--diagnostics)
17. [Utilities](#utilities)

---

## Lista Completa por Categoria

### Payments - Asaas

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `asaas-create-payment` | `.../asaas-create-payment` | ✅ | 7 min ago | 154 |
| `asaas-webhook` | `.../asaas-webhook` | ✅ | 7 min ago | 160 |
| `asaas-validate-credentials` | `.../asaas-validate-credentials` | ❌ | 18 days ago | 19 |

### Payments - PushinPay

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `pushinpay-create-pix` | `.../pushinpay-create-pix` | ✅ | 7 min ago | 404 |
| `pushinpay-get-status` | `.../pushinpay-get-status` | ✅ | 7 min ago | 364 |
| `pushinpay-webhook` | `.../pushinpay-webhook` | ✅ | 7 min ago | 386 |
| `pushinpay-stats` | `.../pushinpay-stats` | ❌ | 2 months ago | 98 |
| `test-pushinpay-connection` | `.../test-pushinpay-connection` | ❌ | 2 months ago | 98 |
| `webhook-pushingpay` | `.../webhook-pushingpay` | ❌ | 2 months ago | 244 |

### Payments - MercadoPago

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `mercadopago-create-payment` | `.../mercadopago-create-payment` | ✅ | 7 min ago | 880 |
| `mercadopago-webhook` | `.../mercadopago-webhook` | ✅ | 7 min ago | 485 |
| `mercadopago-oauth-callback` | `.../mercadopago-oauth-callback` | ✅ | 7 min ago | 434 |

### Payments - Stripe

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `stripe-create-payment` | `.../stripe-create-payment` | ✅ | 7 min ago | 217 |
| `stripe-webhook` | `.../stripe-webhook` | ✅ | 7 min ago | 217 |
| `stripe-connect-oauth` | `.../stripe-connect-oauth` | ✅ | 7 min ago | 217 |

### Tracking & Analytics

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `utmify-conversion` | `.../utmify-conversion` | ❌ | 2 months ago | 115 |
| `forward-to-utmify` | `.../forward-to-utmify` | ❌ | 2 months ago | 246 |
| `facebook-conversion-api` | `.../facebook-conversion-api` | ❌ | 2 months ago | 117 |
| `facebook-conversions-api` | `.../facebook-conversions-api` | ❌ | 2 months ago | 50 |
| `dashboard-analytics` | `.../dashboard-analytics` | ❌ | 2 months ago | 136 |
| `checkout-heartbeat` | `.../checkout-heartbeat` | ❌ | 2 months ago | 244 |
| `detect-abandoned-checkouts` | `.../detect-abandoned-checkouts` | ❌ | 2 months ago | 244 |

### Orders

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `create-order` | `.../create-order` | ✅ | 7 min ago | 901 |
| `get-order-for-pix` | `.../get-order-for-pix` | ❌ | 2 months ago | 145 |
| `alert-stuck-orders` | `.../alert-stuck-orders` | ✅ | 7 min ago | 53 |
| `reconcile-pending-orders` | `.../reconcile-pending-orders` | ✅ | 7 min ago | 55 |

### Webhooks

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `trigger-webhooks` | `.../trigger-webhooks` | ✅ | 7 min ago | 809 |
| `process-webhook-queue` | `.../process-webhook-queue` | ✅ | 7 min ago | 703 |
| `dispatch-webhook` | `.../dispatch-webhook` | ❌ | a month ago | 180 |
| `send-webhook` | `.../send-webhook` | ❌ | 2 months ago | 89 |
| `retry-webhooks` | `.../retry-webhooks` | ❌ | 2 months ago | 270 |
| `send-webhook-test` | `.../send-webhook-test` | ✅ | 7 min ago | 90 |
| `get-webhook-logs` | `.../get-webhook-logs` | ❌ | 2 months ago | 52 |
| `test-webhook-dispatch` | `.../test-webhook-dispatch` | ❌ | 2 months ago | 45 |
| `trigger-webhooks-internal` | `.../trigger-webhooks-internal` | ❌ | 2 months ago | 62 |

### Buyer Portal

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `buyer-auth` | `.../buyer-auth` | ✅ | 7 min ago | 85 |
| `buyer-orders` | `.../buyer-orders` | ✅ | 7 min ago | 81 |
| `buyer-profile` | `.../buyer-profile` | ❌ | 12 days ago | 6 |
| `buyer-session` | `.../buyer-session` | ❌ | 12 days ago | 6 |

### Members Area

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `members-area-certificates` | `.../members-area-certificates` | ✅ | 7 min ago | 71 |
| `members-area-drip` | `.../members-area-drip` | ✅ | 7 min ago | 72 |
| `members-area-groups` | `.../members-area-groups` | ✅ | 7 min ago | 75 |
| `members-area-progress` | `.../members-area-progress` | ✅ | 7 min ago | 70 |
| `members-area-quizzes` | `.../members-area-quizzes` | ✅ | 7 min ago | 71 |
| `members-area-students` | `.../members-area-students` | ✅ | 7 min ago | 78 |

### Email

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `send-email` | `.../send-email` | ✅ | 7 min ago | 127 |
| `send-confirmation-email` | `.../send-confirmation-email` | ❌ | 2 months ago | 53 |
| `send-pix-email` | `.../send-pix-email` | ❌ | 2 months ago | 53 |

### Security & Crypto

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `decrypt-customer-data` | `.../decrypt-customer-data` | ✅ | 7 min ago | 48 |
| `decrypt-customer-data-batch` | `.../decrypt-customer-data-batch` | ✅ | 7 min ago | 43 |
| `encrypt-token` | `.../encrypt-token` | ❌ | 2 months ago | 192 |
| `verify-turnstile` | `.../verify-turnstile` | ✅ | 7 min ago | 47 |

### User Management

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `get-users-with-emails` | `.../get-users-with-emails` | ✅ | 7 min ago | 165 |
| `manage-user-role` | `.../manage-user-role` | ✅ | 7 min ago | 167 |
| `manage-user-status` | `.../manage-user-status` | ✅ | 7 min ago | 165 |
| `producer-auth` | `.../producer-auth` | ✅ | 7 min ago | 29 |
| `product-management` | `.../product-management` | ✅ | NEW | 0 |
| `offer-management` | `.../offer-management` | ✅ | NEW | 0 |
| `checkout-management` | `.../checkout-management` | ✅ | NEW | 0 |
| `product-duplicate` | `.../product-duplicate` | ✅ | NEW | 0 |
| `coupon-management` | `.../coupon-management` | ✅ | NEW | 0 |
| `integration-management` | `.../integration-management` | ✅ | NEW | 0 |

### Affiliates

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `manage-affiliation` | `.../manage-affiliation` | ✅ | 7 min ago | 298 |
| `request-affiliation` | `.../request-affiliation` | ✅ | 7 min ago | 301 |
| `update-affiliate-settings` | `.../update-affiliate-settings` | ✅ | 7 min ago | 103 |

### LGPD/GDPR

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `gdpr-forget` | `.../gdpr-forget` | ✅ | 7 min ago | 6 |
| `gdpr-request` | `.../gdpr-request` | ✅ | 7 min ago | 6 |

### Vault & Credentials

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `vault-save` | `.../vault-save` | ✅ | 7 min ago | 102 |
| `vault-migration` | `.../vault-migration` | ✅ | 7 min ago | 103 |
| `save-vendor-credentials` | `.../save-vendor-credentials` | ❌ | 18 days ago | 216 |
| `migrate-credentials-to-vault` | `.../migrate-credentials-to-vault` | ❌ | 18 days ago | 216 |
| `check-secrets` | `.../check-secrets` | ❌ | 19 days ago | 14 |

### Health & Diagnostics

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `health` | `.../health` | ✅ | 7 min ago | 256 |
| `smoke-test` | `.../smoke-test` | ✅ | 7 min ago | 55 |
| `test-deploy` | `.../test-deploy` | ✅ | 7 min ago | 141 |

### Utilities

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `fix-inactive-products` | `.../fix-inactive-products` | ❌ | 2 months ago | 108 |

---

## Funções NÃO Presentes no Código Local (22)

> ⚠️ **Atenção**: Estas funções estão deployadas no Supabase mas NÃO existem no repositório local.
> Isso representa dívida técnica e risco de inconsistência.

| Função | Categoria | Ação Recomendada |
|--------|-----------|------------------|
| `asaas-validate-credentials` | Payments | Criar no repo |
| `pushinpay-stats` | Payments | Criar no repo |
| `test-pushinpay-connection` | Payments | Criar no repo |
| `webhook-pushingpay` | Payments | **Legacy - Deprecar** |
| `utmify-conversion` | Tracking | Criar no repo |
| `forward-to-utmify` | Tracking | **Legacy - Deprecar** |
| `facebook-conversion-api` | Tracking | Criar no repo |
| `facebook-conversions-api` | Tracking | **Duplicate - Deprecar** |
| `dashboard-analytics` | Tracking | Criar no repo |
| `checkout-heartbeat` | Tracking | Criar no repo |
| `detect-abandoned-checkouts` | Tracking | Criar no repo |
| `get-order-for-pix` | Orders | Criar no repo |
| `dispatch-webhook` | Webhooks | Criar no repo |
| `send-webhook` | Webhooks | Criar no repo |
| `retry-webhooks` | Webhooks | Criar no repo |
| `get-webhook-logs` | Webhooks | Criar no repo |
| `test-webhook-dispatch` | Webhooks | Criar no repo |
| `trigger-webhooks-internal` | Webhooks | Criar no repo |
| `buyer-profile` | Buyer | Criar no repo |
| `buyer-session` | Buyer | Criar no repo |
| `send-confirmation-email` | Email | Criar no repo |
| `send-pix-email` | Email | Criar no repo |
| `encrypt-token` | Security | Criar no repo |
| `save-vendor-credentials` | Vault | **Legacy - Usar vault-save** |
| `migrate-credentials-to-vault` | Vault | **One-time - Pode remover** |
| `check-secrets` | Vault | Criar no repo |
| `fix-inactive-products` | Utilities | **One-time - Pode remover** |

---

## Notas de Manutenção

### Como Atualizar Este Documento

1. Acesse o Supabase Dashboard → Edge Functions
2. Copie a lista de funções
3. Compare com este documento
4. Atualize as métricas e datas

### Convenções

- ✅ = Presente no código local (`supabase/functions/`)
- ❌ = Apenas deployada (não está no repo)
- **Legacy** = Função antiga que deve ser deprecada
- **Duplicate** = Função duplicada, manter apenas uma
- **One-time** = Função de migração/fix que pode ser removida

### Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-12 | Adicionadas `coupon-management` e `integration-management` - migração completa de CuponsTab e MercadoPagoConfig |
| 2026-01-12 | Expandida `product-management` com ações `update-settings` e `smart-delete` |
| 2026-01-12 | Expandida `checkout-management` com ação `toggle-link-status` |
| 2026-01-12 | Expandida `members-area-students` com ação `assign_groups` |
| 2026-01-12 | Migrados frontends: useProductSettings, deleteProduct, CuponsTab, LinksTab, StudentsTab |
| 2026-01-12 | Expandida `checkout-management` com ações CREATE, UPDATE e SET-DEFAULT |
| 2026-01-12 | Adicionadas `offer-management`, `checkout-management`, `product-duplicate` |
| 2026-01-12 | Adicionada `product-management` para CRUD de produtos via backend |
| 2026-01-12 | Criação inicial do documento com 66 funções |

---

## Referência Rápida

```bash
# Base URL para todas as funções
https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/{function-name}

# Exemplo de chamada
curl -X POST \
  https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```
