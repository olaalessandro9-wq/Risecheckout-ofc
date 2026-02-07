/**
 * Payment Gateways Registry - Configuração Centralizada
 * 
 * Este arquivo define todos os gateways de pagamento disponíveis no sistema.
 * Para adicionar um novo gateway, basta adicionar uma entrada neste registry.
 * 
 * Princípios:
 * - Single Source of Truth
 * - Fácil de manter
 * - Type-safe
 * - Escalável
 */

// ============================================
// TIPOS
// ============================================

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card';

export type GatewayStatus = 'active' | 'coming_soon' | 'beta' | 'deprecated';

export interface GatewayFees {
  fixed?: number;        // Taxa fixa em centavos (ex: 200 = R$ 2,00)
  percentage?: number;   // Taxa percentual (ex: 3.99 = 3,99%)
  transaction?: number;  // Taxa por transação em centavos (ex: 40 = R$ 0,40)
}

import type { AppRole } from "@/hooks/usePermissions";

export interface PaymentGateway {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  logo?: string;
  status: GatewayStatus;
  supportedMethods: PaymentMethod[];
  fees: Partial<Record<PaymentMethod, GatewayFees>>;
  requiresCredentials: boolean;
  credentialsFields?: string[];
  documentationUrl?: string;
  /** Roles para os quais este gateway aparece como "Em Breve" */
  comingSoonForRoles?: readonly AppRole[];
}

// ============================================
// REGISTRY DE GATEWAYS
// ============================================

export const PAYMENT_GATEWAYS: Record<string, PaymentGateway> = {
  // ==================== ASAAS ====================
  asaas: {
    id: 'asaas',
    name: 'asaas',
    displayName: 'Asaas',
    description: 'Gateway de PIX via Asaas',
    status: 'active',
    supportedMethods: ['pix'],
    fees: {
      pix: {
        percentage: 0.99, // 0,99%
      },
    },
    requiresCredentials: true,
    credentialsFields: ['api_key', 'environment'],
    documentationUrl: 'https://docs.asaas.com',
  },

  // ==================== MERCADO PAGO ====================
  mercadopago: {
    id: 'mercadopago',
    name: 'mercadopago',
    displayName: 'Mercado Pago',
    description: 'Gateway completo com PIX e Cartão',
    status: 'active',
    supportedMethods: ['pix', 'credit_card'],
    fees: {
      pix: {
        fixed: 200,      // R$ 2,00
        percentage: 0.99, // 0,99%
      },
      credit_card: {
        fixed: 200,       // R$ 2,00
        percentage: 3.99, // 3,99%
        transaction: 40,  // R$ 0,40
      },
    },
    requiresCredentials: true,
    credentialsFields: ['public_key', 'access_token'],
    documentationUrl: 'https://www.mercadopago.com.br/developers',
  },

  // ==================== PUSHINPAY ====================
  pushinpay: {
    id: 'pushinpay',
    name: 'pushinpay',
    displayName: 'PushinPay',
    description: 'Gateway padrão para PIX',
    status: 'active',
    supportedMethods: ['pix'],
    fees: {
      pix: {
        // Taxas do PushinPay (ajustar conforme necessário)
        fixed: 0,
        percentage: 0,
      },
    },
    requiresCredentials: true,
    credentialsFields: ['api_key'],
    documentationUrl: 'https://pushinpay.com/docs',
  },

  // ==================== STRIPE ====================
  stripe: {
    id: 'stripe',
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Gateway internacional com suporte a múltiplas moedas',
    status: 'active', // ✅ ATIVADO - Apenas para Owner
    supportedMethods: ['credit_card', 'debit_card'],
    fees: {
      pix: {
        percentage: 1.99,
      },
      credit_card: {
        percentage: 3.99,
        transaction: 39,
      },
      debit_card: {
        percentage: 2.99,
        transaction: 39,
      },
    },
    requiresCredentials: true,
    credentialsFields: ['publishable_key', 'secret_key'],
    documentationUrl: 'https://stripe.com/docs',
    comingSoonForRoles: ['user', 'seller'], // Em breve para non-owners
  },

  // ==================== GATEWAYS EM DESENVOLVIMENTO ====================
  // PagSeguro, Cielo e Rede estão desabilitados (ativar quando implementados).
  // Para reativar, descomentar os blocos abaixo.
  
  /*
  // ==================== PAGSEGURO ====================
  pagseguro: {
    id: 'pagseguro',
    name: 'pagseguro',
    displayName: 'PagSeguro',
    description: 'Gateway brasileiro completo',
    status: 'coming_soon',
    supportedMethods: ['pix', 'credit_card', 'boleto'],
    fees: {
      pix: {
        percentage: 0.99,
      },
      credit_card: {
        percentage: 4.99,
      },
      boleto: {
        fixed: 349, // R$ 3,49
      },
    },
    requiresCredentials: true,
    credentialsFields: ['email', 'token'],
    documentationUrl: 'https://dev.pagseguro.uol.com.br',
  },

  // ==================== CIELO ====================
  cielo: {
    id: 'cielo',
    name: 'cielo',
    displayName: 'Cielo',
    description: 'Gateway de cartões da Cielo',
    status: 'coming_soon',
    supportedMethods: ['credit_card', 'debit_card'],
    fees: {
      credit_card: {
        percentage: 3.49,
      },
      debit_card: {
        percentage: 1.99,
      },
    },
    requiresCredentials: true,
    credentialsFields: ['merchant_id', 'merchant_key'],
    documentationUrl: 'https://developercielo.github.io',
  },

  // ==================== REDE ====================
  rede: {
    id: 'rede',
    name: 'rede',
    displayName: 'Rede',
    description: 'Gateway de cartões da Rede',
    status: 'coming_soon',
    supportedMethods: ['credit_card', 'debit_card'],
    fees: {
      credit_card: {
        percentage: 3.49,
      },
      debit_card: {
        percentage: 1.99,
      },
    },
    requiresCredentials: true,
    credentialsFields: ['pv', 'token'],
    documentationUrl: 'https://www.userede.com.br/desenvolvedores',
  },
  */
};

