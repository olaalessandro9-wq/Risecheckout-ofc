# Rise Checkout - Edge Functions Registry

> **🔴 FONTE DA VERDADE MÁXIMA** - Este documento lista TODAS as Edge Functions deployadas no Supabase.  
> Última atualização: 2026-01-19 (RISE V3 Security Infrastructure)  
> Mantenedor: AI Assistant + User

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Total de Funções** | 115 |
| **No código local** | 115 |
| **Apenas deployadas** | 0 |
| **Operações Diretas Frontend** | 0 ✅ |
| **Funções com verify_jwt=true** | 0 ✅ |
| **Base URL** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/` |

---

## 🔐 Mecanismos de Autenticação (RISE V3)

> **REGRA ABSOLUTA**: Todas as funções usam `verify_jwt = false` no `supabase/config.toml`.
> A autenticação é feita no código via producer_sessions ou buyer_token.

| Mecanismo | Header | Validação | Funções |
|-----------|--------|-----------|---------|
| **producer_sessions** | `X-Producer-Session-Token` | `unified-auth.ts` | Dashboard, User Mgmt, Affiliates, Vault, Security |
| **buyer_token** | `X-Buyer-Session` | `buyer-auth.ts` | Members Area, Buyer Portal |
| **webhook/public** | N/A | Signature/payload | Webhooks, Checkout, Auth endpoints |

### Tabela de Auth por Função

| Função | Auth Mechanism | verify_jwt | Observação |
|--------|----------------|------------|------------|
| **Product Management** | | | |
| `product-crud` | producer_sessions | false | unified-auth |
| `product-settings` | producer_sessions | false | unified-auth |
| `offer-crud` | producer_sessions | false | unified-auth |
| `offer-bulk` | producer_sessions | false | unified-auth |
| `checkout-crud` | producer_sessions | false | unified-auth |
| `order-bump-crud` | producer_sessions | false | unified-auth |
| `checkout-editor` | producer_sessions | false | unified-auth |
| `product-duplicate` | producer_sessions | false | unified-auth |
| `coupon-management` | producer_sessions | false | unified-auth |
| `integration-management` | producer_sessions | false | unified-auth |
| **User Management** | | | |
| `manage-user-role` | producer_sessions | false | unified-auth, owner only |
| `manage-user-status` | producer_sessions | false | unified-auth, admin+ |
| `get-users-with-emails` | producer_sessions | false | unified-auth, owner only |
| `producer-auth` | public | false | Login endpoint |
| **Security & Crypto** | | | |
| `decrypt-customer-data` | producer_sessions | false | unified-auth, owner check |
| `decrypt-customer-data-batch` | producer_sessions | false | unified-auth, owner check |
| `encrypt-token` | producer_sessions | false | unified-auth |
| `security-management` | producer_sessions | false | unified-auth |
| **Affiliates** | | | |
| `manage-affiliation` | producer_sessions | false | unified-auth |
| `request-affiliation` | producer_sessions | false | unified-auth |
| `update-affiliate-settings` | producer_sessions | false | unified-auth |
| `get-affiliation-status` | producer_sessions | false | unified-auth |
| `get-all-affiliation-statuses` | producer_sessions | false | unified-auth |
| `get-my-affiliations` | producer_sessions | false | unified-auth |
| `get-affiliation-details` | producer_sessions | false | unified-auth |
| **Vault & Credentials** | | | |
| `vault-save` | producer_sessions | false | unified-auth |
| **Email** | | | |
| `send-email` | producer_sessions | false | unified-auth (v2.0.0) |
| `send-confirmation-email` | internal | false | Chamada interna |
| `send-pix-email` | internal | false | Chamada interna |
| **Buyer Portal** | | | |
| `buyer-auth` | public | false | Login endpoint |
| `buyer-orders` | buyer_token | false | x-buyer-session |
| `buyer-profile` | buyer_token | false | x-buyer-session |
| `buyer-session` | buyer_token | false | x-buyer-session |
| **Members Area** | | | |
| `members-area-modules` | producer_sessions | false | unified-auth |
| `members-area-drip` | buyer_token | false | x-buyer-session |
| `members-area-progress` | buyer_token | false | x-buyer-session |
| `members-area-quizzes` | buyer_token | false | x-buyer-session |
| `members-area-certificates` | buyer_token | false | x-buyer-session |
| `members-area-groups` | producer_sessions | false | unified-auth |
| `content-crud` | producer_sessions | false | unified-auth |
| `content-save` | producer_sessions | false | unified-auth |
| `students-invite` | producer_sessions | false | unified-auth |
| `students-access` | producer_sessions | false | unified-auth |
| `students-groups` | producer_sessions | false | unified-auth |
| `students-list` | producer_sessions | false | unified-auth |
| `pixel-management` | producer_sessions | false | unified-auth |
| `affiliate-pixel-management` | producer_sessions | false | unified-auth |
| **Webhooks** | | | |
| `mercadopago-webhook` | webhook | false | Signature validation |
| `pushinpay-webhook` | webhook | false | Signature validation |
| `stripe-webhook` | webhook | false | Signature validation |
| `asaas-webhook` | webhook | false | Signature validation |
| `trigger-webhooks` | internal | false | Chamada interna |
| `process-webhook-queue` | internal | false | Chamada interna |
| `dispatch-webhook` | internal | false | Chamada interna |
| `send-webhook` | internal | false | Chamada interna |
| `retry-webhooks` | internal | false | Chamada interna |
| `send-webhook-test` | producer_sessions | false | unified-auth |
| `get-webhook-logs` | producer_sessions | false | unified-auth |
| `webhook-crud` | producer_sessions | false | unified-auth |
| `test-webhook-dispatch` | producer_sessions | false | unified-auth |
| `trigger-webhooks-internal` | internal | false | Chamada interna |
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
| `dashboard-analytics` | producer_sessions | false | unified-auth |
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
| `admin-health` | producer_sessions | false | unified-auth |
| `owner-settings` | producer_sessions | false | unified-auth, owner only |
| **Security Infrastructure (RISE V3)** | | | |
| `rls-documentation-generator` | internal | false | Gera documentação RLS automática |
| `key-rotation-executor` | internal | false | Gerenciamento de rotação de chaves de criptografia |
| `rls-security-tester` | internal | false | Framework de testes de segurança RLS |
| `session-manager` | producer_sessions | false | Gerenciamento de sessões (list, revoke, logout) |
| `data-retention-executor` | internal | false | Executa limpeza de dados automatizada |
| **RISE Protocol V2** | | | |
| `rpc-proxy` | producer_sessions | false | unified-auth |
| `storage-management` | producer_sessions | false | unified-auth |
| `pushinpay-stats` | producer_sessions | false | unified-auth |
| **Dashboard & Data** | | | |
| `admin-data` | producer_sessions | false | unified-auth |
| `dashboard-orders` | producer_sessions | false | unified-auth |
| `product-entities` | producer_sessions | false | unified-auth |
| `products-crud` | producer_sessions | false | Core: list, get, get-settings, get-offers, get-checkouts (RISE V3) |
| `producer-profile` | producer_sessions | false | get-profile, check-credentials, get-gateway-connections (RISE V3) |
| `coupon-read` | producer_sessions | false | get-coupon (RISE V3) |
| `content-library` | producer_sessions | false | get-video-library, get-webhook-logs (RISE V3) |
| `vendor-integrations` | producer_sessions | false | unified-auth |
| **Public Endpoints** | | | |
| `affiliation-public` | public | false | Dados públicos de afiliação |
| `checkout-public-data` | public | false | Dados públicos do checkout |
| `marketplace-public` | public | false | Endpoints públicos do marketplace (RISE V3) |

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
| `pushinpay-stats` | `.../pushinpay-stats` | ✅ | producer_sessions |
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
| `dashboard-analytics` | `.../dashboard-analytics` | ✅ | producer_sessions |
| `checkout-heartbeat` | `.../checkout-heartbeat` | ✅ | public |
| `detect-abandoned-checkouts` | `.../detect-abandoned-checkouts` | ✅ | internal |
| `track-visit` | `.../track-visit` | ✅ | public |

### Orders

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `create-order` | `.../create-order` | ✅ | public |
| `get-order-for-pix` | `.../get-order-for-pix` | ✅ | public |
| `alert-stuck-orders` | `.../alert-stuck-orders` | ✅ | internal |

### Reconciliation (RISE V2)

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `reconcile-pending-orders` | `.../reconcile-pending-orders` | ✅ | internal | Orquestrador |
| `reconcile-mercadopago` | `.../reconcile-mercadopago` | ✅ | internal | Gateway specific |
| `reconcile-asaas` | `.../reconcile-asaas` | ✅ | internal | Gateway specific |
| `grant-member-access` | `.../grant-member-access` | ✅ | internal | Chamada interna |

### Webhooks

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `trigger-webhooks` | `.../trigger-webhooks` | ✅ | internal |
| `process-webhook-queue` | `.../process-webhook-queue` | ✅ | internal |
| `dispatch-webhook` | `.../dispatch-webhook` | ✅ | internal |
| `send-webhook` | `.../send-webhook` | ✅ | internal |
| `retry-webhooks` | `.../retry-webhooks` | ✅ | internal |
| `send-webhook-test` | `.../send-webhook-test` | ✅ | producer_sessions |
| `get-webhook-logs` | `.../get-webhook-logs` | ✅ | producer_sessions |
| `test-webhook-dispatch` | `.../test-webhook-dispatch` | ✅ | producer_sessions |
| `trigger-webhooks-internal` | `.../trigger-webhooks-internal` | ✅ | internal |
| `webhook-crud` | `.../webhook-crud` | ✅ | producer_sessions |

### Buyer Portal

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `buyer-auth` | `.../buyer-auth` | ✅ | public |
| `buyer-orders` | `.../buyer-orders` | ✅ | buyer_token |
| `buyer-profile` | `.../buyer-profile` | ✅ | buyer_token |
| `buyer-session` | `.../buyer-session` | ✅ | buyer_token |

### Members Area

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `members-area-certificates` | `.../members-area-certificates` | ✅ | buyer_token |
| `members-area-drip` | `.../members-area-drip` | ✅ | buyer_token |
| `members-area-groups` | `.../members-area-groups` | ✅ | producer_sessions |
| `members-area-modules` | `.../members-area-modules` | ✅ | producer_sessions |
| `members-area-progress` | `.../members-area-progress` | ✅ | buyer_token |
| `members-area-quizzes` | `.../members-area-quizzes` | ✅ | buyer_token |
| `content-crud` | `.../content-crud` | ✅ | producer_sessions |
| `content-save` | `.../content-save` | ✅ | producer_sessions |
| `students-invite` | `.../students-invite` | ✅ | producer_sessions |
| `students-access` | `.../students-access` | ✅ | producer_sessions |
| `students-groups` | `.../students-groups` | ✅ | producer_sessions |
| `students-list` | `.../students-list` | ✅ | producer_sessions |

### Email

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `send-email` | `.../send-email` | ✅ | producer_sessions |
| `send-confirmation-email` | `.../send-confirmation-email` | ✅ | internal |
| `send-pix-email` | `.../send-pix-email` | ✅ | internal |

### Security & Crypto

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `decrypt-customer-data` | `.../decrypt-customer-data` | ✅ | producer_sessions |
| `decrypt-customer-data-batch` | `.../decrypt-customer-data-batch` | ✅ | producer_sessions |
| `encrypt-token` | `.../encrypt-token` | ✅ | producer_sessions |
| `security-management` | `.../security-management` | ✅ | producer_sessions |
| `verify-turnstile` | `.../verify-turnstile` | ✅ | public |

### Security Infrastructure (RISE V3)

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `rls-documentation-generator` | `.../rls-documentation-generator` | ✅ | internal | Gera documentação RLS automática (SQL → Markdown) |
| `key-rotation-executor` | `.../key-rotation-executor` | ✅ | internal | Gerenciamento de rotação de chaves de criptografia |
| `rls-security-tester` | `.../rls-security-tester` | ✅ | internal | Framework automatizado de testes de segurança RLS |
| `session-manager` | `.../session-manager` | ✅ | producer_sessions | Gerenciamento de sessões (list, revoke, logout-all) |
| `data-retention-executor` | `.../data-retention-executor` | ✅ | internal | Executa limpeza de dados automatizada (16 tabelas) |

### User Management

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `get-users-with-emails` | `.../get-users-with-emails` | ✅ | producer_sessions |
| `manage-user-role` | `.../manage-user-role` | ✅ | producer_sessions |
| `manage-user-status` | `.../manage-user-status` | ✅ | producer_sessions |
| `producer-auth` | `.../producer-auth` | ✅ | public |
| `product-crud` | `.../product-crud` | ✅ | producer_sessions |
| `product-settings` | `.../product-settings` | ✅ | producer_sessions |
| `offer-crud` | `.../offer-crud` | ✅ | producer_sessions |
| `offer-bulk` | `.../offer-bulk` | ✅ | producer_sessions |
| `checkout-crud` | `.../checkout-crud` | ✅ | producer_sessions |
| `checkout-editor` | `.../checkout-editor` | ✅ | producer_sessions |
| `order-bump-crud` | `.../order-bump-crud` | ✅ | producer_sessions |
| `product-duplicate` | `.../product-duplicate` | ✅ | producer_sessions |
| `coupon-management` | `.../coupon-management` | ✅ | producer_sessions |
| `integration-management` | `.../integration-management` | ✅ | producer_sessions |

### Affiliates

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `manage-affiliation` | `.../manage-affiliation` | ✅ | producer_sessions |
| `request-affiliation` | `.../request-affiliation` | ✅ | producer_sessions |
| `update-affiliate-settings` | `.../update-affiliate-settings` | ✅ | producer_sessions |
| `get-affiliation-details` | `.../get-affiliation-details` | ✅ | producer_sessions |
| `get-affiliation-status` | `.../get-affiliation-status` | ✅ | producer_sessions |
| `get-all-affiliation-statuses` | `.../get-all-affiliation-statuses` | ✅ | producer_sessions |
| `get-my-affiliations` | `.../get-my-affiliations` | ✅ | producer_sessions |
| `affiliate-pixel-management` | `.../affiliate-pixel-management` | ✅ | producer_sessions |

### Pixels

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `pixel-management` | `.../pixel-management` | ✅ | producer_sessions |

### LGPD/GDPR

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `gdpr-forget` | `.../gdpr-forget` | ✅ | public |
| `gdpr-request` | `.../gdpr-request` | ✅ | public |

### Vault & Credentials

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `vault-save` | `.../vault-save` | ✅ | producer_sessions |

### Health & Diagnostics

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `admin-health` | `.../admin-health` | ✅ | producer_sessions |
| `health` | `.../health` | ✅ | public |
| `smoke-test` | `.../smoke-test` | ✅ | public |
| `test-deploy` | `.../test-deploy` | ✅ | public |
| `check-secrets` | `.../check-secrets` | ✅ | public |

### Owner

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `owner-settings` | `.../owner-settings` | ✅ | producer_sessions |

### RISE Protocol V2

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `rpc-proxy` | `.../rpc-proxy` | ✅ | producer_sessions |
| `storage-management` | `.../storage-management` | ✅ | producer_sessions |

### Dashboard & Data

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `admin-data` | `.../admin-data` | ✅ | producer_sessions | Dados administrativos |
| `dashboard-orders` | `.../dashboard-orders` | ✅ | producer_sessions | Ordens do dashboard |
| `dashboard-analytics` | `.../dashboard-analytics` | ✅ | producer_sessions | Métricas do dashboard (modular, RISE V3) |
| `product-entities` | `.../product-entities` | ✅ | producer_sessions | Entidades do produto |
| `product-full-loader` | `.../product-full-loader` | ✅ | producer_sessions | **BFF**: 1 chamada substitui 6 (offers, bumps, checkouts, links, coupons, product) |
| `products-crud` | `.../products-crud` | ✅ | producer_sessions | CRUD de produtos |
| `vendor-integrations` | `.../vendor-integrations` | ✅ | producer_sessions | Integrações do vendor |

### Public Endpoints

| Nome | URL | No Repo? | Auth |
|------|-----|----------|------|
| `affiliation-public` | `.../affiliation-public` | ✅ | public |
| `checkout-public-data` | `.../checkout-public-data` | ✅ | public |
| `marketplace-public` | `.../marketplace-public` | ✅ | public |

---

## Funções NÃO Presentes no Código Local (0)

> ✅ **Todas as funções estão sincronizadas!** Não há mais dívida técnica.

---

## Notas de Manutenção

### Regras de Autenticação (RISE V3)

1. **NUNCA** use `verify_jwt = true` para funções que usam `producer_sessions`
2. Funções de dashboard DEVEM usar `unified-auth.ts`
3. Funções de buyer portal DEVEM usar `buyer_token`
4. Webhooks DEVEM validar signature/payload, não JWT

### Como Atualizar Este Documento

1. Acesse o Supabase Dashboard → Edge Functions
2. Copie a lista de funções
3. Compare com este documento
4. Atualize as métricas e auth mechanisms

### Convenções

- ✅ = Presente no código local (`supabase/functions/`)
- **producer_sessions** = Autenticação via X-Producer-Session-Token
- **buyer_token** = Autenticação via X-Buyer-Session
- **public** = Sem autenticação
- **webhook** = Validação de signature
- **internal** = Chamada interna (cron, outras edge functions)
- **oauth** = Callback de OAuth flow

### Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-19 | **RISE V3 SECURITY INFRASTRUCTURE** - Adicionadas 5 Edge Functions de segurança |
| 2026-01-19 | Criada `rls-documentation-generator` (geração automática de documentação RLS) |
| 2026-01-19 | Criada `key-rotation-executor` (gerenciamento de rotação de chaves) |
| 2026-01-19 | Criada `rls-security-tester` (framework de testes de segurança RLS) |
| 2026-01-19 | Criada `session-manager` (gerenciamento de sessões de produtores) |
| 2026-01-19 | Criada `data-retention-executor` (limpeza automatizada de 16 tabelas) |
| 2026-01-19 | Total de funções: 110 → 115 |
| 2026-01-18 | **RISE V3 products-crud REFACTORING** - Dividida em 4 Edge Functions |
| 2026-01-18 | Criada `producer-profile` (get-profile, check-credentials, get-gateway-connections) |
| 2026-01-18 | Criada `coupon-read` (get-coupon) |
| 2026-01-18 | Criada `content-library` (get-video-library, get-webhook-logs) |
| 2026-01-18 | `products-crud` reduzida de 597 para 268 linhas |
| 2026-01-18 | **RISE V3 MARKETPLACE SEPARATION** - Criada `marketplace-public` Edge Function |
| 2026-01-18 | Separados endpoints públicos do marketplace de `products-crud` |
| 2026-01-18 | `products-crud` agora contém apenas endpoints core autenticados |
| 2026-01-17 | **RISE V3 AUTH STANDARDIZATION** - Padronização completa de autenticação |
| 2026-01-17 | Migrado `get-users-with-emails` para unified-auth (v2.0.0) |
| 2026-01-17 | Migrado `send-email` para unified-auth (v2.0.0) |
| 2026-01-17 | Removidas referências órfãs: `migrate-credentials-to-vault`, `migrate-vendor-credentials-to-vault` |
| 2026-01-17 | Corrigido `verify_jwt` para `manage-user-role`, `manage-user-status`, `update-affiliate-settings` |
| 2026-01-17 | Corrigido `verify_jwt` para `decrypt-customer-data`, `decrypt-customer-data-batch` |
| 2026-01-17 | Adicionada seção "Mecanismos de Autenticação" com tabela completa |
| 2026-01-17 | Total de funções com verify_jwt=true: **0** ✅ |
| 2026-01-16 | **AUDITORIA FINAL - MIGRAÇÃO 100% COMPLETA** ✅ |
| 2026-01-16 | Deletado `src/api/storage/remove.ts` - substituído por `storage-management` Edge Function |
| 2026-01-16 | **MIGRAÇÃO FRONTEND → EDGE FUNCTIONS** (10 arquivos) |
| 2026-01-16 | **RISE V2 REFACTOR**: `reconcile-pending-orders` dividida em 4 Edge Functions |
| 2026-01-15 | **FIX GATEWAYS**: Criada `pushinpay-validate-token` |
| 2026-01-13 | **FASE 3**: Criados 21 stubs para funções deployed-only |
