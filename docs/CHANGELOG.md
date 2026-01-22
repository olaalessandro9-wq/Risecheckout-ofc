# Changelog - RiseCheckout

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [3.5.3] - 2026-01-22

### 🧹 Auditoria Módulo Financeiro (RISE V3)

#### Refatorado
- **Modularização do `asaas/api.ts`** (309 → 3 arquivos < 200 linhas cada):
  - `api/validation-api.ts` - Validação de credenciais (~65 linhas)
  - `api/payment-api.ts` - Pagamentos PIX e Cartão (~105 linhas)
  - `api/settings-api.ts` - Configurações get/save/disconnect (~175 linhas)
  - `api/index.ts` - Barrel export (compatibilidade total)

#### Removido
- **Parâmetro não utilizado `vendorId`** em `saveAsaasSettings()` - Edge Function usa token auth
- **Parâmetro não utilizado `vendorId`** em `disconnectAsaas()` - Edge Function usa token auth
- **Logger não utilizado `log`** em `PushinPayConfigForm.tsx` - declarado mas nunca usado
- **Arquivo monolítico `api.ts`** - substituído por estrutura modular `api/`

#### Arquivos Afetados
- `src/integrations/gateways/asaas/api.ts` → DELETADO
- `src/integrations/gateways/asaas/api/` → CRIADO (4 arquivos)
- `src/integrations/gateways/asaas/index.ts` → Atualizado import
- `src/integrations/gateways/asaas/hooks.ts` → Removidos parâmetros
- `src/integrations/gateways/pushinpay/components/ConfigForm.tsx` → -3 linhas

#### Conformidade RISE V3
- **Arquivos > 300 linhas:** 0 (era 1)
- **Parâmetros não utilizados:** 0 (eram 2)
- **Variáveis não utilizadas:** 0 (era 1)
- **Limite 300 linhas:** ✅ 100%

---

## [3.5.2] - 2026-01-21

### 🧹 Auditoria Módulo de Afiliados (RISE V3)

#### Removido
- **Import morto `supabase`** em `OffersTab.tsx` - nunca era utilizado
- **Arquivo deprecated `PixelsTab.tsx`** - re-export legado desnecessário (import correto já era `from "./pixels"`)
- **Prop não utilizado `onRefetch`** em `DetailsTab.tsx` - declarado mas nunca consumido

#### Arquivos Afetados
- `src/components/affiliation/tabs/OffersTab.tsx` (-1 linha)
- `src/components/affiliation/tabs/PixelsTab.tsx` (DELETADO)
- `src/components/affiliation/tabs/DetailsTab.tsx` (-1 linha)
- `src/pages/AffiliationDetails.tsx` (-1 prop)

#### Conformidade RISE V3
- **Zero código morto:** ✅ 100%
- **Zero arquivos deprecated:** ✅ 100%
- **Zero props não utilizados:** ✅ 100%
- **Limite 300 linhas:** ✅ Todos arquivos < 300 linhas



### 🧹 Auditoria Marketplace Module (RISE V3)

#### Removido
- **Botão morto `(Selecionar todos)`** em `CategoryFilter.tsx` - redundante com opção "Todas as categorias" no Select

#### Corrigido
- **Dependência faltando** em `useAffiliateRequest.ts` - `updateCacheStatus` adicionado ao array de dependências do `useCallback`

#### Conformidade RISE V3
- **Zero código morto:** ✅ 100%
- **Zero dependências faltando:** ✅ 100%
- **Limite 300 linhas:** ✅ Todos arquivos < 300 linhas

---

## [3.4.0] - 2026-01-21

### 🎯 Refatoração Webhooks Module (RISE V3 10.0/10)

#### Adicionado
- **Módulo XState `webhooksMachine`** (157 linhas):
  - State machine completa para gerenciamento de webhooks outbound
  - Estados: `idle`, `loading`, `ready`, `saving`, `deleting`, `loadingLogs`, `error`
  - Actors para operações async: `loadWebhooks`, `saveWebhook`, `deleteWebhook`, `loadLogs`

- **Componentes modulares** em `src/modules/webhooks/`:
  - `WebhooksManager.tsx` - Container principal com Provider
  - `WebhooksList.tsx` - Lista com filtros e busca
  - `WebhookForm.tsx` - Formulário de criação/edição
  - `WebhookFormSheet.tsx` - Sheet wrapper
  - `WebhookDeleteDialog.tsx` - Confirmação de exclusão
  - `TestWebhookDialog.tsx` - Envio de evento teste
  - `WebhookLogsDialog.tsx` - Visualização de logs

- **Action `get-logs` em `webhook-crud`**: Centraliza busca de logs de entrega

#### Removido
- **Edge Function `get-webhook-logs`**: Consolidada em `webhook-crud` action=`get-logs`
- **Handler `get-webhook-logs` de `content-library`**: Movido para `webhook-crud`
- **Componentes legados**: `src/components/webhooks/` (5 arquivos deletados)

