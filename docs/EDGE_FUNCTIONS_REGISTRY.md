# Rise Checkout - Edge Functions Registry

> **🔴 FONTE DA VERDADE MÁXIMA** - Este documento lista TODAS as Edge Functions deployadas no Supabase.  
> Última atualização: 2026-02-06 (Multi-Secret Key Architecture - 4 Domínios de Isolamento)  
> Mantenedor: AI Assistant + User

---

## 🏆 RISE V3 Compliance Badge

```
╔═══════════════════════════════════════════════════════════════╗
║  ✅ RISE PROTOCOL V3 - 10.0/10 - MULTI-SECRET KEY ARCH       ║
║     107 Edge Functions | 214 RLS Policies | Zero Legacy       ║
║     ACCESS_TOKEN: 4h | REFRESH_THRESHOLD: 30m | LOCK: 30s     ║
║     ~110 Test Files | ~550+ Edge Tests | Zero Monoliths       ║
║     SSOT: 'users' table | auth.users: ABANDONED               ║
║     API KEYS: publishable + 4 secret domains (isolation)      ║
║     verify_jwt: false (ALL functions) | config.toml: 107      ║
║     SECRET DOMAINS: webhooks | payments | admin | general     ║
╚═══════════════════════════════════════════════════════════════╝
```

**Relatórios:**
- [`docs/UNIFIED_IDENTITY_FINAL_REPORT.md`](./UNIFIED_IDENTITY_FINAL_REPORT.md)
- [`docs/TESTING_MODULARIZATION_REPORT.md`](./TESTING_MODULARIZATION_REPORT.md)

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Total de Funções** | 107 |
| **No código local** | 107 |
| **Apenas deployadas** | 0 |
| **Operações Diretas Frontend** | 0 ✅ |
| **Funções com verify_jwt=true** | 0 ✅ |
| **config.toml entries** | 107 ✅ |
| **API Key System** | Publishable/Secret (new) ✅ |
| **Secret Domains** | 4 (webhooks, payments, admin, general) ✅ |
| **Unified Auth Compliance** | 100% ✅ |
| **Context Guards** | ✅ Producer + Buyer |
| **Base URL (Frontend)** | `https://api.risecheckout.com/functions/v1/` |
| **Base URL (Webhooks)** | `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/` |

---

## 🔐 Mecanismos de Autenticação (RISE V3 - Unified Auth)

> **REGRA ABSOLUTA**: Todas as 107 funções usam `verify_jwt = false` no `supabase/config.toml`.
> A autenticação é feita no código via cookies httpOnly + tabela `sessions` unificada.
> 
> **API KEYS (2026-02):** Migrado de legacy JWT (anon/service_role) para novo sistema
> publishable/secret. As new keys NÃO são JWTs, por isso `verify_jwt = false` é obrigatório.
>
> **MULTI-SECRET KEY (2026-02):** As 107 funções são isoladas em 4 domínios de segurança,
> cada um com sua própria secret key. Se uma key for vazada, revoga-se APENAS ela.

| Mecanismo | Cookie | Validação | Funções |
|-----------|--------|-----------|---------|
| **sessions (unified)** | `__Secure-rise_access` + `__Secure-rise_refresh` | `unified-auth-v2.ts` | TODAS as funções autenticadas |
| **webhook/public** | N/A | Signature/payload | Webhooks, Checkout, Auth endpoints |

> **RISE V3 (Jan 2026):** Sistema 100% unificado. Zero fallbacks. Zero tabelas legadas.
> O frontend usa `credentials: 'include'` e nunca acessa tokens diretamente (proteção XSS total).

### 🔑 Multi-Secret Key Architecture (4 Domínios)

| Domínio | Env Var | Funções | Risco Vazamento | Impacto Revogação |
|---------|---------|---------|-----------------|-------------------|
| **webhooks** | `RISE_SECRET_WEBHOOKS` | 10 | ALTO (URLs expostas) | Webhooks param, checkout continua |
| **payments** | `RISE_SECRET_PAYMENTS` | 18 | ALTO (endpoints públicos) | Pagamentos param, dashboard continua |
| **admin** | `RISE_SECRET_ADMIN` | 17 | BAIXO (sessão autenticada) | Admin para, vendas continuam |
| **general** | `SUPABASE_SERVICE_ROLE_KEY` | 62 | MÉDIO (mistura pub/auth) | Features gerais param, pagamentos/webhooks continuam |

