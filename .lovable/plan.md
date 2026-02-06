

# Arquitetura Multi-Secret Key: 4 Dominios de Isolamento para RiseCheckout

## Contexto

O novo sistema de API keys do Supabase permite criar multiplas **secret keys** (`sb_secret_...`), cada uma com acesso completo `service_role`, mas operacionalmente isoladas. Se uma key for vazada, voce revoga APENAS ela sem afetar o restante do sistema.

## Mapeamento Completo: 107 Functions em 4 Dominios

### DOMINIO 1: WEBHOOKS (10 funcoes)

Funcoes que recebem callbacks de gateways de pagamento ou processam fila de webhooks outbound.

**Risco de vazamento**: ALTO (URLs expostas para gateways externos)
**Impacto de revogacao**: Webhooks param de ser processados, pagamentos nao atualizam status, mas checkout continua criando pedidos.

| Funcao | Auth Mechanism | Descricao |
|--------|----------------|-----------|
| `mercadopago-webhook` | webhook signature | Inbound MercadoPago |
| `stripe-webhook` | webhook signature | Inbound Stripe |
| `pushinpay-webhook` | webhook signature | Inbound PushinPay |
| `asaas-webhook` | webhook signature | Inbound Asaas |
| `trigger-webhooks` | internal secret | Disparo outbound |
| `process-webhook-queue` | internal secret | Fila de processamento |
| `retry-webhooks` | internal secret | Retry de falhas |
| `send-webhook-test` | sessions | Teste manual |
| `webhook-crud` | sessions | CRUD de webhooks |
| `order-lifecycle-worker` | internal secret | Post-payment/refund actions |

**Env var**: `SUPABASE_SECRET_WEBHOOKS`

---

### DOMINIO 2: PAYMENTS (18 funcoes)

Funcoes que criam pagamentos, consultam status, reconciliam, e concedem acesso apos pagamento.

**Risco de vazamento**: ALTO (endpoints publicos acessados por compradores anonimos)
**Impacto de revogacao**: Checkout para de processar pagamentos, mas dashboard e area de membros continuam.

| Funcao | Auth Mechanism | Descricao |
|--------|----------------|-----------|
| `mercadopago-create-payment` | public | Criar pagamento MP |
| `mercadopago-oauth-callback` | oauth | OAuth MP |
| `stripe-create-payment` | public | Criar pagamento Stripe |
| `stripe-connect-oauth` | oauth | OAuth Stripe |
| `asaas-create-payment` | public | Criar pagamento Asaas |
| `asaas-validate-credentials` | public | Validar Asaas |
| `pushinpay-create-pix` | public | Criar PIX PushinPay |
| `pushinpay-get-status` | public | Status PIX |
| `pushinpay-validate-token` | public | Validar token PP |
| `pushinpay-stats` | sessions | Stats PushinPay |
| `create-order` | public | Criar pedido |
| `get-order-for-pix` | public | Dados pedido PIX |
| `get-pix-status` | public | Recuperar PIX |
| `reconcile-pending-orders` | internal | Orquestrador reconciliacao |
| `reconcile-mercadopago` | internal | Reconciliacao MP |
| `reconcile-asaas` | internal | Reconciliacao Asaas |
| `grant-member-access` | internal | Conceder acesso pos-pagamento |
| `alert-stuck-orders` | internal | Alertar pedidos travados |

**Env var**: `SUPABASE_SECRET_PAYMENTS`

---

### DOMINIO 3: ADMIN (17 funcoes)

Funcoes de alto privilegio: seguranca, criptografia, GDPR, vault, gerenciamento de roles, infraestrutura.

**Risco de vazamento**: BAIXO (maioria requer sessao autenticada de owner/admin)
**Impacto de revogacao**: Dashboard admin e operacoes sensiveis param, mas checkout e vendas continuam.

