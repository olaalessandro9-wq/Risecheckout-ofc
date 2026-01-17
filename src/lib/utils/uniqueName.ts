/**
 * ensureUniqueName - Check product name uniqueness via Edge Function
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { api } from "@/lib/api";

interface UniqueNameResponse {
  uniqueName?: string;
}

export async function ensureUniqueName(
  _supabase: unknown, // Legacy parameter, not used anymore
  base: string,
): Promise<string> {
  const { data, error } = await api.call<UniqueNameResponse>("admin-data", {
    action: "check-unique-name",
    productName: base,
  });

  if (error) throw new Error(error.message);
  
  return data?.uniqueName || base;
}
