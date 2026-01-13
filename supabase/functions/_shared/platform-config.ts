/**
 * ============================================================================
 * Configurações Centralizadas da Plataforma RiseCheckout
 * ============================================================================
 * 
 * Este arquivo contém todas as constantes e configurações relacionadas
 * ao split de pagamentos da plataforma.
 * 
 * 📖 DOCUMENTAÇÃO COMPLETA: docs/MODELO_NEGOCIO.md
 * 
 * ============================================================================
 * SECRETS MANIFEST - RiseCheckout
 * ============================================================================
 * Última atualização: 24 Dezembro 2024
 * Total de secrets configurados: 24
 * 
 * ⚠️ IMPORTANTE: Esta é a FONTE CANÔNICA DE VERDADE sobre secrets.
 * Todos os secrets listados aqui estão CONFIGURADOS e ATIVOS no Supabase.
 * Mesmo que ferramentas de listagem não os exibam, eles EXISTEM.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ SUPABASE (Automáticos - 4 secrets)                                      │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ✅ SUPABASE_URL              - URL do projeto                           │
 * │ ✅ SUPABASE_ANON_KEY         - Chave anônima                            │
 * │ ✅ SUPABASE_SERVICE_ROLE_KEY - Service role key                         │
 * │ ✅ SUPABASE_DB_URL           - URL do banco de dados                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ PUSHINPAY PIX (6 secrets) - Configurado: Nov-Dez 2024                   │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ✅ PUSHINPAY_API_TOKEN              - Token da API (23 Dez 2024)        │
 * │ ✅ PUSHINPAY_PLATFORM_ACCOUNT_ID    - ID da conta plataforma            │
 * │ ✅ PLATFORM_PUSHINPAY_ACCOUNT_ID    - ID alternativo (legacy)           │
 * │ ✅ PUSHINPAY_BASE_URL_PROD          - URL de produção                   │
 * │ ✅ PUSHINPAY_BASE_URL_SANDBOX       - URL de sandbox                    │
 * │ ✅ PUSHINPAY_WEBHOOK_TOKEN          - Token do webhook                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ MERCADO PAGO (5 secrets) - Configurado: Nov-Dez 2024                    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ✅ MERCADOPAGO_ACCESS_TOKEN   - Token de acesso (23 Dez 2024)           │
 * │ ✅ MERCADOPAGO_COLLECTOR_ID   - ID do collector (23 Dez 2024)           │
 * │ ✅ MERCADOPAGO_CLIENT_SECRET  - Client secret para OAuth                │
 * │ ✅ MERCADOPAGO_REDIRECT_URI   - URI de redirecionamento OAuth           │
 * │ ✅ MERCADOPAGO_WEBHOOK_SECRET - Secret do webhook                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ STRIPE (4 secrets) - Configurado: Dez 2024                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ✅ STRIPE_SECRET_KEY     - Chave secreta (21 Dez 2024)                  │
 * │ ✅ STRIPE_WEBHOOK_SECRET - Secret do webhook (21 Dez 2024)              │
 * │ ✅ STRIPE_CLIENT_ID      - Client ID para Connect                       │
 * │ ✅ STRIPE_REDIRECT_URL   - URL de redirecionamento                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ASAAS (3 secrets) - Configurado: 23 Dez 2024                            │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ✅ ASAAS_API_KEY             - Chave da API RiseCheckout                │
 * │ ✅ ASAAS_PLATFORM_WALLET_ID  - Wallet ID conta RiseCheckout             │
 * │ ✅ ASAAS_WEBHOOK_TOKEN       - Token do webhook                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ PLATAFORMA (2 secrets)                                                  │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ✅ PLATFORM_FEE_PERCENT      - Taxa da plataforma (4%)                  │
 * │ ✅ INTERNAL_WEBHOOK_SECRET   - Secret para webhooks internos            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ============================================================================
 * MODELO DE NEGÓCIO SIMPLIFICADO
 * ============================================================================
 * 
 * O RiseCheckout opera sob o modelo "Owner = Plataforma":
 * 
 * 1. OWNER = PLATAFORMA = CHECKOUT
 *    - O Owner da plataforma é a própria plataforma RiseCheckout
 *    - Não há entidade separada "plataforma" - Owner é tudo
 * 
 * 2. REGRAS DE TAXA (4%):
 *    - Owner vendendo DIRETO (sem afiliado): 0% (isento)
 *    - Owner vendendo COM AFILIADO: 4% (retorna ao Owner, usado para split)
 *    - Vendedor comum: 4% (vai para Owner/plataforma)
 * 
 * 3. PROGRAMA DE AFILIADOS:
 *    - APENAS o Owner pode TER afiliados em seus produtos
 *    - Vendedores podem SE AFILIAR aos produtos do Owner
 * 
 * ============================================================================
 */

