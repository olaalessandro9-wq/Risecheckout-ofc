/**
 * Session Validation Helper
 * 
 * Validates buyer session using unified auth system.
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAuthenticatedUser } from "../../_shared/unified-auth-v2.ts";
import type { BuyerData } from "../types.ts";

/**
 * Validates session using unified system only.
 * Legacy buyer_sessions fallback removed - RISE V3 migration complete.
 */
export async function validateSession(
  supabase: SupabaseClient,
  req: Request
): Promise<BuyerData | null> {
  const unifiedUser = await getAuthenticatedUser(supabase, req);

  if (unifiedUser) {
    return {
      id: unifiedUser.id,
      email: unifiedUser.email,
      name: unifiedUser.name,
      is_active: true,
    };
  }

  return null;
}
