# Edge Functions Style Guide

> **RISE ARCHITECT PROTOCOL V3 - Guia de Estilo para Edge Functions**  
> Última atualização: 2026-01-19  
> Mantenedor: Lead Architect

---

## Princípios Fundamentais

1. **Zero Duplicação**: Usar shared modules sempre
2. **Zero Technical Debt**: Código limpo, tipado, documentado
3. **Single Responsibility**: Cada função faz UMA coisa
4. **< 300 Linhas**: Arquivos grandes devem ser refatorados

---

## Shared Modules Obrigatórios

### 1. Autenticação: `unified-auth.ts`

**SEMPRE** usar para funções do dashboard (producer):

```typescript
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// Dentro do handler:
let producerId: string;
try {
  const producer = await requireAuthenticatedProducer(supabase, req);
  producerId = producer.id;
} catch {
  return unauthorizedResponse(corsHeaders);
}
```

**❌ PROIBIDO:**
```typescript
// NÃO USAR - código duplicado
const sessionToken = req.headers.get("x-producer-session-token");
const { data: session } = await supabase
  .from("producer_sessions")
  .select("...")
  .eq("session_token", sessionToken);
```

### 2. CORS: `cors-v2.ts`

> **ATUALIZADO 2026-01-20:** Migrado de `cors.ts` para `cors-v2.ts`

**Para funções de dashboard (origins específicas):**
```typescript
import { handleCorsV2 } from "../_shared/cors-v2.ts";

const corsResult = handleCorsV2(req);
if (corsResult instanceof Response) return corsResult;
const corsHeaders = corsResult.headers;
```

**Para funções públicas (webhooks, checkout):**
```typescript
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";

// Use PUBLIC_CORS_HEADERS diretamente
return new Response(JSON.stringify(data), {
  headers: { ...PUBLIC_CORS_HEADERS, "Content-Type": "application/json" }
});
```

**❌ PROIBIDO:**
```typescript
// NÃO USAR - CORS hardcoded
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // ...
};
```

### 3. Rate Limiting: `rate-limiting/index.ts` (Centralizado)

> **ATUALIZADO 2026-01-20:** Sistema consolidado com 28 configs específicas por ação.

```typescript
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";

// Aplicar rate limiting (usar config específica)
const rateLimitResult = await rateLimitMiddleware(
  supabase,
  req,
  RATE_LIMIT_CONFIGS.MERCADOPAGO_CREATE_PAYMENT,  // Config específica
  corsHeaders
);
if (rateLimitResult) {
  return rateLimitResult;  // Já retorna Response formatada
}
```

**Configs Disponíveis (RATE_LIMIT_CONFIGS):**
| Config | maxAttempts/min | Uso |
|--------|-----------------|-----|
| BUYER_AUTH_LOGIN | 10 | Login de compradores |
| PRODUCER_AUTH_LOGIN | 15 | Login de produtores |
| PRODUCER_AUTH_RESET | 5 | Reset de senha |
| CREATE_ORDER | 60 | Criação de pedidos |
| CREATE_PIX | 60 | Pagamento PIX |
| STRIPE_CREATE_PAYMENT | 60 | Pagamento Stripe |
| MERCADOPAGO_CREATE_PAYMENT | 60 | Pagamento MercadoPago |
| ASAAS_CREATE_PAYMENT | 60 | Pagamento Asaas |
| WEBHOOK | 300 | Webhooks de gateways |
| GDPR_REQUEST | 5 | Solicitações LGPD |
| GDPR_FORGET | 5 | Anonimização LGPD |
| DEFAULT | 60 | Ações não especificadas |

**❌ PROIBIDO - Configs Hardcoded:**
```typescript
// NUNCA faça isso - viola RISE V3 SSOT
const RATE_LIMIT = { action: "x", maxAttempts: 10, ... };
```

### 4. Sentry: `sentry.ts`

```typescript
import { withSentry, captureException } from "../_shared/sentry.ts";

// Wrapper automático
serve(withSentry("function-name", async (req) => {
  // handler
}));

// Captura manual
await captureException(error, { functionName: "function-name", extra: { ... } });
```

### 5. Logging Centralizado: `logger.ts`

**Status:** ✅ 100% COMPLIANT (migração concluída em 2026-01-19)

**OBRIGATÓRIO** em toda Edge Function:

```typescript
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("nome-da-funcao");

// Uso correto:
log.debug("Dados detalhados", { data });  // Apenas em dev (LOG_LEVEL=debug)
log.info("Operação iniciada", { orderId });
log.warn("Situação inesperada", { details });
log.error("Erro crítico", error);
```

**❌ PROIBIDO:**
```typescript
// NÃO USAR - logging não centralizado
console.log("[function] mensagem");
console.error("[function] erro");
console.warn("[function] aviso");

// NÃO USAR - helpers locais
const logStep = (msg: string) => console.log(msg);
```

#### Exceções Permitidas

Os seguintes arquivos são **EXPLICITAMENTE PERMITIDOS** a usar `console.*`:

| Arquivo | Motivo | Tipo |
|---------|--------|------|
| `_shared/logger.ts` | Fonte da verdade do sistema de logging | Infraestrutura |
| `_shared/platform-secrets.ts` | JSDoc (documentação de código) | Documentação |
| `_shared/payment-gateways/PaymentFactory.ts` | JSDoc (documentação de código) | Documentação |
| `mercadopago-oauth-callback/templates/html-responses.ts` | JavaScript client-side (navegador) | Frontend embed |

**Validação:** O script `lint-console.sh` exclui automaticamente estes arquivos da verificação.

**Níveis de Log:**
| Nível | Uso | Visível em Produção |
|-------|-----|---------------------|
| debug | Debug de desenvolvimento | Não (default) |
| info | Operações normais | Sim (LOG_LEVEL=info) |
| warn | Situações inesperadas | Sim |
| error | Erros críticos | Sempre |

### 6. Response Helpers: `edge-helpers.ts`

```typescript
import { jsonResponse, errorResponse } from "../_shared/edge-helpers.ts";

return jsonResponse({ success: true, data }, corsHeaders);
return errorResponse("Mensagem de erro", corsHeaders, 400);
```

---

## Templates de Funções

### Template: Função de Dashboard (Producer)

```typescript
/**
 * [nome-da-funcao] Edge Function
 * 
 * [Descrição breve]
 * 
 * @version 1.0.0
 * @auth producer_sessions
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { jsonResponse, errorResponse } from "../_shared/edge-helpers.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("nome-da-funcao");

serve(withSentry("nome-da-funcao", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Parse body
    const body = await req.json();
    const { action } = body;

    log.info("Action recebida", { action, producerId });

    // Router
    switch (action) {
      case "list":
        return handleList(supabase, producerId, corsHeaders);
      case "create":
        return handleCreate(supabase, producerId, body, corsHeaders);
      default:
        return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro inesperado", { error: errorMessage });
    await captureException(error instanceof Error ? error : new Error(errorMessage), { functionName: "nome-da-funcao" });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
```

### Template: Função Pública (Checkout, Webhook)

```typescript
/**
 * [nome-da-funcao] Edge Function
 * 
 * [Descrição breve]
 * 
 * @version 1.0.0
 * @auth public
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("nome-da-funcao");

serve(withSentry("nome-da-funcao", async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: PUBLIC_CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting (RISE V3 - Config centralizada específica)
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.DEFAULT,  // Usar config específica para a ação
      PUBLIC_CORS_HEADERS
    );
    if (rateLimitResult) {
      return rateLimitResult;  // Já retorna Response formatada com 429
    }

    // Logic
    const body = await req.json();
    // ...

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...PUBLIC_CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro", { error: errorMessage });
    await captureException(error instanceof Error ? error : new Error(errorMessage), { functionName: "nome-da-funcao" });
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...PUBLIC_CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
}));
```

---

## Anti-Patterns (PROIBIDO)

### 1. ❌ Autenticação Local

```typescript
// PROIBIDO - Duplicação de código
const { data: session } = await supabase
  .from("producer_sessions")
  .select("producer_id, expires_at")
  .eq("session_token", token);
```

### 2. ❌ CORS Hardcoded

```typescript
// PROIBIDO - CORS inconsistente
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};
```

### 3. ❌ Verificação de Sessão Inline

```typescript
// PROIBIDO - Lógica espalhada
if (!session.is_valid) return errorResponse("Não autorizado");
if (new Date(session.expires_at) < new Date()) return errorResponse("Expirado");
```

### 4. ❌ Arquivos > 300 Linhas

```typescript
// PROIBIDO - Arquivo monolítico
// Se seu arquivo tem mais de 300 linhas, extraia handlers para _shared/
```

### 5. ❌ Logging Direto

```typescript
// PROIBIDO - Usar console.log/error/warn diretamente
console.log("[function] mensagem");
console.error("[function] erro");

// Use createLogger() em vez disso
```

---

## Checklist de Code Review

Antes de fazer merge:

- [ ] Usa `unified-auth.ts` para autenticação (dashboard)
- [ ] Usa `handleCorsV2()` ou `PUBLIC_CORS_HEADERS` de `cors-v2.ts` para CORS
- [ ] Usa `withSentry()` para error tracking
- [ ] Usa `jsonResponse()` e `errorResponse()` para respostas
- [ ] Arquivo tem menos de 300 linhas
- [ ] **Logging via `createLogger()` - console.log PROIBIDO** ✅
- [ ] Tipagem completa (zero `any`)
- [ ] Atualizado no `EDGE_FUNCTIONS_REGISTRY.md`

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-20 | Rate limiting atualizado para usar `_shared/rate-limiting/index.ts` com configs centralizadas |
| 2026-01-19 | Migração de logging 100% completa - exceções documentadas, templates corrigidos |
| 2026-01-17 | Criação inicial do guia |