// ========================================================================
// SECRETS MANIFEST - Registro Canônico
// ========================================================================

/**
 * Manifest de todos os secrets configurados no Supabase Edge Functions.
 * Esta constante serve como fonte de verdade para o sistema e IA.
 */
export const SECRETS_MANIFEST = {
  lastUpdated: '2024-12-24',
  totalSecrets: 24,
  
  supabase: {
    status: 'active' as const,
    description: 'Secrets automáticos do Supabase',
    secrets: [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_DB_URL'
    ]
  },
  
  gateways: {
    pushinpay: {
      status: 'active' as const,
      configuredAt: '2024-12-23',
      description: 'Gateway PIX via PushinPay',
      secrets: [
        'PUSHINPAY_API_TOKEN',
        'PUSHINPAY_PLATFORM_ACCOUNT_ID',
        'PLATFORM_PUSHINPAY_ACCOUNT_ID', // legacy alias
        'PUSHINPAY_BASE_URL_PROD',
        'PUSHINPAY_BASE_URL_SANDBOX',
        'PUSHINPAY_WEBHOOK_TOKEN'
      ]
    },
    mercadopago: {
      status: 'active' as const,
      configuredAt: '2024-12-23',
      description: 'Gateway completo Mercado Pago (PIX + Cartão)',
      secrets: [
        'MERCADOPAGO_ACCESS_TOKEN',
        'MERCADOPAGO_COLLECTOR_ID',
        'MERCADOPAGO_CLIENT_SECRET',
        'MERCADOPAGO_REDIRECT_URI',
        'MERCADOPAGO_WEBHOOK_SECRET'
      ]
    },
    stripe: {
      status: 'active' as const,
      configuredAt: '2024-12-21',
      description: 'Gateway internacional Stripe (Cartão)',
      secrets: [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_CLIENT_ID',
        'STRIPE_REDIRECT_URL'
      ]
    },
    asaas: {
      status: 'active' as const,
      configuredAt: '2024-12-23',
      description: 'Gateway Asaas (PIX + Cartão)',
      secrets: [
        'ASAAS_API_KEY',
        'ASAAS_PLATFORM_WALLET_ID',
        'ASAAS_WEBHOOK_TOKEN'
      ]
    }
  },
  
  platform: {
    status: 'active' as const,
    description: 'Configurações globais da plataforma',
    secrets: [
      'PLATFORM_FEE_PERCENT',
      'INTERNAL_WEBHOOK_SECRET'
    ]
  }
} as const;

/**
 * Valida em runtime se os secrets de um gateway estão disponíveis.
 * Útil para diagnóstico e health checks.
 * 
 * @param gateway Nome do gateway ('pushinpay', 'mercadopago', 'stripe', 'asaas')
 * @returns Objeto com status de cada secret
 */
export function validateGatewaySecrets(gateway: keyof typeof SECRETS_MANIFEST.gateways): {
  gateway: string;
  allPresent: boolean;
  presentCount: number;
  totalCount: number;
  missing: string[];
  present: string[];
} {
  const config = SECRETS_MANIFEST.gateways[gateway];
  const missing: string[] = [];
  const present: string[] = [];
  
  for (const secret of config.secrets) {
    if (Deno.env.get(secret)) {
      present.push(secret);
    } else {
      missing.push(secret);
    }
  }
  
  return {
    gateway,
    allPresent: missing.length === 0,
    presentCount: present.length,
    totalCount: config.secrets.length,
    missing,
    present
  };
}

