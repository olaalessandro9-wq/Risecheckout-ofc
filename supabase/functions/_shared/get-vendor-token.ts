/**
 * get-vendor-token.ts - Helpers para buscar tokens e configs do Vault
 * 
 * @version 3.0.0 - Multi-Secret Key Architecture
 * 
 * P0-4: Tokens nunca devem ir para o frontend
 * Uses 'payments' domain since it deals with gateway credentials.
 */

import { getSupabaseClient, type SupabaseClient } from "./supabase-client.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("VendorToken");

// ============================================
// TYPES
// ============================================

interface VendorIntegration {
  id: string;
  vendor_id: string;
  gateway: string;
  access_token?: string;
  refresh_token?: string;
  merchant_id?: string;
  environment?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// GET VENDOR TOKEN FROM VAULT
// ============================================

export async function getVendorToken(
  vendorId: string,
  gateway: string
): Promise<string | null> {
  const supabase: SupabaseClient = getSupabaseClient("payments");

  try {
    const secretName = `${gateway}_${vendorId}_access_token`;
    const { data, error } = await supabase
      .rpc('get_vault_secret', { p_name: secretName });

    if (error) {
      log.error(`Failed to get token for ${gateway}:`, error);
      return null;
    }

    return data as string | null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Exception:", errorMessage);
    return null;
  }
}

// ============================================
// GET VENDOR INTEGRATION CONFIG
// ============================================

export async function getVendorIntegrationConfig(
  vendorId: string,
  gateway: string
): Promise<VendorIntegration | null> {
  const supabase: SupabaseClient = getSupabaseClient("payments");

  try {
    const { data, error } = await supabase
      .from('vendor_integrations')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('gateway', gateway)
      .single();

    if (error) {
      log.error(`Failed to get config for ${gateway}:`, error);
      return null;
    }

    return data as VendorIntegration | null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Exception:", errorMessage);
    return null;
  }
}
