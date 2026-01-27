/**
 * Response helpers for students-invite Edge Function
 * RISE V3 Compliant
 */

import type { JsonResponseData } from "../types.ts";

export function jsonResponse(
  data: JsonResponseData,
  status = 200,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
