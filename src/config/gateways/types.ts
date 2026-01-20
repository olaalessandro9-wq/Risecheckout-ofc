/**
 * Gateway Registry Types
 * 
 * @module config/gateways
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Single Source of Truth para TODOS os tipos relacionados a gateways.
 * Usado tanto pelo Registry quanto pelos módulos de integração.
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// GATEWAY IDENTIFIERS
// ============================================================================

/**
 * IDs de todos os gateways suportados pelo sistema.
 * Usar este tipo em vez de strings literais em todo o código.
 */
export type GatewayId = 'asaas' | 'mercadopago' | 'pushinpay' | 'stripe';

/**
 * Tipo de integração armazenado no banco de dados (vendor_integrations.integration_type)
 */
export type IntegrationType = 'ASAAS' | 'MERCADOPAGO' | 'PUSHINPAY' | 'STRIPE';

// ============================================================================
// GATEWAY STATUS & ENVIRONMENT
// ============================================================================

/**
 * Status do gateway na plataforma
 */
export type GatewayStatus = 'active' | 'beta' | 'coming_soon' | 'deprecated';

/**
 * Ambiente de operação do gateway
 */
export type GatewayEnvironment = 'sandbox' | 'production';

// ============================================================================
// GATEWAY CAPABILITIES
// ============================================================================

/**
 * Métodos de pagamento suportados
 */
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card';

/**
 * Capacidades de um gateway
 */
export interface GatewayCapabilities {
  readonly pix: boolean;
  readonly creditCard: boolean;
  readonly boleto: boolean;
  readonly debitCard: boolean;
}

/**
 * Tipo de autenticação do gateway
 */
export type GatewayAuthType = 'api_key' | 'oauth' | 'mixed';

// ============================================================================
// GATEWAY FEES
// ============================================================================

/**
 * Estrutura de taxas de um gateway
 */
export interface GatewayFees {
  readonly fixed?: number;       // Taxa fixa em centavos (ex: 200 = R$ 2,00)
  readonly percentage?: number;  // Taxa percentual (ex: 3.99 = 3,99%)
  readonly transaction?: number; // Taxa por transação em centavos
}

// ============================================================================
// GATEWAY DEFINITION (REGISTRY ENTRY)
// ============================================================================

/**
 * Definição completa de um gateway no Registry.
 * Esta é a estrutura principal usada para renderização e lógica.
 */
export interface GatewayDefinition {
  /** ID único do gateway */
  readonly id: GatewayId;
  
  /** Tipo de integração no banco de dados */
  readonly integrationType: IntegrationType;
  
  /** Nome para exibição */
  readonly name: string;
  
  /** Descrição curta */
  readonly description: string;
  
  /** Ícone do Lucide para UI */
  readonly icon: LucideIcon;
  
  /** Cor do ícone (hex) */
  readonly iconColor: string;
  
  /** Status do gateway na plataforma */
  readonly status: GatewayStatus;
  
  /** Capacidades do gateway */
  readonly capabilities: GatewayCapabilities;
  
  /** Tipo de autenticação */
  readonly authType: GatewayAuthType;
  
  /** Se permite toggle sandbox/production */
  readonly hasEnvironmentToggle: boolean;
  
  /** Taxas por método de pagamento */
  readonly fees: Readonly<Partial<Record<PaymentMethod, GatewayFees>>>;
  
  /** URL da documentação oficial */
  readonly documentationUrl?: string;
}

// ============================================================================
// CONNECTION STATUS
// ============================================================================

/**
 * Status de conexão de um gateway para um vendor
 */
export interface GatewayConnectionStatus {
  readonly id: GatewayId;
  readonly connected: boolean;
  readonly mode: GatewayEnvironment | null;
  readonly lastConnectedAt: string | null;
}

/**
 * Mapa de status de conexão por gateway
 */
export type GatewayConnectionMap = Record<GatewayId, GatewayConnectionStatus>;

// ============================================================================
// CREDENTIAL STATUS (para UI de configuração)
// ============================================================================

/**
 * Status das credenciais de um gateway
 */
export interface GatewayCredentialStatus {
  readonly configured: boolean;
  readonly viaSecrets?: boolean;
}

/**
 * Mapa de status de credenciais por gateway
 */
export type GatewayCredentialsMap = Partial<Record<GatewayId, GatewayCredentialStatus>>;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Gateway com status de conexão (usado em listas de UI)
 */
export interface GatewayWithStatus extends GatewayDefinition {
  readonly connectionStatus: GatewayConnectionStatus;
}

/**
 * Props comuns para componentes de configuração de gateway
 */
export interface GatewayConfigFormProps {
  readonly onConnectionChange?: () => void;
}
