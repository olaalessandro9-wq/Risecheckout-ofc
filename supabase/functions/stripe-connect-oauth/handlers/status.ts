/**
 * Stripe Status Handler
 * 
 * Responsabilidade: Verificar status da conexão Stripe
 * 
 * @module stripe-connect-oauth/handlers/status
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface IntegrationConfig {
  stripe_account_id?: string;
  livemode?: boolean;
  email?: string;
  connected_at?: string;
}

interface IntegrationRecord {
  active: boolean;
  config: IntegrationConfig;
}

export interface StatusResult {
  connected: boolean;
  account_id: string | null;
  email: string | null;
  livemode: boolean | null;
  connected_at: string | null;
}

/**
 * Retorna o status da conexão Stripe do vendedor
 */
export async function getStripeStatus(
  supabase: SupabaseClient,
  vendorId: string
): Promise<StatusResult> {
  const { data: integration } = await supabase
    .from("vendor_integrations")
    .select("active, config, updated_at")
    .eq("vendor_id", vendorId)
    .eq("integration_type", "STRIPE")
    .maybeSingle();

  const integrationData = integration as IntegrationRecord | null;
  const connected = !!(integrationData?.active && integrationData?.config?.stripe_account_id);

  return {
    connected,
    account_id: connected ? integrationData!.config.stripe_account_id! : null,
    email: connected ? integrationData!.config.email || null : null,
    livemode: connected ? integrationData!.config.livemode || null : null,
    connected_at: connected ? integrationData!.config.connected_at || null : null,
  };
}
