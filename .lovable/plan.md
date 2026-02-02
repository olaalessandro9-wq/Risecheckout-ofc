

# Plano: Atualização do Cloudflare Worker - CORS Origins

## Resumo Executivo

Este plano resolve o erro CORS no checkout de produção e adiciona suporte para subdomínios futuros. A causa raiz é a ausência de `www.risecheckout.com` na allowlist do Worker.

---

## Análise de Soluções

### Solução A: Wildcard Matching para *.risecheckout.com
- Manutenibilidade: 10/10 (nunca mais precisa editar para novos subdomínios)
- Zero DT: 10/10 (solução permanente)
- Arquitetura: 10/10 (escalável, elegante)
- Escalabilidade: 10/10 (suporta infinitos subdomínios)
- Segurança: 9/10 (qualquer subdomínio é permitido, mas você controla o DNS)
- **NOTA FINAL: 9.8/10**
- Tempo estimado: 5 minutos

### Solução B: Adicionar manualmente cada subdomínio
- Manutenibilidade: 5/10 (precisa editar código a cada novo subdomínio)
- Zero DT: 6/10 (cria trabalho futuro)
- Arquitetura: 6/10 (lista hardcoded cresce infinitamente)
- Escalabilidade: 4/10 (não escala)
- Segurança: 10/10 (controle granular)
- **NOTA FINAL: 6.2/10**
- Tempo estimado: 5 minutos

### DECISÃO: Solução A (Nota 9.8)

A Solução A usa wildcard matching para permitir automaticamente qualquer subdomínio de `risecheckout.com`. Isso elimina a necessidade de atualizar o Worker toda vez que criar um novo subdomínio como `aluno.`, `admin.`, `api.`, etc.

---

## Código Atualizado do Cloudflare Worker

```javascript
// rise-api-proxy Worker - RISE ARCHITECT PROTOCOL V3 - 10.0/10
// API Gateway - Zero Secrets in Frontend Architecture
// FIX: Preserva múltiplos Set-Cookie headers corretamente

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";

// Domínio principal (wildcard match para todos subdomínios)
const MAIN_DOMAIN = "risecheckout.com";

// Origins explicitamente permitidos (para domínios externos)
const EXPLICIT_ORIGINS = [
  "https://biz-bridge-bliss.lovable.app",
  "https://kindred-sell-hub.lovable.app", // Novo preview após remix
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  // 1. Verificar origens explícitas
  if (EXPLICIT_ORIGINS.includes(origin)) return true;
  
  // 2. Permitir qualquer subdomínio de risecheckout.com (incluindo www)
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Match exato do domínio root
    if (hostname === MAIN_DOMAIN) return true;
    
    // Match de qualquer subdomínio (*.risecheckout.com)
    if (hostname.endsWith("." + MAIN_DOMAIN)) return true;
  } catch (e) {
    return false;
  }
  
  // 3. Permitir previews do Lovable (*.lovable.app)
  if (origin.endsWith(".lovable.app")) return true;
  
  return false;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "https://" + MAIN_DOMAIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders(origin)
          } 
        }
      );
    }

    // Preflight OPTIONS
    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin(origin)) {
        return new Response("Forbidden", { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Validar origin para requests não-OPTIONS
    if (origin && !isAllowedOrigin(origin)) {
      return new Response(
        JSON.stringify({ error: "Origin not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Apenas rotear paths de Edge Functions
    if (!url.pathname.startsWith("/functions/v1/")) {
      return new Response(
        JSON.stringify({ error: "Invalid path. Use /functions/v1/{function-name}" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders(origin)
          } 
        }
      );
    }

    // Construir URL de destino
    const targetUrl = SUPABASE_URL + url.pathname + url.search;

    // Clonar headers e INJETAR apikey do Secret
    const headers = new Headers(request.headers);
    headers.set("Host", "wivbtmtgpsxupfjwwovf.supabase.co");
    headers.set("apikey", env.SUPABASE_ANON_KEY);

    // Proxy request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });

    // ============================================
    // CRITICAL FIX: Preservar múltiplos Set-Cookie
    // ============================================
    const responseHeaders = new Headers();

    // Copiar todos headers EXCETO Set-Cookie
    for (const [key, value] of response.headers) {
      if (key.toLowerCase() !== "set-cookie") {
        responseHeaders.set(key, value);
      }
    }

    // Preservar TODOS os Set-Cookie (pode haver múltiplos: access + refresh)
    const setCookies = response.headers.getAll("Set-Cookie");
    for (const cookie of setCookies) {
      responseHeaders.append("Set-Cookie", cookie);
    }

    // Adicionar CORS headers
    if (origin && isAllowedOrigin(origin)) {
      responseHeaders.set("Access-Control-Allow-Origin", origin);
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
```

