/**
 * gateway-credentials.ts
 * 
 * Busca credenciais de gateway dinamicamente baseado no vendedor (Owner vs Vendedor comum).
 * Extraído de platform-config.ts para RISE ARCHITECT PROTOCOL V3 (< 300 linhas).
 * 
 * @module _shared/gateway-credentials
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  PLATFORM_OWNER_USER_ID, 
  OWNER_GATEWAY_SECRETS, 
  type GatewayType 
} from "./platform-constants.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("GatewayCredentials");

// ========================================================================
// INTERFACES
// ========================================================================

/**
 * Credenciais de um gateway de pagamento
 * Suporta tanto snake_case (interno) quanto camelCase (compatibilidade)
 */
export interface GatewayCredentials {
  // Snake case (padrão interno)
  api_key?: string;
  access_token?: string;
  token?: string;
  wallet_id?: string;
  collector_id?: string;
  account_id?: string;
  
  // CamelCase (aliases para compatibilidade)
  apiKey?: string;
  accessToken?: string;
  walletId?: string;
  collectorId?: string;
  accountId?: string;
  
  /** Ambiente (sandbox ou production) */
  environment: 'sandbox' | 'production';
  /** Origem das credenciais */
  source: 'owner_secrets' | 'vendor_integration';
}

/**
 * Resultado da validação de credenciais
 */
export interface CredentialsValidationResult {
  valid: boolean;
  missingFields: string[];
}

/**
 * Resultado da busca de credenciais
 */
export interface GatewayCredentialsResult {
  success: boolean;
  credentials?: GatewayCredentials;
  error?: string;
  isOwner: boolean;
  source: 'owner_secrets' | 'vendor_integration' | 'error';
}

// ========================================================================
// FUNÇÕES PRINCIPAIS
// ========================================================================

/**
 * Busca credenciais de gateway com lógica Owner vs Vendedor
 */
