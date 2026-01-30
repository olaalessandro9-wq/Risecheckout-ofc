/**
 * Advantage Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Advantage item configuration covering:
 * - Config structure validation
 * - Default values
 * - Size enum validation
 * - Mode flags validation
 *
 * @module components/checkout/builder/items/Advantage/__tests__/AdvantageConfig.test
 */

import { describe, it, expect } from "vitest";
import { AdvantageConfig, type AdvantageContent } from "../index";
import { AdvantageView } from "../AdvantageView";
import { AdvantageEditor } from "../AdvantageEditor";

describe("AdvantageConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(AdvantageConfig).toHaveProperty("label");
      expect(AdvantageConfig).toHaveProperty("icon");
      expect(AdvantageConfig).toHaveProperty("view");
      expect(AdvantageConfig).toHaveProperty("editor");
      expect(AdvantageConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(AdvantageConfig.label).toBe("Vantagem");
    });

    it("references AdvantageView component", () => {
      expect(AdvantageConfig.view).toBe(AdvantageView);
    });

    it("references AdvantageEditor component", () => {
      expect(AdvantageConfig.editor).toBe(AdvantageEditor);
    });
  });

  describe("Default Values", () => {
    it("has all required default fields", () => {
      expect(AdvantageConfig.defaults).toHaveProperty("title");
      expect(AdvantageConfig.defaults).toHaveProperty("description");
      expect(AdvantageConfig.defaults).toHaveProperty("icon");
      expect(AdvantageConfig.defaults).toHaveProperty("primaryColor");
      expect(AdvantageConfig.defaults).toHaveProperty("titleColor");
      expect(AdvantageConfig.defaults).toHaveProperty("darkMode");
      expect(AdvantageConfig.defaults).toHaveProperty("verticalMode");
      expect(AdvantageConfig.defaults).toHaveProperty("size");
    });

    it("has correct default title", () => {
      expect(AdvantageConfig.defaults.title).toBe("Vantagem");
    });

    it("has correct default description", () => {
      expect(AdvantageConfig.defaults.description).toBe("Descrição da vantagem");
    });

    it("has correct default icon", () => {
      expect(AdvantageConfig.defaults.icon).toBe("check");
    });

    it("has correct default primaryColor", () => {
      expect(AdvantageConfig.defaults.primaryColor).toBe("#1DB88E");
      expect(AdvantageConfig.defaults.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default titleColor", () => {
      expect(AdvantageConfig.defaults.titleColor).toBe("#000000");
      expect(AdvantageConfig.defaults.titleColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default darkMode", () => {
      expect(AdvantageConfig.defaults.darkMode).toBe(false);
    });

    it("has correct default verticalMode", () => {
      expect(AdvantageConfig.defaults.verticalMode).toBe(false);
    });

    it("has correct default size", () => {
      expect(AdvantageConfig.defaults.size).toBe("original");
    });
  });

  describe("Type Validation", () => {
    it("defaults match AdvantageContent type structure", () => {
      const defaults: AdvantageContent = AdvantageConfig.defaults;
      expect(defaults).toBeDefined();
    });

    it("size is valid enum value", () => {
      const validSizes: Array<AdvantageContent["size"]> = ["small", "original", "large"];
      expect(validSizes).toContain(AdvantageConfig.defaults.size);
    });

    it("darkMode is boolean", () => {
      expect(typeof AdvantageConfig.defaults.darkMode).toBe("boolean");
    });

    it("verticalMode is boolean", () => {
      expect(typeof AdvantageConfig.defaults.verticalMode).toBe("boolean");
    });
  });
});
