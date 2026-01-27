
# Plano: Auditoria Completa de Gateways - Migração para API Gateway

## Diagnóstico Root Cause

### Análise da Arquitetura

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA DE CHAMADAS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND → api.risecheckout.com → Supabase Edge Functions                      │
│  (usa API Gateway para OAuth, CRUD, autenticação)                               │
│                                                                                  │
│  GATEWAYS DE PAGAMENTO → Supabase direto (webhooks)                             │
│  (Mercado Pago, PushinPay, Asaas, Stripe chamam direto)                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Resultado da Auditoria

| Componente | Status | Ação Necessária |
|------------|--------|-----------------|
| Mercado Pago OAuth | ✅ CORRIGIDO | Nenhuma (SSOT implementado) |
| Stripe OAuth | ❌ VULNERÁVEL | Aplicar mesmo padrão SSOT |
| Webhook URLs (todos) | ✅ CORRETO | Devem usar SUPABASE_URL (gateways chamam direto) |
| Documentação | ⚠️ DESATUALIZADA | Atualizar referências |
| Platform Secrets Manifest | ⚠️ INCOMPLETO | Adicionar secrets do Stripe |

---

## Problema #1: Stripe OAuth (CRÍTICO)

### Diagnóstico

O `stripe-connect-oauth/handlers/oauth-start.ts` usa o secret `STRIPE_REDIRECT_URL`:

```typescript
// Linha 45 - oauth-start.ts
const redirectUri = Deno.env.get("STRIPE_REDIRECT_URL");
```

**Risco:** Se o secret `STRIPE_REDIRECT_URL` contém a URL antiga do Supabase, haverá o mesmo problema de mismatch que tivemos com Mercado Pago.

### Verificação do Secret

O secret `STRIPE_REDIRECT_URL` **existe** no Supabase (confirmado na lista de secrets).

**Ação Manual Requerida:** Verificar se o valor do secret é:
- ✅ CORRETO: `https://api.risecheckout.com/functions/v1/stripe-connect-oauth?action=callback`
- ❌ INCORRETO: `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/stripe-connect-oauth?action=callback`

---

## Análise de Soluções (RISE V3)

### Solução A: Apenas verificar/corrigir o secret STRIPE_REDIRECT_URL

- Manutenibilidade: 6/10 (depende de humano manter o secret correto)
- Zero DT: 6/10 (SSOT duplicado: secret + código)
- Arquitetura: 5/10 (inconsistente com padrão do Mercado Pago)
- Escalabilidade: 6/10
- Segurança: 9/10
- **NOTA FINAL: 6.2/10**
- Tempo estimado: 5 minutos

### Solução B: Aplicar padrão SSOT do Mercado Pago ao Stripe

- Manutenibilidade: 10/10 (SSOT real: um módulo de configuração)
- Zero DT: 10/10 (remove classe inteira de bugs)
- Arquitetura: 10/10 (consistência entre todos os gateways OAuth)
- Escalabilidade: 10/10 (fácil adicionar novos gateways)
- Segurança: 10/10 (nenhuma configuração de URL como secret)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1 dia

### DECISÃO: Solução B (10.0/10)

A Solução A é inferior porque:
1. Mantém dependência de secret para configuração de URL
2. Inconsistente com o padrão já implementado no Mercado Pago
3. Não elimina a classe de bug (mismatch de redirect_uri)

---

## Plano de Execução

### Fase 1: Criar Módulo SSOT para Stripe OAuth

**Criar arquivo:** `supabase/functions/_shared/stripe-oauth-config.ts`

```typescript
/**
 * Stripe OAuth Configuration - SSOT
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * Single Source of Truth para configuração OAuth do Stripe.
 */

/**
 * Client ID do Stripe Connect (público, seguro hardcodar)
 */
export const STRIPE_CLIENT_ID = Deno.env.get('STRIPE_CLIENT_ID') || '';

/**
 * Redirect URI - SSOT hardcoded para eliminar mismatch
 * Usar API Gateway domain para consistência com arquitetura multi-subdomain
 */
export const STRIPE_REDIRECT_URI = 
  'https://api.risecheckout.com/functions/v1/stripe-connect-oauth?action=callback';

/**
 * Constrói a URL de autorização do Stripe Connect
 */
export function buildStripeAuthorizationUrl(params: { state: string }): string {
  const url = new URL('https://connect.stripe.com/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', STRIPE_CLIENT_ID);
  url.searchParams.set('scope', 'read_write');
  url.searchParams.set('redirect_uri', STRIPE_REDIRECT_URI);
  url.searchParams.set('state', params.state);
  url.searchParams.set('stripe_user[country]', 'BR');
  return url.toString();
}

/**
 * Retorna informações de debug (sem expor secrets)
 */
export function getStripeDebugInfo(): {
  client_id: string;
  redirect_uri: string;
  client_secret_configured: boolean;
} {
  return {
    client_id: STRIPE_CLIENT_ID,
    redirect_uri: STRIPE_REDIRECT_URI,
    client_secret_configured: !!Deno.env.get('STRIPE_SECRET_KEY'),
  };
}
```

