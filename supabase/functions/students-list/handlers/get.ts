/**
 * Handler: Get detailed student info
 * RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "../helpers.ts";
import type { StudentDetail } from "../types.ts";

export async function handleGetStudent(
  supabase: SupabaseClient,
  buyerId: string,
  productId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // SSOT - Unified Identity V3: Query users table with explicit field selection
  const { data: student, error } = await supabase
    .from("users")
    .select(`
      id, email, name, last_login_at, password_hash,
      access:buyer_product_access(id, is_active, granted_at, expires_at, order:orders(*)),
      groups:buyer_groups(group:product_member_groups(*)),
      progress:buyer_content_progress(content_id, progress_percent, completed_at)
    `)
    .eq("id", buyerId)
    .single();

  if (error) throw error;

  return jsonResponse({ success: true, student: student as StudentDetail }, 200, corsHeaders);
}
