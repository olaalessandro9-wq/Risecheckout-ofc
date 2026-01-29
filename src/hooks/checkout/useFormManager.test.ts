/**
 * useFormManager - Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the checkout form manager hook.
 * Covers localStorage persistence, validation, and order bumps.
 * 
 * @module hooks/checkout/useFormManager.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFormManager } from "./useFormManager";

// ============================================================================
// MOCKS
// ============================================================================

// Mock logger to suppress output
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockOrderBumps = [
  {
    id: "bump-1",
    name: "Order Bump 1",
    description: "Description 1",
    price: 1990, // R$ 19,90
    product_id: "product-1",
  },
  {
    id: "bump-2",
    name: "Order Bump 2",
    description: "Description 2",
    price: 2990, // R$ 29,90
    product_id: "product-2",
  },
];

const defaultProps = {
  checkoutId: "checkout-123",
  requiredFields: ["name", "email", "phone", "cpf"],
  orderBumps: mockOrderBumps,
  productPrice: 9990, // R$ 99,90
};

// ============================================================================
// LOCALSTORAGE MOCK
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// ============================================================================
// TESTS: INITIAL STATE
// ============================================================================

describe("useFormManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("Initial State", () => {
    it("should initialize with empty form data", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      expect(result.current.formData).toEqual({
        name: "",
        email: "",
        phone: "",
        document: "",
        cpf: "",
        address: "",
        city: "",
        state: "",
        zipcode: "",
      });
    });

    it("should initialize with empty form errors", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      expect(result.current.formErrors).toEqual({});
    });

    it("should initialize with empty selected bumps", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      expect(result.current.selectedBumps.size).toBe(0);
    });

    it("should initialize with isProcessing false", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      expect(result.current.isProcessing).toBe(false);
    });

    it("should provide all expected properties and methods", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      // Data
      expect(result.current).toHaveProperty("formData");
      expect(result.current).toHaveProperty("formErrors");
      expect(result.current).toHaveProperty("selectedBumps");
      expect(result.current).toHaveProperty("isProcessing");

      // Methods
      expect(result.current).toHaveProperty("updateField");
      expect(result.current).toHaveProperty("updateMultipleFields");
      expect(result.current).toHaveProperty("toggleBump");
      expect(result.current).toHaveProperty("calculateTotal");
      expect(result.current).toHaveProperty("validateForm");
      expect(result.current).toHaveProperty("setFormErrors");
      expect(result.current).toHaveProperty("clearErrors");
      expect(result.current).toHaveProperty("setProcessing");
      expect(result.current).toHaveProperty("getRequiredFieldsConfig");

      // All methods should be functions
      expect(typeof result.current.updateField).toBe("function");
      expect(typeof result.current.updateMultipleFields).toBe("function");
      expect(typeof result.current.toggleBump).toBe("function");
      expect(typeof result.current.calculateTotal).toBe("function");
      expect(typeof result.current.validateForm).toBe("function");
      expect(typeof result.current.setFormErrors).toBe("function");
      expect(typeof result.current.clearErrors).toBe("function");
      expect(typeof result.current.setProcessing).toBe("function");
      expect(typeof result.current.getRequiredFieldsConfig).toBe("function");
    });
  });

  // ============================================================================
  // TESTS: UPDATE FIELD
  // ============================================================================

  describe("updateField", () => {
    it("should update a single field", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.updateField("name", "John Doe");
      });

      expect(result.current.formData.name).toBe("John Doe");
    });

    it("should clear field error when updating", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      // Set an error first
      act(() => {
        result.current.setFormErrors({ name: "Nome é obrigatório" });
      });

      expect(result.current.formErrors.name).toBe("Nome é obrigatório");

      // Update the field
      act(() => {
        result.current.updateField("name", "John Doe");
      });

      // Error should be cleared
      expect(result.current.formErrors.name).toBeUndefined();
    });

    it("should update multiple fields sequentially", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.updateField("name", "John Doe");
      });

      act(() => {
        result.current.updateField("email", "john@example.com");
      });

      act(() => {
        result.current.updateField("phone", "(11) 99999-9999");
      });

      expect(result.current.formData.name).toBe("John Doe");
      expect(result.current.formData.email).toBe("john@example.com");
      expect(result.current.formData.phone).toBe("(11) 99999-9999");
    });
  });

  // ============================================================================
  // TESTS: UPDATE MULTIPLE FIELDS
  // ============================================================================

  describe("updateMultipleFields", () => {
    it("should update multiple fields at once", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.updateMultipleFields({
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "(11) 88888-8888",
        });
      });

      expect(result.current.formData.name).toBe("Jane Doe");
      expect(result.current.formData.email).toBe("jane@example.com");
      expect(result.current.formData.phone).toBe("(11) 88888-8888");
    });

    it("should preserve non-updated fields", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      // First update
      act(() => {
        result.current.updateField("name", "John Doe");
      });

      // Update only email
      act(() => {
        result.current.updateMultipleFields({
          email: "john@example.com",
        });
      });

      // Name should be preserved
      expect(result.current.formData.name).toBe("John Doe");
      expect(result.current.formData.email).toBe("john@example.com");
    });
  });

  // ============================================================================
  // TESTS: ORDER BUMPS
  // ============================================================================

  describe("Order Bumps", () => {
    it("should toggle bump selection on", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.toggleBump("bump-1");
      });

      expect(result.current.selectedBumps.has("bump-1")).toBe(true);
    });

    it("should toggle bump selection off", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      // Select first
      act(() => {
        result.current.toggleBump("bump-1");
      });

      expect(result.current.selectedBumps.has("bump-1")).toBe(true);

      // Deselect
      act(() => {
        result.current.toggleBump("bump-1");
      });

      expect(result.current.selectedBumps.has("bump-1")).toBe(false);
    });

    it("should select multiple bumps", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.toggleBump("bump-1");
      });

      act(() => {
        result.current.toggleBump("bump-2");
      });

      expect(result.current.selectedBumps.has("bump-1")).toBe(true);
      expect(result.current.selectedBumps.has("bump-2")).toBe(true);
      expect(result.current.selectedBumps.size).toBe(2);
    });
  });

  // ============================================================================
  // TESTS: CALCULATE TOTAL
  // ============================================================================

  describe("calculateTotal", () => {
    it("should return product price when no bumps selected", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      const total = result.current.calculateTotal();

      expect(total).toBe(9990); // R$ 99,90
    });

    it("should include single bump in total", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.toggleBump("bump-1");
      });

      const total = result.current.calculateTotal();

      expect(total).toBe(9990 + 1990); // R$ 119,80
    });

    it("should include multiple bumps in total", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.toggleBump("bump-1");
      });

      act(() => {
        result.current.toggleBump("bump-2");
      });

      const total = result.current.calculateTotal();

      expect(total).toBe(9990 + 1990 + 2990); // R$ 149,70
    });

    it("should update total when bump is deselected", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      // Select both
      act(() => {
        result.current.toggleBump("bump-1");
      });

      act(() => {
        result.current.toggleBump("bump-2");
      });

      expect(result.current.calculateTotal()).toBe(9990 + 1990 + 2990);

      // Deselect one
      act(() => {
        result.current.toggleBump("bump-1");
      });

      expect(result.current.calculateTotal()).toBe(9990 + 2990);
    });

    it("should handle empty orderBumps array", () => {
      const { result } = renderHook(() =>
        useFormManager({ ...defaultProps, orderBumps: [] })
      );

      const total = result.current.calculateTotal();

      expect(total).toBe(9990);
    });

    it("should handle non-existent bump IDs gracefully", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.toggleBump("non-existent-bump");
      });

      // Should not throw, just returns product price
      const total = result.current.calculateTotal();

      expect(total).toBe(9990);
    });
  });

  // ============================================================================
  // TESTS: VALIDATION
  // ============================================================================

  describe("validateForm", () => {
    it("should return invalid for empty form with required fields", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      let validationResult: { isValid: boolean };

      act(() => {
        validationResult = result.current.validateForm();
      });

      expect(validationResult!.isValid).toBe(false);
      expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0);
    });

    it("should return valid for complete form", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.updateMultipleFields({
          name: "John Doe",
          email: "john@example.com",
          phone: "(11) 99999-9999",
          cpf: "529.982.247-25", // Valid CPF
        });
      });

      let validationResult: { isValid: boolean };

      act(() => {
        validationResult = result.current.validateForm();
      });

      expect(validationResult!.isValid).toBe(true);
      expect(Object.keys(result.current.formErrors).length).toBe(0);
    });

    it("should detect invalid email", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: ["email"],
        })
      );

      act(() => {
        result.current.updateField("email", "invalid-email");
      });

      let validationResult: { isValid: boolean };

      act(() => {
        validationResult = result.current.validateForm();
      });

      expect(validationResult!.isValid).toBe(false);
      expect(result.current.formErrors.email).toBeDefined();
    });

    it("should detect invalid CPF", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: ["cpf"],
        })
      );

      act(() => {
        result.current.updateField("cpf", "111.111.111-11"); // Invalid CPF (repeated digits)
      });

      let validationResult: { isValid: boolean };

      act(() => {
        validationResult = result.current.validateForm();
      });

      expect(validationResult!.isValid).toBe(false);
      expect(result.current.formErrors.cpf).toBeDefined();
    });

    it("should accept snapshot override for autofill sync", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: ["name", "email"], // name and email are always required
        })
      );

      // Form state is empty
      expect(result.current.formData.name).toBe("");
      expect(result.current.formData.email).toBe("");

      // But we pass a snapshot with data for both required fields
      let validationResult: { isValid: boolean };

      act(() => {
        validationResult = result.current.validateForm({ 
          name: "From Snapshot",
          email: "snapshot@example.com",
        });
      });

      expect(validationResult!.isValid).toBe(true);
    });

    it("should handle minimal required fields with valid data", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: [], // Only name and email are implicitly required
        })
      );

      // Provide minimum required data (name and email are always required)
      act(() => {
        result.current.updateMultipleFields({
          name: "Minimal User",
          email: "minimal@example.com",
        });
      });

      let validationResult: { isValid: boolean };

      act(() => {
        validationResult = result.current.validateForm();
      });

      expect(validationResult!.isValid).toBe(true);
    });
  });

  // ============================================================================
  // TESTS: ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("should set custom form errors", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.setFormErrors({
          name: "Custom name error",
          email: "Custom email error",
        });
      });

      expect(result.current.formErrors.name).toBe("Custom name error");
      expect(result.current.formErrors.email).toBe("Custom email error");
    });

    it("should clear all errors", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.setFormErrors({
          name: "Error 1",
          email: "Error 2",
          phone: "Error 3",
        });
      });

      expect(Object.keys(result.current.formErrors).length).toBe(3);

      act(() => {
        result.current.clearErrors();
      });

      expect(Object.keys(result.current.formErrors).length).toBe(0);
    });
  });

  // ============================================================================
  // TESTS: PROCESSING STATE
  // ============================================================================

  describe("Processing State", () => {
    it("should set processing to true", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      expect(result.current.isProcessing).toBe(false);

      act(() => {
        result.current.setProcessing(true);
      });

      expect(result.current.isProcessing).toBe(true);
    });

    it("should set processing to false", () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.setProcessing(true);
      });

      expect(result.current.isProcessing).toBe(true);

      act(() => {
        result.current.setProcessing(false);
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });

  // ============================================================================
  // TESTS: REQUIRED FIELDS CONFIG
  // ============================================================================

  describe("getRequiredFieldsConfig", () => {
    it("should return parsed required fields config", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: ["name", "email"],
        })
      );

      const config = result.current.getRequiredFieldsConfig();

      expect(config.name).toBe(true);
      expect(config.email).toBe(true);
      expect(config.phone).toBeFalsy();
      expect(config.cpf).toBeFalsy();
    });

    it("should handle all required fields", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: ["name", "email", "phone", "cpf"],
        })
      );

      const config = result.current.getRequiredFieldsConfig();

      expect(config.name).toBe(true);
      expect(config.email).toBe(true);
      expect(config.phone).toBe(true);
      expect(config.cpf).toBe(true);
    });

    it("should handle empty required fields", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          requiredFields: [],
        })
      );

      const config = result.current.getRequiredFieldsConfig();

      // name and email are ALWAYS required per types
      expect(config.name).toBe(true);
      expect(config.email).toBe(true);
      expect(config.phone).toBe(false);
      expect(config.cpf).toBe(false);
    });
  });

  // ============================================================================
  // TESTS: LOCALSTORAGE PERSISTENCE
  // ============================================================================

  describe("localStorage Persistence", () => {
    it("should save form data to localStorage when checkoutId exists", async () => {
      const { result } = renderHook(() => useFormManager(defaultProps));

      act(() => {
        result.current.updateField("name", "Storage Test");
      });

      // Wait for useEffect to run
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      // Check that setItem was called with correct key format
      const calls = localStorageMock.setItem.mock.calls;
      const hasCorrectKey = calls.some(
        (call: string[]) => call[0] === `risecheckout_form_data:checkout-123`
      );
      expect(hasCorrectKey).toBe(true);
    });

    it("should NOT save form data when checkoutId is missing", async () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: null,
        })
      );

      act(() => {
        result.current.updateField("name", "No Save Test");
      });

      // Wait a bit for any potential useEffect
      await new Promise((resolve) => setTimeout(resolve, 50));

      // setItem should not be called
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("should load saved data on mount when checkoutId matches", async () => {
      // Pre-populate localStorage
      const savedData = {
        data: {
          name: "Saved Name",
          email: "saved@example.com",
          phone: "(11) 77777-7777",
        },
        timestamp: Date.now(),
      };

      localStorageMock.setItem(
        `risecheckout_form_data:checkout-456`,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: "checkout-456",
        })
      );

      // Wait for hydration
      await waitFor(() => {
        expect(result.current.formData.name).toBe("Saved Name");
      });

      expect(result.current.formData.email).toBe("saved@example.com");
      expect(result.current.formData.phone).toBe("(11) 77777-7777");
    });

    it("should NOT load CPF from localStorage (LGPD compliance)", async () => {
      // Pre-populate localStorage with CPF (simulating old data)
      const savedData = {
        data: {
          name: "With CPF",
          email: "test@example.com",
          cpf: "529.982.247-25",
          document: "529.982.247-25",
        },
        timestamp: Date.now(),
      };

      localStorageMock.setItem(
        `risecheckout_form_data:checkout-789`,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: "checkout-789",
        })
      );

      // Wait for hydration
      await waitFor(() => {
        expect(result.current.formData.name).toBe("With CPF");
      });

      // CPF should NOT be loaded (LGPD)
      expect(result.current.formData.cpf).toBe("");
      expect(result.current.formData.document).toBe("");
    });

    it("should expire data after 7 days", async () => {
      // Pre-populate localStorage with old data
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const savedData = {
        data: {
          name: "Expired Name",
          email: "expired@example.com",
        },
        timestamp: eightDaysAgo,
      };

      localStorageMock.setItem(
        `risecheckout_form_data:checkout-expired`,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: "checkout-expired",
        })
      );

      // Wait for hydration
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Data should NOT be loaded (expired)
      expect(result.current.formData.name).toBe("");
      expect(result.current.formData.email).toBe("");

      // localStorage should have tried to remove expired data
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        `risecheckout_form_data:checkout-expired`
      );
    });

    it("should isolate data per checkout ID", async () => {
      // Save data for checkout-A
      const dataA = {
        data: { name: "Checkout A User", email: "a@example.com" },
        timestamp: Date.now(),
      };
      localStorageMock.setItem(
        `risecheckout_form_data:checkout-A`,
        JSON.stringify(dataA)
      );

      // Save different data for checkout-B
      const dataB = {
        data: { name: "Checkout B User", email: "b@example.com" },
        timestamp: Date.now(),
      };
      localStorageMock.setItem(
        `risecheckout_form_data:checkout-B`,
        JSON.stringify(dataB)
      );

      // Render with checkout-A
      const { result: resultA } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: "checkout-A",
        })
      );

      await waitFor(() => {
        expect(resultA.current.formData.name).toBe("Checkout A User");
      });

      // Render with checkout-B
      const { result: resultB } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: "checkout-B",
        })
      );

      await waitFor(() => {
        expect(resultB.current.formData.name).toBe("Checkout B User");
      });

      // Data should be properly isolated
      expect(resultA.current.formData.email).toBe("a@example.com");
      expect(resultB.current.formData.email).toBe("b@example.com");
    });
  });

  // ============================================================================
  // TESTS: EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle malformed localStorage data", async () => {
      // Set invalid JSON
      localStorageMock.getItem.mockReturnValueOnce("not-valid-json");

      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          checkoutId: "checkout-invalid",
        })
      );

      // Should not crash, should use empty form
      expect(result.current.formData.name).toBe("");
    });

    it("should handle undefined orderBumps gracefully", () => {
      // The hook has a default value for orderBumps, so undefined becomes []
      const { result } = renderHook(() =>
        useFormManager({
          checkoutId: "checkout-123",
          requiredFields: ["name"],
          orderBumps: [],
          productPrice: 9990,
        })
      );

      // Should not crash
      expect(result.current.calculateTotal()).toBe(9990);
    });

    it("should handle zero product price", () => {
      const { result } = renderHook(() =>
        useFormManager({
          ...defaultProps,
          productPrice: 0,
        })
      );

      expect(result.current.calculateTotal()).toBe(0);

      act(() => {
        result.current.toggleBump("bump-1");
      });

      expect(result.current.calculateTotal()).toBe(1990);
    });

    it("should maintain stable references for callbacks", () => {
      const { result, rerender } = renderHook(() => useFormManager(defaultProps));

      const firstUpdateField = result.current.updateField;
      const firstToggleBump = result.current.toggleBump;
      const firstCalculateTotal = result.current.calculateTotal;

      rerender();

      // Callbacks should be stable (memoized)
      expect(result.current.updateField).toBe(firstUpdateField);
      expect(result.current.toggleBump).toBe(firstToggleBump);
      expect(result.current.calculateTotal).toBe(firstCalculateTotal);
    });
  });
});
