/**
 * Members Area Reorder Handler
 * 
 * Extracted reorder handler for members-area-modules.
 * RISE Protocol Compliant - < 300 lines
 * 
 * @created 2026-01-13 - Extracted from members-area-handlers.ts
 */

import { SupabaseClient } from "./supabase-types.ts";
import { 
  jsonResponse, 
  errorResponse,
  verifyProductOwnership,
} from "./members-area-handlers.ts";

// ============================================
// REORDER MODULES
// ============================================

export async function handleReorderModules(
  supabase: SupabaseClient,
  productId: string,
  orderedIds: string[],
  producerId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const ownership = await verifyProductOwnership(supabase, productId, producerId);
  if (!ownership.valid) {
    return errorResponse(ownership.error!, corsHeaders, 403);
  }

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("product_member_modules")
      .update({ position: index })
      .eq("id", id)
      .eq("product_id", productId)
  );

  const results = await Promise.all(updates);
  const hasError = results.some((r) => r.error);

  if (hasError) {
    console.error("[members-area-modules] Reorder error");
    return errorResponse("Erro ao reordenar módulos", corsHeaders, 500);
  }

  console.log(`[members-area-modules] Modules reordered by ${producerId}`);
  return jsonResponse({ success: true }, corsHeaders);
}
