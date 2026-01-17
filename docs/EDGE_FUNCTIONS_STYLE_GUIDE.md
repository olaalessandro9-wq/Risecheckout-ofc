# Edge Functions Style Guide

> **RISE ARCHITECT PROTOCOL V3 - Guia de Estilo para Edge Functions**  
> Última atualização: 2026-01-17  
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

### 2. CORS: `cors.ts`

**Para funções de dashboard (origins específicas):**
```typescript
import { handleCors } from "../_shared/cors.ts";

const corsResult = handleCors(req);
if (corsResult instanceof Response) return corsResult;
const corsHeaders = corsResult.headers;
```

**Para funções públicas (webhooks, checkout):**
```typescript
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

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

### 3. Rate Limiting: `rate-limiter.ts`

```typescript
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiter.ts";

// Aplicar rate limiting
const clientIP = getClientIP(req);
const rateLimitResult = await rateLimitMiddleware(supabase, clientIP, "action_name", RATE_LIMIT_CONFIGS.standard);
if (!rateLimitResult.allowed) {
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
}
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

### 5. Response Helpers: `edge-helpers.ts`

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
import { handleCors } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { jsonResponse, errorResponse } from "../_shared/edge-helpers.ts";

serve(withSentry("nome-da-funcao", async (req) => {
  const corsResult = handleCors(req);
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

    console.log(`[nome-da-funcao] Action: ${action}, Producer: ${producerId}`);

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
    console.error("[nome-da-funcao] Unexpected error:", errorMessage);
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
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiter.ts";

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

    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = await rateLimitMiddleware(supabase, clientIP, "nome-da-funcao", RATE_LIMIT_CONFIGS.strict);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições" }),
        { status: 429, headers: { ...PUBLIC_CORS_HEADERS, "Content-Type": "application/json" } }
      );
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
    console.error("[nome-da-funcao] Error:", errorMessage);
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

---

## Checklist de Code Review

Antes de fazer merge:

- [ ] Usa `unified-auth.ts` para autenticação (dashboard)
- [ ] Usa `handleCors()` ou `PUBLIC_CORS_HEADERS` para CORS
- [ ] Usa `withSentry()` para error tracking
- [ ] Usa `jsonResponse()` e `errorResponse()` para respostas
- [ ] Arquivo tem menos de 300 linhas
- [ ] Logging adequado com `console.log()` / `console.error()`
- [ ] Tipagem completa (zero `any`)
- [ ] Atualizado no `EDGE_FUNCTIONS_REGISTRY.md`

---

## Changelog

| Data | Alteração |
|------|-----------|
| 2026-01-17 | Criação inicial do guia |