> **SSOT:** O mapeamento domínio → env var está em `_shared/supabase-client.ts` (factory centralizada).
> Cada função chama `getSupabaseClient('domain')` e o factory resolve a key correta.
> Se a key do domínio não estiver configurada, há fallback automático para `general` (com warning log).

### Tabela de Auth por Função

| Função | Auth Mechanism | verify_jwt | Secret Domain | Observação |
|--------|----------------|------------|---------------|------------|
| **Product Management** | | | | |
| `product-crud` | sessions | false | general | unified-auth-v2 |
| `product-settings` | sessions | false | general | unified-auth-v2 |
| `offer-crud` | sessions | false | general | unified-auth-v2 |
| `offer-bulk` | sessions | false | general | unified-auth-v2 |
| `checkout-crud` | sessions | false | general | unified-auth-v2 |
| `order-bump-crud` | sessions | false | general | unified-auth-v2 |
| `checkout-editor` | sessions | false | general | unified-auth-v2 - **Dual-Layout: mobile_top/bottom_components** |
| `product-duplicate` | sessions | false | general | unified-auth-v2 |
| `coupon-management` | sessions | false | general | unified-auth-v2 |
| `integration-management` | sessions | false | general | unified-auth-v2 |
| **User Management** | | | | |
| `manage-user-role` | sessions | false | admin | unified-auth-v2, admin/owner + **Step-Up MFA Owner (Level 2 / OWNER_MFA)** |
| `manage-user-status` | sessions | false | admin | unified-auth-v2, owner + **Step-Up MFA Owner (Level 2 / OWNER_MFA)** |
| `unified-auth` | public | false | general | SSOT - Login/Register/Refresh/Request-Refresh/Verify-Email/Resend-Verification/MFA-Setup/MFA-Verify-Setup/MFA-Verify/MFA-Disable(guard-only)/MFA-Status endpoint |
| **Security & Crypto** | | | | |
| `decrypt-customer-data` | sessions | false | admin | unified-auth-v2, owner check |
| `decrypt-customer-data-batch` | sessions | false | admin | unified-auth-v2, owner check |
| `encrypt-token` | sessions | false | admin | unified-auth-v2 |
| `security-management` | sessions | false | admin | unified-auth-v2 |
| **Affiliates** | | | | |
| `manage-affiliation` | sessions | false | general | unified-auth-v2 |
| `request-affiliation` | sessions | false | general | unified-auth-v2 |
| `update-affiliate-settings` | sessions | false | general | unified-auth-v2 |
| `get-affiliation-status` | sessions | false | general | unified-auth-v2 |
| `get-all-affiliation-statuses` | sessions | false | general | unified-auth-v2 |
| `get-my-affiliations` | sessions | false | general | unified-auth-v2 |
| `get-affiliation-details` | sessions | false | general | unified-auth-v2 |
| **Vault & Credentials** | | | | |
| `vault-save` | sessions | false | admin | unified-auth-v2 |
| **Email** | | | | |
| `send-email` | sessions | false | general | unified-auth-v2 (v2.0.0) |
| `send-confirmation-email` | internal | false | general | Chamada interna |
| `send-pix-email` | internal | false | general | Chamada interna |
| **Buyer Portal** | | | | |
| `buyer-orders` | sessions | false | general | unified-auth-v2 |
| `buyer-profile` | sessions | false | general | unified-auth-v2 |
| **Members Area** | | | | |
| `members-area-modules` | sessions | false | general | unified-auth-v2 |
| `members-area-drip` | sessions | false | general | unified-auth-v2 |
| `members-area-progress` | sessions | false | general | unified-auth-v2 |
| `members-area-quizzes` | sessions | false | general | unified-auth-v2 |
| `members-area-certificates` | sessions | false | general | unified-auth-v2 |
| `members-area-groups` | sessions | false | general | unified-auth-v2 |
| `content-crud` | sessions | false | general | unified-auth-v2 |
| `content-save` | sessions | false | general | unified-auth-v2 |
| `students-invite` | sessions | false | general | unified-auth-v2 |
| `students-access` | sessions | false | general | unified-auth-v2 |
| `students-groups` | sessions | false | general | unified-auth-v2 |
| `students-list` | sessions | false | general | unified-auth-v2 |
| `pixel-management` | sessions | false | general | unified-auth-v2 |
| `affiliate-pixel-management` | sessions | false | general | unified-auth-v2 |
| **Webhooks** | | | | |
| `mercadopago-webhook` | webhook | false | webhooks | Signature validation |
| `pushinpay-webhook` | webhook | false | webhooks | Signature validation |
| `stripe-webhook` | webhook | false | webhooks | Signature validation |
| `asaas-webhook` | webhook | false | webhooks | Signature validation |
| `trigger-webhooks` | internal | false | webhooks | Chamada interna |
| `process-webhook-queue` | internal | false | webhooks | Chamada interna |
| `retry-webhooks` | internal | false | webhooks | Chamada interna |
| `send-webhook-test` | sessions | false | webhooks | unified-auth-v2 |
| `webhook-crud` | sessions | false | webhooks | unified-auth-v2 (modularized v3.1.0) |
| **OAuth Callbacks** | | | | |
| `mercadopago-oauth-callback` | oauth | false | payments | OAuth flow |
| `stripe-connect-oauth` | oauth | false | payments | OAuth flow |
| **Checkout (Public)** | | | | |
| `create-order` | public | false | payments | Clientes anônimos |
| `mercadopago-create-payment` | public | false | payments | Clientes anônimos |
| `stripe-create-payment` | public | false | payments | Clientes anônimos |
| `asaas-create-payment` | public | false | payments | Clientes anônimos |
| `asaas-validate-credentials` | public | false | payments | Validação |
| `pushinpay-create-pix` | public | false | payments | Clientes anônimos |
| `pushinpay-get-status` | public | false | payments | Polling status |
| `pushinpay-validate-token` | public | false | payments | Validação |
| `get-order-for-pix` | public | false | payments | PIX page |
| `verify-turnstile` | public | false | general | Captcha |
| **Tracking & Analytics** | | | | |
| `utmify-conversion` | public | false | general | Tracking |
| `facebook-conversion-api` | public | false | general | CAPI v2.0.0 - Event ID + Retry |
| `reprocess-failed-facebook-events` | internal | false | general | Cron - Reprocessa CAPI falhados |
| `dashboard-analytics` | sessions | false | general | unified-auth-v2 |
| `checkout-heartbeat` | public | false | general | Heartbeat |
| `detect-abandoned-checkouts` | internal | false | general | Cron |
| `track-visit` | public | false | general | Tracking |
| **Reconciliation** | | | | |
| `reconcile-pending-orders` | internal | false | payments | Orquestrador |
| `reconcile-mercadopago` | internal | false | payments | Gateway specific |
| `reconcile-asaas` | internal | false | payments | Gateway specific |
| `grant-member-access` | internal | false | payments | Chamada interna |
| `alert-stuck-orders` | internal | false | payments | Cron |
| `smoke-test` | public | false | general | Health check |
| **LGPD/GDPR** | | | | |
| `gdpr-request` | public | false | admin | User request |
| `gdpr-forget` | public | false | admin | User request |
| **Health & Diagnostics** | | | | |
| `check-secrets` | public | false | general | Debug |
| `health` | public | false | general | Health check |
| `test-deploy` | public | false | general | Deploy test |
| `admin-health` | sessions | false | admin | unified-auth-v2 |
| `owner-settings` | sessions | false | admin | unified-auth-v2, owner only |
| **Security Infrastructure (RISE V3)** | | | | |
| `rls-documentation-generator` | internal | false | admin | Gera documentação RLS automática |
| `key-rotation-executor` | internal | false | admin | Gerenciamento de rotação de chaves |
| `rls-security-tester` | internal | false | admin | Framework de testes RLS |
| `session-manager` | sessions | false | general | Gerenciamento de sessões |
| `data-retention-executor` | internal | false | admin | Limpeza de dados automatizada |
| **RISE Protocol V3** | | | | |
| `rpc-proxy` | sessions | false | admin | unified-auth-v2 |
| `storage-management` | sessions | false | general | unified-auth-v2 |
| `pushinpay-stats` | sessions | false | payments | unified-auth-v2 |
| **Dashboard & Data** | | | | |
| `admin-data` | sessions | false | admin | unified-auth-v2 - **RETORNA CENTAVOS** |
| `product-entities` | sessions | false | general | unified-auth-v2 |
| `products-crud` | sessions | false | general | Core CRUD (RISE V3) |
| `producer-profile` | sessions | false | general | Profile + gateway connections |
| `coupon-read` | sessions | false | general | get-coupon (RISE V3) |
| `content-library` | sessions | false | general | get-video-library (RISE V3) |
| `vendor-integrations` | sessions | false | general | unified-auth-v2 |
| **Public Endpoints** | | | | |
| `affiliation-public` | public | false | general | Dados públicos de afiliação |
| `checkout-public-data` | public | false | general | BFF Modular (12 handlers) - Zero Latency |
| `marketplace-public` | public | false | general | Endpoints públicos marketplace |
| `email-preview` | sessions | false | general | unified-auth-v2 |
| `get-pix-status` | public | false | payments | Recuperação de PIX (v3.5.4) |
| `utmify-validate-credentials` | sessions | false | general | Diagnóstico de tokens UTMify |

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

