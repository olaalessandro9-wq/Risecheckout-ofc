/**
 * Unique Checkout Name Utility
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

export async function ensureUniqueCheckoutName(
  _supabase: unknown, // Kept for backward compatibility, not used
  productId: string,
  base: string
): Promise<string> {
  const sessionToken = getProducerSessionToken();
  
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: {
      action: 'check-unique-checkout-name',
      productId,
      baseName: base,
    },
    headers: { 'x-producer-session-token': sessionToken || '' },
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'Erro ao verificar nome único');
  
  return data.uniqueName;
}