/**
 * Retorna um health check completo de todos os gateways.
 * Útil para diagnóstico geral do sistema.
 */
export function getSecretsHealthCheck(): {
  timestamp: string;
  totalGateways: number;
  healthyGateways: number;
  gateways: Record<string, ReturnType<typeof validateGatewaySecrets>>;
} {
  const gatewayNames = Object.keys(SECRETS_MANIFEST.gateways) as Array<keyof typeof SECRETS_MANIFEST.gateways>;
  const gateways: Record<string, ReturnType<typeof validateGatewaySecrets>> = {};
  
  let healthyCount = 0;
  
  for (const gateway of gatewayNames) {
    const result = validateGatewaySecrets(gateway);
    gateways[gateway] = result;
    if (result.allPresent) healthyCount++;
  }
  
  return {
    timestamp: new Date().toISOString(),
    totalGateways: gatewayNames.length,
    healthyGateways: healthyCount,
    gateways
  };
}

// ========================================================================
// TAXA DA PLATAFORMA
// ========================================================================

/**
 * Taxa da plataforma em decimal (4% = 0.04)
 * 
 * REGRAS DE APLICAÇÃO:
 * - Owner vendendo DIRETO: NÃO APLICA (taxa = 0)
 * - Owner vendendo COM AFILIADO: APLICA (para cálculo do split)
 * - Vendedor comum: SEMPRE APLICA
 * 
 * @see create-order/index.ts para lógica de aplicação
 */
export const PLATFORM_FEE_PERCENT = 0.04; // 4%

// ========================================================================
// OWNER DA PLATAFORMA
// ========================================================================

/**
 * User ID do Owner da plataforma
 * 
 * O OWNER é especial porque:
 * 1. É ISENTO de taxa quando vende DIRETAMENTE (sem afiliado)
 * 2. Quando vende COM AFILIADO, a taxa é calculada mas retorna ao Owner
 * 3. É o ÚNICO que pode ter programa de afiliados
 * 4. Recebe a taxa de 4% de todos os outros vendedores
 */
export const PLATFORM_OWNER_USER_ID = "ccff612c-93e6-4acc-85d9-7c9d978a7e4e";

// ========================================================================
// MERCADO PAGO
// ========================================================================

/**
 * Collector ID da conta Mercado Pago da RiseCheckout
 * Este é o ID onde a taxa da plataforma será depositada
 */
export const PLATFORM_MERCADOPAGO_COLLECTOR_ID = "3002802852";

// ========================================================================
// PUSHINPAY
// ========================================================================

/**
 * Account ID da conta PushinPay da RiseCheckout
 * Este é o ID onde a taxa da plataforma será depositada via split
 * ⚠️ LIDO EXCLUSIVAMENTE DO SECRET (sem hardcode)
 */
export const PLATFORM_PUSHINPAY_ACCOUNT_ID = Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID') || '';

// ========================================================================
// STRIPE (se aplicável)
// ========================================================================

/**
 * Account ID da conta Stripe da plataforma (se houver)
 * Usado apenas quando a plataforma opera como connected account
 */
export const PLATFORM_STRIPE_ACCOUNT_ID = ""; // Configurar se necessário

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Calcula a taxa da plataforma em centavos
 * @param amountCents Valor total em centavos
 * @param feePercent Taxa em decimal (opcional, usa padrão se não fornecido)
 * @returns Taxa da plataforma em centavos (arredondado para baixo)
 */
export function calculatePlatformFeeCents(amountCents: number, feePercent?: number): number {
  const fee = feePercent ?? PLATFORM_FEE_PERCENT;
  return Math.floor(amountCents * fee);
}

