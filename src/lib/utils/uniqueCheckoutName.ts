/**
 * Unique Checkout Name Utility
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { api } from "@/lib/api";

interface UniqueCheckoutNameResponse {
  success?: boolean;
  uniqueName?: string;
  error?: string;
}

export async function ensureUniqueCheckoutName(
  _supabase: unknown, // Kept for signature stability, not used
  productId: string,
  base: string
): Promise<string> {
  const { data, error } = await api.call<UniqueCheckoutNameResponse>('admin-data', {
    action: 'check-unique-checkout-name',
    productId,
    baseName: base,
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Erro ao verificar nome único');
  
  return data.uniqueName!;
}