### Shared Modules - Step-Up MFA (RISE V3 - v1.0.0)

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `_shared/step-up-mfa.ts` | ~170 | TOTP verification: `requireSelfMfa()` (Level 1 / SELF_MFA), `requireOwnerMfa()` (Level 2 / OWNER_MFA) |
| `_shared/critical-operation-guard.ts` | ~180 | Middleware: `guardCriticalOperation()` - classifica e protege operações por nível |

> **Níveis de Step-Up MFA:**
> - **Level 0 (NONE):** Sem verificação adicional
> - **Level 1 (SELF_MFA):** Requer TOTP do próprio caller
> - **Level 2 (OWNER_MFA):** Requer TOTP do Owner do sistema (proteção contra admin comprometido)
>
> **Audit Log Actions:** `STEP_UP_MFA_SUCCESS`, `STEP_UP_MFA_FAILED`, `OWNER_MFA_REQUIRED`

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

| Nome | URL | No Repo? | Auth | Descrição |
|------|-----|----------|------|-----------|
| `utmify-conversion` | `.../utmify-conversion` | ✅ | public | **DEPRECATED** - Backend-only, não usar no frontend |
| `utmify-validate-credentials` | `.../utmify-validate-credentials` | ✅ | sessions | Diagnóstico de tokens UTMify |
| `facebook-conversion-api` | `.../facebook-conversion-api` | ✅ | public | Facebook CAPI v2.0.0 - Event ID + Retry + Failed Queue |
| `reprocess-failed-facebook-events` | `.../reprocess-failed-facebook-events` | ✅ | internal | Cron - Reprocessa eventos CAPI falhados (hourly) |
| `dashboard-analytics` | `.../dashboard-analytics` | ✅ | sessions | Analytics do produtor |
| `checkout-heartbeat` | `.../checkout-heartbeat` | ✅ | public | Heartbeat de checkout ativo |
| `detect-abandoned-checkouts` | `.../detect-abandoned-checkouts` | ✅ | internal | Detecção de checkouts abandonados |
| `track-visit` | `.../track-visit` | ✅ | public | Tracking de visitas |