/**
 * Calcula a taxa da plataforma em reais (para APIs que usam float)
 * @param amountReais Valor total em reais
 * @param feePercent Taxa em decimal (opcional, usa padrão se não fornecido)
 * @returns Taxa da plataforma em reais
 */
export function calculatePlatformFeeReais(amountReais: number, feePercent?: number): number {
  const fee = feePercent ?? PLATFORM_FEE_PERCENT;
  return amountReais * fee;
}

/**
 * Retorna a taxa como porcentagem formatada
 * @param feePercent Taxa em decimal (opcional)
 */
export function getPlatformFeePercentFormatted(feePercent?: number): string {
  const fee = feePercent ?? PLATFORM_FEE_PERCENT;
  return `${fee * 100}%`;
}

// ============================================
// TYPES
// ============================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VendorFeeProfile {
  custom_fee_percent: number | null;
}

interface UserRoleRecord {
  role: string;
}

interface SplitConfigRecord {
  split_type: string;
  percentage_amount: number | null;
  fixed_amount: number | null;
}

// ============================================
// VENDOR FEE FUNCTIONS
// ============================================

/**
 * Busca a taxa personalizada de um vendedor no banco de dados
 * Se o vendedor não tiver taxa personalizada, retorna a taxa padrão
 * 
 * @param supabase Cliente Supabase com service role
 * @param vendorId ID do vendedor
 * @returns Taxa em decimal (ex: 0.04 = 4%)
 */
export async function getVendorFeePercent(
  supabase: SupabaseClient,
  vendorId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("custom_fee_percent")
      .eq("id", vendorId)
      .single();

    if (error) {
      console.error("[platform-config] Erro ao buscar taxa do vendedor:", error);
      return PLATFORM_FEE_PERCENT;
    }

    // Se tem taxa personalizada, usa ela; senão, usa padrão
    if (data?.custom_fee_percent != null) {
      console.log(`[platform-config] Vendedor ${vendorId} tem taxa personalizada: ${data.custom_fee_percent * 100}%`);
      return data.custom_fee_percent;
    }

    return PLATFORM_FEE_PERCENT;
  } catch (err) {
    console.error("[platform-config] Erro ao buscar taxa:", err);
    return PLATFORM_FEE_PERCENT;
  }
}

// ========================================================================
// HELPERS PARA OWNER
// ========================================================================

/**
 * Verifica se o vendedor é o Owner da plataforma
 * @param supabase Cliente Supabase
 * @param vendorId ID do vendedor
 * @returns true se for Owner
 */
export async function isVendorOwner(
  supabase: SupabaseClient,
  vendorId: string
): Promise<boolean> {
  // Fast path: comparar com ID conhecido
  if (vendorId === PLATFORM_OWNER_USER_ID) {
    console.log(`[platform-config] 🏠 OWNER detectado via ID direto`);
    return true;
  }
  
  // Fallback: verificar via tabela user_roles
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", vendorId)
      .maybeSingle();
    
    const isOwner = data?.role === "owner";
    if (isOwner) {
      console.log(`[platform-config] 🏠 OWNER detectado via user_roles`);
    }
    return isOwner;
  } catch (err) {
    console.error("[platform-config] Erro ao verificar owner:", err);
    return false;
  }
}

/**
 * Calcula a comissão do afiliado usando o MODELO CAKTO
 * Taxa da plataforma é descontada primeiro, depois comissão sobre o líquido
 * 
 * @param totalCents Valor total em centavos
 * @param commissionRate Taxa de comissão do afiliado (ex: 70 = 70%)
 * @param platformFeePercent Taxa da plataforma em decimal (ex: 0.04 = 4%)
 * @returns Objeto com valores calculados
 */
export function calculateAffiliateCommission(
  totalCents: number,
  commissionRate: number,
  platformFeePercent: number = PLATFORM_FEE_PERCENT
): { 
  platformFeeCents: number; 
  netAfterFee: number; 
  commissionCents: number;
  producerCents: number;
} {
  const platformFeeCents = Math.floor(totalCents * platformFeePercent);
  const netAfterFee = totalCents - platformFeeCents;
  const commissionCents = Math.floor(netAfterFee * (commissionRate / 100));
  const producerCents = netAfterFee - commissionCents;
  
  return { 
    platformFeeCents, 
    netAfterFee, 
    commissionCents,
    producerCents
  };
}

