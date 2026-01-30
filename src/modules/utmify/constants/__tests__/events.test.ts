/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * UTMIFY_EVENTS - Testes Unitários
 * 
 * Testa a constante de eventos do UTMify.
 * Cobre estrutura, integridade dos dados, e imutabilidade.
 * 
 * @version 1.0.0
 */

import { describe, it, expect } from "vitest";
import { UTMIFY_EVENTS } from "../events";

// ============================================
// TESTS: STRUCTURE
// ============================================

describe("UTMIFY_EVENTS - Structure", () => {
  it("should be an array", () => {
    expect(Array.isArray(UTMIFY_EVENTS)).toBe(true);
  });

  it("should not be empty", () => {
    expect(UTMIFY_EVENTS.length).toBeGreaterThan(0);
  });

  it("should have exactly 6 events", () => {
    expect(UTMIFY_EVENTS).toHaveLength(6);
  });

  it("should be readonly", () => {
    expect(Object.isFrozen(UTMIFY_EVENTS)).toBe(true);
  });
});

// ============================================
// TESTS: EVENT PROPERTIES
// ============================================

describe("UTMIFY_EVENTS - Event Properties", () => {
  it("should have id property for all events", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event).toHaveProperty("id");
      expect(typeof event.id).toBe("string");
    });
  });

  it("should have label property for all events", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event).toHaveProperty("label");
      expect(typeof event.label).toBe("string");
    });
  });

  it("should have description property for all events", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event).toHaveProperty("description");
      expect(typeof event.description).toBe("string");
    });
  });

  it("should have non-empty id for all events", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.id.length).toBeGreaterThan(0);
    });
  });

  it("should have non-empty label for all events", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.label.length).toBeGreaterThan(0);
    });
  });

  it("should have non-empty description for all events", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.description.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// TESTS: SPECIFIC EVENTS
// ============================================

describe("UTMIFY_EVENTS - Specific Events", () => {
  it("should include pix_generated event", () => {
    const event = UTMIFY_EVENTS.find((e) => e.id === "pix_generated");
    expect(event).toBeDefined();
    expect(event?.label).toBe("PIX Gerado");
    expect(event?.description).toContain("QR Code");
  });

  it("should include purchase_approved event", () => {
    const event = UTMIFY_EVENTS.find((e) => e.id === "purchase_approved");
    expect(event).toBeDefined();
    expect(event?.label).toBe("Compra Aprovada");
    expect(event?.description).toContain("pagamento");
  });

  it("should include purchase_refused event", () => {
    const event = UTMIFY_EVENTS.find((e) => e.id === "purchase_refused");
    expect(event).toBeDefined();
    expect(event?.label).toBe("Compra Recusada");
    expect(event?.description).toContain("recusado");
  });

  it("should include refund event", () => {
    const event = UTMIFY_EVENTS.find((e) => e.id === "refund");
    expect(event).toBeDefined();
    expect(event?.label).toBe("Reembolso");
    expect(event?.description).toContain("reembolsado");
  });

  it("should include chargeback event", () => {
    const event = UTMIFY_EVENTS.find((e) => e.id === "chargeback");
    expect(event).toBeDefined();
    expect(event?.label).toBe("Chargeback");
    expect(event?.description).toContain("chargeback");
  });

  it("should include checkout_abandoned event", () => {
    const event = UTMIFY_EVENTS.find((e) => e.id === "checkout_abandoned");
    expect(event).toBeDefined();
    expect(event?.label).toBe("Abandono de Checkout");
    expect(event?.description).toContain("abandona");
  });
});

// ============================================
// TESTS: UNIQUENESS
// ============================================

describe("UTMIFY_EVENTS - Uniqueness", () => {
  it("should have unique ids", () => {
    const ids = UTMIFY_EVENTS.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have unique labels", () => {
    const labels = UTMIFY_EVENTS.map((e) => e.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it("should not have duplicate events", () => {
    const seen = new Set<string>();
    UTMIFY_EVENTS.forEach((event) => {
      expect(seen.has(event.id)).toBe(false);
      seen.add(event.id);
    });
  });
});

// ============================================
// TESTS: ID FORMAT
// ============================================

describe("UTMIFY_EVENTS - ID Format", () => {
  it("should use snake_case for ids", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.id).toMatch(/^[a-z_]+$/);
    });
  });

  it("should not have spaces in ids", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.id).not.toContain(" ");
    });
  });

  it("should not have uppercase in ids", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.id).toBe(event.id.toLowerCase());
    });
  });
});

// ============================================
// TESTS: LABEL FORMAT
// ============================================

describe("UTMIFY_EVENTS - Label Format", () => {
  it("should have capitalized labels", () => {
    UTMIFY_EVENTS.forEach((event) => {
      const firstChar = event.label.charAt(0);
      expect(firstChar).toBe(firstChar.toUpperCase());
    });
  });

  it("should have human-readable labels", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.label.length).toBeGreaterThan(3);
      expect(event.label).not.toMatch(/^[a-z_]+$/);
    });
  });
});

// ============================================
// TESTS: DESCRIPTION FORMAT
// ============================================

describe("UTMIFY_EVENTS - Description Format", () => {
  it("should have meaningful descriptions", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.description.length).toBeGreaterThan(10);
    });
  });

  it("should start with 'Quando' for all descriptions", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.description).toMatch(/^Quando/);
    });
  });

  it("should have descriptive content", () => {
    UTMIFY_EVENTS.forEach((event) => {
      expect(event.description.split(" ").length).toBeGreaterThan(3);
    });
  });
});

// ============================================
// TESTS: IMMUTABILITY
// ============================================

describe("UTMIFY_EVENTS - Immutability", () => {
  it("should not allow push operations", () => {
    expect(() => {
      (UTMIFY_EVENTS as unknown as Array<unknown>).push({ 
        id: "test", 
        label: "Test", 
        description: "Test" 
      });
    }).toThrow();
  });

  it("should not allow modification of existing events", () => {
    expect(() => {
      (UTMIFY_EVENTS[0] as { id: string }).id = "modified";
    }).toThrow();
  });

  it("should be frozen", () => {
    expect(Object.isFrozen(UTMIFY_EVENTS)).toBe(true);
  });
});
