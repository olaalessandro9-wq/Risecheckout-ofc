/**
 * Gateway Type-Safe Mock Factories
 * 
 * @module test/factories/gateway
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Factories centralizadas para mocks type-safe do módulo Gateway.
 * Segue SSOT dos tipos em src/config/gateways/types.ts
 */

import type { 
  GatewayId,
  GatewayConnectionStatus, 
  GatewayConnectionMap,
  GatewayEnvironment,
} from "@/config/gateways/types";

// ============================================================================
// GATEWAY CONNECTION STATUS FACTORY
// ============================================================================

/**
 * Cria um mock type-safe de GatewayConnectionStatus
 * 
 * IMPORTANTE: O tipo SSOT requer:
 * - id: GatewayId (obrigatório)
 * - mode: GatewayEnvironment | null (obrigatório)
 * - lastConnectedAt: string | null (NÃO 'lastSync')
 * 
 * @param id - ID do gateway (obrigatório)
 * @param overrides - Propriedades para sobrescrever os valores padrão
 * @returns GatewayConnectionStatus completo e tipado
 */
export function createMockGatewayConnectionStatus(
  id: GatewayId,
  overrides: Partial<Omit<GatewayConnectionStatus, "id">> = {}
): GatewayConnectionStatus {
  return {
    id,
    connected: false,
    mode: null,
    lastConnectedAt: null,
    ...overrides,
  };
}

/**
 * Cria um mock de gateway conectado
 */
export function createConnectedGatewayStatus(
  id: GatewayId,
  mode: GatewayEnvironment = "production"
): GatewayConnectionStatus {
  return createMockGatewayConnectionStatus(id, {
    connected: true,
    mode,
    lastConnectedAt: new Date().toISOString(),
  });
}

/**
 * Cria um mock de gateway desconectado
 */
export function createDisconnectedGatewayStatus(
  id: GatewayId
): GatewayConnectionStatus {
  return createMockGatewayConnectionStatus(id, {
    connected: false,
    mode: null,
    lastConnectedAt: null,
  });
}

// ============================================================================
// GATEWAY CONNECTION MAP FACTORY
// ============================================================================

/**
 * Cria um mock type-safe de GatewayConnectionMap
 * 
 * @param overrides - Partial overrides por gateway
 * @returns GatewayConnectionMap completo e tipado
 */
export function createMockGatewayConnectionMap(
  overrides: Partial<Record<GatewayId, Partial<Omit<GatewayConnectionStatus, "id">>>> = {}
): GatewayConnectionMap {
  return {
    asaas: createMockGatewayConnectionStatus("asaas", overrides.asaas),
    mercadopago: createMockGatewayConnectionStatus("mercadopago", overrides.mercadopago),
    pushinpay: createMockGatewayConnectionStatus("pushinpay", overrides.pushinpay),
    stripe: createMockGatewayConnectionStatus("stripe", overrides.stripe),
  };
}

/**
 * Cria um mapa com todos os gateways conectados
 */
export function createAllConnectedGatewayMap(): GatewayConnectionMap {
  return {
    asaas: createConnectedGatewayStatus("asaas"),
    mercadopago: createConnectedGatewayStatus("mercadopago"),
    pushinpay: createConnectedGatewayStatus("pushinpay"),
    stripe: createConnectedGatewayStatus("stripe"),
  };
}

/**
 * Cria um mapa com todos os gateways desconectados
 */
export function createAllDisconnectedGatewayMap(): GatewayConnectionMap {
  return {
    asaas: createDisconnectedGatewayStatus("asaas"),
    mercadopago: createDisconnectedGatewayStatus("mercadopago"),
    pushinpay: createDisconnectedGatewayStatus("pushinpay"),
    stripe: createDisconnectedGatewayStatus("stripe"),
  };
}

/**
 * Cria um mapa misto (alguns conectados, alguns não)
 */
export function createMixedGatewayConnectionMap(): GatewayConnectionMap {
  return {
    asaas: createConnectedGatewayStatus("asaas"),
    mercadopago: createConnectedGatewayStatus("mercadopago"),
    pushinpay: createDisconnectedGatewayStatus("pushinpay"),
    stripe: createDisconnectedGatewayStatus("stripe"),
  };
}

// ============================================================================
// GATEWAY ID HELPERS
// ============================================================================

/**
 * Lista de IDs de gateways válidos
 */
export const GATEWAY_IDS: readonly GatewayId[] = [
  "asaas",
  "mercadopago",
  "pushinpay",
  "stripe",
] as const;

/**
 * Verifica se um ID é um gateway válido
 */
export function isValidGatewayId(id: string): id is GatewayId {
  return GATEWAY_IDS.includes(id as GatewayId);
}
