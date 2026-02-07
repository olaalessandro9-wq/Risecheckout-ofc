/**
 * Gateway Registry - Single Source of Truth
 * 
 * @module config/gateways
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Registro centralizado de TODOS os gateways de pagamento.
 * Esta é a ÚNICA fonte de definição de gateways no sistema.
 * 
 * Para adicionar um novo gateway:
 * 1. Adicionar entrada em GATEWAY_REGISTRY
 * 2. Adicionar ID em GATEWAY_ORDER
 * 3. Criar módulo em src/integrations/gateways/{id}/
 */

import { CreditCard, Wallet } from "lucide-react";
import type {
  GatewayId,
  IntegrationType,
  GatewayDefinition,
  GatewayFees,
  PaymentMethod,
  GatewayCapabilities,
} from "./types";

// ============================================================================
// GATEWAY REGISTRY
// ============================================================================

/**
 * Registro completo de todos os gateways.
 * Cada gateway tem sua definição completa aqui.
 */
export const GATEWAY_REGISTRY: Readonly<Record<GatewayId, GatewayDefinition>> = {
  asaas: {
    id: 'asaas',
    integrationType: 'ASAAS',
    name: 'Asaas',
    description: 'Gateway de pagamento PIX',
    icon: CreditCard,
    iconColor: '#00B4D8',
    status: 'active',
    capabilities: {
      pix: true,
      creditCard: false,
      boleto: true,
      debitCard: false,
    },
    authType: 'api_key',
    hasEnvironmentToggle: true,
    fees: {
      pix: { percentage: 0.99 },
    },
    documentationUrl: 'https://docs.asaas.com',
  },

  pushinpay: {
    id: 'pushinpay',
    integrationType: 'PUSHINPAY',
    name: 'PushinPay',
    description: 'Gateway de pagamento PIX',
    icon: Wallet,
    iconColor: '#3b82f6',
    status: 'active',
    capabilities: {
      pix: true,
      creditCard: false,
      boleto: false,
      debitCard: false,
    },
    authType: 'api_key',
    hasEnvironmentToggle: true,
    fees: {
      pix: { fixed: 0, percentage: 0 },
    },
    documentationUrl: 'https://pushinpay.com/docs',
  },

  mercadopago: {
    id: 'mercadopago',
    integrationType: 'MERCADOPAGO',
    name: 'Mercado Pago',
    description: 'PIX e Cartão de Crédito',
    icon: CreditCard,
    iconColor: '#009EE3',
    status: 'active',
    capabilities: {
      pix: true,
      creditCard: true,
      boleto: false,
      debitCard: false,
    },
    authType: 'oauth',
    hasEnvironmentToggle: true,
    fees: {
      pix: { fixed: 200, percentage: 0.99 },
      credit_card: { fixed: 200, percentage: 3.99, transaction: 40 },
    },
    documentationUrl: 'https://www.mercadopago.com.br/developers',
  },

  stripe: {
    id: 'stripe',
    integrationType: 'STRIPE',
    name: 'Stripe',
    description: 'Cartão de Crédito e PIX',
    icon: CreditCard,
    iconColor: '#635BFF',
    status: 'coming_soon',
    capabilities: {
      pix: true,
      creditCard: true,
      boleto: false,
      debitCard: true,
    },
    authType: 'oauth',
    hasEnvironmentToggle: false,
    fees: {
      pix: { percentage: 1.99 },
      credit_card: { percentage: 3.99, transaction: 39 },
      debit_card: { percentage: 2.99, transaction: 39 },
    },
    documentationUrl: 'https://stripe.com/docs',
  },
} as const;

// ============================================================================
// GATEWAY ORDER (para exibição consistente em UI)
// ============================================================================

/**
 * Ordem de exibição dos gateways na UI.
 * Usado em listas e selectors.
 */
export const GATEWAY_ORDER: readonly GatewayId[] = [
  'asaas',
  'pushinpay',
  'mercadopago',
  'stripe',
] as const;

