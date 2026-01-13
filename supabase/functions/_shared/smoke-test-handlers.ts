/**
 * Smoke Test Handlers
 * 
 * Extracted handlers for smoke-test edge function.
 * 
 * RISE Protocol Compliant - < 300 linhas
 * @version 2.0.0 - Zero `any` compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration_ms: number;
}

export interface SmokeTestResponse {
  success: boolean;
  version: string;
  timestamp: string;
  total_tests: number;
  passed: number;
  failed: number;
  duration_ms: number;
  tests: TestResult[];
}

interface PostgrestError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// ============================================================================
// LOGGING
// ============================================================================

export function logInfo(message: string, data?: unknown) {
  console.log(`[smoke-test] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

export function logError(message: string, error?: unknown) {
  console.error(`[smoke-test] [ERROR] ${message}`, error);
}

// ============================================================================
// TEST: SECRETS
// ============================================================================

export async function testSecrets(): Promise<TestResult[]> {
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

export async function testTables(supabase: SupabaseClient): Promise<TestResult[]> {
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
      const pgError = error as PostgrestError | null;
      results.push({
        name: `Table: ${table}`,
        passed,
        message: passed ? 'Acessível' : `Erro: ${pgError?.message ?? 'Unknown error'}`,
        duration_ms: Date.now() - start,
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      results.push({
        name: `Table: ${table}`,
        passed: false,
        message: `Exceção: ${err.message}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return results;
}

// ============================================================================
// TEST: EDGE FUNCTIONS
// ============================================================================

export async function testEdgeFunctions(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  const endpoints = [
    { name: 'health', method: 'GET' },
    { name: 'trigger-webhooks', method: 'OPTIONS' },
    { name: 'create-order', method: 'OPTIONS' },
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint.name}`, {
        method: endpoint.method,
      });
      
      const passed = response.ok;
      results.push({
        name: `EdgeFunction: ${endpoint.name} (${endpoint.method === 'OPTIONS' ? 'CORS' : ''})`,
        passed,
        message: passed ? `Status ${response.status}` : `Falhou: ${response.status}`,
        duration_ms: Date.now() - start,
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      results.push({
        name: `EdgeFunction: ${endpoint.name}`,
        passed: false,
        message: `Exceção: ${err.message}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return results;
}

// ============================================================================
// TEST: VAULT & RPC FUNCTIONS
// ============================================================================

interface RpcError {
  message?: string;
}

export async function testVaultAndRPC(supabase: SupabaseClient): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const rpcFunctions = [
    { name: 'save_gateway_credentials', params: { p_vendor_id: '00000000-0000-0000-0000-000000000000', p_gateway: '__test__', p_credentials: { test: true } } },
    { name: 'get_gateway_credentials', params: { p_vendor_id: '00000000-0000-0000-0000-000000000000', p_gateway: '__test__' } },
    { name: 'delete_gateway_credentials', params: { p_vendor_id: '00000000-0000-0000-0000-000000000000', p_gateway: '__test__' } },
  ];

  for (const rpc of rpcFunctions) {
    const start = Date.now();
    try {
      const { error } = await supabase.rpc(rpc.name, rpc.params);
      const rpcError = error as RpcError | null;
      const functionExists = !rpcError?.message?.includes('does not exist');
      
      results.push({
        name: `RPC: ${rpc.name}`,
        passed: functionExists,
        message: functionExists ? 'Existe' : 'Não encontrada',
        duration_ms: Date.now() - start,
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      results.push({
        name: `RPC: ${rpc.name}`,
        passed: false,
        message: `Exceção: ${err.message}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return results;
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export async function runAllTests(supabase: SupabaseClient): Promise<TestResult[]> {
  const allTests: TestResult[] = [];

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

  return allTests;
}

// ============================================================================
// BUILD RESPONSE
// ============================================================================

export function buildSmokeTestResponse(
  tests: TestResult[],
  version: string,
  startTime: number
): SmokeTestResponse {
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  
  return {
    success: failed === 0,
    version,
    timestamp: new Date().toISOString(),
    total_tests: tests.length,
    passed,
    failed,
    duration_ms: Date.now() - startTime,
    tests,
  };
}