| Funcao | Auth Mechanism | Descricao |
|--------|----------------|-----------|
| `admin-data` | sessions | Dados administrativos |
| `admin-health` | sessions | Health admin |
| `owner-settings` | sessions | Configuracoes owner |
| `manage-user-role` | sessions | Gerenciar roles |
| `manage-user-status` | sessions | Gerenciar status users |
| `security-management` | sessions | Gestao de seguranca |
| `decrypt-customer-data` | sessions | Decriptar dados |
| `decrypt-customer-data-batch` | sessions | Decriptar batch |
| `encrypt-token` | sessions | Encriptar tokens |
| `key-rotation-executor` | internal | Rotacao de chaves |
| `rls-documentation-generator` | internal | Gerar docs RLS |
| `rls-security-tester` | internal | Testar RLS |
| `data-retention-executor` | internal | Limpeza de dados |
| `vault-save` | sessions | Salvar no vault |
| `gdpr-forget` | public | LGPD esquecimento |
| `gdpr-request` | public | LGPD solicitacao |
| `rpc-proxy` | sessions | Proxy RPC |

**Env var**: `SUPABASE_SECRET_ADMIN`

---

### DOMINIO 4: GENERAL (62 funcoes)

Auth, CRUD de produtos, checkout, area de membros, afiliados, tracking, email, diagnosticos.

**Risco de vazamento**: MEDIO (mistura de publico e autenticado)
**Impacto de revogacao**: Features gerais param, mas pagamentos e webhooks continuam processando.

| Funcao | Auth | Descricao |
|--------|------|-----------|
| `unified-auth` | public | Login/Register/Refresh |
| `session-manager` | sessions | Gestao sessoes |
| `product-crud` | sessions | CRUD produtos |
| `product-duplicate` | sessions | Duplicar produto |
| `product-entities` | sessions | Entidades produto |
| `product-full-loader` | sessions | Loader completo |
| `product-settings` | sessions | Config produto |
| `products-crud` | sessions | CRUD v2 |
| `checkout-crud` | sessions | CRUD checkout |
| `checkout-editor` | sessions | Editor checkout |
| `checkout-public-data` | public | BFF modular |
| `checkout-heartbeat` | public | Heartbeat |
| `offer-crud` | sessions | CRUD ofertas |
| `offer-bulk` | sessions | Bulk ofertas |
| `order-bump-crud` | sessions | CRUD bumps |
| `coupon-management` | sessions | Gestao cupons |
| `coupon-read` | sessions | Leitura cupons |
| `integration-management` | sessions | Gestao integracoes |
| `vendor-integrations` | sessions | Integracoes vendor |
| `producer-profile` | sessions | Perfil produtor |
| `buyer-orders` | sessions | Pedidos buyer |
| `buyer-profile` | sessions | Perfil buyer |
| `dashboard-analytics` | sessions | Analytics |
| `members-area-certificates` | sessions | Certificados |
| `members-area-drip` | sessions | Drip content |
| `members-area-groups` | sessions | Grupos |
| `members-area-modules` | sessions | Modulos |
| `members-area-progress` | sessions | Progresso |
| `members-area-quizzes` | sessions | Quizzes |
| `content-crud` | sessions | CRUD conteudo |
| `content-library` | sessions | Biblioteca |
| `content-save` | sessions | Salvar conteudo |
| `students-access` | sessions | Acesso alunos |
| `students-groups` | sessions | Grupos alunos |
| `students-invite` | sessions | Convidar alunos |
| `students-list` | sessions | Listar alunos |
| `pixel-management` | sessions | Gestao pixels |
| `affiliate-pixel-management` | sessions | Pixels afiliado |
| `affiliation-public` | public | Dados pub afiliacao |
| `manage-affiliation` | sessions | Gestao afiliacao |
| `request-affiliation` | sessions | Solicitar afiliacao |
| `update-affiliate-settings` | sessions | Config afiliado |
| `get-affiliation-details` | sessions | Detalhes afiliacao |
| `get-affiliation-status` | sessions | Status afiliacao |
| `get-all-affiliation-statuses` | sessions | Todos status |
| `get-my-affiliations` | sessions | Minhas afiliacoes |
| `marketplace-public` | public | Marketplace |
| `storage-management` | sessions | Gestao storage |
| `send-email` | sessions | Enviar email |
| `send-confirmation-email` | internal | Email confirmacao |
| `send-pix-email` | internal | Email PIX |
| `email-preview` | sessions | Preview email |
| `track-visit` | public | Tracking visita |
| `utmify-conversion` | public | UTMify (deprecated) |
| `utmify-validate-credentials` | sessions | Validar UTMify |
| `facebook-conversion-api` | public | Facebook CAPI |
| `detect-abandoned-checkouts` | internal | Detectar abandonos |
| `verify-turnstile` | public | Captcha |
| `check-secrets` | public | Diagnostico secrets |
| `health` | public | Health check |
| `smoke-test` | public | Smoke test |
| `test-deploy` | public | Deploy test |

