/**
 * ProductFormMachine Guards Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Product Form State Machine guards.
 * 
 * @module products/machines/__tests__
 */

import { describe, it, expect } from "vitest";
import {
  isDirty,
  calculateDirtyFlags,
  isValid,
  canSave,
  hasProduct,
  isPristine,
  isCheckoutSettingsInitialized,
} from "../productFormMachine.guards";
import type { ProductFormContext } from "../productFormMachine.types";
import { initialContext } from "../productFormMachine.context";

// ============================================================================
// HELPER: Create context with overrides
// ============================================================================

function createContext(overrides: Partial<ProductFormContext> = {}): ProductFormContext {
  return { ...initialContext, ...overrides };
}

function createDirtyGeneralContext(): ProductFormContext {
  return createContext({
    serverData: {
      ...initialContext.serverData,
      general: {
        name: "Original Name",
        description: "",
        price: 100,
        support_name: "",
        support_email: "",
        delivery_url: "",
        external_delivery: false,
        delivery_type: "standard",
      },
    },
    editedData: {
      ...initialContext.editedData,
      general: {
        name: "Modified Name",
        description: "",
        price: 100,
        support_name: "",
        support_email: "",
        delivery_url: "",
        external_delivery: false,
        delivery_type: "standard",
      },
    },
  });
}

// ============================================================================
// isDirty TESTS
// ============================================================================

describe("isDirty guard", () => {
  it("returns false for pristine context", () => {
    const context = createContext();
    expect(isDirty({ context })).toBe(false);
  });

  it("returns true when general name is modified", () => {
    const context = createDirtyGeneralContext();
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when general description is modified", () => {
    const context = createContext({
      serverData: {
        ...initialContext.serverData,
        general: { ...initialContext.serverData.general, description: "" },
      },
      editedData: {
        ...initialContext.editedData,
        general: { ...initialContext.editedData.general, description: "New description" },
      },
    });
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when price is modified", () => {
    const context = createContext({
      serverData: {
        ...initialContext.serverData,
        general: { ...initialContext.serverData.general, price: 100 },
      },
      editedData: {
        ...initialContext.editedData,
        general: { ...initialContext.editedData.general, price: 200 },
      },
    });
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when image has file pending", () => {
    const context = createContext({
      editedData: {
        ...initialContext.editedData,
        image: {
          imageFile: new File([], "test.png"),
          imageUrl: "",
          pendingRemoval: false,
        },
      },
    });
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when image pending removal", () => {
    const context = createContext({
      editedData: {
        ...initialContext.editedData,
        image: {
          imageFile: null,
          imageUrl: "http://example.com/image.png",
          pendingRemoval: true,
        },
      },
    });
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when offers are modified", () => {
    const context = createContext({
      editedData: {
        ...initialContext.editedData,
        offers: {
          localOffers: [],
          deletedOfferIds: [],
          modified: true,
        },
      },
    });
    expect(isDirty({ context })).toBe(true);
  });

  it("returns true when offer is deleted", () => {
    const context = createContext({
      editedData: {
        ...initialContext.editedData,
        offers: {
          localOffers: [],
          deletedOfferIds: ["offer-1"],
          modified: false,
        },
      },
    });
    expect(isDirty({ context })).toBe(true);
  });
});

// ============================================================================
// calculateDirtyFlags TESTS
// ============================================================================

describe("calculateDirtyFlags", () => {
  it("returns all false for pristine context", () => {
    const flags = calculateDirtyFlags(initialContext);
    expect(flags.general).toBe(false);
    expect(flags.image).toBe(false);
    expect(flags.offers).toBe(false);
    expect(flags.upsell).toBe(false);
    expect(flags.affiliate).toBe(false);
    expect(flags.checkoutSettings).toBe(false);
  });

  it("identifies dirty general section", () => {
    const context = createDirtyGeneralContext();
    const flags = calculateDirtyFlags(context);
    expect(flags.general).toBe(true);
    expect(flags.image).toBe(false);
  });

  it("identifies dirty image section", () => {
    const context = createContext({
      editedData: {
        ...initialContext.editedData,
        image: { imageFile: new File([], "test.png"), imageUrl: "", pendingRemoval: false },
      },
    });
    const flags = calculateDirtyFlags(context);
    expect(flags.image).toBe(true);
    expect(flags.general).toBe(false);
  });
});

