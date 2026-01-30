/**
 * Text Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Text item configuration covering:
 * - Config structure validation
 * - Default values
 * - Type exports
 * - Component references
 *
 * @module components/checkout/builder/items/Text/__tests__/TextConfig.test
 */

import { describe, it, expect } from "vitest";
import { TextConfig, type TextContent } from "../index";
import { TextView } from "../TextView";
import { TextEditor } from "../TextEditor";

describe("TextConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(TextConfig).toHaveProperty("label");
      expect(TextConfig).toHaveProperty("icon");
      expect(TextConfig).toHaveProperty("view");
      expect(TextConfig).toHaveProperty("editor");
      expect(TextConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(TextConfig.label).toBe("Texto");
    });

    it("has icon defined", () => {
      expect(TextConfig.icon).toBeDefined();
    });

    it("references TextView component", () => {
      expect(TextConfig.view).toBe(TextView);
    });

    it("references TextEditor component", () => {
      expect(TextConfig.editor).toBe(TextEditor);
    });
  });

  describe("Default Values", () => {
    it("has all required default fields", () => {
      expect(TextConfig.defaults).toHaveProperty("text");
      expect(TextConfig.defaults).toHaveProperty("fontSize");
      expect(TextConfig.defaults).toHaveProperty("color");
      expect(TextConfig.defaults).toHaveProperty("alignment");
      expect(TextConfig.defaults).toHaveProperty("backgroundColor");
      expect(TextConfig.defaults).toHaveProperty("borderColor");
      expect(TextConfig.defaults).toHaveProperty("borderWidth");
      expect(TextConfig.defaults).toHaveProperty("borderRadius");
    });

    it("has correct default text", () => {
      expect(TextConfig.defaults.text).toBe("Edite este texto");
    });

    it("has correct default fontSize", () => {
      expect(TextConfig.defaults.fontSize).toBe(16);
      expect(typeof TextConfig.defaults.fontSize).toBe("number");
    });

    it("has correct default color", () => {
      expect(TextConfig.defaults.color).toBe("#000000");
      expect(TextConfig.defaults.color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default alignment", () => {
      expect(TextConfig.defaults.alignment).toBe("center");
      expect(["left", "center", "right"]).toContain(TextConfig.defaults.alignment);
    });

    it("has correct default backgroundColor", () => {
      expect(TextConfig.defaults.backgroundColor).toBe("#FFFFFF");
      expect(TextConfig.defaults.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default borderColor", () => {
      expect(TextConfig.defaults.borderColor).toBe("#E5E7EB");
      expect(TextConfig.defaults.borderColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("has correct default borderWidth", () => {
      expect(TextConfig.defaults.borderWidth).toBe(1);
      expect(typeof TextConfig.defaults.borderWidth).toBe("number");
    });

    it("has correct default borderRadius", () => {
      expect(TextConfig.defaults.borderRadius).toBe(8);
      expect(typeof TextConfig.defaults.borderRadius).toBe("number");
    });
  });

  describe("Type Validation", () => {
    it("defaults match TextContent type structure", () => {
      const defaults: TextContent = TextConfig.defaults;
      expect(defaults).toBeDefined();
    });

    it("has valid alignment values", () => {
      const validAlignments: Array<TextContent["alignment"]> = ["left", "center", "right"];
      expect(validAlignments).toContain(TextConfig.defaults.alignment);
    });

    it("fontSize is within reasonable range", () => {
      expect(TextConfig.defaults.fontSize).toBeGreaterThan(0);
      expect(TextConfig.defaults.fontSize).toBeLessThan(100);
    });

    it("borderWidth is non-negative", () => {
      expect(TextConfig.defaults.borderWidth).toBeGreaterThanOrEqual(0);
    });

    it("borderRadius is non-negative", () => {
      expect(TextConfig.defaults.borderRadius).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Component References", () => {
    it("view component is a valid React component", () => {
      expect(typeof TextConfig.view).toBe("function");
    });

    it("editor component is a valid React component", () => {
      expect(typeof TextConfig.editor).toBe("function");
    });
  });
});