#### Conformidade RISE V3
- **XState SSOT:** ✅ `webhooksMachine` como fonte única de verdade
- **Zero `any` types:** ✅ 100%
- **Zero `console.log`:** ✅ Usa `createLogger()`
- **Limite 300 linhas:** ✅ Todos arquivos < 160 linhas
- **Total Edge Functions:** 114 (-1, consolidação)

---

## [3.3.1] - 2026-01-18

### 🔧 Refatoração products-crud (RISE V3 Seção 6.4)

#### Adicionado
- **Edge Function `producer-profile`** (208 linhas):
  - `get-profile`: Retorna perfil do produtor
  - `check-credentials`: Verifica credenciais de gateway
  - `get-gateway-connections`: Retorna conexões de gateway

- **Edge Function `coupon-read`** (125 linhas):
  - `get-coupon`: Retorna cupom específico para edição

- **Edge Function `content-library`** (160 linhas):
  - `get-video-library`: Biblioteca de vídeos do produto

#### Alterado
- **products-crud:** Reduzida de 597 para 268 linhas (-55%)
- **Frontend atualizado:**
  - `Perfil.tsx` → `producer-profile`
  - `CuponsTab.tsx` → `coupon-read`
  - `useVideoLibrary.ts` → `content-library`

#### Conformidade RISE V3
- **Seção 6.4 (Limite 300 linhas):** ✅ Todas funções < 300 linhas
- **Single Responsibility Principle:** ✅ 1 domínio por função
- **Total Edge Functions:** 114 (após consolidação webhooks)

---

## [3.3.0] - 2026-01-18

### 🎯 Refatoração RISE V3 - Marketplace

#### Adicionado
- **Edge Function `marketplace-public`** (222 linhas):
  - `get-products`: Lista produtos do marketplace com filtros
  - `get-product`: Detalhes de um produto específico
  - `get-categories`: Categorias ativas do marketplace

- **10 novos sub-componentes MarketplaceFilters:**
  - `FilterHeader`, `SearchFilter`, `ApprovalFilter`, `TypeFilter`
  - `CategoryFilter`, `CommissionFilter`, `SortFilter`, `FilterActions`
  - `useMarketplaceFilters` hook
  - `index.tsx` (orquestrador com 84 linhas)

- **11 novos sub-componentes ProductDetails:**
  - `ProductHeader`, `ProductInfo`, `CommissionDetails`, `OfferCard`
  - `OffersList`, `OwnerActions`, `AffiliateActions`, `utils`
  - `useProductOffers`, `useOwnerCheck` hooks
  - `index.tsx` (orquestrador com 167 linhas)

#### Alterado
- **MarketplaceFilters.tsx:** Refatorado de 369 para 84 linhas (-77%)
- **ProductDetails.tsx:** Refatorado de 504 para 167 linhas (-67%)
- **products-crud:** Reduzido de 747 para 597 linhas (endpoints públicos movidos)
- **marketplace.ts:** Atualizado para usar `marketplace-public` Edge Function via `api.publicCall()`

#### Removido
- Endpoints de marketplace de `products-crud` (movidos para `marketplace-public`)
- Código morto: `OffersList.tsx`, `PopularityIndicator.tsx`, `RulesList.tsx`, `AffiliateButton.tsx`
- Prop não utilizada: `onPromote` em `ProductCard`, `MarketplaceGrid`, `Marketplace`
- Handlers duplicados: `getMarketplaceProducts`, `getMarketplaceProduct`, `getMarketplaceCategories` de `products-crud`

#### Conformidade RISE V3
- **Seção 4 (Lei Suprema):** ✅ 100% - Escolhida solução nota 10/10 sobre 7.6/10
- **Zero arquivos > 300 linhas no frontend:** ✅ 100%
- **Zero God Objects:** ✅ 100%
- **Single Responsibility Principle:** ✅ 100%
- **Zero Database Access (Frontend):** ✅ 100%
- **Zero tipos `any`:** ✅ 100%

---

## [3.2.0] - 2026-01-17

### 📦 Sistema de Status Hotmart/Kiwify

#### Adicionado
- **Arquitetura Dual-Layer de Status:**
  - `status` (público): 4 valores canônicos (`paid`, `pending`, `refunded`, `chargeback`)
  - `technical_status` (interno): 6 valores (`active`, `expired`, `gateway_cancelled`, `gateway_timeout`, `gateway_error`, `abandoned`)
  - `expired_at`: Timestamp de expiração para PIX/boleto

- **Novo documento:** `docs/ORDER_STATUS_MODEL.md` - Documentação completa do sistema

#### Alterado
- **Modelo de Status:** Seguindo padrão Hotmart/Kiwify, vendas pendentes NUNCA transitam para "cancelado" na UI
- **Webhooks atualizados:** `pushinpay-webhook`, `asaas-webhook`, `reconcile-mercadopago` agora definem `technical_status`
- **Frontend:** `OrderDetailsDialog.tsx` e `dashboard.types.ts` simplificados para 4 status

