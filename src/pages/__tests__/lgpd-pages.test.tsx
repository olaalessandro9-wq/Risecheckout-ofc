/**
 * @file lgpd-pages.test.tsx
 * @description Tests for LGPD pages
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";

// Import mocks
import "./_shared";

// ============================================================================
// GdprRequest
// ============================================================================

describe("GdprRequest", () => {
  it("should export default component", async () => {
    const module = await import("../lgpd/GdprRequest");
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../lgpd/GdprRequest");
    expect(typeof module.default).toBe("function");
  });
});

// ============================================================================
// GdprConfirm
// ============================================================================

describe("GdprConfirm", () => {
  it("should export default component", async () => {
    const module = await import("../lgpd/GdprConfirm");
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../lgpd/GdprConfirm");
    expect(typeof module.default).toBe("function");
  });
});
