/**
 * gateway-credentials.ts
 * 
 * Busca credenciais de gateway dinamicamente baseado no vendedor (Owner vs Vendedor comum).
 * Extraído de platform-config.ts para RISE Protocol V2 (< 300 linhas).
 * 
 * @module _shared/gateway-credentials
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  PLATFORM_OWNER_USER_ID, 
  OWNER_GATEWAY_SECRETS, 
  type GatewayType 
} from "./platform-constants.ts";

// ========================================================================
// INTERFACES
// ========================================================================

/**
 * Credenciais de um gateway de pagamento
 */
export interface GatewayCredentials {
  /** API Key (Asaas) */
  api_key?: string;
  /** Access Token (Mercado Pago) */
  access_token?: string;
  /** Token genérico (PushinPay) */
  token?: string;
  /** Wallet ID para split (Asaas) */
  wallet_id?: string;
  /** Collector ID para split (Mercado Pago) */
  collector_id?: string;
  /** Account ID para split (PushinPay, Stripe) */
  account_id?: string;
  /** Ambiente (sandbox ou production) */
  environment: 'sandbox' | 'production';
  /** Origem das credenciais */
  source: 'owner_secrets' | 'vendor_integration';
}

/**
 * Resultado da busca de credenciais
 */
export interface GatewayCredentialsResult {
  success: boolean;
  credentials?: GatewayCredentials;
  error?: string;
}

// ========================================================================
// FUNÇÕES PRINCIPAIS
// ========================================================================

/**
 * Busca credenciais de gateway com lógica Owner vs Vendedor
 * 
 * LÓGICA:
 * - Se vendorId === PLATFORM_OWNER_USER_ID:
 *   → Buscar de Deno.env (secrets globais via OWNER_GATEWAY_SECRETS)
 *   → source = 'owner_secrets'
 * 
 * - Senão:
 *   → Buscar de vendor_integrations no banco
 *   → Descriptografar se necessário
 *   → source = 'vendor_integration'
 * 
 * @param supabase - Cliente Supabase
 * @param vendorId - ID do vendedor
 * @param gateway - Gateway de pagamento
 * @returns Resultado com credenciais ou erro
 * 
 * @example
 * ```typescript
 * const result = await getGatewayCredentials(supabase, vendorId, 'asaas');
 * if (result.success) {
 *   console.log('API Key:', result.credentials.api_key);
 * }
 * ```
 */
export async function getGatewayCredentials(
  supabase: SupabaseClient,
  vendorId: string,
  gateway: GatewayType
): Promise<GatewayCredentialsResult> {
  try {
    // ========================================================================
    // CASO 1: OWNER - Buscar de Secrets Globais
    // ========================================================================
    if (vendorId === PLATFORM_OWNER_USER_ID) {
      console.log(`[gateway-credentials] Buscando credenciais do Owner para ${gateway}`);
      
      const secretsMap = OWNER_GATEWAY_SECRETS[gateway];
      const credentials: GatewayCredentials = {
        environment: 'production',
        source: 'owner_secrets',
      };

      // Buscar secrets específicos do gateway
      switch (gateway) {
        case 'asaas':
          credentials.api_key = Deno.env.get(secretsMap.apiKey);
          credentials.wallet_id = Deno.env.get(secretsMap.walletId);
          break;

        case 'mercadopago':
          credentials.access_token = Deno.env.get(secretsMap.accessToken);
          credentials.collector_id = Deno.env.get(secretsMap.collectorId);
          break;

        case 'pushinpay':
          credentials.token = Deno.env.get(secretsMap.token);
          credentials.account_id = Deno.env.get(secretsMap.accountId);
          break;

        case 'stripe':
          credentials.api_key = Deno.env.get(secretsMap.secretKey);
          break;
      }

      // Validar se as credenciais mínimas estão presentes
      if (!validateCredentials(credentials, gateway)) {
        return {
          success: false,
          error: `Credenciais do Owner para ${gateway} não configuradas nos secrets`,
        };
      }

      return {
        success: true,
        credentials,
      };
    }

    // ========================================================================
    // CASO 2: VENDEDOR COMUM - Buscar de vendor_integrations
    // ========================================================================
    console.log(`[gateway-credentials] Buscando credenciais do vendedor ${vendorId} para ${gateway}`);

    // Mapear gateway para integration_type
    const integrationTypeMap: Record<GatewayType, string> = {
      asaas: 'ASAAS',
      mercadopago: 'MERCADOPAGO',
      pushinpay: 'PUSHINPAY',
      stripe: 'STRIPE',
    };

    const integrationType = integrationTypeMap[gateway];

    // Buscar integração no banco
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
      };
    }

    // Extrair credenciais do config
    const config = integration.config as Record<string, unknown>;
    const credentials: GatewayCredentials = {
      environment: (config.environment as 'sandbox' | 'production') || 'production',
      source: 'vendor_integration',
    };

    // Mapear campos do config para GatewayCredentials
    switch (gateway) {
      case 'asaas':
        credentials.api_key = config.api_key as string;
        credentials.wallet_id = config.wallet_id as string;
        break;

      case 'mercadopago':
        credentials.access_token = config.access_token as string;
        credentials.collector_id = config.collector_id as string;
        break;

      case 'pushinpay':
        credentials.token = config.token as string;
        credentials.account_id = config.account_id as string;
        break;

      case 'stripe':
        credentials.api_key = config.secret_key as string;
        credentials.account_id = config.account_id as string;
        break;
    }

    // Validar se as credenciais mínimas estão presentes
    if (!validateCredentials(credentials, gateway)) {
      return {
        success: false,
        error: `Credenciais do vendedor ${vendorId} para ${gateway} estão incompletas`,
      };
    }

    return {
      success: true,
      credentials,
    };

  } catch (error) {
    console.error('[gateway-credentials] Erro ao buscar credenciais:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Valida se as credenciais mínimas estão presentes
 * 
 * @param credentials - Credenciais a validar
 * @param gateway - Gateway de pagamento
 * @returns true se válidas, false caso contrário
 * 
 * @example
 * ```typescript
 * const valid = validateCredentials(credentials, 'asaas');
 * if (!valid) {
 *   console.error('Credenciais inválidas');
 * }
 * ```
 */
export function validateCredentials(
  credentials: GatewayCredentials,
  gateway: string
): boolean {
  switch (gateway) {
    case 'asaas':
      return !!credentials.api_key;

    case 'mercadopago':
      return !!credentials.access_token;

    case 'pushinpay':
      return !!credentials.token;

    case 'stripe':
      return !!credentials.api_key;

    default:
      return false;
  }
}