> **🔴 RISE V3 - UTMify Backend SSOT (ATUALIZADO 2026-02-04)**:
> 
> Eventos UTMify são disparados **EXCLUSIVAMENTE** pelo backend via módulo `_shared/utmify/`:
> 
> ### UTMify Shared Module (RISE V3 - Modularizado)
> 
> | Arquivo | Linhas | Responsabilidade |
> |---------|--------|------------------|
> | `_shared/utmify/types.ts` | ~130 | Tipos unificados |
> | `_shared/utmify/constants.ts` | ~30 | Constantes (URL, STATUS_MAP) |
> | `_shared/utmify/token-normalizer.ts` | ~100 | **SSOT** normalização de tokens |
> | `_shared/utmify/date-formatter.ts` | ~35 | Formatação UTC |
> | `_shared/utmify/payment-mapper.ts` | ~25 | Mapeamento de métodos |
> | `_shared/utmify/config-checker.ts` | ~70 | Verificação evento habilitado |
> | `_shared/utmify/token-retriever.ts` | ~60 | Recuperação do Vault |
> | `_shared/utmify/payload-builder.ts` | ~100 | Construção do payload |
> | `_shared/utmify/order-fetcher.ts` | ~55 | Busca pedido no DB |
> | `_shared/utmify/dispatcher.ts` | ~120 | Orquestrador principal |
> | `_shared/utmify/index.ts` | ~35 | Barrel export |
> 
> **Regra de Segurança**: Token nunca aparece em logs; apenas fingerprint SHA-256 (12 chars hex).
> 
> | Evento | Disparado em | Gateway |
> |--------|--------------|---------|
> | `pix_generated` | `mercadopago-create-payment`, `pushinpay-create-pix`, `asaas-create-payment`, `stripe-create-payment` | Todos |
> | `purchase_approved` | `webhook-post-payment.ts` | Todos |
> | `purchase_refused` | `stripe-webhook`, `mercadopago-webhook` | Stripe, MercadoPago |
> | `refund` | `webhook-post-refund.ts` | Todos |
> | `chargeback` | `webhook-post-refund.ts` | Todos |
> 
> **O frontend (PaymentSuccessPage.tsx) NÃO dispara mais eventos UTMify** - código legado foi removido em v4.0.0.
> 
> O endpoint `utmify-conversion` permanece deployado apenas para compatibilidade com integrações externas, mas NÃO deve ser chamado pelo frontend.
>
> ### Facebook CAPI Shared Module (RISE V3 - v2.0.0)
> 
> Eventos Facebook CAPI são disparados pelo **backend** via módulo `_shared/facebook-capi/`:
> 
> | Arquivo | Linhas | Responsabilidade |
> |---------|--------|------------------|
> | `_shared/facebook-capi/types.ts` | ~120 | Tipos unificados |
> | `_shared/facebook-capi/event-id.ts` | ~30 | Geração de event_id (deduplicação) |
> | `_shared/facebook-capi/pixel-resolver.ts` | ~110 | Resolve pixels Facebook por produto |
> | `_shared/facebook-capi/dispatcher.ts` | ~180 | Orquestrador principal |
> | `_shared/facebook-capi/index.ts` | ~30 | Barrel export |
> 
> **Deduplicação Pixel+CAPI**: O frontend e backend geram o MESMO `event_id` para Purchase
> (`purchase_{orderId}`), permitindo deduplicação automática pelo Facebook.
> 
> **Resiliência**: 3 retries com exponential backoff (1s, 2s, 4s). Falhas persistidas na
> tabela `failed_facebook_events` e reprocessadas via cron (`reprocess-failed-facebook-events`).
> 
> | Evento | Disparado em | Gateway |
> |--------|--------------|---------|
> | `Purchase` | `webhook-post-payment.ts` (Step 5) | Todos |

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

### Secret Domains

| Domínio | Env Var | Descrição |
|---------|---------|-----------|
| `webhooks` | `SUPABASE_SECRET_WEBHOOKS` | Callbacks de gateways, fila de webhooks outbound |
| `payments` | `SUPABASE_SECRET_PAYMENTS` | Criação de pagamentos, reconciliação, acesso pós-pagamento |
| `admin` | `SUPABASE_SECRET_ADMIN` | Segurança, criptografia, GDPR, vault, gerenciamento de roles |
| `general` | `SUPABASE_SERVICE_ROLE_KEY` | Auth, CRUD, checkout, área de membros, afiliados, tracking |

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-02-06 | Multi-Secret Key Architecture: 4 domínios de isolamento (webhooks, payments, admin, general). Factory centralizada em `_shared/supabase-client.ts`. 107 funções migradas |
| 2026-02-06 | API Keys Migration: Legacy JWT → Publishable/Secret. config.toml: 107 entries. Badge updated |
| 2026-02-04 | UTMify Backend SSOT - Eventos completos no backend |
| 2026-01-23 | RISE V3 Complete - Removed buyer-auth, producer-auth, buyer-session |
| 2026-01-22 | Unified auth migration |
| 2026-01-16 | Initial registry |
