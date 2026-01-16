/**
 * ensureUniqueName - Check product name uniqueness via Edge Function
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

export async function ensureUniqueName(
  _supabase: unknown, // Legacy parameter, not used anymore
  base: string,
): Promise<string> {
  const sessionToken = getProducerSessionToken();
  
  const { data, error } = await supabase.functions.invoke("admin-data", {
    body: { 
      action: "check-unique-name",
      productName: base,
    },
    headers: { "x-producer-session-token": sessionToken || "" },
  });

  if (error) throw error;
  
  return data?.uniqueName || base;
}
