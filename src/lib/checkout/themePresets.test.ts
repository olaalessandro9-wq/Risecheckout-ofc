/**
 * themePresets Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for theme presets constants.
 * Pure constants with zero external dependencies.
 * 
 * @module test/lib/checkout/themePresets
 */

import { describe, it, expect } from "vitest";
import { THEME_PRESETS, FONT_OPTIONS, type ThemePreset } from "@/lib/checkout/themePresets";

describe("THEME_PRESETS", () => {
  describe("light theme", () => {
    const lightTheme = THEME_PRESETS.light;

    it("should have name 'light'", () => {
      expect(lightTheme.name).toBe("light");
    });

    it("should have white background", () => {
      expect(lightTheme.colors.background).toBe("#FFFFFF");
    });

    it("should have black primary text", () => {
      expect(lightTheme.colors.primaryText).toBe("#000000");
    });

    it("should have all required top-level color properties", () => {
      const requiredColors = [
        "background",
        "primaryText",
        "secondaryText",
        "active",
        "icon",
        "formBackground",
        "border",
        "productPrice",
      ];

      requiredColors.forEach((color) => {
        expect(lightTheme.colors).toHaveProperty(color);
        expect(lightTheme.colors[color as keyof typeof lightTheme.colors]).toBeDefined();
      });
    });

    it("should have button colors", () => {
      expect(lightTheme.colors.button).toBeDefined();
      expect(lightTheme.colors.button.background).toBe("#10B981");
      expect(lightTheme.colors.button.text).toBe("#FFFFFF");
    });

    it("should have unselectedButton colors", () => {
      expect(lightTheme.colors.unselectedButton).toBeDefined();
      expect(lightTheme.colors.unselectedButton.text).toBe("#000000");
      expect(lightTheme.colors.unselectedButton.background).toBe("#FFFFFF");
      expect(lightTheme.colors.unselectedButton.icon).toBe("#000000");
    });

    it("should have selectedButton colors", () => {
      expect(lightTheme.colors.selectedButton).toBeDefined();
      expect(lightTheme.colors.selectedButton.text).toBe("#FFFFFF");
      expect(lightTheme.colors.selectedButton.background).toBe("#10B981");
      expect(lightTheme.colors.selectedButton.icon).toBe("#FFFFFF");
    });

    it("should have box colors", () => {
      expect(lightTheme.colors.box).toBeDefined();
      expect(lightTheme.colors.box.headerBg).toBeDefined();
      expect(lightTheme.colors.box.bg).toBeDefined();
      expect(lightTheme.colors.box.primaryText).toBeDefined();
    });

    it("should have orderSummary colors", () => {
      expect(lightTheme.colors.orderSummary).toBeDefined();
      expect(lightTheme.colors.orderSummary.background).toBe("#F9FAFB");
      expect(lightTheme.colors.orderSummary.titleText).toBe("#000000");
    });

    it("should have footer colors", () => {
      expect(lightTheme.colors.footer).toBeDefined();
      expect(lightTheme.colors.footer.background).toBe("#F9FAFB");
      expect(lightTheme.colors.footer.primaryText).toBe("#000000");
    });

    it("should have securePurchase colors", () => {
      expect(lightTheme.colors.securePurchase).toBeDefined();
      expect(lightTheme.colors.securePurchase.headerBackground).toBe("#10B981");
      expect(lightTheme.colors.securePurchase.headerText).toBe("#FFFFFF");
    });

    it("should have orderBump colors", () => {
      expect(lightTheme.colors.orderBump).toBeDefined();
      expect(lightTheme.colors.orderBump.headerText).toBe("#10B981");
      expect(lightTheme.colors.orderBump.priceText).toBe("#10B981");
    });

    it("should have creditCardFields colors", () => {
      expect(lightTheme.colors.creditCardFields).toBeDefined();
      expect(lightTheme.colors.creditCardFields.textColor).toBe("#000000");
      expect(lightTheme.colors.creditCardFields.backgroundColor).toBe("#FFFFFF");
    });

    it("should have personalDataFields colors", () => {
      expect(lightTheme.colors.personalDataFields).toBeDefined();
      expect(lightTheme.colors.personalDataFields.textColor).toBe("#000000");
    });

    it("should have infoBox colors", () => {
      expect(lightTheme.colors.infoBox).toBeDefined();
      expect(lightTheme.colors.infoBox.background).toBe("#ECFDF5");
      expect(lightTheme.colors.infoBox.text).toBe("#047857");
    });
  });

  describe("dark theme", () => {
    const darkTheme = THEME_PRESETS.dark;

    it("should have name 'dark'", () => {
      expect(darkTheme.name).toBe("dark");
    });

    it("should have dark background", () => {
      expect(darkTheme.colors.background).toBe("#0A0A0A");
    });

    it("should have white primary text", () => {
      expect(darkTheme.colors.primaryText).toBe("#FFFFFF");
    });

    it("should have all required top-level color properties", () => {
      const requiredColors = [
        "background",
        "primaryText",
        "secondaryText",
        "active",
        "icon",
        "formBackground",
        "border",
        "productPrice",
      ];

      requiredColors.forEach((color) => {
        expect(darkTheme.colors).toHaveProperty(color);
        expect(darkTheme.colors[color as keyof typeof darkTheme.colors]).toBeDefined();
      });
    });

    it("should have dark formBackground", () => {
      expect(darkTheme.colors.formBackground).toBe("#1A1A1A");
    });

    it("should have orderSummary with dark background", () => {
      expect(darkTheme.colors.orderSummary).toBeDefined();
      expect(darkTheme.colors.orderSummary.background).toBe("#1A1A1A");
      expect(darkTheme.colors.orderSummary.titleText).toBe("#FFFFFF");
    });

    it("should have creditCardFields with dark styling", () => {
      expect(darkTheme.colors.creditCardFields.textColor).toBe("#FFFFFF");
      expect(darkTheme.colors.creditCardFields.backgroundColor).toBe("#1A1A1A");
    });

    it("should have infoBox with transparent background", () => {
      expect(darkTheme.colors.infoBox.background).toBe("rgba(16,185,129,0.1)");
    });
  });

  describe("theme structure", () => {
    it("should have exactly 2 themes: light and dark", () => {
      const themeKeys = Object.keys(THEME_PRESETS);
      expect(themeKeys).toHaveLength(2);
      expect(themeKeys).toContain("light");
      expect(themeKeys).toContain("dark");
    });

    it("should have consistent structure between light and dark", () => {
      const lightColorKeys = Object.keys(THEME_PRESETS.light.colors).sort();
      const darkColorKeys = Object.keys(THEME_PRESETS.dark.colors).sort();
      expect(lightColorKeys).toEqual(darkColorKeys);
    });
  });
});

describe("FONT_OPTIONS", () => {
  it("should have 5 font options", () => {
    expect(FONT_OPTIONS).toHaveLength(5);
  });

  it("should include Inter as first option", () => {
    expect(FONT_OPTIONS[0]).toEqual({ value: "Inter", label: "Inter" });
  });

  it("should include all required fonts", () => {
    const fontValues = FONT_OPTIONS.map((f) => f.value);
    expect(fontValues).toContain("Inter");
    expect(fontValues).toContain("Roboto");
    expect(fontValues).toContain("Poppins");
    expect(fontValues).toContain("Montserrat");
    expect(fontValues).toContain("Open Sans");
  });

  it("should have matching value and label for each font", () => {
    FONT_OPTIONS.forEach((font) => {
      expect(font.value).toBe(font.label);
    });
  });

  it("should have correct structure for each font option", () => {
    FONT_OPTIONS.forEach((font) => {
      expect(font).toHaveProperty("value");
      expect(font).toHaveProperty("label");
      expect(typeof font.value).toBe("string");
      expect(typeof font.label).toBe("string");
    });
  });
});
