/**
 * Response Utilities
 * 
 * Centralizes JSON response helpers for all Edge Functions.
 * 
 * @version 1.0.0
 */

/**
 * Creates a JSON response with CORS headers
 */
export function jsonResponse(
  data: unknown,
  corsHeaders: Record<string, string>,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Creates an error response with CORS headers
 */
export function errorResponse(
  message: string,
  corsHeaders: Record<string, string>,
  status: number = 400
): Response {
  return jsonResponse({ success: false, error: message }, corsHeaders, status);
}

/**
 * Creates a success response with CORS headers
 */
export function successResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>
): Response {
  return jsonResponse({ success: true, ...data }, corsHeaders, 200);
}

/**
 * Creates an unauthorized response
 */
export function unauthorizedResponse(
  corsHeaders: Record<string, string>,
  message: string = "Não autorizado"
): Response {
  return errorResponse(message, corsHeaders, 401);
}

/**
 * Creates a forbidden response
 */
export function forbiddenResponse(
  corsHeaders: Record<string, string>,
  message: string = "Acesso negado"
): Response {
  return errorResponse(message, corsHeaders, 403);
}

/**
 * Creates a not found response
 */
export function notFoundResponse(
  corsHeaders: Record<string, string>,
  message: string = "Não encontrado"
): Response {
  return errorResponse(message, corsHeaders, 404);
}

/**
 * Creates an internal server error response
 */
export function serverErrorResponse(
  corsHeaders: Record<string, string>,
  message: string = "Erro interno do servidor"
): Response {
  return errorResponse(message, corsHeaders, 500);
}
