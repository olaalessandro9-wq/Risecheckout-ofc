
# Plano Completo: Solução C - API Gateway BFF com Cloudflare Worker

## Diagnóstico Confirmado

### Problema Raiz

O frontend possui **3 fontes conflitantes de configuração**:

| Arquivo | URL | Anon Key |
|---------|-----|----------|
| `src/config/supabase.ts` | `api.risecheckout.com` | Hardcoded (exposta) |
| `src/integrations/supabase/client.ts` | `wivbtmtgpsxupfjwwovf.supabase.co` | Hardcoded (exposta) |
| `index.html` (meta CSP) | Permite `*.supabase.co` | Não permite `api.risecheckout.com` |

**Resultado:** Login e checkout públicos quebrados por CSP block.

### Violações RISE V3 Identificadas

| Violação | Gravidade | Arquivo |
|----------|-----------|---------|
| Anon key hardcoded no bundle | CRÍTICA | `src/config/supabase.ts` linha 14 |
| Anon key duplicada/divergente | CRÍTICA | `src/integrations/supabase/client.ts` linha 17 |
| CSP duplicado (meta + Cloudflare) | ALTA | `index.html` linha 14-28 |
| 2 URLs diferentes para Supabase | ALTA | config vs integrations |

## Arquitetura Alvo (Solução C)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARQUITETURA ATUAL (QUEBRADA)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Lovable)                                                         │
│   ┌─────────────────┐      ┌─────────────────┐                              │
│   │ api.call()      │──────│ Cloudflare      │                              │
│   │ + apikey header │      │ Worker          │                              │
│   └────────┬────────┘      │ (proxy básico)  │                              │
│            │               └────────┬────────┘                              │
│   CSP BLOQUEIA AQUI                 │                                        │
│   (api.risecheckout.com             ▼                                        │
│    não está no meta CSP)   ┌─────────────────┐                              │
│                            │ Supabase Edge   │                              │
│                            │ Functions       │                              │
│                            └─────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARQUITETURA ALVO (SOLUÇÃO C)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Lovable)                                                         │
│   ┌─────────────────┐                                                        │
│   │ api.call()      │  ← Sem apikey header (Worker injeta)                  │
│   │ Sem secrets     │  ← Nenhuma chave no bundle                            │
│   └────────┬────────┘                                                        │
│            │                                                                 │
│            │  POST https://api.risecheckout.com/functions/v1/{fn}           │
│            │  + credentials: include (cookies)                               │
│            │  + X-Correlation-Id                                             │
│            ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │                   CLOUDFLARE WORKER (BFF)                    │           │
│   │  api.risecheckout.com                                        │           │
│   ├─────────────────────────────────────────────────────────────┤           │
│   │  1. Valida Origin (allowlist)                                │           │
│   │  2. Injeta header "apikey" (via Secret)                      │           │
│   │  3. Forward cookies (credentials)                            │           │
│   │  4. Aplica Security Headers (CSP único no response)          │           │
│   │  5. Timeout + retry + correlation-id                         │           │
│   └────────┬────────────────────────────────────────────────────┘           │
│            │                                                                 │
│            │  POST https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/   │
│            │  + apikey: {SECRET do Worker}                                   │
│            │  + Cookie passthrough                                           │
│            ▼                                                                 │
│   ┌─────────────────┐                                                        │
│   │ Supabase Edge   │                                                        │
│   │ Functions       │                                                        │
│   └─────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Fases de Implementação

### FASE 0: Correção Imediata (5 minutos) - DESBLOQUEAR AGORA

**Objetivo:** Restaurar login e checkout HOJE enquanto implementamos a solução definitiva.

**Arquivo:** `index.html`

**Mudança:** Adicionar `https://api.risecheckout.com` na diretiva `connect-src` do meta CSP.

**Linha 20 atual:**
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mercadopago.com ...
```

**Linha 20 corrigida:**
```
connect-src 'self' https://api.risecheckout.com https://*.supabase.co wss://*.supabase.co https://*.mercadopago.com ...
```

**Validação:** Após deploy, DevTools Console não deve mais mostrar "Refused to connect".

### FASE 1: Cloudflare Worker BFF (1-2 dias)

**Objetivo:** Criar o Worker que será o gateway único para todas as Edge Functions.

**Worker Code (para criar no Cloudflare Dashboard):**

```javascript
/**
 * RiseCheckout API Gateway Worker
 * 
 * RISE Protocol V3 - BFF Pattern
 * 
 * Este Worker é o único ponto de entrada do frontend para Edge Functions.
 * Ele injeta o apikey via Secret e centraliza segurança/headers.
 */