#### Migrado
- **14 pedidos históricos** de `status = 'cancelled'` para `status = 'pending'` com `technical_status = 'expired'`

#### Documentação
- Atualizado `docs/ARCHITECTURE.md` com seção de Sistema de Status
- Atualizado `docs/UTMIFY_INTEGRATION.md` com mapeamento correto
- Atualizado `docs/STATUS_ATUAL.md` para versão 3.2

---

## [3.1.0] - 2026-01-16

### 🔒 Migração Frontend → Edge Functions (RISE Protocol V2)

#### Adicionado
- **10 novas actions** em Edge Functions existentes:
  - `admin-data`: 7 actions (marketplace-categories, marketplace-stats, user-profile-name, check-unique-checkout-name, user-products-simple, members-area-settings, members-area-modules-with-contents)
  - `webhook-crud`: 3 actions (listWebhooksWithProducts, listUserProducts, getWebhookProducts)
  - `checkout-public-data`: 1 action (check-order-payment-status)

#### Migrado
- **10 arquivos frontend** para usar Edge Functions (Zero Database Access):
  - `WebhooksConfig.tsx`, `WebhookForm.tsx` → `webhook-crud`
  - `AffiliatesTab.tsx`, `MarketplaceSettings.tsx` → `admin-data`
  - `useMembersAreaSettings.ts`, `MenuPreview.tsx` → `admin-data`
  - `StripePix.tsx` → `checkout-public-data`
  - `uniqueCheckoutName.ts`, `useAdminAnalytics.ts` → `admin-data`

#### Removido
- `src/api/storage/remove.ts` - Substituído por `storage-management` Edge Function
- `src/lib/utils/slug.ts` - Código morto no frontend (movido para Edge Functions)

#### Conformidade
- **Zero chamadas `supabase.from()`** no frontend
- **RISE Protocol V2 Compliance: 100%**

---

## [3.0.0] - 2026-01-15

### 🎉 Marco: Produção 100% Completa

#### Adicionado
- **Dashboard Financeiro Avançado**
  - MetricCard com animações e trends
  - RevenueChart com Recharts
  - DateRangeFilter customizado
  - Métricas: Ticket médio, Conversão, PIX vs Cartão
  - Edge Function `dashboard-analytics`

- **LGPD Compliance Completo**
  - Edge Functions `gdpr-request` e `gdpr-forget`
  - Páginas frontend `/lgpd/request` e `/lgpd/confirm`
  - Tabelas `gdpr_requests` e `gdpr_audit_log`
  - Rate limiting (3 req/hora por email)
  - Token com expiração de 24h

- **Testes Automatizados**
  - `create-order/index.test.ts`
  - `mercadopago-webhook/index.test.ts`

#### Melhorado
- Eliminação de 100% dos tipos `any` no código (eram ~850)
- Documentação sincronizada com estado real do projeto

#### Corrigido
- Documentação desatualizada arquivada em `docs/archive/`

---

## [2.5.0] - 2026-01-13

### Refatoração RISE Protocol V2

#### Adicionado
- 21 novas Edge Functions especializadas
- Módulos compartilhados: `_shared/session.ts`, `_shared/response.ts`, `_shared/ownership.ts`
- `rpc-proxy` e `storage-management` para centralização

#### Alterado
- Dividida `checkout-management` (1354 linhas) em 3 funções
- Dividida `product-management` (954 linhas) em 2 funções
- Dividida `offer-management` (603 linhas) em 2 funções
- Dividida `members-area-content` (584 linhas) em 2 funções
- Dividida `members-area-students` (1155 linhas) em 4 funções

#### Removido
- 6 funções legado: `webhook-pushingpay`, `forward-to-utmify`, etc.
- Operações diretas ao banco no frontend (agora 100% via Edge Functions)

---

## [2.0.0] - 2025-12

### Segurança e Vault

#### Adicionado
- Migração completa para Vault unificado
- Validação HMAC-SHA256 em todos os webhooks
- RLS Policies em todas as tabelas
- Rate limiting ativo

#### Alterado
- Arquitetura de credenciais via `vault-save`
- OAuth callbacks unificados

---

## [1.0.0] - 2025-11

### Release Inicial

#### Adicionado
- Multi-gateway: Mercado Pago, PushinPay, Stripe, Asaas
- Sistema de checkout customizável
- Order bumps e cupons
- Área de membros
- Sistema de afiliados
- Notificações via Sonner
- Email via ZeptoMail

---

## Legenda

- 🎉 Marco importante
- ✨ Nova funcionalidade
- 🔧 Correção de bug
- 📝 Documentação
- 🗑️ Removido
- 🔒 Segurança
- 🎯 Refatoração RISE V3
- 📦 Sistema de Status
