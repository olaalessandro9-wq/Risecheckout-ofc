/**
 * Stripe Disconnect Handler
 * 
 * Responsabilidade: Desconectar conta Stripe
 * 
 * @module stripe-connect-oauth/handlers/disconnect
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

interface IntegrationConfig {
  stripe_account_id?: string;
}

interface IntegrationRecord {
  config: IntegrationConfig;
}

export interface DisconnectResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Desconecta a conta Stripe do vendedor
 */
export async function disconnectStripe(
  supabase: SupabaseClient,
  stripe: Stripe,
  vendorId: string
): Promise<DisconnectResult> {
  console.log('[Disconnect] Desconectando Stripe para vendor:', vendorId);

  try {
    // Buscar integração existente
    const { data: integration } = await supabase
      .from("vendor_integrations")
      .select("config")
      .eq("vendor_id", vendorId)
      .eq("integration_type", "STRIPE")
      .maybeSingle();

    const integrationData = integration as IntegrationRecord | null;

    if (integrationData?.config?.stripe_account_id) {
      // Revogar acesso no Stripe
      try {
        await stripe.oauth.deauthorize({
          client_id: Deno.env.get("STRIPE_CLIENT_ID") || "",
          stripe_user_id: integrationData.config.stripe_account_id,
        });
        console.log('[Disconnect] Acesso Stripe revogado');
      } catch (revokeError) {
        console.warn('[Disconnect] Erro ao revogar (continuando):', revokeError);
      }
    }

    // Desativar integração no banco
    await supabase
      .from("vendor_integrations")
      .update({ 
        active: false,
        config: {},
        updated_at: new Date().toISOString()
      })
      .eq("vendor_id", vendorId)
      .eq("integration_type", "STRIPE");

    console.log('[Disconnect] ✅ Integração desconectada');

    return {
      success: true,
      message: "Stripe disconnected successfully"
    };

  } catch (error) {
    console.error('[Disconnect] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao desconectar'
    };
  }
}
