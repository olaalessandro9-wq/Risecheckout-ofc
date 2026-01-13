/**
 * get-vendor-token.ts - Helpers para buscar tokens e configs do Vault
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliant - Zero `any`
 * 
 * P0-4: Tokens nunca devem ir para o frontend
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Buscar access_token do Vault via SQL (client JS não tem método .vault)
    const secretName = `${gateway}_${vendorId}_access_token`;
    const { data, error } = await supabase
      .rpc('get_vault_secret', { p_name: secretName });

    if (error) {
      console.error(`[get-vendor-token] Failed to get token for ${gateway}:`, error);
      return null;
    }

    return data as string | null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[get-vendor-token] Exception:`, errorMessage);
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
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Buscar configuração completa (com access_token) do backend
    const { data, error } = await supabase
      .from('vendor_integrations')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('gateway', gateway)
      .single();

    if (error) {
      console.error(`[get-vendor-integration] Failed to get config for ${gateway}:`, error);
      return null;
    }

    return data as VendorIntegration | null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[get-vendor-integration] Exception:`, errorMessage);
    return null;
  }
}