// ============================================================================
// isValid TESTS
// ============================================================================

describe("isValid guard", () => {
  it("returns true when no validation errors", () => {
    const context = createContext({
      validationErrors: {
        general: {},
        upsell: {},
        affiliate: {},
        checkoutSettings: {},
      },
    });
    expect(isValid({ context })).toBe(true);
  });

  it("returns false when general has errors", () => {
    const context = createContext({
      validationErrors: {
        general: { name: "Nome é obrigatório" },
        upsell: {},
        affiliate: {},
        checkoutSettings: {},
      },
    });
    expect(isValid({ context })).toBe(false);
  });

  it("returns false when upsell has errors", () => {
    const context = createContext({
      validationErrors: {
        general: {},
        upsell: { customPageUrl: "URL inválida" },
        affiliate: {},
        checkoutSettings: {},
      },
    });
    expect(isValid({ context })).toBe(false);
  });

  it("returns false when affiliate has errors", () => {
    const context = createContext({
      validationErrors: {
        general: {},
        upsell: {},
        affiliate: { defaultRate: "Taxa inválida" },
        checkoutSettings: {},
      },
    });
    expect(isValid({ context })).toBe(false);
  });
});

// ============================================================================
// canSave TESTS
// ============================================================================

describe("canSave guard", () => {
  it("returns false when pristine and valid", () => {
    const context = createContext();
    expect(canSave({ context })).toBe(false);
  });

  it("returns false when dirty but invalid", () => {
    const context = createContext({
      serverData: {
        ...initialContext.serverData,
        general: { ...initialContext.serverData.general, name: "Original" },
      },
      editedData: {
        ...initialContext.editedData,
        general: { ...initialContext.editedData.general, name: "Modified" },
      },
      validationErrors: {
        general: { name: "Nome muito curto" },
        upsell: {},
        affiliate: {},
        checkoutSettings: {},
      },
    });
    expect(canSave({ context })).toBe(false);
  });

  it("returns true when dirty and valid", () => {
    const context = createContext({
      serverData: {
        ...initialContext.serverData,
        general: { ...initialContext.serverData.general, name: "Original" },
      },
      editedData: {
        ...initialContext.editedData,
        general: { ...initialContext.editedData.general, name: "Modified" },
      },
      validationErrors: {
        general: {},
        upsell: {},
        affiliate: {},
        checkoutSettings: {},
      },
    });
    expect(canSave({ context })).toBe(true);
  });
});

// ============================================================================
// OTHER GUARDS
// ============================================================================

describe("hasProduct guard", () => {
  it("returns true when product is loaded", () => {
    const context = createContext({
      serverData: {
        ...initialContext.serverData,
        product: { id: "pr-1", name: "Test Product" } as ProductFormContext["serverData"]["product"],
      },
    });
    expect(hasProduct({ context })).toBe(true);
  });

  it("returns false when product is null", () => {
    const context = createContext();
    expect(hasProduct({ context })).toBe(false);
  });
});

describe("isPristine guard", () => {
  it("returns true for unmodified context", () => {
    expect(isPristine({ context: initialContext })).toBe(true);
  });

  it("returns false for modified context", () => {
    const context = createDirtyGeneralContext();
    expect(isPristine({ context })).toBe(false);
  });
});

describe("isCheckoutSettingsInitialized guard", () => {
  it("returns false by default", () => {
    const context = createContext();
    expect(isCheckoutSettingsInitialized({ context })).toBe(false);
  });

  it("returns true when initialized", () => {
    const context = createContext({ isCheckoutSettingsInitialized: true });
    expect(isCheckoutSettingsInitialized({ context })).toBe(true);
  });
});