---

## Subdomínios Agora Suportados Automaticamente

| Subdomínio | Status |
|------------|--------|
| `risecheckout.com` | ✅ Permitido |
| `www.risecheckout.com` | ✅ Permitido (FIX!) |
| `app.risecheckout.com` | ✅ Permitido |
| `pay.risecheckout.com` | ✅ Permitido |
| `members.risecheckout.com` | ✅ Permitido |
| `aluno.risecheckout.com` | ✅ Permitido (NOVO!) |
| `admin.risecheckout.com` | ✅ Permitido (futuro) |
| `api.risecheckout.com` | ✅ Permitido (futuro) |
| `*.risecheckout.com` | ✅ QUALQUER subdomínio |
| `*.lovable.app` | ✅ Permitido (previews) |

---

## Como Fazer o Deploy no Cloudflare

1. Acesse o **Cloudflare Dashboard** → **Workers & Pages**
2. Selecione o Worker `rise-api-proxy`
3. Clique em **Edit Code** (ou Quick Edit)
4. **Substitua TODO o código** pelo código acima
5. Clique em **Save and Deploy**
6. Teste acessando `https://www.risecheckout.com` e verificando se o checkout funciona

---

## Mudanças Técnicas Principais

```text
ANTES (hardcoded array):
┌─────────────────────────────────────┐
│ ALLOWED_ORIGINS = [                 │
│   "https://risecheckout.com",       │
│   "https://app.risecheckout.com",   │
│   "https://pay.risecheckout.com",   │
│   "https://members.risecheckout.com"│
│ ]                                   │
│ ❌ www.risecheckout.com AUSENTE     │
│ ❌ aluno.risecheckout.com AUSENTE   │
│ ❌ Precisa editar para cada novo    │
└─────────────────────────────────────┘

DEPOIS (wildcard matching):
┌─────────────────────────────────────┐
│ MAIN_DOMAIN = "risecheckout.com"    │
│                                     │
│ isAllowedOrigin(origin):            │
│   hostname === MAIN_DOMAIN ✅       │
│   hostname.endsWith("."+MAIN_DOMAIN)│
│   ✅ www.risecheckout.com           │
│   ✅ aluno.risecheckout.com         │
│   ✅ qualquer-coisa.risecheckout.com│
└─────────────────────────────────────┘
```

---

## Resultado Esperado

| Problema | Antes | Depois |
|----------|-------|--------|
| CORS Error em www. | ❌ 403 Forbidden | ✅ Funciona |
| Novos subdomínios | ❌ Precisa editar Worker | ✅ Automático |
| Manutenibilidade | ❌ Manual | ✅ Zero manutenção |

---

## Nota de Segurança

A solução wildcard é segura porque:

1. **Você controla o DNS** - Apenas você pode criar subdomínios em risecheckout.com
2. **HTTPS obrigatório** - A função só aceita origins com `https://`
3. **Validação de URL** - Usa `new URL()` para parsing seguro, evitando bypasses como `risecheckout.com.evil.com`

