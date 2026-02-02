// rise-api-proxy Worker - RISE ARCHITECT PROTOCOL V3 - 10.0/10
// API Gateway - Zero Secrets in Frontend Architecture
// FIX: Preserva múltiplos Set-Cookie headers corretamente
// UPDATED: 2026-02-02 - SECURITY HARDENED - Only risecheckout.com allowed

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";

// Domínio principal (wildcard match para todos subdomínios)
const MAIN_DOMAIN = "risecheckout.com";

function isAllowedOrigin(origin) {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Permitir risecheckout.com e *.risecheckout.com
    if (hostname === MAIN_DOMAIN) return true;
    if (hostname.endsWith("." + MAIN_DOMAIN)) return true;
  } catch (e) {
    return false;
  }

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
