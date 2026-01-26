/**
 * API de configurações do Owner
 * Gerencia ambientes de gateway (sandbox/production) via Edge Function owner-settings
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { api } from "@/lib/api/client";
import { createLogger } from "@/lib/logger";

const log = createLogger('OwnerSettings');

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

interface EnvironmentsResponse {
  success: boolean;
  environments?: OwnerGatewayEnvironments;
  error?: string;
}

/**
 * Busca os ambientes configurados para todos os gateways do Owner
 * Usa Edge Function para maior segurança
 */
export async function getOwnerGatewayEnvironments(): Promise<OwnerGatewayEnvironments> {
  try {
    const { data, error } = await api.call<EnvironmentsResponse>(
      "owner-settings/get-gateway-environments",
      {}
    );

    if (error) {
      log.error('Erro ao buscar ambientes via Edge Function', error);
      return DEFAULT_ENVIRONMENTS;
    }

    if (!data?.success || !data.environments) {
      log.error('Resposta inválida', { error: data?.error });
      return DEFAULT_ENVIRONMENTS;
    }

    return data.environments;
  } catch (error: unknown) {
    log.error('Erro inesperado ao buscar ambientes', error);
    return DEFAULT_ENVIRONMENTS;
  }
}

interface SetEnvironmentResponse {
  success: boolean;
  error?: string;
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
    const { data, error } = await api.call<SetEnvironmentResponse>(
      "owner-settings/set-gateway-environment",
      { gateway, environment }
    );

    if (error) {
      log.error('Erro ao atualizar ambiente', error);
      return { ok: false, error: error.message };
    }

    if (!data?.success) {
      return { ok: false, error: data?.error || "Erro ao atualizar ambiente" };
    }

    log.info(`Gateway ${gateway} alterado para ${environment}`);
    return { ok: true };
  } catch (error: unknown) {
    log.error('Erro inesperado ao atualizar ambiente', error);
    return { ok: false, error: String(error) };
  }
}
