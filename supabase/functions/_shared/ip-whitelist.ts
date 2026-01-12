/**
 * ============================================================================
 * IP WHITELIST HELPER
 * ============================================================================
 * 
 * Validação de IPs de origem para webhooks de gateways de pagamento.
 * Camada adicional de segurança para gateways que não suportam HMAC.
 * 
 * Fonte: Documentação oficial dos gateways
 * ============================================================================
 */

/**
 * IPs oficiais do Asaas (fonte: docs.asaas.com)
 * Última atualização: Janeiro 2026
 */
export const ASAAS_OFFICIAL_IPS = [
  "52.67.12.206",
  "18.230.8.159",
  "54.94.136.112",
  "54.94.183.101"
];

/**
 * Extrai o IP real do cliente de uma requisição HTTP.
 * Considera headers de proxies reversos (Cloudflare, Load Balancers).
 */
export function getClientIP(req: Request): string | null {
  // CF-Connecting-IP: IP real quando atrás do Cloudflare
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // X-Forwarded-For: IP real quando atrás de proxy/load balancer
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Pega o primeiro IP da lista (IP original do cliente)
    return xForwardedFor.split(',')[0].trim();
  }

  // X-Real-IP: Alternativa comum
  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) return xRealIP;

  return null;
}

/**
 * Verifica se um IP está na whitelist do Asaas.
 */
export function isAsaasIP(ip: string | null): boolean {
  if (!ip) return false;
  return ASAAS_OFFICIAL_IPS.includes(ip);
}

/**
 * Resultado da validação de IP
 */
export interface IPValidationResult {
  isValid: boolean;
  clientIP: string | null;
  reason?: string;
}

/**
 * Valida se uma requisição veio de um IP autorizado do Asaas.
 * 
 * @param req - Requisição HTTP
 * @param enforceWhitelist - Se true, bloqueia IPs não autorizados. Se false, apenas loga warning.
 * @returns Resultado da validação
 */
export function validateAsaasIP(req: Request, enforceWhitelist: boolean): IPValidationResult {
  const clientIP = getClientIP(req);
  
  if (!clientIP) {
    return {
      isValid: !enforceWhitelist, // Em modo não-enforced, permite sem IP
      clientIP: null,
      reason: 'Could not determine client IP from request headers'
    };
  }

  const isValid = isAsaasIP(clientIP);
  
  if (!isValid) {
    return {
      isValid: !enforceWhitelist, // Em modo não-enforced, permite mas loga
      clientIP,
      reason: `IP ${clientIP} is not in Asaas whitelist`
    };
  }

  return {
    isValid: true,
    clientIP,
    reason: undefined
  };
}
