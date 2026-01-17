# Changelog - RiseCheckout

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

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
