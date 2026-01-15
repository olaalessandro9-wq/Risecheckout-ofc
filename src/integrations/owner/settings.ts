/**
 * API de configurações do Owner
 * Gerencia ambientes de gateway (sandbox/production) via Edge Function owner-settings
 * 
 * RISE Protocol V2 Compliant - Todas as operações via Edge Functions
 */

import { supabase } from "@/integrations/supabase/client";

export type GatewayType = 'asaas' | 'mercadopago' | 'pushinpay' | 'stripe';
export type GatewayEnvironment = 'sandbox' | 'production';

export interface OwnerGatewayEnvironments {
  asaas: GatewayEnvironment;
  mercadopago: GatewayEnvironment;
  pushinpay: GatewayEnvironment;
  stripe: GatewayEnvironment;
}

const DEFAULT_ENVIRONMENTS: OwnerGatewayEnvironments = {
  asaas: 'production',
  mercadopago: 'production',
  pushinpay: 'production',
  stripe: 'production',
};

/**
 * Busca os ambientes configurados para todos os gateways do Owner
 * Usa Edge Function para maior segurança
 */
export async function getOwnerGatewayEnvironments(): Promise<OwnerGatewayEnvironments> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "owner-settings/get-gateway-environments",
      { body: {} }
    );

    if (error) {
      console.error('[owner/settings] Erro ao buscar ambientes via Edge Function:', error);
      return DEFAULT_ENVIRONMENTS;
    }

    const result = data as { success: boolean; environments?: OwnerGatewayEnvironments; error?: string };
    
    if (!result.success || !result.environments) {
      console.error('[owner/settings] Resposta inválida:', result.error);
      return DEFAULT_ENVIRONMENTS;
    }

    return result.environments;
  } catch (error: unknown) {
    console.error('[owner/settings] Erro inesperado:', error);
    return DEFAULT_ENVIRONMENTS;
  }
}

/**
 * Atualiza o ambiente de um gateway específico
 * Usa Edge Function para garantir validação de role Owner
 */
export async function setOwnerGatewayEnvironment(
  gateway: GatewayType,
  environment: GatewayEnvironment
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "owner-settings/set-gateway-environment",
      {
        body: { gateway, environment },
      }
    );

    if (error) {
      console.error('[owner/settings] Erro ao atualizar ambiente:', error);
      return { ok: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    
    if (!result.success) {
      return { ok: false, error: result.error || "Erro ao atualizar ambiente" };
    }

    console.log(`[owner/settings] Gateway ${gateway} alterado para ${environment}`);
    return { ok: true };
  } catch (error: unknown) {
    console.error('[owner/settings] Erro inesperado:', error);
    return { ok: false, error: String(error) };
  }
}
