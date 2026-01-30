/**
 * Image Config Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Image item configuration covering:
 * - Config structure validation
 * - Default values
 * - Type exports
 * - Component references
 *
 * @module components/checkout/builder/items/Image/__tests__/ImageConfig.test
 */

import { describe, it, expect } from "vitest";
import { ImageConfig, type ImageContent } from "../index";
import { ImageView } from "../ImageView";
import { ImageEditor } from "../ImageEditor";

describe("ImageConfig", () => {
  describe("Configuration Structure", () => {
    it("has all required fields", () => {
      expect(ImageConfig).toHaveProperty("label");
      expect(ImageConfig).toHaveProperty("icon");
      expect(ImageConfig).toHaveProperty("view");
      expect(ImageConfig).toHaveProperty("editor");
      expect(ImageConfig).toHaveProperty("defaults");
    });

    it("has correct label", () => {
      expect(ImageConfig.label).toBe("Imagem");
    });

    it("has icon defined", () => {
      expect(ImageConfig.icon).toBeDefined();
    });

    it("references ImageView component", () => {
      expect(ImageConfig.view).toBe(ImageView);
    });

    it("references ImageEditor component", () => {
      expect(ImageConfig.editor).toBe(ImageEditor);
    });
  });

  describe("Default Values", () => {
    it("has alignment default", () => {
      expect(ImageConfig.defaults.alignment).toBe("center");
    });

    it("has maxWidth default", () => {
      expect(ImageConfig.defaults.maxWidth).toBe(720);
      expect(typeof ImageConfig.defaults.maxWidth).toBe("number");
    });

    it("has roundedImage default", () => {
      expect(ImageConfig.defaults.roundedImage).toBe(true);
      expect(typeof ImageConfig.defaults.roundedImage).toBe("boolean");
    });

    it("has alt text default", () => {
      expect(ImageConfig.defaults.alt).toBe("Imagem do checkout");
      expect(typeof ImageConfig.defaults.alt).toBe("string");
    });

    it("does not have imageUrl in defaults", () => {
      expect(ImageConfig.defaults.imageUrl).toBeUndefined();
    });
  });

  describe("Type Validation", () => {
    it("defaults match ImageContent type structure", () => {
      const defaults: ImageContent = ImageConfig.defaults;
      expect(defaults).toBeDefined();
    });

    it("has valid alignment value", () => {
      const validAlignments: Array<ImageContent["alignment"]> = ["left", "center", "right"];
      expect(validAlignments).toContain(ImageConfig.defaults.alignment);
    });

    it("maxWidth is positive", () => {
      expect(ImageConfig.defaults.maxWidth).toBeGreaterThan(0);
    });

    it("roundedImage is boolean", () => {
      expect(typeof ImageConfig.defaults.roundedImage).toBe("boolean");
    });
  });

  describe("Component References", () => {
    it("view component is a valid React component", () => {
      expect(typeof ImageConfig.view).toBe("function");
    });

    it("editor component is a valid React component", () => {
      expect(typeof ImageConfig.editor).toBe("function");
    });
  });
});
