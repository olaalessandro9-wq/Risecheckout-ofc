// supabase/functions/check-secrets/index.ts
// Edge Function de Diagnóstico - Verifica status de todas as secrets do sistema

import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("check-secrets");

const corsHeaders = PUBLIC_CORS_HEADERS;

interface SecretStatus {
  configured: boolean;
  category: string;
}

interface SecretsReport {
  timestamp: string;
  summary: {
    total: number;
    configured: number;
    missing: number;
    percentage: string;
  };
  secrets: Record<string, SecretStatus>;
  categories: Record<string, { configured: number; total: number }>;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Lista completa de secrets esperadas pelo sistema (NOMES CORRETOS)
  // NOTE: Supabase auto-injects these env vars. After migrating to new API keys:
  // - SUPABASE_ANON_KEY contains the publishable key (sb_publishable_...)
  // - SUPABASE_SERVICE_ROLE_KEY contains the secret key (sb_secret_...)
  // The env var NAMES remain unchanged for backwards compatibility.
  const expectedSecrets: Record<string, string> = {
    // Supabase Core (env var names kept by Supabase, values are new-format keys)
    'SUPABASE_URL': 'supabase',
    'SUPABASE_ANON_KEY': 'supabase', // Contains publishable key (sb_publishable_...)
    'SUPABASE_SERVICE_ROLE_KEY': 'supabase', // Contains secret key (sb_secret_...)
    'SUPABASE_DB_URL': 'supabase',
    
    // Multi-Secret Key Domains (RISE V3 - Blast Radius Isolation)
    'SUPABASE_SECRET_WEBHOOKS': 'supabase-domains',
    'SUPABASE_SECRET_PAYMENTS': 'supabase-domains',
    'SUPABASE_SECRET_ADMIN': 'supabase-domains',
    
    // Mercado Pago
    'MERCADOPAGO_ACCESS_TOKEN': 'mercadopago',
    'MERCADOPAGO_CLIENT_SECRET': 'mercadopago',
    'MERCADOPAGO_REDIRECT_URI': 'mercadopago',
    'MERCADOPAGO_WEBHOOK_SECRET': 'mercadopago',
    'MERCADOPAGO_COLLECTOR_ID': 'mercadopago',
    
    // Stripe (STRIPE_REDIRECT_URL removido - hardcoded em stripe-oauth-config.ts SSOT)
    'STRIPE_SECRET_KEY': 'stripe',
    'STRIPE_WEBHOOK_SECRET': 'stripe',
    'STRIPE_CLIENT_ID': 'stripe',
    
    // PushinPay
    'PUSHINPAY_API_TOKEN': 'pushinpay',
    'PUSHINPAY_WEBHOOK_TOKEN': 'pushinpay',
    'PUSHINPAY_PLATFORM_ACCOUNT_ID': 'pushinpay',
    'PUSHINPAY_BASE_URL_PROD': 'pushinpay',
    'PUSHINPAY_BASE_URL_SANDBOX': 'pushinpay',
    
    // Asaas
    'ASAAS_API_KEY': 'asaas',
    'ASAAS_PLATFORM_WALLET_ID': 'asaas',
    'ASAAS_WEBHOOK_TOKEN': 'asaas',
    
    // Platform
    'PLATFORM_FEE_PERCENT': 'platform',
    'INTERNAL_WEBHOOK_SECRET': 'platform',
  };

  const secrets: Record<string, SecretStatus> = {};
  const categories: Record<string, { configured: number; total: number }> = {};
  let configuredCount = 0;

  // Verificar cada secret
  for (const [name, category] of Object.entries(expectedSecrets)) {
    const value = Deno.env.get(name);
    const isConfigured = value !== undefined && value !== null && value.trim() !== '';
    
    secrets[name] = {
      configured: isConfigured,
      category: category,
    };

    if (isConfigured) {
      configuredCount++;
    }

    // Agregar por categoria
    if (!categories[category]) {
      categories[category] = { configured: 0, total: 0 };
    }
    categories[category].total++;
    if (isConfigured) {
      categories[category].configured++;
    }
  }

  const total = Object.keys(expectedSecrets).length;
  const missing = total - configuredCount;
  const percentage = ((configuredCount / total) * 100).toFixed(1);

  const report: SecretsReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      configured: configuredCount,
      missing,
      percentage: `${percentage}%`,
    },
    secrets,
    categories,
  };

  log.info(`Report generated: ${configuredCount}/${total} secrets configured (${percentage}%)`);

  return new Response(
    JSON.stringify(report, null, 2),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
