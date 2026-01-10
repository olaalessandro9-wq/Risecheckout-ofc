/**
 * CORS Configuration Helper
 * 
 * Centraliza a configuração de CORS para todas as Edge Functions.
 * 
 * SECURITY FIX (VULN-008): Retorna null para origens inválidas
 * em vez de fallback inseguro para o primeiro domínio.
 * 
 * @version 2.0.0 - Security hardened
 */

/**
 * Lista de origens permitidas para CORS
 * Adicione novos domínios conforme necessário
 */
export const ALLOWED_ORIGINS = [
  // Produção
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  
  // Staging/Preview (Lovable)
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app",
  
  // Desenvolvimento local
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

/**
 * Retorna os headers CORS se origem for válida, ou null se inválida
 * 
 * SECURITY: Não faz fallback para origens inválidas
 * 
 * @param origin - Header Origin da requisição
 * @returns Headers CORS configurados ou null se origem inválida
 */
export function getCorsHeaders(origin: string | null): Record<string, string> | null {
  // Se não há origin (ex: requisições server-to-server), permite
  if (!origin) {
    return {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-buyer-session, x-producer-session-token",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Max-Age": "86400",
    };
  }

  // Verifica se origem está na lista permitida
  if (!ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`[CORS] ⚠️ Origem bloqueada: ${origin}`);
    return null; // SECURITY: Retorna null para origens não permitidas
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-buyer-session, x-producer-session-token",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Cria uma Response 403 para requisições de origens não autorizadas
 */
export function createCorsErrorResponse(): Response {
  return new Response(
    JSON.stringify({ 
      error: "Forbidden", 
      message: "Origin not allowed" 
    }),
    { 
      status: 403, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}

/**
 * Helper para tratar CORS em Edge Functions
 * Retorna Response se origem inválida ou se for preflight
 * Retorna null se deve continuar processando
 */
export function handleCors(req: Request): { headers: Record<string, string> } | Response {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Origem inválida - retorna 403
  if (!corsHeaders) {
    return createCorsErrorResponse();
  }

  // Preflight request - retorna OK com headers CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Origem válida - retorna headers para uso
  return { headers: corsHeaders };
}

/**
 * Headers CORS para funções que precisam aceitar qualquer origem
 * (ex: webhooks públicos de gateways de pagamento)
 * 
 * USE COM CAUTELA - apenas para endpoints que recebem callbacks externos
 */
export const PUBLIC_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-producer-session-token, x-buyer-session",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
