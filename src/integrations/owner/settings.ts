/**
 * API de configurações do Owner
 * Gerencia ambientes de gateway (sandbox/production) via platform_settings
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
 */
export async function getOwnerGatewayEnvironments(): Promise<OwnerGatewayEnvironments> {
  const keys = [
    'gateway_environment_asaas',
    'gateway_environment_mercadopago',
    'gateway_environment_pushinpay',
    'gateway_environment_stripe',
  ];

  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', keys);

  if (error) {
    console.error('[owner/settings] Erro ao buscar ambientes:', error);
    return DEFAULT_ENVIRONMENTS;
  }

  const environments = { ...DEFAULT_ENVIRONMENTS };

  data?.forEach((row) => {
    const gateway = row.key.replace('gateway_environment_', '') as GatewayType;
    if (gateway in environments) {
      environments[gateway] = row.value === 'sandbox' ? 'sandbox' : 'production';
    }
  });

  return environments;
}

/**
 * Atualiza o ambiente de um gateway específico
 */
export async function setOwnerGatewayEnvironment(
  gateway: GatewayType,
  environment: GatewayEnvironment
): Promise<{ ok: boolean; error?: string }> {
  const key = `gateway_environment_${gateway}`;

  const { error } = await supabase
    .from('platform_settings')
    .update({ value: environment, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    console.error('[owner/settings] Erro ao atualizar ambiente:', error);
    return { ok: false, error: error.message };
  }

  console.log(`[owner/settings] Gateway ${gateway} alterado para ${environment}`);
  return { ok: true };
}
