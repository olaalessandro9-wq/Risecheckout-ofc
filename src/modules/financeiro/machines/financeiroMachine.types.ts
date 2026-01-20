/**
 * Financeiro Machine Types
 * 
 * @module modules/financeiro/machines
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { GatewayId, GatewayConnectionStatus, GatewayConnectionMap } from "@/config/gateways/types";

// ============================================================================
// CONTEXT
// ============================================================================

export interface FinanceiroMachineContext {
  /** Mapa de status de conexão por gateway */
  readonly connectionStatuses: GatewayConnectionMap;
  
  /** Gateway atualmente selecionado para configuração */
  readonly selectedGateway: GatewayId | null;
  
  /** Erro de carregamento, se houver */
  readonly loadError: string | null;
  
  /** Timestamp do último refresh */
  readonly lastRefreshAt: number | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type FinanceiroMachineEvent =
  | { type: "LOAD" }
  | { type: "REFRESH" }
  | { type: "RETRY" }
  | { type: "SELECT_GATEWAY"; gatewayId: GatewayId }
  | { type: "DESELECT_GATEWAY" }
  | { type: "GATEWAY_CONNECTED"; gatewayId: GatewayId }
  | { type: "GATEWAY_DISCONNECTED"; gatewayId: GatewayId };

// ============================================================================
// ACTOR OUTPUTS
// ============================================================================

export interface LoadGatewayStatusesOutput {
  readonly statuses: GatewayConnectionMap;
}

// ============================================================================
// INITIAL CONTEXT
// ============================================================================

const createDefaultConnectionStatus = (id: GatewayId): GatewayConnectionStatus => ({
  id,
  connected: false,
  mode: null,
  lastConnectedAt: null,
});

export const initialFinanceiroContext: FinanceiroMachineContext = {
  connectionStatuses: {
    asaas: createDefaultConnectionStatus("asaas"),
    mercadopago: createDefaultConnectionStatus("mercadopago"),
    pushinpay: createDefaultConnectionStatus("pushinpay"),
    stripe: createDefaultConnectionStatus("stripe"),
  },
  selectedGateway: null,
  loadError: null,
  lastRefreshAt: null,
};
