/**
 * @file index.test.ts
 * @description Barrel export tests for Asaas hooks
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";

describe("Asaas Hooks Barrel Export", () => {
  it("should export all hook modules", async () => {
    const hooks = await import("../../hooks");

    expect(hooks.useAsaasConfig).toBeDefined();
    expect(hooks.useAsaasValidation).toBeDefined();
    expect(hooks.useAsaasSaveConfig).toBeDefined();
    expect(hooks.useAsaasDisconnect).toBeDefined();
    expect(hooks.useAsaasConnectionStatus).toBeDefined();
  });

  it("should export functions (not undefined)", async () => {
    const hooks = await import("../../hooks");

    expect(typeof hooks.useAsaasConfig).toBe("function");
    expect(typeof hooks.useAsaasValidation).toBe("function");
    expect(typeof hooks.useAsaasSaveConfig).toBe("function");
    expect(typeof hooks.useAsaasDisconnect).toBe("function");
    expect(typeof hooks.useAsaasConnectionStatus).toBe("function");
  });
});