// Secrets configurados no Cloudflare:
// - SUPABASE_ANON_KEY: A anon key do projeto
// - CORS_ALLOWED_ORIGINS: Lista de origens permitidas

const SUPABASE_PROJECT_REF = "wivbtmtgpsxupfjwwovf";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

// Origins permitidas (produção + preview)
const ALLOWED_ORIGINS = [
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://app.risecheckout.com",
  "https://pay.risecheckout.com",
  // Preview Lovable
  "https://id-preview--ed9257df-d9f6-4a5e-961f-eca053f14944.lovable.app",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Apenas rotas /functions/v1/*
    if (!url.pathname.startsWith("/functions/v1/")) {
      return new Response("Not Found", { status: 404 });
    }
    
    // Validar Origin
    const origin = request.headers.get("Origin");
    const isAllowedOrigin = origin && ALLOWED_ORIGINS.some(
      allowed => origin === allowed || origin.endsWith(".lovable.app")
    );
    
    // CORS Preflight
    if (request.method === "OPTIONS") {
      return handleCorsPrelight(origin, isAllowedOrigin);
    }
    
    // Apenas POST permitido
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    
    // Construir URL para Supabase
    const targetUrl = `${SUPABASE_URL}${url.pathname}`;
    
    // Construir headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("apikey", env.SUPABASE_ANON_KEY); // Injetado via Secret
    
    // Forward headers importantes
    const correlationId = request.headers.get("X-Correlation-Id");
    if (correlationId) {
      headers.set("X-Correlation-Id", correlationId);
    }
    
    // Forward cookies (para autenticação httpOnly)
    const cookie = request.headers.get("Cookie");
    if (cookie) {
      headers.set("Cookie", cookie);
    }
    
    // Forward Authorization se existir (legacy compatibility)
    const auth = request.headers.get("Authorization");
    if (auth) {
      headers.set("Authorization", auth);
    }
    
    try {
      // Forward request para Supabase
      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: request.body,
      });
      
      // Construir response com headers de segurança
      const responseHeaders = new Headers(response.headers);
      
      // CORS
      if (isAllowedOrigin) {
        responseHeaders.set("Access-Control-Allow-Origin", origin);
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
      }
      
      // Forward Set-Cookie (para refresh de tokens)
      // Cloudflare Workers preservam Set-Cookie automaticamente
      
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
      
    } catch (error) {
      console.error("Gateway error:", error);
      return new Response(
        JSON.stringify({ error: "Gateway Error", message: error.message }),
        { 
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};

function handleCorsPrelight(origin, isAllowed) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Correlation-Id, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  
  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  
  return new Response(null, { status: 204, headers });
}
```

**Configuração no Cloudflare Dashboard:**

1. Workers & Pages > Create Worker
2. Nome: `risecheckout-api-gateway`
3. Colar o código acima
4. Settings > Variables > Add:
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Encrypt)
5. Triggers > Custom Domains > Add `api.risecheckout.com`

### FASE 2: Refatorar Frontend (3-5 dias)

**Objetivo:** Remover todas as chaves do frontend e unificar configuração.

#### 2.1 Unificar `src/config/supabase.ts`

**De:**
```typescript
export const SUPABASE_URL = "https://api.risecheckout.com";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Para:**
```typescript
/**
 * Supabase Configuration
 * 
 * RISE Protocol V3 - Zero Secrets in Frontend
 * 
 * O frontend NÃO possui acesso a nenhuma chave.
 * O Cloudflare Worker (api.risecheckout.com) injeta o apikey automaticamente.
 */

export const API_GATEWAY_URL = "https://api.risecheckout.com";

// Removido: SUPABASE_ANON_KEY - Worker injeta via Secret
```

#### 2.2 Refatorar `src/lib/api/client.ts`

**Mudanças:**
- Remover import de `SUPABASE_ANON_KEY`
- Remover header `apikey` (Worker injeta)
- Manter `credentials: 'include'` (cookies)

#### 2.3 Refatorar `src/lib/api/public-client.ts`

**Mudanças iguais ao client.ts.**

#### 2.4 Refatorar `src/lib/session-commander/coordinator.ts`

**Mudanças:**
- Remover import de `SUPABASE_ANON_KEY`
- Remover header `apikey`

#### 2.5 Deprecar `src/integrations/supabase/client.ts`

Este arquivo **não deve mais existir** na Solução C. O frontend não deve ter um Supabase client direto.

**Opções:**
1. Deletar completamente (se nenhum código usa)
2. Substituir por stub que lança erro explicativo

Vou verificar quem importa este arquivo antes de decidir.

### FASE 3: Eliminar CSP Duplicado (1 dia)

**Objetivo:** Ter uma única fonte de CSP (Worker ou HTML, não ambos).

**Decisão Arquitetural:** Manter CSP no `index.html` (Lovable controla) e remover qualquer CSP injetado pelo Cloudflare.

**Ação no Cloudflare:**
1. Rules > Transform Rules > Response Headers
2. Remover qualquer regra que adicione `Content-Security-Policy`

**Ação no Frontend:**
1. Atualizar `index.html` com CSP definitivo:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://sdk.mercadopago.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.risecheckout.com https://*.sentry.io https://*.ingest.us.sentry.io https://www.google-analytics.com https://api.utmify.com.br https://graph.facebook.com;
  frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://*.mercadopago.com https://www.youtube.com https://player.vimeo.com;
  media-src 'self' https: blob:;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
">
```

**Nota:** Removido `*.supabase.co` do `connect-src` porque o frontend só fala com `api.risecheckout.com`.

### FASE 4: Higiene e Documentação (1 dia)

#### 4.1 Auditoria de Segurança

Buscar e remover:
- Todas as ocorrências de anon key hardcoded
- Todas as URLs diretas para `*.supabase.co` no frontend
- Arquivos `.env` com secrets

#### 4.2 Atualizar Documentação

**Criar:** `docs/API_GATEWAY_ARCHITECTURE.md`

Conteúdo:
- Diagrama de arquitetura
- Como o Worker funciona
- Como atualizar allowlist de origins
- Como rotacionar o apikey no Worker

**Atualizar:** `docs/SECURITY_OVERVIEW.md`

Adicionar seção sobre o Gateway BFF.

#### 4.3 Deletar Arquivos Obsoletos

- `vercel.json` (se não for mais usado)
- Qualquer config duplicada

## Checklist de Validação Final

| Teste | Esperado |
|-------|----------|
| Login em risecheckout.com/auth | Funciona sem erro CSP |
| Checkout público /c/{slug} | Carrega produto e pagamento |
| DevTools Console | Zero erros de CSP |
| DevTools Network | Requests vão para api.risecheckout.com |
| Bundle JS (view-source) | Zero ocorrências de "eyJhbGciOiJIUzI1NiIs" |
| Response Headers | CSP vem apenas do HTML (ou Worker) |

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Worker mal configurado | Média | Testar exaustivamente em staging |
| CSP ainda conflitante | Baixa | Validar headers com DevTools |
| Supabase client legado sendo usado | Alta | Auditoria completa de imports |

## Cronograma

| Fase | Duração | Dependência |
|------|---------|-------------|
| Fase 0 (Fix imediato) | 5 min | Nenhuma |
| Fase 1 (Worker) | 1-2 dias | Acesso ao Cloudflare Dashboard |
| Fase 2 (Refatorar Frontend) | 3-5 dias | Worker funcionando |
| Fase 3 (CSP único) | 1 dia | Frontend refatorado |
| Fase 4 (Documentação) | 1 dia | Tudo funcionando |

**Total:** 6-9 dias para implementação completa.

## Próximos Passos Imediatos

1. **AGORA:** Aprovar este plano
2. **Fase 0:** Eu edito o `index.html` para desbloquear o site
3. **Você:** Cria o Worker no Cloudflare com o código fornecido
4. **Eu:** Refatoro o frontend para remover todas as chaves
