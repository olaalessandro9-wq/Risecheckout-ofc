/**
 * Response Helpers - Unified
 * 
 * RISE Protocol V3: Single source of truth for all response helpers.
 * STANDARD SIGNATURE: (data, corsHeaders, status)
 * 
 * This file replaces all duplicate jsonResponse/errorResponse across:
 * - producer-auth-helpers.ts
 * - buyer-auth-password.ts
 * - edge-helpers.ts
 * - response.ts
 * - integration-handlers.ts
 * - checkout-crud-helpers.ts
 * - pixel-types.ts
 * - buyer-auth-producer-handlers.ts
 * 
 * @version 1.0.0
 */

// ============================================
// STANDARD RESPONSE HELPERS
// ============================================

/**
 * Creates a JSON response with CORS headers.
 * STANDARD SIGNATURE - all code should use this order.
 * 
 * @param data - Response data object
 * @param corsHeaders - CORS headers record
 * @param status - HTTP status code (default: 200)
 */
export function jsonResponse(
  data: unknown,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Creates an error response with CORS headers.
 * 
 * @param message - Error message string
 * @param corsHeaders - CORS headers record
 * @param status - HTTP status code (default: 400)
 */
export function errorResponse(
  message: string,
  corsHeaders: Record<string, string>,
  status = 400
): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

/**
 * Creates a success response with CORS headers.
 * 
 * @param data - Additional data to include in response
 * @param corsHeaders - CORS headers record
 */
export function successResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>
): Response {
  return jsonResponse({ success: true, ...data }, corsHeaders, 200);
}

/**
 * Creates an unauthorized response (401).
 * 
 * @param corsHeaders - CORS headers record
 * @param message - Custom message (default: "Não autorizado")
 */
export function unauthorizedResponse(
  corsHeaders: Record<string, string>,
  message = "Não autorizado"
): Response {
  return errorResponse(message, corsHeaders, 401);
}

/**
 * Creates a forbidden response (403).
 * 
 * @param corsHeaders - CORS headers record
 * @param message - Custom message (default: "Acesso negado")
 */
export function forbiddenResponse(
  corsHeaders: Record<string, string>,
  message = "Acesso negado"
): Response {
  return errorResponse(message, corsHeaders, 403);
}

/**
 * Creates a not found response (404).
 * 
 * @param corsHeaders - CORS headers record
 * @param message - Custom message (default: "Não encontrado")
 */
export function notFoundResponse(
  corsHeaders: Record<string, string>,
  message = "Não encontrado"
): Response {
  return errorResponse(message, corsHeaders, 404);
}

/**
 * Creates an internal server error response (500).
 * 
 * @param corsHeaders - CORS headers record
 * @param message - Custom message (default: "Erro interno do servidor")
 */
export function serverErrorResponse(
  corsHeaders: Record<string, string>,
  message = "Erro interno do servidor"
): Response {
  return errorResponse(message, corsHeaders, 500);
}

/**
 * Creates a rate limit exceeded response (429).
 * 
 * @param corsHeaders - CORS headers record
 * @param retryAfter - Seconds until retry is allowed
 * @param message - Custom message (default: "Muitas requisições. Tente novamente mais tarde.")
 */
export function rateLimitResponse(
  corsHeaders: Record<string, string>,
  retryAfter?: number,
  message = "Muitas requisições. Tente novamente mais tarde."
): Response {
  const data: Record<string, unknown> = { success: false, error: message };
  if (retryAfter !== undefined) {
    data.retryAfter = retryAfter;
  }
  return jsonResponse(data, corsHeaders, 429);
}