**Env var**: `SUPABASE_SERVICE_ROLE_KEY` (auto-injected by Supabase -- zero configuracao manual)

---

## Analise de Solucoes

### Solucao A: Config por funcao (cada funcao sabe seu env var diretamente)

Cada `index.ts` faz `Deno.env.get("SUPABASE_SECRET_PAYMENTS")` diretamente.

- Manutenibilidade: 5/10 -- Mudar o nome de um env var exige alterar N arquivos
- Zero DT: 5/10 -- Nenhuma centralizacao, dominio espalhado no codigo
- Arquitetura: 4/10 -- Viola DRY, cada funcao decide qual env var usar
- Escalabilidade: 5/10 -- Adicionar novo dominio exige buscar todos os arquivos
- Seguranca: 9/10 -- Isolamento funcional ok
- **NOTA FINAL: 5.3/10**

### Solucao B: Factory centralizado com dominio tipado + mapeamento declarativo

Refatorar `_shared/supabase-client.ts` com um enum `SecretDomain` e um map `domain -> env_var_name`. Cada funcao chama `getSupabaseClient('payments')`. O mapeamento e declarativo e centralizado em UM arquivo.

- Manutenibilidade: 10/10 -- Mudar env var name toca UM arquivo. Adicionar dominio: 1 linha
- Zero DT: 10/10 -- SSOT absoluto para dominio-chave
- Arquitetura: 10/10 -- Factory pattern com DI implicita, Clean Architecture
- Escalabilidade: 10/10 -- Novos dominios sao 1 linha no mapa + criar a key
- Seguranca: 10/10 -- Isolamento operacional + centralizacao de auditoria
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A espalha a responsabilidade por 107 arquivos. A Solucao B centraliza tudo em um unico SSOT (`supabase-client.ts`), tornado trivial adicionar/remover/rotacionar dominios.

---

## Plano de Execucao Detalhado

### Fase 1: Refatorar `_shared/supabase-client.ts` (SSOT)

Adicionar:

```text
// Secret domain type
export type SecretDomain = 'webhooks' | 'payments' | 'admin' | 'general';

// SSOT: maps domain to environment variable name
const DOMAIN_KEY_MAP: Record<SecretDomain, string> = {
  webhooks: 'SUPABASE_SECRET_WEBHOOKS',
  payments: 'SUPABASE_SECRET_PAYMENTS',
  admin:    'SUPABASE_SECRET_ADMIN',
  general:  'SUPABASE_SERVICE_ROLE_KEY', // Auto-injected by Supabase
};

// Per-domain cached clients
const domainClients: Partial<Record<SecretDomain, SupabaseClient>> = {};

// New public API
export function getSupabaseClient(domain: SecretDomain = 'general'): SupabaseClient {
  if (domainClients[domain]) return domainClients[domain]!;

  const url = getSupabaseUrl();
  const envVar = DOMAIN_KEY_MAP[domain];
  const key = Deno.env.get(envVar);

  if (!key) {
    // Fallback to general key during migration
    log.warn(`Secret for domain '${domain}' (${envVar}) not found, falling back to general`);
    return getSupabaseClient('general');
  }

  const client = createClient(url, key);
  domainClients[domain] = client;
  log.debug(`Supabase client initialized for domain: ${domain}`);
  return client;
}
```

A funcao existente `getSupabaseClient()` sem parametro continua funcionando (default `'general'`). Zero breaking changes.

O fallback garante que funcoes migradas NAO quebram antes das secrets serem configuradas no Dashboard.

### Fase 2: Atualizar `_shared/get-vendor-token.ts`

Substituir as 2 instancias de `createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)` por `getSupabaseClient('payments')` (pois busca tokens de gateway).

### Fase 3: Migrar todas as 107 funcoes `index.ts`

Refatoracao mecanica em cada funcao:

**ANTES** (padrao atual em ~100 funcoes):
```text
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ...
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
```

**DEPOIS** (padrao novo):
```text
import { getSupabaseClient } from "../_shared/supabase-client.ts";
// ...
const supabase = getSupabaseClient('payments'); // domain correto
```

