/**
 * CORS Configuration Helper
 * 
 * Centraliza a configuração de CORS para todas as Edge Functions.
 * Substitui o uso de '*' por uma lista de domínios permitidos.
 * 
 * @version 1.0.0
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
 * Retorna os headers CORS apropriados baseado na origem da requisição
 * 
 * @param origin - Header Origin da requisição
 * @returns Headers CORS configurados
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Headers CORS para funções que precisam aceitar qualquer origem
 * (ex: webhooks públicos de gateways de pagamento)
 * 
 * USE COM CAUTELA - apenas para endpoints públicos
 */
export const PUBLIC_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
