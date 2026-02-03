
# Plano: Otimização de Performance do Checkout Público (Zero Latency Architecture)

## Contexto do Problema

O usuário reportou que o checkout carrega lentamente comparado a concorrentes (Hotmart, Kiwify, Cakto). A tela "Processando seu Link de pagamento..." demora visivelmente antes de mostrar o checkout.

## Diagnóstico Técnico

### Fluxo Atual (Sequencial - ~1.5-2.5s)

```text
USUÁRIO CLICA NO LINK /c/:slug
        │
        ▼
┌──────────────────────────────┐
│ 1. Lazy Load PaymentLinkRedirect │ ~100-200ms (chunk JS)
└──────────────────────────────┘
        │ "Processando seu link de pagamento..."
        ▼
┌──────────────────────────────┐
│ 2. Edge Function: payment-link-data │ ~300ms (cold) / ~150ms (warm)
└──────────────────────────────┘
        │ Recebe checkout_slug
        ▼
┌──────────────────────────────┐
│ 3. navigate(/pay/:slug)      │ React Router
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ 4. Lazy Load PublicCheckoutV2 │ ~100-200ms (chunk JS)
└──────────────────────────────┘
        │ "Carregando checkout..."
        ▼
┌──────────────────────────────┐
│ 5. XState: idle → loading    │ Estado inicial
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ 6. Edge Function: resolve-and-load │ ~300-400ms (cold) / ~150ms (warm)
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ 7. XState: loading → ready   │ Render do checkout
└──────────────────────────────┘

TEMPO TOTAL: ~1.5s (warm) a ~2.5s (cold)
```

### Gargalos Identificados

| Gargalo | Impacto | Causa Raiz |
|---------|---------|------------|
| 2x Lazy Load chunks JS | +200-400ms | Sequencial, não prefetched |
| 2x Edge Function calls | +300-600ms | Sequencial, não paralelo |
| XState init + transitions | +50-100ms | Overhead natural |
| Cold start Edge Functions | +30-75ms por função | Supabase Deno runtime |

### Como Concorrentes Resolvem

Hotmart/Kiwify/Cakto usam uma das seguintes técnicas:
1. **Server-Side Rendering (SSR)**: HTML já vem pronto do servidor
2. **Preload/Prefetch**: Chunks JS carregados antes do clique
3. **Single Request**: Uma única chamada resolve slug E carrega dados

---

## Analise de Solucoes (RISE Protocol V3 Secao 4.4)

### Solucao A: Prefetch do Chunk no PaymentLinkRedirect

Fazer prefetch do chunk PublicCheckoutV2 enquanto a primeira Edge Function responde.

- Manutenibilidade: 8/10 (adiciona logica de prefetch)
- Zero DT: 8/10 (melhoria parcial)
- Arquitetura: 7/10 (otimizacao pontual, nao resolve raiz)
- Escalabilidade: 8/10
- Seguranca: 10/10
- **NOTA FINAL: 8.0/10**
- Tempo estimado: 30 minutos

### Solucao B: Unificar Edge Function (payment-link + resolve-and-load)

Criar action unificada que resolve payment link slug E carrega todos os dados em 1 chamada.

- Manutenibilidade: 9/10 (menos codigo, fluxo mais simples)
- Zero DT: 9/10 (elimina 1 HTTP call)
- Arquitetura: 8/10 (unifica handlers)
- Escalabilidade: 9/10
- Seguranca: 10/10
- **NOTA FINAL: 8.8/10**
- Tempo estimado: 2 horas

### Solucao C: Zero Latency Architecture (Prefetch + BFF Unificado + Skeleton Instantaneo)

Arquitetura completa que:
1. **Prefetch chunk JS** durante payment-link-data
2. **BFF Super-Unificado** que aceita payment_link_slug OU checkout_slug
3. **Skeleton instantaneo** com dados parciais
4. **Elimina redirect** - Renderiza direto

- Manutenibilidade: 10/10 (arquitetura limpa, fluxo unico)
- Zero DT: 10/10 (1 HTTP call, 1 chunk load)
- Arquitetura: 10/10 (design pattern ideal)
- Escalabilidade: 10/10 (suporta crescimento)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 4-6 horas

### DECISAO: Solucao C (Nota 10.0)

Conforme Lei Suprema Secao 4.6: A melhor solucao VENCE. SEMPRE.
Tempo nao e criterio. Complexidade nao e criterio.

---

## Plano de Implementacao: Zero Latency Architecture

### Fase 1: BFF Super-Unificado (resolve-payment-link-and-load)

Nova action que aceita **qualquer tipo de slug** e retorna tudo em 1 chamada:

```typescript
// POST checkout-public-data
// action: "resolve-universal"
// slug: "abc123" (pode ser checkout_slug OU payment_link_slug)

// Logica:
// 1. Tenta resolver como checkout slug
// 2. Se nao encontrar, tenta como payment_link slug
// 3. Retorna todos os dados (checkout, product, offer, bumps, pixels, etc)
```

**Arquivo a criar:**
```text
supabase/functions/checkout-public-data/handlers/resolve-universal-handler.ts
```

### Fase 2: Rota Unificada no Frontend

Alterar `/c/:slug` para nao redirecionar, mas carregar o checkout diretamente:

```text
ANTES:
/c/:slug → PaymentLinkRedirect → navigate(/pay/:slug) → PublicCheckoutV2

DEPOIS:
/c/:slug → PublicCheckoutUnified (resolve qualquer slug)
/pay/:slug → PublicCheckoutUnified (resolve qualquer slug)
```