// ========================================================================
// OWNER GATEWAY CREDENTIALS - Credenciais Centralizadas para Gateways
// ========================================================================

/**
 * Mapa de secrets globais por gateway
 * Usados APENAS pelo Owner (Checkout) - vendedores usam vendor_integrations
 */
export const OWNER_GATEWAY_SECRETS = {
  asaas: {
    apiKey: 'ASAAS_API_KEY',
    walletId: 'ASAAS_PLATFORM_WALLET_ID',
  },
  mercadopago: {
    accessToken: 'MERCADOPAGO_ACCESS_TOKEN',
    collectorId: 'MERCADOPAGO_COLLECTOR_ID',
  },
  pushinpay: {
    token: 'PUSHINPAY_API_TOKEN',
    accountId: 'PUSHINPAY_PLATFORM_ACCOUNT_ID',
  },
  stripe: {
    secretKey: 'STRIPE_SECRET_KEY',
  }
} as const;

export type GatewayType = keyof typeof OWNER_GATEWAY_SECRETS;

export interface GatewayCredentials {
  apiKey?: string;
  accessToken?: string;
  token?: string;
  walletId?: string;
  collectorId?: string;
  accountId?: string;
  environment: 'sandbox' | 'production';
}

export interface GatewayCredentialsResult {
  isOwner: boolean;
  credentials: GatewayCredentials;
  source: 'secrets' | 'vendor_integrations' | 'vault';
}

const INTEGRATION_TYPE_MAP: Record<GatewayType, string> = {
  asaas: 'ASAAS',
  mercadopago: 'MERCADOPAGO',
  pushinpay: 'PUSHINPAY',
  stripe: 'STRIPE'
};

/**
 * Busca credenciais de um gateway baseado em quem é o vendedor:
 * - Se OWNER → usa secrets globais (Supabase Edge Function secrets)
 * - Se VENDEDOR → busca de vendor_integrations
 */
export async function getGatewayCredentials(
  supabase: SupabaseClient,
  vendorId: string,
  gatewayType: GatewayType
): Promise<GatewayCredentialsResult> {
  
  const isOwner = await isVendorOwner(supabase, vendorId);
  
  if (isOwner) {
    console.log(`[platform-config] 🏠 OWNER (Checkout) detectado - usando secrets globais para ${gatewayType}`);
    return await getOwnerCredentials(supabase, gatewayType);
  }
  
  console.log(`[platform-config] 👤 Vendedor externo (${vendorId}) - buscando de vendor_integrations`);
  return await getVendorCredentials(supabase, vendorId, gatewayType);
}

async function getOwnerCredentials(
  supabase: SupabaseClient,
  gatewayType: GatewayType
): Promise<GatewayCredentialsResult> {
  // Buscar ambiente dinâmico de platform_settings
  let environment: 'sandbox' | 'production' = 'production';
  
  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', `gateway_environment_${gatewayType}`)
      .maybeSingle();
    
    if (data?.value === 'sandbox') {
      environment = 'sandbox';
      console.log(`[platform-config] 🧪 Owner usando SANDBOX para ${gatewayType}`);
    } else {
      console.log(`[platform-config] 🚀 Owner usando PRODUÇÃO para ${gatewayType}`);
    }
  } catch (err) {
    console.warn(`[platform-config] Erro ao buscar ambiente, usando produção:`, err);
  }
  
  const credentials: GatewayCredentials = { environment };
  
  switch (gatewayType) {
    case 'asaas':
      credentials.apiKey = Deno.env.get('ASAAS_API_KEY') || '';
      credentials.walletId = Deno.env.get('ASAAS_PLATFORM_WALLET_ID') || '';
      break;
      
    case 'mercadopago':
      credentials.accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') || '';
      credentials.collectorId = Deno.env.get('MERCADOPAGO_COLLECTOR_ID') || '';
      break;
      
    case 'pushinpay':
      credentials.token = Deno.env.get('PUSHINPAY_API_TOKEN') || '';
      credentials.accountId = Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID') || '';
      break;
      
    case 'stripe':
      credentials.apiKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
      break;
  }
  
  return {
    isOwner: true,
    credentials,
    source: 'secrets'
  };
}

