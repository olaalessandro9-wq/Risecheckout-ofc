// Função helper para buscar tokens do Vault (backend only)
// P0-4: Tokens nunca devem ir para o frontend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  } catch (error) {
    console.error(`[get-vendor-token] Exception:`, error);
    return null;
  }
}

export async function getVendorIntegrationConfig(
  vendorId: string,
  gateway: string
): Promise<any | null> {
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

    return data;
  } catch (error) {
    console.error(`[get-vendor-integration] Exception:`, error);
    return null;
  }
}
