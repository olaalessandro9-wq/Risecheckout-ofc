# Rise Checkout - Edge Functions Registry

> **🔴 FONTE DA VERDADE MÁXIMA** - Este documento lista TODAS as Edge Functions deployadas no Supabase.  
> Última atualização: 2026-02-03 (RISE V3 - Eliminação completa de código legado auth.users)  
> Mantenedor: AI Assistant + User

---

## 🏆 RISE V3 Compliance Badge

```
╔═══════════════════════════════════════════════════════════════╗
║  ✅ RISE PROTOCOL V3 - 10.0/10 - ZERO AUTH.USERS LEGACY       ║
║     105 Edge Functions | 214 RLS Policies | Zero Legacy       ║
║     ACCESS_TOKEN: 4h | REFRESH_THRESHOLD: 30m | LOCK: 30s     ║
║     ~110 Test Files | ~550+ Edge Tests | Zero Monoliths       ║
║     SSOT: 'users' table | auth.users: ABANDONED               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Relatórios:**
- [`docs/UNIFIED_IDENTITY_FINAL_REPORT.md`](./UNIFIED_IDENTITY_FINAL_REPORT.md)
- [`docs/TESTING_MODULARIZATION_REPORT.md`](./TESTING_MODULARIZATION_REPORT.md)

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Total de Funções** | 105 |
| **No código local** | 105 |
| **Apenas deployadas** | 0 |
| **Operações Diretas Frontend** | 0 ✅ |
| **Funções com verify_jwt=true** | 0 ✅ |
| **Unified Auth Compliance** | 100% ✅ |
| **Context Guards** | ✅ Producer + Buyer |
| **Base URL (Frontend)** | `https://api.risecheckout.com/functions/v1/` |
| **Base URL (Webhooks)** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/` |

---

## 🔐 Mecanismos de Autenticação (RISE V3 - Unified Auth)

> **REGRA ABSOLUTA**: Todas as funções usam `verify_jwt = false` no `supabase/config.toml`.
> A autenticação é feita no código via cookies httpOnly + tabela `sessions` unificada.

| Mecanismo | Cookie | Validação | Funções |
|-----------|--------|-----------|---------|
| **sessions (unified)** | `__Secure-rise_access` + `__Secure-rise_refresh` | `unified-auth-v2.ts` | TODAS as funções autenticadas |
| **webhook/public** | N/A | Signature/payload | Webhooks, Checkout, Auth endpoints |

> **RISE V3 (Jan 2026):** Sistema 100% unificado. Zero fallbacks. Zero tabelas legadas.
> O frontend usa `credentials: 'include'` e nunca acessa tokens diretamente (proteção XSS total).

### Tabela de Auth por Função

| Função | Auth Mechanism | verify_jwt | Observação |
|--------|----------------|------------|------------|
| **Product Management** | | | |
| `product-crud` | sessions | false | unified-auth-v2 |
| `product-settings` | sessions | false | unified-auth-v2 |
| `offer-crud` | sessions | false | unified-auth-v2 |
| `offer-bulk` | sessions | false | unified-auth-v2 |
| `checkout-crud` | sessions | false | unified-auth-v2 |
| `order-bump-crud` | sessions | false | unified-auth-v2 |
| `checkout-editor` | sessions | false | unified-auth-v2 |
| `product-duplicate` | sessions | false | unified-auth-v2 |
| `coupon-management` | sessions | false | unified-auth-v2 |
| `integration-management` | sessions | false | unified-auth-v2 |
| **User Management** | | | |
| `manage-user-role` | sessions | false | unified-auth-v2, owner only |
| `manage-user-status` | sessions | false | unified-auth-v2, admin+ |
| `unified-auth` | public | false | SSOT - Login/Register/Refresh/Request-Refresh endpoint |
| **Security & Crypto** | | | |
| `decrypt-customer-data` | sessions | false | unified-auth-v2, owner check |
| `decrypt-customer-data-batch` | sessions | false | unified-auth-v2, owner check |
| `encrypt-token` | sessions | false | unified-auth-v2 |
| `security-management` | sessions | false | unified-auth-v2 |
| **Affiliates** | | | |
| `manage-affiliation` | sessions | false | unified-auth-v2 |
| `request-affiliation` | sessions | false | unified-auth-v2 |
| `update-affiliate-settings` | sessions | false | unified-auth-v2 |
| `get-affiliation-status` | sessions | false | unified-auth-v2 |
| `get-all-affiliation-statuses` | sessions | false | unified-auth-v2 |
| `get-my-affiliations` | sessions | false | unified-auth-v2 |
| `get-affiliation-details` | sessions | false | unified-auth-v2 |
| **Vault & Credentials** | | | |
| `vault-save` | sessions | false | unified-auth-v2 |
| **Email** | | | |
| `send-email` | sessions | false | unified-auth-v2 (v2.0.0) |
| `send-confirmation-email` | internal | false | Chamada interna |
| `send-pix-email` | internal | false | Chamada interna |
| **Buyer Portal** | | | |
| `buyer-orders` | sessions | false | unified-auth-v2 |
| `buyer-profile` | sessions | false | unified-auth-v2 |
| **Members Area** | | | |
| `members-area-modules` | sessions | false | unified-auth-v2 |
| `members-area-drip` | sessions | false | unified-auth-v2 |
| `members-area-progress` | sessions | false | unified-auth-v2 |
| `members-area-quizzes` | sessions | false | unified-auth-v2 |
| `members-area-certificates` | sessions | false | unified-auth-v2 |
| `members-area-groups` | sessions | false | unified-auth-v2 |
| `content-crud` | sessions | false | unified-auth-v2 |
| `content-save` | sessions | false | unified-auth-v2 |
| `students-invite` | sessions | false | unified-auth-v2 |
| `students-access` | sessions | false | unified-auth-v2 |
| `students-groups` | sessions | false | unified-auth-v2 |
| `students-list` | sessions | false | unified-auth-v2 |
| `pixel-management` | sessions | false | unified-auth-v2 |
| `affiliate-pixel-management` | sessions | false | unified-auth-v2 |
| **Webhooks** | | | |
| `mercadopago-webhook` | webhook | false | Signature validation |
| `pushinpay-webhook` | webhook | false | Signature validation |
| `stripe-webhook` | webhook | false | Signature validation |
| `asaas-webhook` | webhook | false | Signature validation |
| `trigger-webhooks` | internal | false | Chamada interna |
| `process-webhook-queue` | internal | false | Chamada interna |
| `retry-webhooks` | internal | false | Chamada interna |
| `send-webhook-test` | sessions | false | unified-auth-v2 |
| `webhook-crud` | sessions | false | unified-auth-v2 (modularized v3.1.0) |
| **OAuth Callbacks** | | | |
| `mercadopago-oauth-callback` | oauth | false | OAuth flow |
| `stripe-connect-oauth` | oauth | false | OAuth flow |
| **Checkout (Public)** | | | |
| `create-order` | public | false | Clientes anônimos |
| `mercadopago-create-payment` | public | false | Clientes anônimos |
| `stripe-create-payment` | public | false | Clientes anônimos |
| `asaas-create-payment` | public | false | Clientes anônimos |
| `asaas-validate-credentials` | public | false | Validação |
| `pushinpay-create-pix` | public | false | Clientes anônimos |
| `pushinpay-get-status` | public | false | Polling status |
| `pushinpay-validate-token` | public | false | Validação |
| `get-order-for-pix` | public | false | PIX page |
| `verify-turnstile` | public | false | Captcha |
| **Tracking & Analytics** | | | |
| `utmify-conversion` | public | false | Tracking |
| `facebook-conversion-api` | public | false | Tracking |
| `dashboard-analytics` | sessions | false | unified-auth-v2 |
| `checkout-heartbeat` | public | false | Heartbeat |
| `detect-abandoned-checkouts` | internal | false | Cron |
| `track-visit` | public | false | Tracking |
| **Reconciliation** | | | |
| `reconcile-pending-orders` | internal | false | Orquestrador |
| `reconcile-mercadopago` | internal | false | Gateway specific |
| `reconcile-asaas` | internal | false | Gateway specific |
| `grant-member-access` | internal | false | Chamada interna |
| `alert-stuck-orders` | internal | false | Cron |
| `smoke-test` | public | false | Health check |
| **LGPD/GDPR** | | | |
| `gdpr-request` | public | false | User request |
| `gdpr-forget` | public | false | User request |
| **Health & Diagnostics** | | | |
| `check-secrets` | public | false | Debug |
| `health` | public | false | Health check |
| `test-deploy` | public | false | Deploy test |
| `admin-health` | sessions | false | unified-auth-v2 |
| `owner-settings` | sessions | false | unified-auth-v2, owner only |
| **Security Infrastructure (RISE V3)** | | | |
| `rls-documentation-generator` | internal | false | Gera documentação RLS automática |
| `key-rotation-executor` | internal | false | Gerenciamento de rotação de chaves |
| `rls-security-tester` | internal | false | Framework de testes RLS |
| `session-manager` | sessions | false | Gerenciamento de sessões |
| `data-retention-executor` | internal | false | Limpeza de dados automatizada |
| **RISE Protocol V3** | | | |
| `rpc-proxy` | sessions | false | unified-auth-v2 |
| `storage-management` | sessions | false | unified-auth-v2 |
| `pushinpay-stats` | sessions | false | unified-auth-v2 |
| **Dashboard & Data** | | | |
| `admin-data` | sessions | false | unified-auth-v2 - **RETORNA CENTAVOS** |
| `product-entities` | sessions | false | unified-auth-v2 |
| `products-crud` | sessions | false | Core CRUD (RISE V3) |
| `producer-profile` | sessions | false | Profile + gateway connections |
| `coupon-read` | sessions | false | get-coupon (RISE V3) |
| `content-library` | sessions | false | get-video-library (RISE V3) |
| `vendor-integrations` | sessions | false | unified-auth-v2 |
| **Public Endpoints** | | | |
| `affiliation-public` | public | false | Dados públicos de afiliação |
| `checkout-public-data` | public | false | BFF Modular (11 handlers) |
| `marketplace-public` | public | false | Endpoints públicos marketplace |

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
12. [Security Infrastructure (RISE V3)](#security-infrastructure-rise-v3)
13. [User Management](#user-management)
14. [Affiliates](#affiliates)
15. [Pixels](#pixels)
16. [LGPD/GDPR](#lgpdgdpr)
17. [Vault & Credentials](#vault--credentials)
18. [Health & Diagnostics](#health--diagnostics)

---

## Lista Completa por Categoria

### Payments - Asaas

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `asaas-create-payment` | `.../asaas-create-payment` | ✅ | public |
| `asaas-webhook` | `.../asaas-webhook` | ✅ | webhook |
| `asaas-validate-credentials` | `.../asaas-validate-credentials` | ✅ | public |

### Payments - PushinPay

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `pushinpay-create-pix` | `.../pushinpay-create-pix` | ✅ | public |
| `pushinpay-get-status` | `.../pushinpay-get-status` | ✅ | public |
| `pushinpay-webhook` | `.../pushinpay-webhook` | ✅ | webhook |
| `pushinpay-stats` | `.../pushinpay-stats` | ✅ | sessions |
| `pushinpay-validate-token` | `.../pushinpay-validate-token` | ✅ | public |

### Payments - MercadoPago

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `mercadopago-create-payment` | `.../mercadopago-create-payment` | ✅ | public |
| `mercadopago-webhook` | `.../mercadopago-webhook` | ✅ | webhook |
| `mercadopago-oauth-callback` | `.../mercadopago-oauth-callback` | ✅ | oauth |

### Payments - Stripe

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `stripe-create-payment` | `.../stripe-create-payment` | ✅ | public |
| `stripe-webhook` | `.../stripe-webhook` | ✅ | webhook |
| `stripe-connect-oauth` | `.../stripe-connect-oauth` | ✅ | oauth |

### Tracking & Analytics

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `utmify-conversion` | `.../utmify-conversion` | ✅ | public |
| `facebook-conversion-api` | `.../facebook-conversion-api` | ✅ | public |
| `dashboard-analytics` | `.../dashboard-analytics` | ✅ | sessions |
| `checkout-heartbeat` | `.../checkout-heartbeat` | ✅ | public |
| `detect-abandoned-checkouts` | `.../detect-abandoned-checkouts` | ✅ | internal |
| `track-visit` | `.../track-visit` | ✅ | public |

### Orders

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `create-order` | `.../create-order` | ✅ | public | Criação de pedidos |
| `get-order-for-pix` | `.../get-order-for-pix` | ✅ | public | Dados do pedido para PIX |
| `get-pix-status` | `.../get-pix-status` | ✅ | public | Recuperação de PIX (v3.5.4) |
| `alert-stuck-orders` | `.../alert-stuck-orders` | ✅ | internal |

### Reconciliation (RISE V2)

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `reconcile-pending-orders` | `.../reconcile-pending-orders` | ✅ | internal | Orquestrador |
| `reconcile-mercadopago` | `.../reconcile-mercadopago` | ✅ | internal | Gateway specific |
| `reconcile-asaas` | `.../reconcile-asaas` | ✅ | internal | Gateway specific |
| `grant-member-access` | `.../grant-member-access` | ✅ | internal | Chamada interna |

### Order Lifecycle (RISE V3)

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `order-lifecycle-worker` | `.../order-lifecycle-worker` | ✅ | internal | Processa eventos de lifecycle de pedidos (paid/refund/chargeback) |

### Webhooks

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `trigger-webhooks` | `.../trigger-webhooks` | ✅ | internal | Disparo de webhooks |
| `process-webhook-queue` | `.../process-webhook-queue` | ✅ | internal | Processamento de fila |
| `retry-webhooks` | `.../retry-webhooks` | ✅ | internal | Retry de webhooks falhados |
| `send-webhook-test` | `.../send-webhook-test` | ✅ | sessions | Teste de webhooks |
| `webhook-crud` | `.../webhook-crud` | ✅ | sessions | SSOT - CRUD + logs |

### Buyer Portal

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `buyer-orders` | `.../buyer-orders` | ✅ | sessions |
| `buyer-profile` | `.../buyer-profile` | ✅ | sessions |

### Members Area

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `members-area-certificates` | `.../members-area-certificates` | ✅ | sessions |
| `members-area-drip` | `.../members-area-drip` | ✅ | sessions |
| `members-area-groups` | `.../members-area-groups` | ✅ | sessions |
| `members-area-modules` | `.../members-area-modules` | ✅ | sessions |
| `members-area-progress` | `.../members-area-progress` | ✅ | sessions |
| `members-area-quizzes` | `.../members-area-quizzes` | ✅ | sessions |
| `content-crud` | `.../content-crud` | ✅ | sessions |
| `content-save` | `.../content-save` | ✅ | sessions |
| `students-invite` | `.../students-invite` | ✅ | sessions |
| `students-access` | `.../students-access` | ✅ | sessions |
| `students-groups` | `.../students-groups` | ✅ | sessions |
| `students-list` | `.../students-list` | ✅ | sessions |

### Email

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `send-email` | `.../send-email` | ✅ | sessions |
| `send-confirmation-email` | `.../send-confirmation-email` | ✅ | internal |
| `send-pix-email` | `.../send-pix-email` | ✅ | internal |

### Security & Crypto

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `decrypt-customer-data` | `.../decrypt-customer-data` | ✅ | sessions |
| `decrypt-customer-data-batch` | `.../decrypt-customer-data-batch` | ✅ | sessions |
| `encrypt-token` | `.../encrypt-token` | ✅ | sessions |
| `security-management` | `.../security-management` | ✅ | sessions |
| `verify-turnstile` | `.../verify-turnstile` | ✅ | public |

### Security Infrastructure (RISE V3)

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `rls-documentation-generator` | `.../rls-documentation-generator` | ✅ | internal | Gera documentação RLS |
| `key-rotation-executor` | `.../key-rotation-executor` | ✅ | internal | Rotação de chaves |
| `rls-security-tester` | `.../rls-security-tester` | ✅ | internal | Testes RLS |
| `session-manager` | `.../session-manager` | ✅ | sessions | Gerenciamento de sessões |
| `data-retention-executor` | `.../data-retention-executor` | ✅ | internal | Limpeza de dados |

### User Management

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `manage-user-role` | `.../manage-user-role` | ✅ | sessions |
| `manage-user-status` | `.../manage-user-status` | ✅ | sessions |
| `unified-auth` | `.../unified-auth` | ✅ | public |
| `product-crud` | `.../product-crud` | ✅ | sessions |
| `product-settings` | `.../product-settings` | ✅ | sessions |
| `offer-crud` | `.../offer-crud` | ✅ | sessions |
| `offer-bulk` | `.../offer-bulk` | ✅ | sessions |
| `checkout-crud` | `.../checkout-crud` | ✅ | sessions |
| `checkout-editor` | `.../checkout-editor` | ✅ | sessions |
| `order-bump-crud` | `.../order-bump-crud` | ✅ | sessions |
| `product-duplicate` | `.../product-duplicate` | ✅ | sessions |
| `coupon-management` | `.../coupon-management` | ✅ | sessions |
| `integration-management` | `.../integration-management` | ✅ | sessions |

### Affiliates

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `manage-affiliation` | `.../manage-affiliation` | ✅ | sessions |
| `request-affiliation` | `.../request-affiliation` | ✅ | sessions |
| `update-affiliate-settings` | `.../update-affiliate-settings` | ✅ | sessions |
| `get-affiliation-details` | `.../get-affiliation-details` | ✅ | sessions |
| `get-affiliation-status` | `.../get-affiliation-status` | ✅ | sessions |
| `get-all-affiliation-statuses` | `.../get-all-affiliation-statuses` | ✅ | sessions |
| `get-my-affiliations` | `.../get-my-affiliations` | ✅ | sessions |
| `affiliate-pixel-management` | `.../affiliate-pixel-management` | ✅ | sessions |

### Pixels

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `pixel-management` | `.../pixel-management` | ✅ | sessions |

### LGPD/GDPR

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `gdpr-request` | `.../gdpr-request` | ✅ | public |
| `gdpr-forget` | `.../gdpr-forget` | ✅ | public |

### Vault & Credentials

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `vault-save` | `.../vault-save` | ✅ | sessions |

### Health & Diagnostics

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `check-secrets` | `.../check-secrets` | ✅ | public |
| `health` | `.../health` | ✅ | public |
| `test-deploy` | `.../test-deploy` | ✅ | public |
| `admin-health` | `.../admin-health` | ✅ | sessions |
| `owner-settings` | `.../owner-settings` | ✅ | sessions |

---

## Convenções

- ✅ = Presente no código local (`supabase/functions/`)
- **sessions** = Autenticação via Cookie `__Secure-rise_access` (unified-auth-v2)
- **public** = Sem autenticação
- **webhook** = Validação de signature
- **internal** = Chamada interna (cron, outras edge functions)
- **oauth** = Callback de OAuth flow

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-23 | RISE V3 Complete - Removed buyer-auth, producer-auth, buyer-session |
| 2026-01-22 | Unified auth migration |
| 2026-01-16 | Initial registry |