// ============================================
// HELPERS
// ============================================

/**
 * Retorna todos os gateways ativos
 */
export function getActiveGateways(): PaymentGateway[] {
  return Object.values(PAYMENT_GATEWAYS).filter(
    (gateway) => gateway.status === 'active'
  );
}

/**
 * Retorna gateways que suportam um método específico
 */
export function getGatewaysByMethod(method: PaymentMethod): PaymentGateway[] {
  return Object.values(PAYMENT_GATEWAYS).filter(
    (gateway) => gateway.supportedMethods.includes(method)
  );
}

/**
 * Retorna gateways ativos que suportam um método específico
 */
export function getActiveGatewaysByMethod(method: PaymentMethod): PaymentGateway[] {
  return getActiveGateways().filter(
    (gateway) => gateway.supportedMethods.includes(method)
  );
}

/**
 * Retorna um gateway específico pelo ID
 */
export function getGatewayById(id: string): PaymentGateway | undefined {
  return PAYMENT_GATEWAYS[id];
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
 * Verifica se um gateway está disponível (ativo ou beta)
 */
export function isGatewayAvailable(gatewayId: string): boolean {
  const gateway = getGatewayById(gatewayId);
  return gateway ? ['active', 'beta'].includes(gateway.status) : false;
}

/**
 * Retorna o nome de exibição de um gateway
 */
export function getGatewayDisplayName(gatewayId: string): string {
  const gateway = getGatewayById(gatewayId);
  return gateway?.displayName || gatewayId;
}

// ============================================
// TIPOS PARA TYPESCRIPT
// ============================================

export type GatewayId = keyof typeof PAYMENT_GATEWAYS;

export type ActiveGatewayId = 'asaas' | 'mercadopago' | 'pushinpay' | 'stripe';

export type PixGatewayId = 'asaas' | 'mercadopago' | 'pushinpay';

export type CreditCardGatewayId = 'mercadopago' | 'stripe';