Cada funcao recebe o dominio correto conforme as tabelas acima:
- 10 funcoes de webhook -> `'webhooks'`
- 18 funcoes de payment -> `'payments'`
- 17 funcoes de admin -> `'admin'`
- 62 funcoes de general -> `'general'`

Beneficio: remove o `import { createClient }` direto do Supabase JS e remove as chamadas diretas a `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` de todos os 107 arquivos. Tudo passa pelo factory centralizado.

### Fase 4: Atualizar `check-secrets/index.ts`

Adicionar as 3 novas secrets esperadas:

```text
'SUPABASE_SECRET_WEBHOOKS': 'supabase-domains',
'SUPABASE_SECRET_PAYMENTS': 'supabase-domains',
'SUPABASE_SECRET_ADMIN': 'supabase-domains',
```

### Fase 5: Atualizar documentacao

**`docs/EDGE_FUNCTIONS_REGISTRY.md`**:
- Adicionar coluna "Secret Domain" na tabela de auth por funcao
- Adicionar secao "Multi-Secret Key Architecture"

**`docs/API_GATEWAY_ARCHITECTURE.md`**:
- Documentar o mapeamento dominio -> env var

**`docs/SECURITY_OVERVIEW.md`**:
- Documentar a estrategia de isolamento e rotacao

**`.env.example`**:
- Adicionar as 3 novas variaveis

### Fase 6: Configuracao Manual (User -- Supabase Dashboard)

1. **Criar 3 secret keys** no Supabase Dashboard > Settings > API Keys > "Publishable and secret API keys"
   - Nomear: `webhooks`, `payments`, `admin`
   - Copiar cada valor `sb_secret_...`

2. **Configurar como Supabase Secrets** (Dashboard > Settings > Edge Functions > Manage Secrets):
   - `SUPABASE_SECRET_WEBHOOKS` = valor da key "webhooks"
   - `SUPABASE_SECRET_PAYMENTS` = valor da key "payments"
   - `SUPABASE_SECRET_ADMIN` = valor da key "admin"

3. **Testar** cada dominio isoladamente:
   - Webhooks: enviar webhook de teste do MercadoPago
   - Payments: criar pedido de teste no checkout
   - Admin: acessar dashboard admin
   - General: fazer login e navegar

4. **Validar isolamento**: revogar temporariamente uma key de teste e confirmar que apenas as funcoes daquele dominio falham

---

## Arvore de Arquivos Modificados

```text
MODIFICADOS (CORE):
  supabase/functions/_shared/supabase-client.ts        <- Factory com SecretDomain
  supabase/functions/_shared/get-vendor-token.ts        <- Usar factory('payments')

MODIFICADOS (107 FUNCOES - refatoracao mecanica):
  supabase/functions/*/index.ts                         <- getSupabaseClient('domain')

MODIFICADOS (DIAGNOSTICO):
  supabase/functions/check-secrets/index.ts             <- 3 novas secrets

MODIFICADOS (DOCS):
  docs/EDGE_FUNCTIONS_REGISTRY.md                       <- Coluna "Secret Domain"
  docs/API_GATEWAY_ARCHITECTURE.md                      <- Secao multi-key
  docs/SECURITY_OVERVIEW.md                             <- Estrategia de isolamento
  .env.example                                          <- 3 novas variaveis
```

## Estrategia de Rotacao (Pos-Implementacao)

Quando uma key for vazada:

```text
1. Supabase Dashboard > API Keys > Revogar key comprometida
2. Criar nova key no mesmo Dashboard
3. Dashboard > Edge Functions > Manage Secrets > Atualizar a env var correspondente
4. Edge Functions re-deployam automaticamente com novo secret
5. Tempo total de downtime: ~30 segundos (apenas no dominio afetado)
6. Dominios nao afetados: ZERO impacto
```

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Funcao com dominio errado | MEDIA | BAIXO | Fallback para 'general' no factory |
| Secret nao configurada | MEDIA | BAIXO | Log de warning + fallback automatico |
| Breaking change no factory | BAIXO | ALTO | Default parameter `'general'` = backward compatible |
| Erro de import em alguma funcao | MEDIA | BAIXO | Refatoracao mecanica, padrao identico |

