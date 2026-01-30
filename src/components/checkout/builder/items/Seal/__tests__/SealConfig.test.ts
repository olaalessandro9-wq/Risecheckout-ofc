/**
 * Seal Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Seal item configuration covering:
 * - Config structure validation
 * - Default values
 * - Color validation
 * - Alignment validation
 *
 * @module components/checkout/builder/items/Seal/__tests__/SealConfig.test
 */

import { describe, it, expect } from "vitest";
import { SealConfig, type SealContent } from "../index";
import { SealView } from "../SealView";
import { SealEditor } from "../SealEditor";

describe("SealConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(SealConfig).toHaveProperty("label");
      expect(SealConfig).toHaveProperty("icon");
      expect(SealConfig).toHaveProperty("view");
      expect(SealConfig).toHaveProperty("editor");
      expect(SealConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(SealConfig.label).toBe("Selo");
    });

    it("references SealView component", () => {
      expect(SealConfig.view).toBe(SealView);
    });

    it("references SealEditor component", () => {
      expect(SealConfig.editor).toBe(SealEditor);
    });
  });

  describe("Default Values", () => {
    it("has all required default fields", () => {
      expect(SealConfig.defaults).toHaveProperty("topText");
      expect(SealConfig.defaults).toHaveProperty("title");
      expect(SealConfig.defaults).toHaveProperty("subtitle");
      expect(SealConfig.defaults).toHaveProperty("primaryColor");
      expect(SealConfig.defaults).toHaveProperty("titleColor");
      expect(SealConfig.defaults).toHaveProperty("alignment");
      expect(SealConfig.defaults).toHaveProperty("darkMode");
    });

    it("has correct default topText", () => {
      expect(SealConfig.defaults.topText).toBe("7");
    });

    it("has correct default title", () => {
      expect(SealConfig.defaults.title).toBe("Privacidade");
    });

    it("has correct default subtitle", () => {
      expect(SealConfig.defaults.subtitle).toBe("Garantida");
    });

    it("has correct default primaryColor", () => {
      expect(SealConfig.defaults.primaryColor).toBe("#4F9EF8");
      expect(SealConfig.defaults.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default titleColor", () => {
      expect(SealConfig.defaults.titleColor).toBe("#FFFFFF");
      expect(SealConfig.defaults.titleColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default alignment", () => {
      expect(SealConfig.defaults.alignment).toBe("center");
    });

    it("has correct default darkMode", () => {
      expect(SealConfig.defaults.darkMode).toBe(false);
      expect(typeof SealConfig.defaults.darkMode).toBe("boolean");
    });
  });

  describe("Type Validation", () => {
    it("defaults match SealContent type structure", () => {
      const defaults: SealContent = SealConfig.defaults;
      expect(defaults).toBeDefined();
    });

    it("alignment is valid enum value", () => {
      const validAlignments: Array<SealContent["alignment"]> = ["left", "center", "right"];
      expect(validAlignments).toContain(SealConfig.defaults.alignment);
    });

    it("darkMode is boolean", () => {
      expect(typeof SealConfig.defaults.darkMode).toBe("boolean");
    });
  });
});
