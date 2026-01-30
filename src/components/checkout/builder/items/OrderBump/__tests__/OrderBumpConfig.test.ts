/**
 * OrderBump Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for OrderBump item configuration covering:
 * - Config structure validation
 * - Default values
 * - Layout enum validation
 * - Optional color fields
 *
 * @module components/checkout/builder/items/OrderBump/__tests__/OrderBumpConfig.test
 */

import { describe, it, expect } from "vitest";
import { OrderBumpConfig, type OrderBumpContent } from "../index";
import { OrderBumpView } from "../OrderBumpView";
import { OrderBumpEditor } from "../OrderBumpEditor";

describe("OrderBumpConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(OrderBumpConfig).toHaveProperty("label");
      expect(OrderBumpConfig).toHaveProperty("icon");
      expect(OrderBumpConfig).toHaveProperty("view");
      expect(OrderBumpConfig).toHaveProperty("editor");
      expect(OrderBumpConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(OrderBumpConfig.label).toBe("Order Bumps");
    });

    it("references OrderBumpView component", () => {
      expect(OrderBumpConfig.view).toBe(OrderBumpView);
    });

    it("references OrderBumpEditor component", () => {
      expect(OrderBumpConfig.editor).toBe(OrderBumpEditor);
    });
  });

  describe("Default Values", () => {
    it("has all required default fields", () => {
      expect(OrderBumpConfig.defaults).toHaveProperty("title");
      expect(OrderBumpConfig.defaults).toHaveProperty("showImages");
      expect(OrderBumpConfig.defaults).toHaveProperty("layout");
    });

    it("has correct default title", () => {
      expect(OrderBumpConfig.defaults.title).toBe("Ofertas limitadas");
    });

    it("has correct default showImages", () => {
      expect(OrderBumpConfig.defaults.showImages).toBe(true);
      expect(typeof OrderBumpConfig.defaults.showImages).toBe("boolean");
    });

    it("has correct default layout", () => {
      expect(OrderBumpConfig.defaults.layout).toBe("list");
    });

    it("does not have highlightColor in defaults", () => {
      expect(OrderBumpConfig.defaults.highlightColor).toBeUndefined();
    });

    it("does not have backgroundColor in defaults", () => {
      expect(OrderBumpConfig.defaults.backgroundColor).toBeUndefined();
    });
  });

  describe("Type Validation", () => {
    it("defaults match OrderBumpContent type structure", () => {
      const defaults: OrderBumpContent = OrderBumpConfig.defaults;
      expect(defaults).toBeDefined();
    });

    it("layout is valid enum value", () => {
      const validLayouts: Array<OrderBumpContent["layout"]> = ["list", "grid"];
      expect(validLayouts).toContain(OrderBumpConfig.defaults.layout);
    });

    it("showImages is boolean", () => {
      expect(typeof OrderBumpConfig.defaults.showImages).toBe("boolean");
    });
  });
});
