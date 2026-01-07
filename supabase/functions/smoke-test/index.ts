/**
 * ============================================================================
 * SMOKE-TEST EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 1.0
 * Data: 2026-01-07
 * 
 * Valida que o sistema está saudável após cada deploy.
 * Executa uma série de verificações críticas e retorna status.
 * 
 * ============================================================================
 * TESTES EXECUTADOS
 * ============================================================================
 * 
 * 1. Secrets críticos existem
 * 2. Tabelas críticas acessíveis
 * 3. Edge Functions respondem
 * 4. Vault funcional
 * 5. RPC Functions existem
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const FUNCTION_VERSION = "1.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// LOGGING
// ============================================================================

function logInfo(message: string, data?: unknown) {
  console.log(`[smoke-test] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: unknown) {
  console.error(`[smoke-test] [ERROR] ${message}`, error);
}

// ============================================================================
// TEST TYPES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration_ms: number;
}

interface SmokeTestResponse {
  success: boolean;
  version: string;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  duration_ms: number;
  tests: TestResult[];
}

// ============================================================================
// TEST: SECRETS
// ============================================================================

async function testSecrets(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const criticalSecrets = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INTERNAL_WEBHOOK_SECRET',
  ];

  const optionalSecrets = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_WEBHOOK_SECRET',
    'STRIPE_SECRET_KEY',
    'ASAAS_API_KEY',
    'PUSHINPAY_TOKEN',
  ];

  for (const secret of criticalSecrets) {
    const start = Date.now();
    const value = Deno.env.get(secret);
    const passed = !!value && value.length > 0;
    
    results.push({
      name: `Secret: ${secret}`,
      passed,
      message: passed ? 'Configurado' : 'AUSENTE (CRÍTICO)',
      duration_ms: Date.now() - start,
    });
  }

  // Verificar se ao menos um gateway está configurado
  const start = Date.now();
  const hasGateway = optionalSecrets.some(s => {
    const v = Deno.env.get(s);
    return v && v.length > 0;
  });

  results.push({
    name: 'Secret: Pelo menos 1 gateway',
    passed: hasGateway,
    message: hasGateway ? 'OK' : 'Nenhum gateway configurado',
    duration_ms: Date.now() - start,
  });

  return results;
}

// ============================================================================
// TEST: TABLES
// ============================================================================

async function testTables(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  const tables = [
    'orders',
    'products',
    'offers',
    'checkouts',
    'order_events',
    'buyer_profiles',
    'buyer_product_access',
  ];

  for (const table of tables) {
    const start = Date.now();
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      const passed = !error;
      results.push({
        name: `Table: ${table}`,
        passed,
        message: passed ? 'Acessível' : `Erro: ${error?.message}`,
        duration_ms: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: `Table: ${table}`,
        passed: false,
        message: `Exceção: ${e.message}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return results;
}

// ============================================================================
// TEST: EDGE FUNCTIONS
// ============================================================================

async function testEdgeFunctions(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  // Test: health endpoint
  const healthStart = Date.now();
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/health`, {
      method: 'GET',
    });
    
    const passed = response.ok;
    results.push({
      name: 'EdgeFunction: health',
      passed,
      message: passed ? `Status ${response.status}` : `Falhou: ${response.status}`,
      duration_ms: Date.now() - healthStart,
    });
  } catch (e: any) {
    results.push({
      name: 'EdgeFunction: health',
      passed: false,
      message: `Exceção: ${e.message}`,
      duration_ms: Date.now() - healthStart,
    });
  }

  // Test: trigger-webhooks OPTIONS (CORS)
  const webhookStart = Date.now();
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
      method: 'OPTIONS',
    });
    
    const passed = response.ok;
    results.push({
      name: 'EdgeFunction: trigger-webhooks (CORS)',
      passed,
      message: passed ? `Status ${response.status}` : `Falhou: ${response.status}`,
      duration_ms: Date.now() - webhookStart,
    });
  } catch (e: any) {
    results.push({
      name: 'EdgeFunction: trigger-webhooks (CORS)',
      passed: false,
      message: `Exceção: ${e.message}`,
      duration_ms: Date.now() - webhookStart,
    });
  }

  // Test: create-order OPTIONS (CORS)
  const createOrderStart = Date.now();
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
      method: 'OPTIONS',
    });
    
    const passed = response.ok;
    results.push({
      name: 'EdgeFunction: create-order (CORS)',
      passed,
      message: passed ? `Status ${response.status}` : `Falhou: ${response.status}`,
      duration_ms: Date.now() - createOrderStart,
    });
  } catch (e: any) {
    results.push({
      name: 'EdgeFunction: create-order (CORS)',
      passed: false,
      message: `Exceção: ${e.message}`,
      duration_ms: Date.now() - createOrderStart,
    });
  }

  return results;
}

// ============================================================================
// TEST: VAULT & RPC FUNCTIONS
// ============================================================================

async function testVaultAndRPC(supabase: any): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test: RPC save_gateway_credentials exists
  const saveStart = Date.now();
  try {
    // Tentamos chamar com dados inválidos só para ver se a função existe
    const { error } = await supabase.rpc('save_gateway_credentials', {
      p_vendor_id: '00000000-0000-0000-0000-000000000000',
      p_gateway: '__test__',
      p_credentials: { test: true },
    });

    // Se der erro de constraint/FK, a função existe
    // Se der erro de "function does not exist", não existe
    const functionExists = !error?.message?.includes('does not exist');
    
    results.push({
      name: 'RPC: save_gateway_credentials',
      passed: functionExists,
      message: functionExists ? 'Existe' : 'Não encontrada',
      duration_ms: Date.now() - saveStart,
    });
  } catch (e: any) {
    results.push({
      name: 'RPC: save_gateway_credentials',
      passed: false,
      message: `Exceção: ${e.message}`,
      duration_ms: Date.now() - saveStart,
    });
  }

  // Test: RPC get_gateway_credentials exists
  const getStart = Date.now();
  try {
    const { data, error } = await supabase.rpc('get_gateway_credentials', {
      p_vendor_id: '00000000-0000-0000-0000-000000000000',
      p_gateway: '__test__',
    });

    const functionExists = !error?.message?.includes('does not exist');
    
    results.push({
      name: 'RPC: get_gateway_credentials',
      passed: functionExists,
      message: functionExists ? 'Existe' : 'Não encontrada',
      duration_ms: Date.now() - getStart,
    });
  } catch (e: any) {
    results.push({
      name: 'RPC: get_gateway_credentials',
      passed: false,
      message: `Exceção: ${e.message}`,
      duration_ms: Date.now() - getStart,
    });
  }

  // Test: RPC delete_gateway_credentials exists
  const deleteStart = Date.now();
  try {
    const { error } = await supabase.rpc('delete_gateway_credentials', {
      p_vendor_id: '00000000-0000-0000-0000-000000000000',
      p_gateway: '__test__',
    });

    const functionExists = !error?.message?.includes('does not exist');
    
    results.push({
      name: 'RPC: delete_gateway_credentials',
      passed: functionExists,
      message: functionExists ? 'Existe' : 'Não encontrada',
      duration_ms: Date.now() - deleteStart,
    });
  } catch (e: any) {
    results.push({
      name: 'RPC: delete_gateway_credentials',
      passed: false,
      message: `Exceção: ${e.message}`,
      duration_ms: Date.now() - deleteStart,
    });
  }

  return results;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();
  const allTests: TestResult[] = [];

  try {
    logInfo(`Versão ${FUNCTION_VERSION} iniciada`);

    // Setup Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Executar todos os testes
    logInfo('Executando testes de secrets...');
    const secretTests = await testSecrets();
    allTests.push(...secretTests);

    logInfo('Executando testes de tabelas...');
    const tableTests = await testTables(supabase);
    allTests.push(...tableTests);

    logInfo('Executando testes de edge functions...');
    const edgeFunctionTests = await testEdgeFunctions();
    allTests.push(...edgeFunctionTests);

    logInfo('Executando testes de Vault/RPC...');
    const vaultTests = await testVaultAndRPC(supabase);
    allTests.push(...vaultTests);

    // Calcular resultados
    const passed = allTests.filter(t => t.passed).length;
    const failed = allTests.filter(t => !t.passed).length;
    const success = failed === 0;

    const response: SmokeTestResponse = {
      success,
      version: FUNCTION_VERSION,
      timestamp: new Date().toISOString(),
      total_tests: allTests.length,
      passed,
      failed,
      duration_ms: Date.now() - startTime,
      tests: allTests,
    };

    logInfo(`Testes concluídos: ${passed}/${allTests.length} passaram`, { success });

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: success ? 200 : 500, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    logError('Erro fatal', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        tests: allTests,
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
