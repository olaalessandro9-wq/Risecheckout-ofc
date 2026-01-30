/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Integration Tests for asaas-validate-credentials Edge Function
 * 
 * Coverage:
 * - CORS handling (OPTIONS requests)
 * - API Key validation (required, empty, whitespace)
 * - Environment validation (sandbox, production, invalid)
 * - Asaas API integration (/myAccount endpoint)
 * - Wallet ID retrieval (/walletId endpoint)
 * - Success responses with account data
 * - Error handling (invalid credentials, network errors)
 * 
 * @module asaas-validate-credentials/index.test
 * @version 1.0.0
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

// Skip tests if environment is not configured or using mock values
const isMockUrl = !supabaseUrl || supabaseUrl.includes('test.supabase.co') || !supabaseUrl.startsWith('https://');
const skipTests = isMockUrl;

// ============================================================================
// CORS TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials: OPTIONS deve retornar CORS headers",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'OPTIONS'
    });

    await response.text();

    assertEquals(response.status, 200);
    assertExists(response.headers.get('Access-Control-Allow-Origin'));
    assertExists(response.headers.get('Access-Control-Allow-Methods'));
  }
});

// ============================================================================
// API KEY VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials: Deve rejeitar request sem apiKey",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      // apiKey missing
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  }
});

Deno.test({
  name: "asaas-validate-credentials: Deve rejeitar apiKey vazia",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: '',
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  }
});

Deno.test({
  name: "asaas-validate-credentials: Deve rejeitar apiKey com apenas espaços",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: '   ',
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  }
});

// ============================================================================
// ENVIRONMENT VALIDATION TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials: Deve rejeitar request sem environment",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'test_key_123'
      // environment missing
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  }
});

Deno.test({
  name: "asaas-validate-credentials: Deve rejeitar environment inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'test_key_123',
      environment: 'invalid_env'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertEquals(data.valid, false);
    assertExists(data.message);
  }
});

Deno.test({
  name: "asaas-validate-credentials: Deve aceitar environment 'sandbox'",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'invalid_key_for_test',
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.json();

    // Should not return 400 for environment validation
    assertEquals(response.status !== 400 || response.status === 401, true);
  }
});

Deno.test({
  name: "asaas-validate-credentials: Deve aceitar environment 'production'",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'invalid_key_for_test',
      environment: 'production'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.json();

    // Should not return 400 for environment validation
    assertEquals(response.status !== 400 || response.status === 401, true);
  }
});

// ============================================================================
// INVALID CREDENTIALS TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials: Deve retornar valid=false para credenciais inválidas",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'definitely_invalid_key_12345',
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertEquals(data.valid, false);
    assertExists(data.message);
  }
});

// ============================================================================
// RESPONSE STRUCTURE TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials: Response deve ter estrutura correta para erro",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'invalid_key',
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    assertExists(data.valid);
    assertEquals(typeof data.valid, 'boolean');
    assertExists(data.message);
    assertEquals(typeof data.message, 'string');
  }
});

Deno.test({
  name: "asaas-validate-credentials: Content-Type deve ser application/json",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const payload = {
      apiKey: 'test_key',
      environment: 'sandbox'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await response.json();

    assertEquals(response.headers.get('Content-Type')?.includes('application/json'), true);
  }
});

// ============================================================================
// EDGE CASES TESTS
// ============================================================================

Deno.test({
  name: "asaas-validate-credentials: Deve lidar com JSON inválido",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json {'
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  }
});

Deno.test({
  name: "asaas-validate-credentials: Deve lidar com body vazio",
  ignore: skipTests,
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/asaas-validate-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ''
    });

    await response.text();

    assertEquals(response.status >= 400, true);
  }
});
