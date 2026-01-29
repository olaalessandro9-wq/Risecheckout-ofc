/**
 * normalizeDesign Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the normalizeDesign utility function.
 * Depends on themePresets module.
 * 
 * @module test/lib/checkout/normalizeDesign
 */

import { describe, it, expect } from "vitest";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import { THEME_PRESETS } from "@/lib/checkout/themePresets";

describe("normalizeDesign", () => {
  describe("theme detection", () => {
    it("should default to light theme when no theme specified", () => {
      const result = normalizeDesign({});
      expect(result.name).toBe("light");
    });

    it("should use design.theme if present", () => {
      const result = normalizeDesign({
        design: { theme: "dark" },
      });
      expect(result.name).toBe("dark");
    });

    it("should use checkout.theme as fallback", () => {
      const result = normalizeDesign({
        theme: "dark",
      });
      expect(result.name).toBe("dark");
    });

    it("should prioritize design.theme over checkout.theme", () => {
      const result = normalizeDesign({
        theme: "dark",
        design: { theme: "light" },
      });
      expect(result.name).toBe("light");
    });

    it("should treat unknown themes as light", () => {
      const result = normalizeDesign({
        design: { theme: "unknown-theme" },
      });
      expect(result.name).toBe("light");
    });
  });

  describe("preset application", () => {
    it("should apply light preset colors", () => {
      const result = normalizeDesign({ design: { theme: "light" } });
      expect(result.colors.background).toBe(THEME_PRESETS.light.colors.background);
      expect(result.colors.primaryText).toBe(THEME_PRESETS.light.colors.primaryText);
    });

    it("should apply dark preset colors", () => {
      const result = normalizeDesign({ design: { theme: "dark" } });
      expect(result.colors.background).toBe(THEME_PRESETS.dark.colors.background);
      expect(result.colors.primaryText).toBe(THEME_PRESETS.dark.colors.primaryText);
    });
  });

  describe("color merging", () => {
    it("should merge design.colors with preset", () => {
      const customBackground = "#FF0000";
      const result = normalizeDesign({
        design: {
          theme: "light",
          colors: { background: customBackground },
        },
      });
      expect(result.colors.background).toBe(customBackground);
      // Other colors should remain from preset
      expect(result.colors.primaryText).toBe(THEME_PRESETS.light.colors.primaryText);
    });

    it("should deep merge nested objects", () => {
      const customButtonBg = "#00FF00";
      const result = normalizeDesign({
        design: {
          theme: "light",
          colors: {
            button: { background: customButtonBg, text: "#FFFFFF" },
          },
        },
      });
      expect(result.colors.button.background).toBe(customButtonBg);
      // Text should be what we passed, not preset
      expect(result.colors.button.text).toBe("#FFFFFF");
    });

    it("should not mutate original preset", () => {
      const originalBackground = THEME_PRESETS.light.colors.background;
      
      normalizeDesign({
        design: {
          theme: "light",
          colors: { background: "#CUSTOM" },
        },
      });
      
      expect(THEME_PRESETS.light.colors.background).toBe(originalBackground);
    });

    it("should handle null design.colors", () => {
      const result = normalizeDesign({
        design: {
          theme: "light",
          colors: undefined,
        },
      });
      expect(result.colors.background).toBe(THEME_PRESETS.light.colors.background);
    });

    it("should handle empty design.colors object", () => {
      const result = normalizeDesign({
        design: {
          theme: "light",
          colors: {},
        },
      });
      expect(result.colors.background).toBe(THEME_PRESETS.light.colors.background);
    });
  });

  describe("derived properties - light theme", () => {
    it("should ensure border property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.border).toBeDefined();
      expect(typeof result.colors.border).toBe("string");
    });

    it("should ensure infoBox property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.infoBox).toBeDefined();
      expect(result.colors.infoBox.background).toBeDefined();
      expect(result.colors.infoBox.border).toBeDefined();
      expect(result.colors.infoBox.text).toBeDefined();
    });

    it("should ensure orderBump property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.orderBump).toBeDefined();
      expect(result.colors.orderBump.headerBackground).toBeDefined();
      expect(result.colors.orderBump.priceText).toBeDefined();
    });

    it("should ensure creditCardFields property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.creditCardFields).toBeDefined();
      expect(result.colors.creditCardFields.textColor).toBeDefined();
      expect(result.colors.creditCardFields.backgroundColor).toBeDefined();
    });

    it("should ensure orderSummary property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.orderSummary).toBeDefined();
      expect(result.colors.orderSummary.background).toBeDefined();
      expect(result.colors.orderSummary.titleText).toBeDefined();
    });

    it("should ensure footer property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.footer).toBeDefined();
      expect(result.colors.footer.background).toBeDefined();
      expect(result.colors.footer.primaryText).toBeDefined();
    });

    it("should ensure securePurchase property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.securePurchase).toBeDefined();
      expect(result.colors.securePurchase.headerBackground).toBeDefined();
      expect(result.colors.securePurchase.headerText).toBeDefined();
    });

    it("should ensure personalDataFields property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.personalDataFields).toBeDefined();
      expect(result.colors.personalDataFields.textColor).toBeDefined();
    });

    it("should ensure productPrice property exists", () => {
      const result = normalizeDesign({});
      expect(result.colors.productPrice).toBeDefined();
      expect(typeof result.colors.productPrice).toBe("string");
    });
  });

  describe("derived properties - dark theme", () => {
    it("should use dark theme defaults for border", () => {
      const result = normalizeDesign({ design: { theme: "dark" } });
      expect(result.colors.border).toBe("#374151");
    });

    it("should use dark theme defaults for infoBox", () => {
      const result = normalizeDesign({ design: { theme: "dark" } });
      expect(result.colors.infoBox.background).toBe("rgba(16,185,129,0.1)");
    });
  });

  describe("edge cases", () => {
    it("should handle null design object", () => {
      const result = normalizeDesign({ design: null });
      expect(result.name).toBe("light");
      expect(result.colors.background).toBe(THEME_PRESETS.light.colors.background);
    });

    it("should handle undefined design object", () => {
      const result = normalizeDesign({ design: undefined });
      expect(result.name).toBe("light");
    });

    it("should preserve custom nested properties during merge", () => {
      const result = normalizeDesign({
        design: {
          theme: "light",
          colors: {
            orderSummary: {
              background: "#CUSTOM_BG",
              titleText: "#CUSTOM_TEXT",
              productName: "#CUSTOM_PRODUCT",
              priceText: "#CUSTOM_PRICE",
              labelText: "#CUSTOM_LABEL",
              borderColor: "#CUSTOM_BORDER",
            },
          },
        },
      });
      expect(result.colors.orderSummary.background).toBe("#CUSTOM_BG");
      expect(result.colors.orderSummary.titleText).toBe("#CUSTOM_TEXT");
      expect(result.colors.orderSummary.productName).toBe("#CUSTOM_PRODUCT");
    });
  });
});