### Fase 2: Atualizar oauth-start.ts

**Arquivo:** `supabase/functions/stripe-connect-oauth/handlers/oauth-start.ts`

**Mudanças:**
1. Importar configuração do módulo SSOT
2. Usar `buildStripeAuthorizationUrl()` em vez de montar manualmente
3. Remover dependência do secret `STRIPE_REDIRECT_URL`

```typescript
// ANTES
const redirectUri = Deno.env.get("STRIPE_REDIRECT_URL");

// DEPOIS
import { STRIPE_CLIENT_ID, buildStripeAuthorizationUrl } from "../../_shared/stripe-oauth-config.ts";

// E usar:
const authUrl = buildStripeAuthorizationUrl({ state });
```

### Fase 3: Atualizar Platform Secrets Manifest

**Arquivo:** `supabase/functions/_shared/platform-secrets.ts`

**Adicionar:**
```typescript
// STRIPE
STRIPE_CLIENT_ID: {
  name: 'STRIPE_CLIENT_ID',
  description: 'Client ID do Stripe Connect para OAuth',
  required: true,
  gateway: 'stripe',
},
STRIPE_WEBHOOK_SECRET: {
  name: 'STRIPE_WEBHOOK_SECRET',
  description: 'Secret para validação de webhooks do Stripe',
  required: true,
  gateway: 'stripe',
},
```

### Fase 4: Atualizar Documentação

**Arquivos a atualizar:**
1. `docs/EDGE_FUNCTIONS_REGISTRY.md` - Alterar Base URL para `api.risecheckout.com`
2. `docs/PUSHINPAY_WEBHOOK_CONFIG_GUIDE.md` - Manter URL do Supabase (correto para webhooks)
3. `docs/auditoria_producao_risecheckout.md` - Clarificar que webhooks usam Supabase direto

### Fase 5: Verificação Webhook URLs (Confirmação)

**NENHUMA MUDANÇA NECESSÁRIA** nas URLs de webhook porque:

1. Gateways de pagamento (MP, PushinPay, Asaas, Stripe) chamam DIRETAMENTE o Supabase
2. Não passam pelo Cloudflare Worker
3. `SUPABASE_URL` é automaticamente injetado pelo Supabase

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  WEBHOOK FLOW (CORRETO)                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Mercado Pago API                                                         │
│       │                                                                   │
│       ▼                                                                   │
│  POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/mp-webhook   │
│       │                                                                   │
│       ▼                                                                   │
│  Edge Function processa (sem CORS, sem cookies)                          │
│                                                                           │
│  ✅ Isso é CORRETO - não precisa de api.risecheckout.com                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Resumo de Arquivos Impactados

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `supabase/functions/_shared/stripe-oauth-config.ts` | CRIAR | Módulo SSOT para Stripe OAuth |
| `supabase/functions/stripe-connect-oauth/handlers/oauth-start.ts` | MODIFICAR | Usar SSOT em vez de secret |
| `supabase/functions/_shared/platform-secrets.ts` | MODIFICAR | Adicionar STRIPE_CLIENT_ID e STRIPE_WEBHOOK_SECRET |
| `docs/EDGE_FUNCTIONS_REGISTRY.md` | MODIFICAR | Atualizar Base URL na documentação |

---

## Ação Manual Requerida

| Secret | Ação | Valor Esperado |
|--------|------|----------------|
| `STRIPE_REDIRECT_URL` | VERIFICAR/ATUALIZAR | Pode ser removido após implementação (será hardcoded) |
| `STRIPE_CLIENT_ID` | VERIFICAR | Deve existir e estar correto |

**NOTA:** Após implementação da Solução B, o secret `STRIPE_REDIRECT_URL` se torna **obsoleto** pois a URL será hardcoded no código (igual ao Mercado Pago).

---

## Checklist de Validação

Após implementar:

1. [ ] Módulo `stripe-oauth-config.ts` criado
2. [ ] `oauth-start.ts` atualizado para usar SSOT
3. [ ] `platform-secrets.ts` atualizado com secrets do Stripe
4. [ ] Documentação atualizada
5. [ ] Testar fluxo OAuth do Stripe end-to-end
6. [ ] Verificar logs para confirmar que `redirect_uri` mostra URL correta

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | ✅ Resolve mismatch de redirect_uri estruturalmente |
| Single Source of Truth | ✅ Módulo único para configuração OAuth |
| Zero Dívida Técnica | ✅ Remove dependência de secret para URL |
| Arquitetura Correta | ✅ Consistente com padrão do Mercado Pago |
| Segurança | ✅ URLs não são secrets, seguro hardcodar |
| < 300 linhas | ✅ Módulo SSOT terá ~50 linhas |