**Arquivos a modificar:**
```text
src/routes/publicRoutes.tsx              # Ambas rotas usam mesmo componente
src/pages/PaymentLinkRedirect.tsx        # DELETAR ou manter para backwards compat
src/modules/checkout-public/hooks/useCheckoutPublicMachine.ts  # Aceita qualquer slug
```

### Fase 3: Prefetch de Chunk JS

Adicionar prefetch do chunk checkout quando o usuario hover/focus em links de pagamento:

```typescript
// Em qualquer lugar que exibe link de pagamento
const prefetchCheckout = () => {
  import("@/pages/PublicCheckoutV2");
};

// Prefetch tambem na landing page para links externos
useEffect(() => {
  // Prefetch quando idle
  requestIdleCallback(() => {
    import("@/pages/PublicCheckoutV2");
  });
}, []);
```

### Fase 4: Skeleton Progressivo

Mostrar skeleton do checkout IMEDIATAMENTE enquanto dados carregam:

```typescript
// CheckoutPublicLoader.tsx
if (isIdle || isLoading) {
  return <CheckoutSkeleton />; // Skeleton visual, nao spinner
}
```

---

## Arvore de Arquivos

```text
# CRIAR
supabase/functions/checkout-public-data/handlers/resolve-universal-handler.ts

# MODIFICAR
supabase/functions/checkout-public-data/index.ts           # Adicionar action
supabase/functions/checkout-public-data/types.ts           # Adicionar tipo
src/routes/publicRoutes.tsx                                 # Unificar rotas
src/modules/checkout-public/hooks/useCheckoutPublicMachine.ts  # Aceitar qualquer slug
src/modules/checkout-public/machines/checkoutPublicMachine.actors.ts  # Chamar resolve-universal
src/modules/checkout-public/components/CheckoutPublicLoader.tsx  # Skeleton progressivo

# CRIAR (Skeleton)
src/modules/checkout-public/components/CheckoutSkeleton.tsx

# DEPRECAR (manter para SEO/backwards)
src/pages/PaymentLinkRedirect.tsx  # Adicionar @deprecated + redirect imediato
```

---

## Fluxo Apos Implementacao

```text
USUARIO CLICA NO LINK /c/:slug OU /pay/:slug
        │
        ▼
┌──────────────────────────────┐
│ 1. Lazy Load PublicCheckoutUnified │ ~100ms (ou 0ms se prefetched)
└──────────────────────────────┘
        │ Skeleton instantaneo
        ▼
┌──────────────────────────────┐
│ 2. Edge Function: resolve-universal │ ~300ms (inclui TUDO)
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ 3. Render checkout completo  │
└──────────────────────────────┘

TEMPO TOTAL: ~400ms (warm) a ~600ms (cold)
REDUCAO: 60-70% do tempo original
```

---

## Metricas de Sucesso

| Metrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| HTTP calls (load) | 2 | 1 | -50% |
| Chunk loads | 2 (sequencial) | 1 (prefetched) | -50% |
| Time to First Byte | ~300ms | ~150ms | -50% |
| Time to Interactive | ~2s | ~600ms | -70% |
| Perceived performance | "Lento" | "Instantaneo" | Competitivo |

---

## Secao Tecnica: resolve-universal-handler.ts

```typescript
/**
 * Resolve Universal Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Aceita QUALQUER tipo de slug (checkout ou payment_link) e retorna
 * todos os dados necessarios para renderizar o checkout.
 * 
 * Isso elimina a necessidade de 2 HTTP calls sequenciais.
 */

export async function handleResolveUniversal(ctx: HandlerContext): Promise<Response> {
  const { supabase, body, jsonResponse } = ctx;
  const { slug, affiliateCode } = body;

  if (!slug) {
    return jsonResponse({ error: "slug required" }, 400);
  }

  // 1. Tenta resolver como checkout slug primeiro (mais comum)
  const { data: checkout, error: checkoutError } = await supabase
    .from("checkouts")
    .select(CHECKOUT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  // 2. Se encontrou checkout, usa o fluxo normal
  if (checkout && !checkoutError) {
    return resolveWithCheckout(supabase, checkout, affiliateCode, jsonResponse);
  }

  // 3. Nao encontrou checkout - tenta como payment_link slug
  const { data: paymentLink } = await supabase
    .rpc("get_payment_link_with_checkout_slug", { p_slug: slug })
    .maybeSingle();

  if (!paymentLink) {
    return jsonResponse({ error: "Checkout nao encontrado" }, 404);
  }

  // 4. Valida payment link status
  if (paymentLink.status === "inactive") {
    return jsonResponse({ 
      error: "Produto nao disponivel", 
      reason: "INACTIVE" 
    }, 404);
  }

  // 5. Busca o checkout real usando checkout_slug do payment link
  const { data: realCheckout } = await supabase
    .from("checkouts")
    .select(CHECKOUT_SELECT)
    .eq("slug", paymentLink.checkout_slug)
    .maybeSingle();

  if (!realCheckout) {
    return jsonResponse({ error: "Checkout nao configurado" }, 404);
  }

  return resolveWithCheckout(supabase, realCheckout, affiliateCode, jsonResponse);
}
```

---

## Validacao Pos-Implementacao

1. Acessar `/c/[payment-link-slug]` - Deve renderizar checkout em < 600ms
2. Acessar `/pay/[checkout-slug]` - Mesmo comportamento
3. Zero telas de "Processando link" ou "Carregando checkout"
4. Skeleton aparece instantaneamente
5. Performance igual ou superior a Hotmart/Kiwify

**RISE V3 Score Final: 10.0/10**
