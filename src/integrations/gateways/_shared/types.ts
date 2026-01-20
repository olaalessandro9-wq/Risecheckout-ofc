/**
 * Shared Gateway Types
 * 
 * @module integrations/gateways/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Types base compartilhados por TODOS os gateways.
 * Elimina duplicação e garante consistência.
 */

import type { GatewayId, GatewayEnvironment, IntegrationType } from "@/config/gateways/types";

// ============================================================================
// BASE CONFIG TYPES
// ============================================================================

/**
 * Configuração base para qualquer gateway
 */
export interface BaseGatewayConfig {
  readonly environment: GatewayEnvironment;
  readonly isConfigured: boolean;
}

/**
 * Resultado de operações de conexão/desconexão
 */
export interface GatewayOperationResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Resultado de validação de credenciais
 */
export interface GatewayValidationResult {
  readonly valid: boolean;
  readonly message?: string;
  readonly accountName?: string;
  readonly walletId?: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type para hooks de configuração
 */
export interface UseGatewayConfigReturn<TConfig extends BaseGatewayConfig> {
  readonly config: TConfig | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
}

/**
 * Return type para hooks de validação
 */
export interface UseGatewayValidationReturn<TResult extends GatewayValidationResult> {
  readonly validate: (...args: unknown[]) => Promise<TResult>;
  readonly isValidating: boolean;
  readonly lastResult: TResult | null;
}

/**
 * Return type para hooks de save
 */
export interface UseGatewaySaveReturn<TConfig> {
  readonly save: (config: TConfig) => Promise<GatewayOperationResult>;
  readonly isSaving: boolean;
}

/**
 * Return type para hooks de disconnect
 */
export interface UseGatewayDisconnectReturn {
  readonly disconnect: () => Promise<GatewayOperationResult>;
  readonly isDisconnecting: boolean;
}

/**
 * Return type para hooks de status de conexão
 */
export interface UseGatewayConnectionStatusReturn {
  readonly isConnected: boolean;
  readonly isLoading: boolean;
  readonly refetch: () => Promise<void>;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props base para componentes de configuração de gateway
 */
export interface GatewayConfigFormProps {
  readonly onConnectionChange?: () => void;
}

/**
 * Props para componentes de status de conexão
 */
export interface GatewayConnectionStatusProps {
  readonly connected: boolean;
  readonly environment?: GatewayEnvironment;
  readonly accountName?: string;
  readonly onDisconnect?: () => void;
  readonly isDisconnecting?: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Payload base para chamadas de API de gateway
 */
export interface GatewayApiPayload {
  readonly action: string;
  readonly gatewayId?: GatewayId;
  readonly integrationType?: IntegrationType;
}

/**
 * Response base de API de gateway
 */
export interface GatewayApiResponse<TData = unknown> {
  readonly success: boolean;
  readonly data?: TData;
  readonly error?: string;
}