// ============================================================================
// INTEGRATION TYPE MAPPING
// ============================================================================

/**
 * Mapa de GatewayId → IntegrationType
 * Usado para queries no banco de dados (vendor_integrations)
 */
export const INTEGRATION_TYPE_MAP: Readonly<Record<GatewayId, IntegrationType>> = {
  asaas: 'ASAAS',
  mercadopago: 'MERCADOPAGO',
  pushinpay: 'PUSHINPAY',
  stripe: 'STRIPE',
} as const;

/**
 * Mapa reverso: IntegrationType → GatewayId
 */
export const GATEWAY_ID_MAP: Readonly<Record<IntegrationType, GatewayId>> = {
  ASAAS: 'asaas',
  MERCADOPAGO: 'mercadopago',
  PUSHINPAY: 'pushinpay',
  STRIPE: 'stripe',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Retorna a definição de um gateway pelo ID
 */
export function getGatewayById(id: GatewayId): GatewayDefinition {
  return GATEWAY_REGISTRY[id];
}

/**
 * Retorna todos os gateways na ordem de exibição
 */
export function getAllGateways(): GatewayDefinition[] {
  return GATEWAY_ORDER.map((id) => GATEWAY_REGISTRY[id]);
}

/**
 * Retorna gateways com status específico
 */
export function getGatewaysByStatus(status: GatewayDefinition['status']): GatewayDefinition[] {
  return getAllGateways().filter((g) => g.status === status);
}

/**
 * Retorna gateways ativos
 */
export function getActiveGateways(): GatewayDefinition[] {
  return getGatewaysByStatus('active');
}

/**
 * Retorna gateways que suportam um método de pagamento específico
 */
export function getGatewaysByPaymentMethod(method: PaymentMethod): GatewayDefinition[] {
  return getAllGateways().filter((g) => {
    const capMap: Record<PaymentMethod, keyof GatewayCapabilities> = {
      pix: 'pix',
      credit_card: 'creditCard',
      boleto: 'boleto',
      debit_card: 'debitCard',
    };
    return g.capabilities[capMap[method]];
  });
}

/**
 * Retorna gateways ativos que suportam um método de pagamento
 */
export function getActiveGatewaysByPaymentMethod(method: PaymentMethod): GatewayDefinition[] {
  return getGatewaysByPaymentMethod(method).filter((g) => g.status === 'active');
}

/**
 * Retorna gateways que suportam PIX
 */
export function getPixGateways(): GatewayDefinition[] {
  return getAllGateways().filter((g) => g.capabilities.pix);
}

/**
 * Retorna gateways que suportam Cartão de Crédito
 */
export function getCreditCardGateways(): GatewayDefinition[] {
  return getAllGateways().filter((g) => g.capabilities.creditCard);
}

/**
 * Verifica se um ID é um GatewayId válido
 */
export function isValidGatewayId(id: string): id is GatewayId {
  return id in GATEWAY_REGISTRY;
}

/**
 * Formata as taxas de um gateway para exibição
 */
export function formatGatewayFees(fees: GatewayFees): string {
  const parts: string[] = [];

  if (fees.fixed) {
    parts.push(`R$ ${(fees.fixed / 100).toFixed(2)}`);
  }

  if (fees.percentage) {
    parts.push(`${fees.percentage.toFixed(2)}%`);
  }

  if (fees.transaction) {
    parts.push(`R$ ${(fees.transaction / 100).toFixed(2)}`);
  }

  return parts.length > 0 ? `Taxa: ${parts.join(' + ')}` : 'Sem taxas';
}

/**
 * Converte IntegrationType para GatewayId
 */
export function integrationTypeToGatewayId(type: IntegrationType): GatewayId {
  return GATEWAY_ID_MAP[type];
}

/**
 * Converte GatewayId para IntegrationType
 */
export function gatewayIdToIntegrationType(id: GatewayId): IntegrationType {
  return INTEGRATION_TYPE_MAP[id];
}
