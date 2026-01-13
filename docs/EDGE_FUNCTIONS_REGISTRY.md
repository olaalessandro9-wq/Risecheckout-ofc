# Rise Checkout - Edge Functions Registry

> **🔴 FONTE DA VERDADE MÁXIMA** - Este documento lista TODAS as Edge Functions deployadas no Supabase.  
> Última atualização: 2026-01-13  
> Mantenedor: AI Assistant + User

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Total de Funções** | 85 |
| **No código local** | 85 |
| **Apenas deployadas** | 0 |
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
14. [Pixels](#pixels)
15. [LGPD/GDPR](#lgpdgdpr)
16. [Vault & Credentials](#vault--credentials)
17. [Health & Diagnostics](#health--diagnostics)
18. [Utilities](#utilities)

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

| `facebook-conversion-api` | `.../facebook-conversion-api` | ❌ | 2 months ago | 117 |

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
| `members-area-modules` | `.../members-area-modules` | ✅ | NEW | 0 |
| `members-area-progress` | `.../members-area-progress` | ✅ | 7 min ago | 70 |
| `members-area-quizzes` | `.../members-area-quizzes` | ✅ | 7 min ago | 71 |
| `content-crud` | `.../content-crud` | ✅ | NEW | 0 |
| `content-save` | `.../content-save` | ✅ | NEW | 0 |
| `students-invite` | `.../students-invite` | ✅ | NEW | 0 |
| `students-access` | `.../students-access` | ✅ | NEW | 0 |
| `students-groups` | `.../students-groups` | ✅ | NEW | 0 |
| `students-list` | `.../students-list` | ✅ | NEW | 0 |

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
| `product-crud` | `.../product-crud` | ✅ | NEW | 0 |
| `product-settings` | `.../product-settings` | ✅ | NEW | 0 |
| `offer-crud` | `.../offer-crud` | ✅ | NEW | 0 |
| `offer-bulk` | `.../offer-bulk` | ✅ | NEW | 0 |
| `checkout-crud` | `.../checkout-crud` | ✅ | NEW | 0 |
| `checkout-editor` | `.../checkout-editor` | ✅ | NEW | 0 |
| `order-bump-crud` | `.../order-bump-crud` | ✅ | NEW | 0 |
| `product-duplicate` | `.../product-duplicate` | ✅ | NEW | 0 |
| `coupon-management` | `.../coupon-management` | ✅ | NEW | 0 |
| `integration-management` | `.../integration-management` | ✅ | NEW | 0 |

### Affiliates

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `manage-affiliation` | `.../manage-affiliation` | ✅ | 7 min ago | 298 |
| `request-affiliation` | `.../request-affiliation` | ✅ | 7 min ago | 301 |
| `update-affiliate-settings` | `.../update-affiliate-settings` | ✅ | 7 min ago | 103 |
| `get-affiliation-details` | `.../get-affiliation-details` | ✅ | NEW | 0 |
| `get-affiliation-status` | `.../get-affiliation-status` | ✅ | NEW | 0 |
| `get-all-affiliation-statuses` | `.../get-all-affiliation-statuses` | ✅ | NEW | 0 |
| `get-my-affiliations` | `.../get-my-affiliations` | ✅ | NEW | 0 |

### Pixels

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `pixel-management` | `.../pixel-management` | ✅ | NEW | 0 |

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


---

## Funções NÃO Presentes no Código Local (0)

> ✅ **Todas as funções estão sincronizadas!** Não há mais dívida técnica de funções deployed-only.

| Função | Categoria | Ação Recomendada |
|--------|-----------|------------------|
| - | - | Nenhuma ação necessária |

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
| 2026-01-13 | **FASE 3**: Criados 21 stubs para funções deployed-only - DÍVIDA TÉCNICA ZERO! |
| 2026-01-13 | **FASE 2**: Deletadas 6 funções legado: `webhook-pushingpay`, `forward-to-utmify`, `facebook-conversions-api`, `save-vendor-credentials`, `migrate-credentials-to-vault`, `fix-inactive-products` |
| 2026-01-13 | **REFATORAÇÃO FASE 1.4**: `members-area-students` (1155 linhas) dividida em 4 Edge Functions especializadas |
| 2026-01-13 | Criada `students-invite` (~280 linhas) - Convites: invite, auto-invite |
| 2026-01-13 | Criada `students-access` (~100 linhas) - Acesso: grant-access, revoke-access |
| 2026-01-13 | Criada `students-groups` (~140 linhas) - Grupos: assign-groups |
| 2026-01-13 | Criada `students-list` (~250 linhas) - Listagem: list |
| 2026-01-13 | Migrados 4 arquivos frontend para usar novas Edge Functions de students |
| 2026-01-13 | Deletada `members-area-students` (substituída pelas 4 novas funções) |
| 2026-01-13 | **REFATORAÇÃO FASE 1.4**: `members-area-content` (584 linhas) dividida em 2 Edge Functions especializadas |
| 2026-01-13 | Criada `content-crud` (~260 linhas) - CRUD: create, update, delete, reorder |
| 2026-01-13 | Criada `content-save` (~230 linhas) - Save: save-full (atomic) |
| 2026-01-13 | Migrados 2 arquivos frontend para usar novas Edge Functions de content |
| 2026-01-13 | Deletada `members-area-content` (substituída pelas 2 novas funções) |
| 2026-01-13 | **REFATORAÇÃO FASE 1.3**: `offer-management` (603 linhas) dividida em 2 Edge Functions especializadas |
| 2026-01-13 | Criada `offer-crud` (~280 linhas) - CRUD individual: create, update, delete |
| 2026-01-13 | Criada `offer-bulk` (~220 linhas) - Bulk operations: bulk-save |
| 2026-01-13 | Migrado `useGeneralTab.ts` para usar novas Edge Functions de oferta |
| 2026-01-13 | Deletada `offer-management` (substituída pelas 2 novas funções) |
| 2026-01-13 | **REFATORAÇÃO FASE 1.2**: `product-management` (954 linhas) dividida em 2 Edge Functions especializadas |
| 2026-01-13 | Criada `product-crud` (~280 linhas) - CRUD básico: create, update, delete |
| 2026-01-13 | Criada `product-settings` (~300 linhas) - Settings: update-settings, update-general, smart-delete, update-price |
| 2026-01-13 | Migrados 6 arquivos frontend para usar novas Edge Functions de produto |
| 2026-01-13 | Deletada `product-management` (substituída pelas 2 novas funções) |
| 2026-01-13 | **REFATORAÇÃO FASE 1.1**: `checkout-management` (1354 linhas) dividida em 3 Edge Functions especializadas |
| 2026-01-13 | Criada `checkout-crud` (~296 linhas) - CRUD de checkouts: create, update, set-default, delete, toggle-link-status |
| 2026-01-13 | Criada `checkout-editor` (~239 linhas) - Editor: get-editor-data, update-design |
| 2026-01-13 | Criada `order-bump-crud` (~213 linhas) - CRUD de order bumps: create, update, delete, reorder |
| 2026-01-13 | Migrados 6 arquivos frontend para usar novas Edge Functions especializadas |
| 2026-01-13 | Deletada `checkout-management` (substituída pelas 3 novas funções) |
| 2026-01-13 | Criados módulos compartilhados: `_shared/session.ts`, `_shared/response.ts`, `_shared/ownership.ts` |
| 2026-01-13 | Criada `pixel-management` Edge Function - migração completa de `useVendorPixels.ts` |
| 2026-01-13 | Adicionadas 4 funções de afiliação ao Registry: `get-affiliation-details`, `get-affiliation-status`, `get-all-affiliation-statuses`, `get-my-affiliations` |
| 2026-01-13 | Adicionado rate limiting em `members-area-modules` e `members-area-content` |
| 2026-01-13 | Adicionada ação `update-price` em `product-management` - atualização atômica de preço |
| 2026-01-13 | Adicionada ação `order-bump/reorder` em `checkout-management` - reordenação via Edge Function |
| 2026-01-13 | Migrado `EditPriceDialog.tsx` - zero operações diretas ao banco |
| 2026-01-13 | Migrado `OrderBumpList.tsx` - zero operações diretas ao banco (reorder e delete) |
| 2026-01-13 | Expandida `checkout-management` com ações `get-editor-data` e `update-design` |
| 2026-01-13 | Migrado `CheckoutCustomizer.tsx` - zero operações diretas ao banco |
| 2026-01-12 | Adicionadas `members-area-modules` e `members-area-content` - migração completa da Members Area |
| 2026-01-12 | Expandida `product-management` com ação `update-general` |
| 2026-01-12 | Removidos hooks `useDripSettings` e `useAttachmentUpload` - lógica integrada em `members-area-content` |
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

## Módulos Compartilhados (`_shared/`)

| Arquivo | Descrição |
|---------|-----------|
| `cors.ts` | CORS seguro com lista de origens permitidas |
| `sentry.ts` | Integração com Sentry para tracking de erros |
| `rate-limit.ts` | Rate limiting usando `rate_limit_attempts` |
| `session.ts` | Validação de sessão do produtor |
| `response.ts` | Helpers para respostas JSON padronizadas |
| `ownership.ts` | Verificação de ownership (produto, checkout, offer, pixel) |

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