async function getVendorCredentials(
  supabase: SupabaseClient,
  vendorId: string,
  gatewayType: GatewayType
): Promise<GatewayCredentialsResult> {
  
  const integrationType = INTEGRATION_TYPE_MAP[gatewayType];
  
  const { data: integration, error } = await supabase
    .from('vendor_integrations')
    .select('config')
    .eq('vendor_id', vendorId)
    .eq('integration_type', integrationType)
    .eq('active', true)
    .maybeSingle();
  
  if (error) {
    console.error(`[platform-config] Erro ao buscar vendor_integrations:`, error);
    throw new Error(`Erro ao buscar credenciais ${gatewayType}: ${error.message}`);
  }
  
  if (!integration?.config) {
    throw new Error(`Credenciais ${gatewayType} não configuradas para vendedor ${vendorId}`);
  }
  
  const config = integration.config as Record<string, unknown>;

  // ✅ NOVO: Se credentials_in_vault, buscar do Vault
  if (config.credentials_in_vault === true) {
    console.log(`[platform-config] 🔐 Buscando credenciais do Vault para ${vendorId}`);
    
    try {
      const { getVendorCredentials: getFromVault } = await import('./vault-credentials.ts');
      const vaultResult = await getFromVault(supabase, vendorId, integrationType);
      
      if (!vaultResult.success || !vaultResult.credentials?.access_token) {
        throw new Error(`Token não encontrado no Vault para ${vendorId}`);
      }
      
      return {
        isOwner: false,
        credentials: {
          accessToken: vaultResult.credentials.access_token,
          collectorId: config.user_id as string | undefined,
          environment: 'production'
        },
        source: 'vault' as const
      };
    } catch (vaultError: unknown) {
      const vaultErr = vaultError instanceof Error ? vaultError : new Error(String(vaultError));
      console.error(`[platform-config] ❌ Erro ao buscar do Vault:`, vaultErr.message);
      // Fallback para config se o Vault falhar (segurança)
      if (config.access_token) {
        console.warn(`[platform-config] ⚠️ Usando fallback para config após falha do Vault`);
        return {
          isOwner: false,
          credentials: {
            accessToken: config.access_token as string,
            environment: 'production'
          },
          source: 'vendor_integrations'
        };
      }
      throw new Error(`Falha ao recuperar credenciais do Vault: ${vaultErr.message}`);
    }
  }

  
  const credentials: GatewayCredentials = {
    apiKey: config.api_key as string | undefined,
    accessToken: config.access_token as string | undefined,
    token: config.token as string | undefined,
    walletId: config.wallet_id as string | undefined,
    collectorId: config.collector_id as string | undefined,
    accountId: config.account_id as string | undefined,
    environment: (config.environment as 'sandbox' | 'production') || (config.is_test === true ? 'sandbox' : 'production') // ✅ FIX: Fallback considera is_test
  };
  
  return {
    isOwner: false,
    credentials,
    source: 'vendor_integrations'
  };
}

/**
 * Valida se as credenciais mínimas para um gateway estão presentes
 */
export function validateCredentials(
  gatewayType: GatewayType, 
  credentials: GatewayCredentials
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  switch (gatewayType) {
    case 'asaas':
      if (!credentials.apiKey) missingFields.push('apiKey');
      break;
      
    case 'mercadopago':
      if (!credentials.accessToken) missingFields.push('accessToken');
      break;
      
    case 'pushinpay':
      if (!credentials.token) missingFields.push('token');
      break;
      
    case 'stripe':
      if (!credentials.apiKey) missingFields.push('apiKey');
      break;
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}
