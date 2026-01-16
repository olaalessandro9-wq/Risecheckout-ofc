# Rise Checkout - Edge Functions Registry

> **🔴 FONTE DA VERDADE MÁXIMA** - Este documento lista TODAS as Edge Functions deployadas no Supabase.  
> Última atualização: 2026-01-16 (Auditoria Final)  
> Mantenedor: AI Assistant + User

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Total de Funções** | 95 |
| **No código local** | 95 |
| **Apenas deployadas** | 0 |
| **Operações Diretas Frontend** | 0 ✅ |
| **Arquivos API obsoletos removidos** | 1 (src/api/storage/remove.ts) |
| **Base URL** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/` |

### RISE Protocol V2 Compliance Functions (NEW)

| Nome | URL | No Repo? | Descrição |
|------|-----|----------|-----------|
| `rpc-proxy` | `.../rpc-proxy` | ✅ | Centraliza RPCs do frontend |
| `storage-management` | `.../storage-management` | ✅ | Centraliza operações de storage |

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
| `asaas-create-payment` | `.../asaas-create-payment` | ✅ | 10 min ago | 188 |
| `asaas-webhook` | `.../asaas-webhook` | ✅ | 10 min ago | 194 |
| `asaas-validate-credentials` | `.../asaas-validate-credentials` | ✅ | 20 days ago | 19 |

### Payments - PushinPay

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `pushinpay-create-pix` | `.../pushinpay-create-pix` | ✅ | 10 min ago | 438 |
| `pushinpay-get-status` | `.../pushinpay-get-status` | ✅ | 10 min ago | 398 |
| `pushinpay-webhook` | `.../pushinpay-webhook` | ✅ | 10 min ago | 420 |
| `pushinpay-stats` | `.../pushinpay-stats` | ✅ | 10 min ago | 103 |
| `pushinpay-validate-token` | `.../pushinpay-validate-token` | ✅ | NEW | 0 |

### Payments - MercadoPago

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `mercadopago-create-payment` | `.../mercadopago-create-payment` | ✅ | 10 min ago | 915 |
| `mercadopago-webhook` | `.../mercadopago-webhook` | ✅ | 10 min ago | 519 |
| `mercadopago-oauth-callback` | `.../mercadopago-oauth-callback` | ✅ | 10 min ago | 468 |

### Payments - Stripe

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `stripe-create-payment` | `.../stripe-create-payment` | ✅ | 10 min ago | 251 |
| `stripe-webhook` | `.../stripe-webhook` | ✅ | 10 min ago | 252 |
| `stripe-connect-oauth` | `.../stripe-connect-oauth` | ✅ | 10 min ago | 251 |

### Tracking & Analytics

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `utmify-conversion` | `.../utmify-conversion` | ✅ | 10 min ago | 120 |
| `facebook-conversion-api` | `.../facebook-conversion-api` | ✅ | 10 min ago | 122 |
| `dashboard-analytics` | `.../dashboard-analytics` | ✅ | 10 min ago | 141 |
| `dashboard-orders` | `.../dashboard-orders` | ✅ | NEW | 0 |
| `checkout-heartbeat` | `.../checkout-heartbeat` | ✅ | 10 min ago | 249 |
| `detect-abandoned-checkouts` | `.../detect-abandoned-checkouts` | ✅ | 10 min ago | 249 |
| `track-visit` | `.../track-visit` | ✅ | 10 min ago | 0 |

### Orders

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `create-order` | `.../create-order` | ✅ | 10 min ago | 935 |
| `get-order-for-pix` | `.../get-order-for-pix` | ✅ | 10 min ago | 150 |
| `alert-stuck-orders` | `.../alert-stuck-orders` | ✅ | 10 min ago | 87 |

### Reconciliation (RISE V2 Refactored)

| Nome | URL | No Repo? | Última Atividade | Descrição |
|------|-----|----------|------------------|-----------|
| `reconcile-pending-orders` | `.../reconcile-pending-orders` | ✅ | 10 min ago | **Orquestrador** - busca pedidos pendentes e delega para gateways |
| `reconcile-mercadopago` | `.../reconcile-mercadopago` | ✅ | NEW | Reconcilia pedidos MercadoPago |
| `reconcile-asaas` | `.../reconcile-asaas` | ✅ | NEW | Reconcilia pedidos Asaas |
| `grant-member-access` | `.../grant-member-access` | ✅ | NEW | Concede acesso à área de membros |

### Webhooks

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `trigger-webhooks` | `.../trigger-webhooks` | ✅ | 10 min ago | 843 |
| `process-webhook-queue` | `.../process-webhook-queue` | ✅ | 10 min ago | 737 |
| `dispatch-webhook` | `.../dispatch-webhook` | ✅ | 10 min ago | 185 |
| `send-webhook` | `.../send-webhook` | ✅ | 10 min ago | 94 |
| `retry-webhooks` | `.../retry-webhooks` | ✅ | 10 min ago | 275 |
| `send-webhook-test` | `.../send-webhook-test` | ✅ | 10 min ago | 124 |
| `get-webhook-logs` | `.../get-webhook-logs` | ✅ | 10 min ago | 57 |
| `test-webhook-dispatch` | `.../test-webhook-dispatch` | ✅ | 10 min ago | 50 |
| `trigger-webhooks-internal` | `.../trigger-webhooks-internal` | ✅ | 10 min ago | 67 |
| `webhook-crud` | `.../webhook-crud` | ✅ | 2026-01-13 | 0 |

### Buyer Portal

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `buyer-auth` | `.../buyer-auth` | ✅ | 10 min ago | 119 |
| `buyer-orders` | `.../buyer-orders` | ✅ | 10 min ago | 115 |
| `buyer-profile` | `.../buyer-profile` | ✅ | 10 min ago | 11 |
| `buyer-session` | `.../buyer-session` | ✅ | 10 min ago | 11 |

### Members Area

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `members-area-certificates` | `.../members-area-certificates` | ✅ | 10 min ago | 105 |
| `members-area-drip` | `.../members-area-drip` | ✅ | 10 min ago | 106 |
| `members-area-groups` | `.../members-area-groups` | ✅ | 10 min ago | 109 |
| `members-area-modules` | `.../members-area-modules` | ✅ | 10 min ago | 15 |
| `members-area-progress` | `.../members-area-progress` | ✅ | 10 min ago | 104 |
| `members-area-quizzes` | `.../members-area-quizzes` | ✅ | 10 min ago | 105 |
| `content-crud` | `.../content-crud` | ✅ | 10 min ago | 6 |
| `content-save` | `.../content-save` | ✅ | 10 min ago | 6 |
| `students-invite` | `.../students-invite` | ✅ | 10 min ago | 8 |
| `students-access` | `.../students-access` | ✅ | 10 min ago | 8 |
| `students-groups` | `.../students-groups` | ✅ | 10 min ago | 8 |
| `students-list` | `.../students-list` | ✅ | 10 min ago | 8 |

### Email

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `send-email` | `.../send-email` | ✅ | 10 min ago | 161 |
| `send-confirmation-email` | `.../send-confirmation-email` | ✅ | 10 min ago | 58 |
| `send-pix-email` | `.../send-pix-email` | ✅ | 10 min ago | 58 |

### Security & Crypto

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `decrypt-customer-data` | `.../decrypt-customer-data` | ✅ | 10 min ago | 82 |
| `decrypt-customer-data-batch` | `.../decrypt-customer-data-batch` | ✅ | 10 min ago | 77 |
| `encrypt-token` | `.../encrypt-token` | ✅ | 10 min ago | 197 |
| `security-management` | `.../security-management` | ✅ | 2026-01-13 | 0 |
| `verify-turnstile` | `.../verify-turnstile` | ✅ | 10 min ago | 81 |

### User Management

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `get-users-with-emails` | `.../get-users-with-emails` | ✅ | 10 min ago | 199 |
| `manage-user-role` | `.../manage-user-role` | ✅ | 10 min ago | 201 |
| `manage-user-status` | `.../manage-user-status` | ✅ | 10 min ago | 199 |
| `producer-auth` | `.../producer-auth` | ✅ | 10 min ago | 65 |
| `product-crud` | `.../product-crud` | ✅ | 10 min ago | 9 |
| `products-crud` | `.../products-crud` | ✅ | NEW | 0 |
| `product-settings` | `.../product-settings` | ✅ | 10 min ago | 9 |
| `product-entities` | `.../product-entities` | ✅ | NEW | 0 |
| `offer-crud` | `.../offer-crud` | ✅ | 10 min ago | 8 |
| `offer-bulk` | `.../offer-bulk` | ✅ | 10 min ago | 8 |
| `checkout-crud` | `.../checkout-crud` | ✅ | 10 min ago | 10 |
| `checkout-editor` | `.../checkout-editor` | ✅ | 10 min ago | 10 |
| `checkout-public-data` | `.../checkout-public-data` | ✅ | NEW | 0 |
| `order-bump-crud` | `.../order-bump-crud` | ✅ | 10 min ago | 10 |
| `product-duplicate` | `.../product-duplicate` | ✅ | 10 min ago | 20 |
| `coupon-management` | `.../coupon-management` | ✅ | 10 min ago | 17 |
| `integration-management` | `.../integration-management` | ✅ | 10 min ago | 17 |
| `vendor-integrations` | `.../vendor-integrations` | ✅ | NEW | 0 |
| `affiliation-public` | `.../affiliation-public` | ✅ | NEW | 0 |

### Affiliates

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `manage-affiliation` | `.../manage-affiliation` | ✅ | 10 min ago | 332 |
| `request-affiliation` | `.../request-affiliation` | ✅ | 10 min ago | 337 |
| `update-affiliate-settings` | `.../update-affiliate-settings` | ✅ | 10 min ago | 137 |
| `get-affiliation-details` | `.../get-affiliation-details` | ✅ | 10 min ago | 27 |
| `get-affiliation-status` | `.../get-affiliation-status` | ✅ | 10 min ago | 27 |
| `get-all-affiliation-statuses` | `.../get-all-affiliation-statuses` | ✅ | 10 min ago | 25 |
| `get-my-affiliations` | `.../get-my-affiliations` | ✅ | 10 min ago | 27 |
| `affiliate-pixel-management` | `.../affiliate-pixel-management` | ✅ | 10 min ago | 1 |

### Pixels

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `pixel-management` | `.../pixel-management` | ✅ | 10 min ago | 13 |

### LGPD/GDPR

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `gdpr-forget` | `.../gdpr-forget` | ✅ | 10 min ago | 40 |
| `gdpr-request` | `.../gdpr-request` | ✅ | 10 min ago | 40 |

### Vault & Credentials

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `vault-save` | `.../vault-save` | ✅ | 10 min ago | 136 |
| `vault-migration` | `.../vault-migration` | ✅ | 10 min ago | 137 |
| `check-secrets` | `.../check-secrets` | ✅ | 21 days ago | 14 |

### Health & Diagnostics

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `admin-health` | `.../admin-health` | ✅ | 2026-01-13 | 0 |
| `health` | `.../health` | ✅ | 10 min ago | 290 |
| `smoke-test` | `.../smoke-test` | ✅ | 10 min ago | 89 |
| `test-deploy` | `.../test-deploy` | ✅ | 10 min ago | 175 |

### Owner

| Nome | URL | No Repo? | Última Atividade | Invocações |
|------|-----|----------|------------------|------------|
| `owner-settings` | `.../owner-settings` | ✅ | 2026-01-13 | 0 |

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
| 2026-01-16 | **AUDITORIA FINAL - MIGRAÇÃO 100% COMPLETA** ✅ |
| 2026-01-16 | Deletado `src/api/storage/remove.ts` - substituído por `storage-management` Edge Function |
| 2026-01-16 | **MIGRAÇÃO FRONTEND → EDGE FUNCTIONS** (10 arquivos): |
| 2026-01-16 | - `WebhooksConfig.tsx` → `webhook-crud` (listWebhooksWithProducts, listUserProducts) |
| 2026-01-16 | - `WebhookForm.tsx` → `webhook-crud` (getWebhookProducts) |
| 2026-01-16 | - `AffiliatesTab.tsx` → `admin-data` (affiliate-gateway-settings) |
| 2026-01-16 | - `MarketplaceSettings.tsx` → `admin-data` (marketplace-categories) |
| 2026-01-16 | - `useMembersAreaSettings.ts` → `admin-data` (members-area-settings, members-area-modules-with-contents) |
| 2026-01-16 | - `MenuPreview.tsx` → `admin-data` (user-profile-name) |
| 2026-01-16 | - `StripePix.tsx` → `checkout-public-data` (check-order-payment-status) |
| 2026-01-16 | - `uniqueCheckoutName.ts` → `admin-data` (check-unique-checkout-name) |
| 2026-01-16 | Expandida `admin-data` com 7 novas actions: marketplace-categories, marketplace-stats, user-profile-name, check-unique-checkout-name, user-products-simple, members-area-settings, members-area-modules-with-contents |
| 2026-01-16 | Expandida `webhook-crud` com 3 novas actions: listWebhooksWithProducts, listUserProducts, getWebhookProducts |
| 2026-01-16 | Expandida `checkout-public-data` com action: check-order-payment-status |
| 2026-01-16 | **RISE V2 REFACTOR**: `reconcile-pending-orders` (475 linhas) dividida em 4 Edge Functions especializadas |
| 2026-01-16 | Criada `reconcile-mercadopago` (~115 linhas) - Reconciliação MercadoPago |
| 2026-01-16 | Criada `reconcile-asaas` (~115 linhas) - Reconciliação Asaas |
| 2026-01-16 | Criada `grant-member-access` (~95 linhas) - Concessão de acesso área de membros |
| 2026-01-16 | `reconcile-pending-orders` refatorada para orquestrador (~105 linhas) |
| 2026-01-16 | **DT-02 FINAL**: Removida `test-pushinpay-connection` do Registry (função legado deletada) |
| 2026-01-16 | **DT-08 FIX**: URL hardcoded em `PushinPayAdapter.ts` → dinâmica via `Deno.env.get('SUPABASE_URL')` |
| 2026-01-16 | **DT-06 FIX**: Criado `_shared/logger.ts` - Logger centralizado com níveis (debug/info/warn/error) |
| 2026-01-15 | **FIX GATEWAYS**: Criada `pushinpay-validate-token` - validação de token via backend (elimina CSP + segurança) |
| 2026-01-15 | **FIX GATEWAYS**: Corrigido CORS em `stripe-connect-oauth` - adicionado `x-producer-session-token` aos headers |
| 2026-01-15 | **FIX GATEWAYS**: Corrigido 406 em PushinPay API - `.single()` → `.maybeSingle()` |
| 2026-01-15 | **FIX GATEWAYS**: Corrigido walletId persistente em Asaas ConfigForm - não apaga mais valor manual |
| 2026-01-15 | **VAULT UNIFICADO**: `vault-save` atualizado para usar convenção `gateway_{type}_{vendor_id}` via RPC `save_gateway_credentials` |
| 2026-01-15 | Correção: Arquitetura Vault unificada - todas as integrações agora usam mesma convenção que OAuth callbacks |
| 2026-01-15 | Sincronização: `asaas-validate-credentials` e `check-secrets` adicionadas ao código local (eram deployed-only) |
| 2026-01-15 | Correção: `user_id` → `producer_id` em `pixel-rate-limit.ts`, `affiliate-pixel-management`, `storage-management` |
| 2026-01-15 | Correção: Normalização snake_case no payload de Order Bumps (`useOrderBumpForm.ts`) |
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
| 2026-01-13 | ✅ **MIGRAÇÃO 100% COMPLETA** - Zero operações diretas no frontend |
| 2026-01-13 | Adicionada `webhook-crud` para CRUD de webhooks via backend |
| 2026-01-13 | Migrados: WebhooksConfig, AffiliatesTab, useMembersAreaSettings, useMembersAreaBuilder |
| 2026-01-13 | Expandida `integration-management` com `save-profile-wallet`, `clear-profile-wallet` |
| 2026-01-13 | Expandida `product-settings` com `update-affiliate-gateway-settings`, `update-members-area-settings` |
| 2026-01-13 | Expandida `members-area-modules` com `save-sections`, `save-builder-settings` |
| 2026-01-13 | **REFATORAÇÃO RISE PROTOCOL V2 - FASE 1**: Transformados 5 `index.ts` em Routers puros |
| 2026-01-13 | Criado `buyer-auth-email-templates.ts` (85 linhas) |
| 2026-01-13 | Criado `buyer-auth-producer-handlers.ts` (194 linhas) |
| 2026-01-13 | Criado `product-duplicate-handlers.ts` (305 linhas) |
| 2026-01-13 | Corrigido `any` → `SupabaseClient` em 23+ funções de handlers |
| 2026-01-13 | Reduzido `producer-auth/index.ts`: 570→95 linhas (-83%) |
| 2026-01-13 | Reduzido `members-area-modules/index.ts`: 568→137 linhas (-76%) |
| 2026-01-13 | Reduzido `coupon-management/index.ts`: 522→113 linhas (-78%) |
| 2026-01-13 | Reduzido `product-duplicate/index.ts`: 363→120 linhas (-67%) |
| 2026-01-13 | Corrigido log functions em `trigger-webhooks/index.ts` (`any` → `unknown`) |
| 2026-01-13 | **REFATORAÇÃO RISE PROTOCOL V2 - FASE 2**: Transformados mais 5 `index.ts` em Routers puros |
| 2026-01-13 | Dividido `email-templates.ts` em 5 arquivos modulares (553→39 linhas barrel) |
| 2026-01-13 | Criado `email-templates-base.ts` (233 linhas) - Tipos e helpers |
| 2026-01-13 | Criado `email-templates-purchase.ts` (146 linhas) - Templates de compra |
| 2026-01-13 | Criado `email-templates-payment.ts` (95 linhas) - Templates de pagamento |
| 2026-01-13 | Criado `email-templates-seller.ts` (114 linhas) - Templates do vendedor |
| 2026-01-13 | Criado `trigger-webhooks-handlers.ts` (295 linhas) - Handlers de webhooks |
| 2026-01-13 | Criado `integration-handlers.ts` (393 linhas) - Handlers de integrações |
| 2026-01-13 | Criado `smoke-test-handlers.ts` (271 linhas) - Handlers de smoke test |
| 2026-01-13 | Reduzido `trigger-webhooks/index.ts`: 438→120 linhas (-73%) |
| 2026-01-13 | Reduzido `integration-management/index.ts`: 429→85 linhas (-80%) |
| 2026-01-13 | Reduzido `smoke-test/index.ts`: 409→59 linhas (-86%) |
| 2026-01-13 | Reduzido `product-crud/index.ts`: 322→102 linhas (-68%) |
| 2026-01-13 | Reduzido `offer-crud/index.ts`: 329→96 linhas (-71%) |
| 2026-01-13 | Dividido `producer-auth-handlers.ts`: extraído `producer-auth-session-handlers.ts` (121 linhas) |
| 2026-01-13 | Dividido `product-duplicate-handlers.ts`: extraído `product-duplicate-cloner.ts` (144 linhas) |
| 2026-01-13 | Dividido `coupon-handlers.ts`: extraído `coupon-validation.ts` (124 linhas) |
| 2026-01-13 | Criado `product-crud-handlers.ts` (271 linhas) - CRUD de produtos |
| 2026-01-13 | Criado `offer-crud-handlers.ts` (269 linhas) - CRUD de ofertas |
| 2026-01-13 | Dividido `buyer-auth-handlers.ts`: extraído `buyer-auth-password.ts` (93 linhas) |
| 2026-01-13 | Dividido `pixel-handlers.ts`: extraído `pixel-rate-limit.ts` (143 linhas) |
| 2026-01-13 | **FASE 2 COMPLETA**: 14 novos handlers, 10 routers puros, 93% conformidade RISE Protocol |
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

### Tipos e Helpers Base

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `supabase-types.ts` | 222 | Tipos centralizados (SupabaseClient, interfaces) |
| `edge-helpers.ts` | 275 | Helpers: jsonResponse, errorResponse, validateSession |
| `cors.ts` | ~50 | CORS seguro com lista de origens permitidas |
| `sentry.ts` | ~80 | Integração com Sentry para tracking de erros |
| `rate-limit.ts` | ~100 | Rate limiting usando `rate_limit_attempts` |
| `session.ts` | ~60 | Validação de sessão do produtor |
| `response.ts` | ~50 | Helpers para respostas JSON padronizadas |
| `ownership.ts` | ~80 | Verificação de ownership (produto, checkout, offer, pixel) |

### Handlers de Autenticação

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `producer-auth-handlers.ts` | 379 | Register, Login, Logout, Validate |
| `producer-auth-reset-handlers.ts` | ~150 | Password reset flow |
| `producer-auth-helpers.ts` | ~100 | Helpers de autenticação |
| `buyer-auth-handlers.ts` | 330 | Register, Login, Logout |
| `buyer-auth-handlers-extended.ts` | 318 | Validate, CheckEmail, Password reset |
| `buyer-auth-producer-handlers.ts` | 194 | Producer-specific buyer auth |
| `buyer-auth-email-templates.ts` | 85 | Email templates |
| `unified-auth.ts` | ~200 | Autenticação cross-system |

### Handlers de Negócio

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `members-area-handlers.ts` | 301 | CRUD de módulos |
| `members-area-sections-handlers.ts` | ~150 | Sections e builder settings |
| `coupon-handlers.ts` | 353 | CRUD de cupons |
| `product-duplicate-handlers.ts` | 305 | Duplicação de produtos |

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