export async function getGatewayCredentials(
  supabase: SupabaseClient,
  vendorId: string,
  gateway: GatewayType
): Promise<GatewayCredentialsResult> {
  try {
    const isOwner = vendorId === PLATFORM_OWNER_USER_ID;

    // ========================================================================
    // CASO 1: OWNER - Buscar de Secrets Globais
    // ========================================================================
    if (isOwner) {
      log.info(`Buscando credenciais do Owner para ${gateway}`);
      
      const credentials: GatewayCredentials = {
        environment: 'production',
        source: 'owner_secrets',
      };

      // Buscar secrets específicos do gateway com type assertions
      switch (gateway) {
        case 'asaas': {
          const secrets = OWNER_GATEWAY_SECRETS.asaas;
          const apiKey = Deno.env.get(secrets.apiKey);
          const walletId = Deno.env.get(secrets.walletId);
          credentials.api_key = apiKey;
          credentials.apiKey = apiKey;
          credentials.wallet_id = walletId;
          credentials.walletId = walletId;
          break;
        }

        case 'mercadopago': {
          const secrets = OWNER_GATEWAY_SECRETS.mercadopago;
          const accessToken = Deno.env.get(secrets.accessToken);
          const collectorId = Deno.env.get(secrets.collectorId);
          credentials.access_token = accessToken;
          credentials.accessToken = accessToken;
          credentials.collector_id = collectorId;
          credentials.collectorId = collectorId;
          break;
        }

        case 'pushinpay': {
          const secrets = OWNER_GATEWAY_SECRETS.pushinpay;
          const token = Deno.env.get(secrets.token);
          const accountId = Deno.env.get(secrets.accountId);
          credentials.token = token;
          credentials.account_id = accountId;
          credentials.accountId = accountId;
          break;
        }

        case 'stripe': {
          const secrets = OWNER_GATEWAY_SECRETS.stripe;
          const secretKey = Deno.env.get(secrets.secretKey);
          credentials.api_key = secretKey;
          credentials.apiKey = secretKey;
          break;
        }
      }

      // Validar se as credenciais mínimas estão presentes
      const validation = validateCredentials(gateway, credentials);
      if (!validation.valid) {
        return {
          success: false,
          error: `Credenciais do Owner para ${gateway} não configuradas nos secrets. Faltando: ${validation.missingFields.join(', ')}`,
          isOwner: true,
          source: 'error',
        };
      }

      return {
        success: true,
        credentials,
        isOwner: true,
        source: 'owner_secrets',
      };
    }

    // ========================================================================
    // CASO 2: VENDEDOR COMUM - Buscar de vendor_integrations
    // ========================================================================
    log.info(`Buscando credenciais do vendedor ${vendorId} para ${gateway}`);

    const integrationTypeMap: Record<GatewayType, string> = {
      asaas: 'ASAAS',
      mercadopago: 'MERCADOPAGO',
      pushinpay: 'PUSHINPAY',
      stripe: 'STRIPE',
    };

    const integrationType = integrationTypeMap[gateway];

    const { data: integration, error: dbError } = await supabase
      .from('vendor_integrations')
      .select('config, active')
      .eq('vendor_id', vendorId)
      .eq('integration_type', integrationType)
      .eq('active', true)
      .single();

    if (dbError || !integration) {
      return {
        success: false,
        error: `Vendedor ${vendorId} não possui integração ativa com ${gateway}`,
        isOwner: false,
        source: 'error',
      };
    }

    const config = integration.config as Record<string, unknown>;
    const credentials: GatewayCredentials = {
      environment: (config.environment as 'sandbox' | 'production') || 'production',
      source: 'vendor_integration',
    };

    // Mapear campos do config para GatewayCredentials (ambos os formatos)
    switch (gateway) {
      case 'asaas': {
        const apiKey = config.api_key as string;
        const walletId = config.wallet_id as string;
        credentials.api_key = apiKey;
        credentials.apiKey = apiKey;
        credentials.wallet_id = walletId;
        credentials.walletId = walletId;
        break;
      }

      case 'mercadopago': {
        const accessToken = config.access_token as string;
        const collectorId = config.collector_id as string;
        credentials.access_token = accessToken;
        credentials.accessToken = accessToken;
        credentials.collector_id = collectorId;
        credentials.collectorId = collectorId;
        break;
      }

      case 'pushinpay': {
        const token = config.token as string;
        const accountId = config.account_id as string;
        credentials.token = token;
        credentials.account_id = accountId;
        credentials.accountId = accountId;
        break;
      }

      case 'stripe': {
        const secretKey = config.secret_key as string;
        const accountId = config.account_id as string;
        credentials.api_key = secretKey;
        credentials.apiKey = secretKey;
        credentials.account_id = accountId;
        credentials.accountId = accountId;
        break;
      }
    }

    // Validar se as credenciais mínimas estão presentes
    const validation = validateCredentials(gateway, credentials);
    if (!validation.valid) {
      return {
        success: false,
        error: `Credenciais do vendedor ${vendorId} para ${gateway} estão incompletas. Faltando: ${validation.missingFields.join(', ')}`,
        isOwner: false,
        source: 'error',
      };
    }

    return {
      success: true,
      credentials,
      isOwner: false,
      source: 'vendor_integration',
    };

  } catch (error) {
    log.error("Erro ao buscar credenciais", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      isOwner: vendorId === PLATFORM_OWNER_USER_ID,
      source: 'error',
    };
  }
}

/**
 * Valida se as credenciais mínimas estão presentes
 * 
 * @param gateway - Gateway de pagamento
 * @param credentials - Credenciais a validar (opcional)
 * @returns Resultado da validação com campos faltantes
 */
export function validateCredentials(
  gateway: string,
  credentials?: GatewayCredentials
): CredentialsValidationResult {
  const missingFields: string[] = [];

  if (!credentials) {
    return { valid: false, missingFields: ['credentials'] };
  }

  switch (gateway) {
    case 'asaas':
      if (!credentials.api_key && !credentials.apiKey) {
        missingFields.push('api_key');
      }
      break;

    case 'mercadopago':
      if (!credentials.access_token && !credentials.accessToken) {
        missingFields.push('access_token');
      }
      break;

    case 'pushinpay':
      if (!credentials.token) {
        missingFields.push('token');
      }
      break;

    case 'stripe':
      if (!credentials.api_key && !credentials.apiKey) {
        missingFields.push('api_key');
      }
      break;

    default:
      missingFields.push('unknown_gateway');
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
