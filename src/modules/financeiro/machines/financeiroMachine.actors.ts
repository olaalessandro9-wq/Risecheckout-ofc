/**
 * Financeiro Machine Actors
 * 
 * @module modules/financeiro/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { GatewayId, GatewayConnectionMap, GatewayConnectionStatus, IntegrationType } from "@/config/gateways/types";
import type { LoadGatewayStatusesOutput } from "./financeiroMachine.types";

const log = createLogger("FinanceiroActors");

// ============================================================================
// API TYPES
// ============================================================================

interface IntegrationStatusResponse {
  success: boolean;
  integrations?: Array<{
    integration_type: IntegrationType;
    active: boolean;
    config?: {
      environment?: "sandbox" | "production";
    };
    updated_at?: string;
  }>;
  error?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const INTEGRATION_TYPE_TO_GATEWAY: Record<IntegrationType, GatewayId> = {
  ASAAS: "asaas",
  MERCADOPAGO: "mercadopago",
  PUSHINPAY: "pushinpay",
  STRIPE: "stripe",
};

function createDefaultStatus(id: GatewayId): GatewayConnectionStatus {
  return {
    id,
    connected: false,
    mode: null,
    lastConnectedAt: null,
  };
}

// ============================================================================
// ACTORS
// ============================================================================

/**
 * Actor para carregar status de todos os gateways
 */
export const loadGatewayStatusesActor = fromPromise<LoadGatewayStatusesOutput, void>(
  async () => {
    log.info("Carregando status de gateways...");

    const { data, error } = await api.call<IntegrationStatusResponse>("integration-management", {
      action: "status",
    });

    if (error) {
      log.error("Erro ao carregar status:", error);
      throw new Error(error.message ?? "Erro ao carregar integrações");
    }

    if (!data?.success) {
      throw new Error(data?.error ?? "Falha ao obter status das integrações");
    }

    // Inicializa com status padrão
    const statuses: GatewayConnectionMap = {
      asaas: createDefaultStatus("asaas"),
      mercadopago: createDefaultStatus("mercadopago"),
      pushinpay: createDefaultStatus("pushinpay"),
      stripe: createDefaultStatus("stripe"),
    };

    // Atualiza com dados reais
    if (data.integrations) {
      for (const integration of data.integrations) {
        const gatewayId = INTEGRATION_TYPE_TO_GATEWAY[integration.integration_type];
        if (gatewayId) {
          statuses[gatewayId] = {
            id: gatewayId,
            connected: integration.active,
            mode: integration.config?.environment ?? null,
            lastConnectedAt: integration.updated_at ?? null,
          };
        }
      }
    }

    log.info("Status carregados:", statuses);
    return { statuses };
  }
);
