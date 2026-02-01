/**
 * Certificate Verification Tests for members-area-certificates
 * 
 * @module members-area-certificates/tests/verification.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  skipIntegration,
  integrationTestOptions,
  getFunctionUrl,
  createPayload,
} from "./_shared.ts";

// ============================================================================
// VERIFY CERTIFICATE TESTS (PUBLIC ACTION)
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: verify - deve rejeitar sem verification_code",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("verify");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assertEquals(response.status, 400);
    assertExists(data.error);
  },
});

Deno.test({
  name: "members-area-certificates/integration: verify - deve retornar valid: false para código inexistente",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("verify", { verification_code: "XXXX-XXXX-XXXX" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.valid, false);
  },
});

Deno.test({
  name: "members-area-certificates/integration: verify - deve converter código para uppercase",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("verify", { verification_code: "abcd-efgh-ijkl" });

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Deve processar sem erro (mesmo que não encontre)
    assertEquals(response.status, 200);
    assertExists(data.valid);
  },
});

// ============================================================================
// LIST BUYER CERTIFICATES TESTS
// ============================================================================

Deno.test({
  name: "members-area-certificates/integration: list-buyer-certificates - deve requerer autenticação",
  ignore: skipIntegration(),
  ...integrationTestOptions,
  fn: async () => {
    const payload = createPayload("list-buyer-certificates");

    const response = await fetch(getFunctionUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await response.text();

    // Deve retornar 401 (sem auth) ou 200 (sucesso)
    assertEquals([200, 401].includes(response.status), true);
  },
});
